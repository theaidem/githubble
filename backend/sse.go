package main

import (
	"fmt"
	"log"
	"net/http"
)

type SSEBroker struct {
	Notifier       chan *SSEPayload
	newClients     chan chan *SSEPayload
	closingClients chan chan *SSEPayload
	clients        map[chan *SSEPayload]bool
}

type SSEPayload struct {
	Event string
	Data  []byte
}

func NewServer() (s *SSEBroker) {
	s = &SSEBroker{
		Notifier:       make(chan *SSEPayload, 1),
		newClients:     make(chan chan *SSEPayload),
		closingClients: make(chan chan *SSEPayload),
		clients:        make(map[chan *SSEPayload]bool),
	}

	go s.listen()
	return
}

func (s *SSEBroker) ServeHTTP(rw http.ResponseWriter, req *http.Request) {

	flusher, ok := rw.(http.Flusher)

	if !ok {
		http.Error(rw, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "text/event-stream")
	rw.Header().Set("Cache-Control", "no-cache")
	rw.Header().Set("Connection", "keep-alive")
	rw.Header().Set("Access-Control-Allow-Origin", "*")

	messageChan := make(chan *SSEPayload)

	s.newClients <- messageChan

	defer func() {
		s.closingClients <- messageChan
	}()

	notify := rw.(http.CloseNotifier).CloseNotify()

	go func() {
		<-notify
		s.closingClients <- messageChan
	}()

	for {
		message := <-messageChan
		fmt.Fprintf(rw, "event: %s\ndata: %s\n\n", message.Event, message.Data)
		flusher.Flush()
	}

}

func (s *SSEBroker) listen() {
	for {
		select {
		case c := <-s.newClients:
			s.clients[c] = true
			log.Printf("Client added. %d registered clients", len(s.clients))

		case c := <-s.closingClients:
			delete(s.clients, c)
			log.Printf("Removed client. %d registered clients", len(s.clients))

		case event := <-s.Notifier:
			for clientMessageChan, _ := range s.clients {
				clientMessageChan <- event
			}
		}
	}

}
