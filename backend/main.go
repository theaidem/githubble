package main

import (
	"flag"
	"log"
	"net/http"
	"os"
)

func main() {

	token := flag.String("token", "", "Your Personal access token (https://github.com/settings/tokens)")
	flag.Parse()

	sse := NewServer()
	fetcher, err := NewFetcher(*token)
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

	log.Fatal("HTTP server error: ", http.ListenAndServe("localhost:3000", sse))
}
