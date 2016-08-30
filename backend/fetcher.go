package main

import (
	"container/ring"
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
	apiEvents = "https://api.github.com/events"
)

type fetcher struct {
	client  *http.Client
	req     *http.Request
	payload chan *ssePayload
	store   *store
	tokens  *ring.Ring
	lastID  string
}

func newFetcher(tokens []string) (*fetcher, error) {

	client := &http.Client{}
	req, err := http.NewRequest("GET", apiEvents, nil)
	if err != nil {
		return nil, err
	}

	tokenRing := ring.New(len(tokens))
	if len(tokens) > 0 {
		for _, t := range tokens {
			tokenRing.Value = string(t)
			tokenRing = tokenRing.Next()
		}

		tokenHeader := fmt.Sprintf("token %s", tokenRing.Value.(string))
		req.Header.Set("Authorization", tokenHeader)
	}

	payload := make(chan *ssePayload, 1)

	store, err := newStore()
	if err != nil {
		return nil, err
	}

	fetcher := &fetcher{client, req, payload, store, tokenRing, ""}
	err = fetcher.test()
	if err != nil {
		return nil, err
	}

	return fetcher, nil
}

func (f *fetcher) start() {

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
					continue
				}

				events, err := jsonParsed.Children()
				if err != nil {
					log.Println(err)
					continue
				}

				for _, event := range events {

					if event.Path("id").String() == f.lastID {
						break
					}

					switch eventType(event.Path("type").Data().(string)) {
					case star, fork:

						log.Printf("%s (%s/%s) %s: %s -> %s\n",
							f.tokens.Value.(string)[:6], rem, limit,
							event.Path("type").Data(),
							event.Path("actor.login").Data(),
							event.Path("repo.name").Data())

						err = f.store.add(
							eventType(event.Path("type").Data().(string)),
							actor,
							event.Path("actor.login").Data().(string),
						)

						if err != nil {
							log.Println(err)
						}

						err = f.store.add(
							eventType(event.Path("type").Data().(string)),
							repo,
							event.Path("repo.name").Data().(string),
						)

						if err != nil {
							log.Println(err)
						}

						// pew pew pew
						f.payload <- &ssePayload{
							Event: "message",
							Data:  event.Bytes(),
						}

					}

				}

				f.payload <- &ssePayload{
					Event: "ratelimits",
					Data:  []byte(fmt.Sprintf("%s/%s/%s", f.tokens.Value.(string)[:6], rem, limit)),
				}

				f.lastID = jsonParsed.Path("id").Index(0).String()

			case http.StatusForbidden:
				log.Printf("(%s/%s) %s\n",
					resp.Header.Get("X-RateLimit-Remaining"),
					resp.Header.Get("X-RateLimit-Limit"), resp.Status)

				f.tokens = f.tokens.Next()
				tokenHeader := fmt.Sprintf("token %s", f.tokens.Value.(string))
				f.req.Header.Set("Authorization", tokenHeader)

				if f.test() == nil {
					continue
				}

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
					f.start()
				})

				return

			default:
				log.Printf("%s (%s/%s) %s\n",
					f.tokens.Value.(string)[:6],
					resp.Header.Get("X-RateLimit-Remaining"),
					resp.Header.Get("X-RateLimit-Limit"), resp.Status)

			}
		}
	}()

	go func() {
		for now := range time.Tick(time.Second) {

			if now.Minute() == 0 && now.Second() == 0 {

				if twitterPiblish() {
					err := f.store.bestRepoTweet()
					if err != nil {
						log.Printf("bestRepoTweet error: %#v\n", err.Error())
					}
				}

				f.store.clear(repo)

			}

			if now.Minute() == 0 && now.Second() == 0 && now.Hour()%3 == 0 {

				if twitterPiblish() {
					err := f.store.bestUserTweet()
					if err != nil {
						log.Printf("bestUserTweet error: %#v\n", err.Error())
					}
				}

				f.store.clear(actor)

			}

		}
	}()

}

func (f *fetcher) test() error {
	resp, err := f.client.Do(f.req)
	if err != nil {
		return err
	}

	rem, limit := resp.Header.Get("X-RateLimit-Remaining"), resp.Header.Get("X-RateLimit-Limit")

	switch resp.StatusCode {
	case http.StatusOK, http.StatusForbidden:
		log.Printf("%s Available X-RateLimit: %s of %s\n", f.tokens.Value.(string)[:5], rem, limit)
	case http.StatusUnauthorized:
		err := errors.New("Bad credentials")
		return err
	}

	return nil
}
