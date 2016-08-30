package main

import (
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/url"
	"os"
	"sort"
	"sync"

	"github.com/ChimeraCoder/anaconda"
)

type statsMap struct {
	stars, forks stats
}

func (s *statsMap) inc(data, typ string) {
	switch typ {
	case "WatchEvent":
		s.stars.inc(data)
	case "ForkEvent":
		s.forks.inc(data)
	}
}

func (s *statsMap) reset() {
	s.stars.reset()
	s.forks.reset()
}

type stats struct {
	data map[string]int
	sync.Mutex
}

func (s *stats) inc(data string) {
	go func() {
		s.Lock()
		s.data[data]++
		s.Unlock()
	}()
}

func (s *stats) reset() {
	s.Lock()
	s.data = make(map[string]int)
	s.Unlock()
}

func (s *stats) top(count int) pairList {
	s.Lock()
	defer s.Unlock()

	p := make(pairList, len(s.data))

	i := 0
	for k, v := range s.data {
		p[i] = pair{k, v}
		i++
	}

	sort.Sort(sort.Reverse(p))
	if len(p) >= count {
		return p[:count]
	}

	return p
}

type lastTweet struct {
	name  string
	num   int
	tweet *anaconda.Tweet
}

type storage struct {
	twitter                     *anaconda.TwitterApi
	lastBestRepo, lastBestActor *lastTweet
	actors, repos               statsMap
}

func newStorage() *storage {

	anaconda.SetConsumerKey(os.Getenv("TWITTER_CONSUMER_KEY"))
	anaconda.SetConsumerSecret(os.Getenv("TWITTER_CONSUMER_SECRET"))

	twitter := anaconda.NewTwitterApi(
		os.Getenv("TWITTER_ACCESS_TOKEN"),
		os.Getenv("TWITTER_ACCESS_TOKEN_SECRET"))

	return &storage{
		twitter: twitter,
		actors: statsMap{
			stars: stats{data: make(map[string]int)},
			forks: stats{data: make(map[string]int)},
		},
		repos: statsMap{
			stars: stats{data: make(map[string]int)},
			forks: stats{data: make(map[string]int)},
		},
	}
}

func (s *storage) bestRepoTweet() error {

	bestStaredRepo := s.repos.stars.top(1)
	if bestStaredRepo == nil {
		return errors.New("nothing to posts")
	}

	repo := bestStaredRepo[0]

	if s.lastBestRepo != nil {
		if s.lastBestRepo.name == repo.Key {
			// again the same repo
			text := phrases["bestStaredRepoReplies"][rand.Intn(len(phrases["bestStaredRepoReplies"])-1)]
			content := fmt.Sprintf(text, repo.Value)

			opts := url.Values{}
			opts.Set("in_reply_to_status_id", s.lastBestRepo.tweet.IdStr)

			_, err := s.twitter.PostTweet(content, opts)
			if err != nil {
				return err
			}
			return nil
		}
	}

	repoLink := fmt.Sprintf("github.com/%s", repo.Key)

	tags, err := repoTags(repo.Key, 2)
	if err != nil {
		return err
	}

	repoContent := fmt.Sprintf("Most starred #github repo for last hour is %s, got %d stars%s", repoLink, repo.Value, tags)
	tweet, err := s.twitter.PostTweet(repoContent, nil)
	if err != nil {
		return err
	}

	s.lastBestRepo = &lastTweet{
		name:  repo.Key,
		num:   repo.Value,
		tweet: &tweet,
	}

	log.Printf("bestStaredRepo: %#v\n", repoContent)
	return nil
}

func (s *storage) bestUserTweet() error {

	bestStargazer := s.actors.stars.top(1)
	if bestStargazer == nil {
		return errors.New("nothing to posts")
	}

	actor := bestStargazer[0]
	actorLink := fmt.Sprintf("github.com/%s", actor.Key)
	actorContent := fmt.Sprintf("Best #github stargazer for last 3 hours is %s, %d stars", actorLink, actor.Value)

	tweet, err := s.twitter.PostTweet(actorContent, nil)
	if err != nil {
		return err
	}

	s.lastBestActor = &lastTweet{
		name:  actor.Key,
		num:   actor.Value,
		tweet: &tweet,
	}

	log.Printf("bestStargazer: %#v\n", actorContent)
	return nil
}
