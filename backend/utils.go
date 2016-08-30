package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
)

var langs = map[string]string{
	"Assembly":     "#assembler",
	"ActionScript": "#actionscript",
	"C":            "#clang",
	"C#":           "#csharp",
	"C++":          "#cpp",
	"Clojure":      "#clojure",
	"CoffeeScript": "#coffeescript",
	"CSS":          "#css",
	"Erlang":       "#erlang",
	"Go":           "#golang",
	"Haskell":      "#haskell",
	"HTML":         "#html",
	"Java":         "#java",
	"JavaScript":   "#javascript",
	"Lua":          "#lua",
	"Matlab":       "#Matlab",
	"Objective-C":  "#objectivec",
	"Perl":         "#perl",
	"PHP":          "#php",
	"Python":       "#python",
	"R":            "#rlang",
	"Ruby":         "#ruby",
	"Scala":        "#scala",
	"Shell":        "#shell",
	"Swift":        "#swift",
	"VimL":         "#viml",
}

var phrases = map[string][]string{
	"bestStaredRepoReplies": []string{
		"+%d in last hour",
		"Wow! +%d stars in last hour again 👍",
		"Best hourly repo again! +%d stars",
		"Again most starred! +%d stars in hour",
		"+%d stars in hour. Again Best hourly. Nice trending!",
		"🙌 +%d stars in hour. Congrats!",
	},
}

type pair struct {
	Key   string
	Value int
}

type pairList []pair

func (p pairList) Len() int           { return len(p) }
func (p pairList) Swap(i, j int)      { p[i], p[j] = p[j], p[i] }
func (p pairList) Less(i, j int) bool { return p[i].Value < p[j].Value }

func repoTags(repo string, count int) (string, error) {

	url := fmt.Sprintf("https://api.github.com/repos/%s/languages", repo)
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	data := make(map[string]int)
	err = json.Unmarshal(body, &data)
	if err != nil {
		return "", err
	}

	p := make(pairList, len(data))

	i := 0
	for k, v := range data {
		p[i] = pair{k, v}
		i++
	}

	sort.Sort(sort.Reverse(p))

	if count != 0 {
		if len(p) > count {
			p = p[:count]
		}
	}

	var tags string
	for _, l := range p {
		if tag, ok := langs[l.Key]; ok {
			tags = tags + " " + tag
		}
	}

	return tags, nil
}

func twitterPiblish() bool {
	b, err := strconv.ParseBool(os.Getenv("TWITTER_PUBLISH"))
	if err != nil {
		log.Println(err.Error())
		return false
	}
	return b
}
