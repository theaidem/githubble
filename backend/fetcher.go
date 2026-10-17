package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const (
	githubEventsAPI = "https://api.github.com/events"
	maxPages        = 3 // GitHub exposes up to 300 recent public events.
)

type fetcher struct {
	client    *http.Client
	apiURL    string
	tokens    []string
	broker    *sseBroker
	idx       int
	lastID    string
	etag      string
	resetAt   []time.Time
	interval  time.Duration
	nextPoll  time.Time
	remaining string
	limit     string
}

func newFetcher(tokens []string, b *sseBroker) (*fetcher, error) {
	if len(tokens) == 0 {
		return nil, fmt.Errorf("set GITHUB_TOKENS to at least one GitHub token")
	}
	return &fetcher{
		client: &http.Client{Timeout: 15 * time.Second}, apiURL: githubEventsAPI,
		tokens: tokens, broker: b, resetAt: make([]time.Time, len(tokens)), interval: time.Minute,
	}, nil
}

func (f *fetcher) run(ctx context.Context) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if f.broker.count() == 0 || time.Now().Before(f.nextPoll) || !f.chooseToken() {
				continue
			}
			if err := f.poll(ctx); err != nil && ctx.Err() == nil {
				slog.ErrorContext(ctx, "github_poll_failed", "error", err, "token_index", f.idx+1)
			}
			f.nextPoll = time.Now().Add(f.interval)
		}
	}
}

func (f *fetcher) chooseToken() bool {
	for i := range f.tokens {
		idx := (f.idx + i) % len(f.tokens)
		if !time.Now().Before(f.resetAt[idx]) {
			f.idx = idx
			return true
		}
	}
	return false
}

func (f *fetcher) poll(ctx context.Context) error {
	started := time.Now()
	var collected []json.RawMessage
	var nextETag string
	var ratePayload ssePayload
	for page := 1; page <= maxPages; page++ {
		endpoint, err := url.Parse(f.apiURL)
		if err != nil {
			return err
		}
		query := endpoint.Query()
		query.Set("per_page", "100")
		query.Set("page", strconv.Itoa(page))
		endpoint.RawQuery = query.Encode()
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+f.tokens[f.idx])
		req.Header.Set("Accept", "application/vnd.github+json")
		req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
		if page == 1 && f.etag != "" {
			req.Header.Set("If-None-Match", f.etag)
		}
		pageStarted := time.Now()
		resp, err := f.client.Do(req)
		if err != nil {
			return err
		}
		if page == 1 {
			f.remaining = resp.Header.Get("X-RateLimit-Remaining")
			f.limit = resp.Header.Get("X-RateLimit-Limit")
			if secs, err := strconv.Atoi(resp.Header.Get("X-Poll-Interval")); err == nil && secs > 0 {
				f.interval = time.Duration(max(60, secs)) * time.Second
			}
		}
		switch resp.StatusCode {
		case http.StatusNotModified:
			f.broker.publish(ssePayload{Event: "ratelimits", Data: []byte(fmt.Sprintf("token-%d/%s/%s", f.idx+1, resp.Header.Get("X-RateLimit-Remaining"), resp.Header.Get("X-RateLimit-Limit")))})
			f.publishChecked()
			resp.Body.Close()
			slog.InfoContext(ctx, "github_feed_unchanged", "poll_interval_seconds", int(f.interval.Seconds()), "rate_remaining", f.remaining, "rate_limit", f.limit)
			return nil
		case http.StatusOK:
			var events []json.RawMessage
			err = json.NewDecoder(io.LimitReader(resp.Body, 8<<20)).Decode(&events)
			resp.Body.Close()
			if err != nil {
				return fmt.Errorf("decode events page %d: %w", page, err)
			}
			slog.DebugContext(ctx, "github_page_fetched", "page", page, "events", len(events), "duration_ms", time.Since(pageStarted).Milliseconds())
			collected = append(collected, events...)
			if page == 1 {
				nextETag = resp.Header.Get("ETag")
				ratePayload = ssePayload{Event: "ratelimits", Data: []byte(fmt.Sprintf("token-%d/%s/%s", f.idx+1, resp.Header.Get("X-RateLimit-Remaining"), resp.Header.Get("X-RateLimit-Limit")))}
			}
			if len(events) == 0 || containsEventID(events, f.lastID) {
				f.finishPoll(ctx, collected, page, nextETag, ratePayload, started)
				return nil
			}
		case http.StatusForbidden, http.StatusTooManyRequests:
			reset, err := strconv.ParseInt(resp.Header.Get("X-RateLimit-Reset"), 10, 64)
			resp.Body.Close()
			if err == nil && reset > time.Now().Unix() {
				f.resetAt[f.idx] = time.Unix(reset, 0).Add(time.Second)
			} else {
				f.resetAt[f.idx] = time.Now().Add(time.Minute)
			}
			slog.WarnContext(ctx, "github_rate_limited", "status", resp.StatusCode, "token_index", f.idx+1, "retry_at", f.resetAt[f.idx], "page", page)
			f.idx = (f.idx + 1) % len(f.tokens)
			return nil
		case http.StatusUnauthorized:
			resp.Body.Close()
			f.resetAt[f.idx] = time.Now().Add(time.Hour)
			slog.ErrorContext(ctx, "github_token_rejected", "token_index", f.idx+1, "page", page)
			f.idx = (f.idx + 1) % len(f.tokens)
			return nil
		default:
			resp.Body.Close()
			return fmt.Errorf("unexpected status %s", resp.Status)
		}
	}
	f.finishPoll(ctx, collected, maxPages, nextETag, ratePayload, started)
	return nil
}

func (f *fetcher) finishPoll(ctx context.Context, collected []json.RawMessage, pages int, nextETag string, ratePayload ssePayload, started time.Time) {
	stars, forks := f.dispatch(collected)
	f.etag = nextETag
	f.broker.publish(ratePayload)
	f.publishChecked()
	slog.InfoContext(ctx, "github_poll_completed",
		"pages", pages, "scanned", len(collected), "new_stars", stars, "new_forks", forks,
		"poll_interval_seconds", int(f.interval.Seconds()), "online", f.broker.count(),
		"token_index", f.idx+1, "rate_remaining", f.remaining, "rate_limit", f.limit,
		"duration_ms", time.Since(started).Milliseconds())
}

func (f *fetcher) publishChecked() {
	f.broker.publish(ssePayload{Event: "checked", Data: []byte(time.Now().UTC().Format(time.RFC3339Nano))})
}

func containsEventID(events []json.RawMessage, id string) bool {
	if id == "" {
		return false
	}
	for _, raw := range events {
		var event struct {
			ID string `json:"id"`
		}
		if json.Unmarshal(raw, &event) == nil && event.ID == id {
			return true
		}
	}
	return false
}

func (f *fetcher) dispatch(events []json.RawMessage) (stars, forks int) {
	if len(events) == 0 {
		return 0, 0
	}
	var newest string
	var unseen []json.RawMessage
	seen := make(map[string]bool, len(events))
	for _, raw := range events {
		var event struct {
			ID   string `json:"id"`
			Type string `json:"type"`
		}
		if err := json.Unmarshal(raw, &event); err != nil || event.ID == "" {
			continue
		}
		if newest == "" {
			newest = event.ID
		}
		if event.ID == f.lastID {
			break
		}
		if seen[event.ID] {
			continue
		}
		seen[event.ID] = true
		if event.Type == "WatchEvent" || event.Type == "ForkEvent" {
			unseen = append(unseen, raw)
			if event.Type == "WatchEvent" {
				stars++
			} else {
				forks++
			}
		}
	}
	// GitHub returns newest first; deliver oldest first to keep the feed and
	// navigation in chronological order. No event is replayed after reconnect.
	for i := len(unseen) - 1; i >= 0; i-- {
		f.broker.publish(ssePayload{Event: "message", Data: unseen[i]})
	}
	if newest != "" {
		f.lastID = newest
	}
	return stars, forks
}
