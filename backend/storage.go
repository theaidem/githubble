package main

import (
	"fmt"
	"log"
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

type storage struct {
	twitter       *anaconda.TwitterApi
	actors, repos statsMap
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

func (s *storage) postTweet() error {

	bestStargazer := s.actors.stars.top(1)
	bestStaredRepo := s.repos.stars.top(1)

	actorLink := fmt.Sprintf("github.com/%s", bestStargazer[0].Key)
	repoLink := fmt.Sprintf("github.com/%s", bestStaredRepo[0].Key)

	tags, err := repoTags(bestStaredRepo[0].Key, 2)
	if err != nil {
		return err
	}

	actorContent := fmt.Sprintf("Best #github stargazer for last hour is %s, %d stars", actorLink, bestStargazer[0].Value)
	repoContent := fmt.Sprintf("Most starred #github repo for last hour is %s, got %d stars%s", repoLink, bestStaredRepo[0].Value, tags)

	_, err = s.twitter.PostTweet(actorContent, nil)
	if err != nil {
		return err
	}
	log.Printf("bestStargazer: %#v\n", actorContent)

	_, err = s.twitter.PostTweet(repoContent, nil)
	if err != nil {
		return err
	}
	log.Printf("bestStaredRepo: %#v\n", repoContent)

	return nil
}
