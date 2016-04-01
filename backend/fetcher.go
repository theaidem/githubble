package main

import (
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/jeffail/gabs"
)

const (
	API_EVENTS = "https://api.github.com/events"
)

type Fetcher struct {
	client  *http.Client
	req     *http.Request
	payload chan *SSEPayload
	lastId  string
}

func NewFetcher(token string) (*Fetcher, error) {

	client := &http.Client{}
	req, err := http.NewRequest("GET", API_EVENTS, nil)
	if err != nil {
		return nil, err
	}

	if len(token) > 0 {
		tokenHeader := fmt.Sprintf("token %s", token)
		req.Header.Set("Authorization", tokenHeader)
	}

	payload := make(chan *SSEPayload, 1)

	fetcher := &Fetcher{client, req, payload, ""}
	err = fetcher.test()
	if err != nil {
		return nil, err
	}

	return fetcher, nil
}

func (f *Fetcher) Start() {

	go func() {

		for {

			resp, err := f.client.Do(f.req)
			if err != nil {
				log.Println(err)
				continue
			}

			etag := resp.Header.Get("ETag")
			if len(etag) != 0 {
				f.req.Header.Set("If-None-Match", etag)
			}

			rem, limit := resp.Header.Get("X-RateLimit-Remaining"), resp.Header.Get("X-RateLimit-Limit")

			switch resp.StatusCode {
			case http.StatusOK:

				body, err := ioutil.ReadAll(resp.Body)
				if err != nil {
					log.Println(err)
				}

				resp.Body.Close()

				jsonParsed, err := gabs.ParseJSON(body)
				if err != nil {
					log.Println(err)
				}

				events, _ := jsonParsed.Children()

				for _, event := range events {

					if event.Path("id").String() == f.lastId {
						break
					}

					switch event.Path("type").Data().(string) {
					case "WatchEvent", "ForkEvent":

						log.Printf("(%s/%s) %s: %s -> %s\n", rem, limit,
							event.Path("type").Data(),
							event.Path("actor.login").Data(),
							event.Path("repo.name").Data())

						// pew pew pew
						f.payload <- &SSEPayload{
							Event: "message",
							Data:  event.Bytes(),
						}

					}

				}

				f.lastId = jsonParsed.Path("id").Index(0).String()

			case http.StatusForbidden:
				log.Printf("(%s/%s) %s\n",
					resp.Header.Get("X-RateLimit-Remaining"),
					resp.Header.Get("X-RateLimit-Limit"), resp.Status)

				i, err := strconv.ParseInt(resp.Header.Get("X-RateLimit-Reset"), 10, 64)
				if err != nil {
					log.Println(err)
				}
				tm := time.Unix(i, 0)

				go func() {
					log.Println("RateLimit is expired")
					for tm.Sub(time.Now()).Minutes() > 0 {
						time.Sleep(time.Second)
						log.Printf("Restart fetcher after: %s\n", tm.Sub(time.Now()).String())
					}
					return
				}()

				time.AfterFunc(tm.Sub(time.Now()), func() {
					f.Start()
				})

				return

			default:
				log.Printf("(%s/%s) %s\n",
					resp.Header.Get("X-RateLimit-Remaining"),
					resp.Header.Get("X-RateLimit-Limit"), resp.Status)

			}
		}
	}()
}

func (f *Fetcher) test() error {
	resp, err := f.client.Do(f.req)
	if err != nil {
		return err
	}

	rem, limit := resp.Header.Get("X-RateLimit-Remaining"), resp.Header.Get("X-RateLimit-Limit")

	switch resp.StatusCode {
	case http.StatusOK, http.StatusForbidden:
		log.Printf("Available X-RateLimit: %s of %s\n", rem, limit)
	case http.StatusUnauthorized:
		err := errors.New("Bad credentials")
		return err
	}

	return nil
}
