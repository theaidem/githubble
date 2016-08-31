# [GitHubble](http://githubble.com/)

View github stars / forks in real-time, and follow me on [twitter](https://twitter.com/githubble)

## What Uses?

### Frontend

[Redux](https://github.com/reactjs/redux),
[react](https://github.com/facebook/react),
[normalizr](https://github.com/gaearon/normalizr)

[Webpack](https://github.com/webpack/webpack) module bundler
 and [Semantic UI](https://github.com/Semantic-Org/Semantic-UI) components

### Backend

[Golang](https://golang.org/) :+1:

[Server-Sent Events](http://www.w3schools.com/html/html5_serversentevents.asp) sending event streams for clients

## How to run localy

Make sure you have [Golang](https://golang.org/) and [NodeJS](https://nodejs.org/) installed

Clone the repo:

```bash
git clone https://github.com/theaidem/githubble
cd githubble/backend
go get -v .
```

Generate your personal [access token](https://github.com/settings/tokens) from Github, then Build and run githubble server:

`<github_access_token>` is Your Personal [access token](https://github.com/settings/tokens) from Github

Copy environment file

```bash
cp .env.example .env
```

and paste your token(s) in this file:

```
GITHUB_TOKENS = <github_access_token>
```

if you want setup twitter posting, fill `TWITTER_` variables in .env file

and run the commands:

```bash
make build && make run
```

From another terminal window:

```bash
cd path/to/githubble/frontend
```

Install dependencies and run:

```
npm i
npm start
```

open [localhost:3001](http://localhost:3001)
