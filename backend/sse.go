package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"sync"
)

type ssePayload struct {
	Event string
	Data  []byte
}

// Each client has a bounded queue. A slow/disconnected browser cannot stall
// polling or the other browsers.
type sseBroker struct {
	mu          sync.Mutex
	clients     map[chan ssePayload]struct{}
	recent      []ssePayload
	lastRate    ssePayload
	lastChecked ssePayload
}

func newBroker() *sseBroker {
	return &sseBroker{clients: make(map[chan ssePayload]struct{})}
}

func (s *sseBroker) count() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.clients)
}

func offer(ch chan ssePayload, message ssePayload) {
	select {
	case ch <- message:
	default:
		// Keep the latest value when the browser is behind.
		select {
		case <-ch:
		default:
		}
		select {
		case ch <- message:
		default:
		}
	}
}

func (s *sseBroker) broadcastLocked(message ssePayload) {
	for ch := range s.clients {
		offer(ch, message)
	}
}

func (s *sseBroker) publish(message ssePayload) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch message.Event {
	case "message":
		s.recent = append(s.recent, message)
		if len(s.recent) > 48 {
			s.recent = s.recent[len(s.recent)-48:]
		}
	case "ratelimits":
		s.lastRate = message
	case "checked":
		s.lastChecked = message
	}
	s.broadcastLocked(message)
}

func (s *sseBroker) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")
	ch := make(chan ssePayload, 64)
	s.mu.Lock()
	s.clients[ch] = struct{}{}
	for _, event := range s.recent {
		offer(ch, event)
	}
	if s.lastRate.Event != "" {
		offer(ch, s.lastRate)
	}
	if s.lastChecked.Event != "" {
		offer(ch, s.lastChecked)
	}
	connected := len(s.clients)
	s.broadcastLocked(ssePayload{Event: "online", Data: []byte(fmt.Sprint(connected))})
	s.mu.Unlock()
	slog.InfoContext(r.Context(), "sse_client_connected", "online", connected)
	defer func() {
		s.mu.Lock()
		delete(s.clients, ch)
		connected := len(s.clients)
		s.broadcastLocked(ssePayload{Event: "online", Data: []byte(fmt.Sprint(connected))})
		s.mu.Unlock()
		slog.Info("sse_client_disconnected", "online", connected)
	}()

	// Send headers immediately even when GitHub hasn't produced an event yet.
	flusher.Flush()
	for {
		select {
		case <-r.Context().Done():
			return
		case message := <-ch:
			if _, err := fmt.Fprintf(w, "event: %s\ndata: %s\n\n", message.Event, message.Data); err != nil {
				// Usually a normal browser disconnect; avoid polluting warning logs.
				slog.Debug("sse_write_failed", "error", err)
				return
			}
			flusher.Flush()
		}
	}
}
