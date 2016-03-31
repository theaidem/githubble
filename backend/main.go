package main

import (
	"log"
	"net/http"
	"os"
)

var token string

func main() {

	sse := NewServer()
	fetcher, err := NewFetcher(token)
	if err != nil {
		log.Println(err)
		os.Exit(1)
	}

	go func() {

		// Let's go ahead
		fetcher.Start()

		for {
			payload := <-fetcher.payload
			sse.Notifier <- payload
		}
	}()

	log.Fatal("HTTP server error: ", http.ListenAndServe("0.0.0.0:3000", sse))
}
