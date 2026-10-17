package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestNewFetcherRequiresToken(t *testing.T) {
	if _, err := newFetcher(nil, newBroker()); err == nil {
		t.Fatal("expected error for missing GitHub token")
	}
}

func TestFetcherPollDeduplicatesAndOrders(t *testing.T) {
	feed := `[{"id":"3","type":"WatchEvent"},{"id":"2","type":"PushEvent"},{"id":"1","type":"ForkEvent"}]`
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer secret" {
			t.Errorf("Authorization = %q", got)
		}
		w.Header().Set("X-RateLimit-Remaining", "42")
		w.Header().Set("X-RateLimit-Limit", "5000")
		_, _ = fmt.Fprint(w, feed)
	}))
	defer srv.Close()
	b := newBroker()
	ch := make(chan ssePayload, 16)
	b.mu.Lock()
	b.clients[ch] = struct{}{}
	b.mu.Unlock()
	f, _ := newFetcher([]string{"secret"}, b)
	f.apiURL = srv.URL
	if err := f.poll(context.Background()); err != nil {
		t.Fatal(err)
	}
	first, second, rate, checked := <-ch, <-ch, <-ch, <-ch
	if !strings.Contains(string(first.Data), `"id":"1"`) || !strings.Contains(string(second.Data), `"id":"3"`) || first.Event != "message" || rate.Event != "ratelimits" || checked.Event != "checked" {
		t.Fatalf("unexpected stream: %+v %+v %+v", first, second, rate)
	}
	if f.lastID != "3" {
		t.Fatalf("lastID = %q", f.lastID)
	}
	if err := f.poll(context.Background()); err != nil {
		t.Fatal(err)
	}
	if got, checked := <-ch, <-ch; got.Event != "ratelimits" || checked.Event != "checked" || len(ch) != 0 {
		t.Fatalf("duplicate events delivered: %+v, queued %d", got, len(ch))
	}
}

func TestFetcherFindsStarsBeyondFirstPageAndRespectsPollInterval(t *testing.T) {
	requests := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		if r.URL.Query().Get("per_page") != "100" {
			t.Errorf("per_page = %q", r.URL.Query().Get("per_page"))
		}
		w.Header().Set("X-Poll-Interval", "120")
		switch r.URL.Query().Get("page") {
		case "1":
			if r.Header.Get("If-None-Match") == `"feed-v1"` {
				w.WriteHeader(http.StatusNotModified)
				return
			}
			w.Header().Set("ETag", `"feed-v1"`)
			_, _ = fmt.Fprint(w, `[{"id":"3","type":"PushEvent"}]`)
		case "2":
			_, _ = fmt.Fprint(w, `[{"id":"2","type":"WatchEvent"}]`)
		case "3":
			_, _ = fmt.Fprint(w, `[{"id":"1","type":"ForkEvent"}]`)
		default:
			t.Errorf("unexpected page %q", r.URL.Query().Get("page"))
		}
	}))
	defer srv.Close()
	b := newBroker()
	ch := make(chan ssePayload, 16)
	b.mu.Lock()
	b.clients[ch] = struct{}{}
	b.mu.Unlock()
	f, _ := newFetcher([]string{"secret"}, b)
	f.apiURL = srv.URL
	if err := f.poll(context.Background()); err != nil {
		t.Fatal(err)
	}
	if requests != 3 || f.interval != 120*time.Second {
		t.Fatalf("requests=%d interval=%s", requests, f.interval)
	}
	first, second, rate, checked := <-ch, <-ch, <-ch, <-ch
	if !strings.Contains(string(first.Data), `"id":"1"`) || !strings.Contains(string(second.Data), `"id":"2"`) || rate.Event != "ratelimits" || checked.Event != "checked" {
		t.Fatalf("unexpected stream: %+v %+v %+v", first, second, rate)
	}
	if err := f.poll(context.Background()); err != nil {
		t.Fatal(err)
	}
	if requests != 4 || len(ch) != 2 || (<-ch).Event != "ratelimits" || (<-ch).Event != "checked" {
		t.Fatalf("conditional request should emit heartbeat but no events: requests=%d", requests)
	}
}

func TestFetcherRotatesRateLimitedToken(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") == "Bearer exhausted" {
			w.Header().Set("X-RateLimit-Reset", fmt.Sprint(time.Now().Add(time.Hour).Unix()))
			w.WriteHeader(http.StatusForbidden)
			return
		}
		_, _ = fmt.Fprint(w, `[]`)
	}))
	defer srv.Close()
	f, _ := newFetcher([]string{"exhausted", "working"}, newBroker())
	f.apiURL = srv.URL
	if err := f.poll(context.Background()); err != nil {
		t.Fatal(err)
	}
	if f.idx != 1 || f.chooseToken() == false || f.idx != 1 {
		t.Fatalf("did not rotate to working token: idx=%d", f.idx)
	}
	if err := f.poll(context.Background()); err != nil {
		t.Fatal(err)
	}
}
