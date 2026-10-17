package main

import (
	"bufio"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestSSEBroadcastAndDisconnect(t *testing.T) {
	b := newBroker()
	srv := httptest.NewServer(b)
	defer srv.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, srv.URL, nil)
	resp, err := srv.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if got := resp.Header.Get("Content-Type"); got != "text/event-stream" {
		t.Fatalf("Content-Type = %q", got)
	}
	scanner := bufio.NewScanner(resp.Body)
	// Consume the initial online event before publishing another message.
	if !scanner.Scan() || scanner.Text() != "event: online" {
		t.Fatalf("missing online event: %q", scanner.Text())
	}
	b.publish(ssePayload{Event: "message", Data: []byte(`{"id":"test"}`)})
	for scanner.Scan() {
		if strings.Contains(scanner.Text(), `{"id":"test"}`) {
			break
		}
	}
	if err := scanner.Err(); err != nil {
		t.Fatal(err)
	}
	cancel()
	for deadline := time.Now().Add(time.Second); b.count() != 0 && time.Now().Before(deadline); {
		time.Sleep(time.Millisecond)
	}
	if b.count() != 0 {
		t.Fatal("client was not unregistered")
	}
}

func TestSSEReplaysRecentEventsToNewClient(t *testing.T) {
	b := newBroker()
	b.publish(ssePayload{Event: "message", Data: []byte(`{"id":"recent"}`)})
	b.publish(ssePayload{Event: "ratelimits", Data: []byte("token-1/4999/5000")})
	b.publish(ssePayload{Event: "checked", Data: []byte("2026-10-16T12:00:00Z")})
	srv := httptest.NewServer(b)
	defer srv.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, srv.URL, nil)
	resp, err := srv.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	scanner := bufio.NewScanner(resp.Body)
	var events []string
	for scanner.Scan() {
		if strings.HasPrefix(scanner.Text(), "event: ") {
			events = append(events, strings.TrimPrefix(scanner.Text(), "event: "))
		}
		if len(events) == 4 {
			break
		}
	}
	want := []string{"message", "ratelimits", "checked", "online"}
	if len(events) != len(want) {
		t.Fatalf("replayed events = %v, want %v; error: %v", events, want, scanner.Err())
	}
	for i := range want {
		if events[i] != want[i] {
			t.Fatalf("replayed events = %v, want %v", events, want)
		}
	}
}
