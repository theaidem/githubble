# GitHubble

<p align="center">
  <img src="assets/githubble-space.jpg" alt="Кот-астронавт, космический телескоп и звёзды" width="600">
</p>

Live version: https://githubble.root.sx/#overview

Live dashboard for public GitHub stars and forks. Go polls the GitHub public
events API and broadcasts WatchEvent/ForkEvent via SSE. Next.js streams those
events through a same-origin route into a React dashboard with session stats,
top actors/repositories, event navigation, pause, counters, and reset.

## Run with Docker Compose

1. Create a [GitHub personal access token](https://github.com/settings/tokens)
   (a token with no scopes is enough for public events).
2. Copy `.env.example` to `.env` and set `GITHUB_TOKENS` (separate multiple tokens with commas).
3. Run `docker compose up --build` and open http://localhost:3001.

The only public service is Next.js on port 3001. The Go backend is internal to
Compose. Never put a GitHub token into `NEXT_PUBLIC_*` variables.

## Local development

Requires Go 1.26.9+ and Node.js 22.12+.

```sh
cd backend
GITHUB_TOKENS=your_token go run .
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3001. If Go isn't listening on localhost:3003, set
`BACKEND_URL` for the Next.js process (e.g. `BACKEND_URL=http://localhost:3003`).
The backend only polls while at least one SSE client is connected. It checks
up to 300 recent events (three pages of 100) and honors GitHub's
`X-Poll-Interval` (normally 60 seconds), using conditional requests. New
events may therefore appear with a delay. The public events feed is eventually
consistent; this app does not guarantee delivery of every GitHub event.
The browser paces each received batch across the following minute to make
the feed easier to watch. Its status line shows the last GitHub check and the
number of buffered events; pacing does not mean the underlying data is newer.
New connections also receive a small replay of recent events so the board can
populate immediately after the service has completed at least one poll.

The Go service writes structured JSON logs to stdout. Set `LOG_LEVEL=debug`
in `.env` for additional diagnostics (`info` is the default), then run
`docker compose logs -f backend`. Logs report client counts, scanned pages,
new stars/forks, GitHub poll interval, rate-limit status and errors; they do
not include token values or event payloads.

## GitHub Pages

On every push to `master` CI also publishes a static build of the frontend to
GitHub Pages (enable it once in Settings → Pages → Source: GitHub Actions).
The static build has no Next.js route, so it reads the SSE stream from
`https://githubble.root.sx/api/events`; override it with the repository
variable `PAGES_SSE_URL`. Local check:
`GITHUB_PAGES=true PAGES_BASE_PATH=/githubble NEXT_PUBLIC_SSE_URL=... npm run build`
after temporarily removing `frontend/src/app/api`.

## Checks

```sh
cd backend && go test -race ./... && go vet ./...
cd frontend && npm test && npm run typecheck && npm run build
```
