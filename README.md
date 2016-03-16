# GitHubble
=========

View github starts/forks in realtime

## What Uses

### Frontend

[Redux](https://github.com/reactjs/redux), 
[react](https://github.com/facebook/react),
[normalizr](https://github.com/gaearon/normalizr),
[webpack](https://github.com/webpack/webpack) module bundler
 and [Semantic UI](https://github.com/Semantic-Org/Semantic-UI) components

### Backend

[Golang](https://golang.org/) :+1:

## How to run localy

Make sure you have [Golang](https://golang.org/) and [NodeJS](https://nodejs.org/) installed

Clone the repo: 

```bash
git clone https://github.com/theaidem/githubble
cd githubble/backend
go get -v .
```

Generate your personal [access token](https://github.com/settings/tokens) from Github, then Build and run githubble server:

```bash
go build -o githubble && ./githubble  -token=<github_access_token>
```

`<github_access_token>` is Your Personal [access token](https://github.com/settings/tokens) from Github

From another terminal window:

```bash
cd path/to/githubble/frontend
```

Install dependencies and run:

```
npm i
npm start
```

open http://localhost:3001

