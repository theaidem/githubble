package main

import (
	"log"
	"net/http"
	"os"
	"strings"
)

var tokens string

func main() {

	sse := newServer()
	fetcher, err := newFetcher(strings.Split(tokens, ","))
	if err != nil {
		log.Println(err)
		os.Exit(1)
	}

	go func() {

		// Let's go ahead
		fetcher.start()

		for {
			payload := <-fetcher.payload
			sse.Notifier <- payload
		}
	}()

	log.Fatal("HTTP server error: ", http.ListenAndServe("0.0.0.0:3000", sse))
}
