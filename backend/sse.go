package main

import (
	"fmt"
	"log"
	"net/http"
)

type sseBroker struct {
	Notifier       chan *ssePayload
	newClients     chan chan *ssePayload
	closingClients chan chan *ssePayload
	clients        map[chan *ssePayload]bool
}

type ssePayload struct {
	Event string
	Data  []byte
}

func newServer() (s *sseBroker) {
	s = &sseBroker{
		Notifier:       make(chan *ssePayload, 1),
		newClients:     make(chan chan *ssePayload),
		closingClients: make(chan chan *ssePayload),
		clients:        make(map[chan *ssePayload]bool),
	}

	go s.listen()
	return
}

func (s *sseBroker) ServeHTTP(rw http.ResponseWriter, req *http.Request) {

	flusher, ok := rw.(http.Flusher)

	if !ok {
		http.Error(rw, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	rw.Header().Set("Content-Type", "text/event-stream")
	rw.Header().Set("Cache-Control", "no-cache")
	rw.Header().Set("Connection", "keep-alive")
	rw.Header().Set("Access-Control-Allow-Origin", "*")

	messageChan := make(chan *ssePayload)

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

func (s *sseBroker) sendOnline(n int) {
	usersLen := fmt.Sprintf("%d", n)
	s.Notifier <- &ssePayload{
		Event: "online",
		Data:  []byte(usersLen),
	}
}

func (s *sseBroker) listen() {
	for {
		select {
		case c := <-s.newClients:
			s.clients[c] = true
			s.sendOnline(len(s.clients))
			log.Printf("Client added. %d registered clients", len(s.clients))

		case c := <-s.closingClients:
			delete(s.clients, c)
			s.sendOnline(len(s.clients))
			log.Printf("Removed client. %d registered clients", len(s.clients))

		case event := <-s.Notifier:
			for clientMessageChan := range s.clients {
				clientMessageChan <- event
			}
		}
	}

}
