"use client";

import { useSse } from "@/hooks/useSse";
import { useStore } from "@/store/useStore";
import { EventsList } from "./EventsList";
import { FeedStatus } from "./FeedStatus";
import { EventView } from "./EventView";
import { Stats } from "./Stats";
import { BranchIcon, GitHubIcon, PauseIcon, PeopleIcon, PlayIcon, PulseIcon, RefreshIcon, RepoIcon, StarIcon } from "./icons";

export function Board() {
  useSse();
  const { entities, loading, error, online, ratelimits, numOnPage, isFrozen,
    setNumOnPage, freeze, reset } = useStore();
  const events = Object.values(entities.events);
  const stars = events.filter((event) => event.type === "WatchEvent").length;
  const forks = events.filter((event) => event.type === "ForkEvent").length;
  return (
    <>
      <a className="skip-link" href="#activity">Skip to activity</a>
      <header className="global-header">
        <div className="global-header-inner">
          <a className="brand" href="#overview" aria-label="GitHubble home"><GitHubIcon /><span>GitHubble</span></a>
          <nav className="global-nav" aria-label="Primary navigation">
            <a href="#activity">Activity</a><a href="#insights">Insights</a>
          </nav>
          <a className="header-source" href="https://github.com/theaidem/githubble" target="_blank" rel="noreferrer">View source <span aria-hidden="true">↗</span></a>
        </div>
      </header>
      <div className="repo-header">
        <div className="repo-header-inner">
          <div className="repo-identity"><RepoIcon /><a href="https://github.com/theaidem" target="_blank" rel="noreferrer">theaidem</a><span>/</span><a className="repo-name-link" href="https://github.com/theaidem/githubble" target="_blank" rel="noreferrer">githubble</a><span className="public-badge">Public</span></div>
          <nav className="repo-tabs" aria-label="Dashboard sections">
            <a className="active" href="#overview"><RepoIcon /> Overview</a>
            <a href="#activity"><PulseIcon /> Activity</a>
            <a href="#insights"><PeopleIcon /> Insights</a>
          </nav>
        </div>
      </div>
      <main className="shell" id="overview">
        <div className="page-heading">
          <div><p className="eyebrow">GITHUB PUBLIC EVENTS</p><h1>Explore GitHub stars & forks</h1>
            <p className="page-description">A live view of public activity across GitHub. Pick an event to see the details.</p></div>
          <div className="online-pill"><span className="online-dot" /> <strong>{online ?? "—"}</strong> watching now</div>
        </div>
        <section className="overview-grid" aria-label="Session overview">
          <div className="metric"><div className="metric-icon star"><StarIcon /></div><div><span className="metric-label">Stars this session</span><strong>{stars.toLocaleString()}</strong></div></div>
          <div className="metric"><div className="metric-icon fork"><BranchIcon /></div><div><span className="metric-label">Forks this session</span><strong>{forks.toLocaleString()}</strong></div></div>
          <div className="metric"><div className="metric-icon total"><PulseIcon /></div><div><span className="metric-label">Total events</span><strong>{events.length.toLocaleString()}</strong></div></div>
        </section>
        <div className="toolbar" role="group" aria-label="Feed controls">
          <div className="toolbar-label"><PulseIcon /><strong>Public activity</strong><span className="toolbar-live">LIVE</span></div>
          <div className="toolbar-actions">
            <label className="page-size">Show <select aria-label="Events on page" value={numOnPage} onChange={(e) => setNumOnPage(Number(e.target.value))}>
              {[15, 30, 50, 70, 90, 110].map((count) => <option key={count}>{count}</option>)}
            </select></label>
            <button className="btn" type="button" onClick={() => freeze(!isFrozen)}>{isFrozen ? <PlayIcon /> : <PauseIcon />}{isFrozen ? "Resume" : "Freeze"}</button>
            <button className="btn" type="button" onClick={reset}><RefreshIcon />Reset session</button>
          </div>
        </div>
        {error && <p className="alert" role="alert">{error}</p>}
        {loading && <p className="alert" role="status">Connecting to the live feed…</p>}
        <FeedStatus />
        <div className="columns">
          <EventView />
          <EventsList />
          <div className="insights-column">
            <Stats />
            <aside className="api-note" aria-label="About event freshness">
              <h3>Why are events a few minutes old?</h3>
              <p>GitHub’s public Events API is not real-time: events can arrive 30 seconds to 6 hours late. We check about once a minute and spread each batch across the feed. “New” means newly received here, not just created.</p>
              <a href="https://docs.github.com/en/rest/activity/events#list-public-events" target="_blank" rel="noreferrer">GitHub API documentation <span aria-hidden="true">↗</span></a>
            </aside>
          </div>
        </div>
        <footer className="footer"><span>GitHubble · Built for curious developers</span><span>GitHub API budget: {ratelimits?.split("/").slice(1).join(" / ") ?? "—"}</span></footer>
      </main>
    </>
  );
}
