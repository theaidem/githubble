package main

import (
	"fmt"
	"log"
	"net/http"
)

type SSEBroker struct {
	Notifier       chan []byte
	newClients     chan chan []byte
	closingClients chan chan []byte
	clients        map[chan []byte]bool
}

func NewServer() (s *SSEBroker) {
	s = &SSEBroker{
		Notifier:       make(chan []byte, 1),
		newClients:     make(chan chan []byte),
		closingClients: make(chan chan []byte),
		clients:        make(map[chan []byte]bool),
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

	messageChan := make(chan []byte)

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
		fmt.Fprintf(rw, "data: %s\n\n", <-messageChan)
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
