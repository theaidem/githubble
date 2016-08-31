package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/ChimeraCoder/anaconda"
	"github.com/tidwall/buntdb"
)

type eventType string
type targetType string

const (
	star  eventType  = "WatchEvent"
	fork             = "ForkEvent"
	actor targetType = "actor"
	repo             = "repo"
)

type stat struct {
	event        eventType
	target       targetType
	name, amount string
}

type lastTweet struct {
	data  *stat
	tweet *anaconda.Tweet
}

type store struct {
	twitter *anaconda.TwitterApi
	db      *buntdb.DB
}

func newStore() (*store, error) {
	db, err := buntdb.Open("data.db")
	if err != nil {
		return nil, err
	}
	// github:eventType:target:name:amount
	db.CreateIndex("amounts", "github:*:amount", buntdb.IndexInt)

	anaconda.SetConsumerKey(os.Getenv("TWITTER_CONSUMER_KEY"))
	anaconda.SetConsumerSecret(os.Getenv("TWITTER_CONSUMER_SECRET"))

	twitter := anaconda.NewTwitterApi(
		os.Getenv("TWITTER_ACCESS_TOKEN"),
		os.Getenv("TWITTER_ACCESS_TOKEN_SECRET"))

	return &store{
		twitter: twitter,
		db:      db,
	}, nil
}

func (s *store) add(event eventType, target targetType, name string) error {

	err := s.db.Update(func(tx *buntdb.Tx) error {

		key := fmt.Sprintf("github:%s:%s:%s:amount", event, target, name)

		val, err := tx.Get(key)
		if err != nil && err != buntdb.ErrNotFound {
			return err
		}

		if err == buntdb.ErrNotFound {
			_, _, err = tx.Set(key, "1", nil)
			return err
		}

		amount, err := strconv.ParseInt(val, 0, 32)
		if err != nil {
			return err
		}

		amount++
		_, _, err = tx.Set(key, fmt.Sprintf("%d", amount), nil)
		return err

	})

	return err
}

func (s *store) top(event eventType, target targetType) (*stat, error) {
	var res *stat
	err := s.db.View(func(tx *buntdb.Tx) error {
		tx.Descend("amounts", func(key, amount string) bool {
			keyDetails := strings.Split(key, ":")
			if eventType(keyDetails[1]) == event && targetType(keyDetails[2]) == target {
				res = new(stat)
				res.event = event
				res.target = target
				res.name = keyDetails[3]
				res.amount = amount
				return false
			}
			return true
		})
		return nil
	})
	return res, err
}

func (s *store) clear(target targetType) error {
	err := s.db.Update(func(tx *buntdb.Tx) error {
		return tx.Descend("amounts", func(key, amount string) bool {
			keyDetails := strings.Split(key, ":")
			if len(keyDetails) > 2 {
				if targetType(keyDetails[2]) == target {
					_, err := tx.Delete(key)
					log.Println(err)
				}
			}
			return true
		})
	})
	return err
}

func (s *store) last(event eventType, target targetType) (*lastTweet, error) {
	var last *lastTweet
	err := s.db.View(func(tx *buntdb.Tx) error {
		key := fmt.Sprintf("last:%s:%s", event, target)
		val, err := tx.Get(key)
		if err != nil {
			return err
		}

		last = new(lastTweet)
		return json.Unmarshal([]byte(val), last)

	})
	return last, err
}

func (s *store) setLast(last *lastTweet) error {
	err := s.db.Update(func(tx *buntdb.Tx) error {
		key := fmt.Sprintf("last:%s:%s", last.data.event, last.data.target)

		data, err := json.Marshal(last)
		if err != nil {
			return err
		}

		_, _, err = tx.Set(key, string(data), nil)
		return err
	})
	return err
}

func (s *store) bestRepoTweet() error {

	theRepo, err := s.top(star, repo)
	if err != nil {
		return err
	}
	if theRepo == nil {
		return errors.New("nothing to posts")
	}

	last, err := s.last(star, repo)
	if err != nil && err != buntdb.ErrNotFound {
		return err
	}

	if last != nil {
		if last.data.name == theRepo.name {
			// again the same repo
			text := phrases["bestStaredRepoReplies"][rand.Intn(len(phrases["bestStaredRepoReplies"])-1)]
			content := fmt.Sprintf(text, theRepo.amount)

			opts := url.Values{}
			opts.Set("in_reply_to_status_id", last.tweet.IdStr)

			_, err = s.twitter.PostTweet(content, opts)
			if err != nil {
				return err
			}
			return nil
		}
	}

	repoLink := fmt.Sprintf("github.com/%s", theRepo.name)
	tags, err := repoTags(theRepo.name, 2)
	if err != nil {
		return err
	}

	repoContent := fmt.Sprintf("Most starred #github repo for last hour is %s, got %s stars%s", repoLink, theRepo.amount, tags)
	tweet, err := s.twitter.PostTweet(repoContent, nil)
	if err != nil {
		return err
	}

	lastBestRepo := &lastTweet{
		data:  theRepo,
		tweet: &tweet,
	}

	log.Printf("bestStaredRepo: %#v\n", repoContent)
	return s.setLast(lastBestRepo)
}

func (s *store) bestUserTweet() error {

	theActor, err := s.top(star, actor)
	if err != nil {
		return err
	}
	if theActor == nil {
		return errors.New("nothing to posts")
	}

	actorLink := fmt.Sprintf("github.com/%s", theActor.name)
	actorContent := fmt.Sprintf("Best #github stargazer for last 3 hours is %s, %s stars", actorLink, theActor.amount)

	tweet, err := s.twitter.PostTweet(actorContent, nil)
	if err != nil {
		return err
	}

	lastBestActor := &lastTweet{
		data:  theActor,
		tweet: &tweet,
	}

	log.Printf("bestStargazer: %#v\n", actorContent)
	return s.setLast(lastBestActor)
}
