package main

import (
	"sort"
	"sync"
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

type pair struct {
	Key   string
	Value int
}

type pairList []pair

func (p pairList) Len() int           { return len(p) }
func (p pairList) Swap(i, j int)      { p[i], p[j] = p[j], p[i] }
func (p pairList) Less(i, j int) bool { return p[i].Value < p[j].Value }

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
	actors, repos statsMap
}

func newStorage() *storage {
	return &storage{
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
