"use client";

import { useStore } from "@/store/useStore";
import { fromNowIso } from "@/utils/format";
import { StarIcon, BranchIcon, RepoIcon } from "./icons";

export function EventView() {
  const { entities, viewingEvent, viewEvent } = useStore();
  const id = viewingEvent && entities.events[viewingEvent] ? viewingEvent : entities.eventIds[0];
  const event = id ? entities.events[id] : null;
  const actor = event && entities.actors[event.actor];
  const repo = event && entities.repos[event.repo];
  const index = id ? entities.eventIds.indexOf(id) : -1;
  // Newest events are first; "prev" goes toward older events.
  const prev = entities.eventIds[index + 1];
  const next = index > 0 ? entities.eventIds[index - 1] : undefined;
  return <section className="panel detail" aria-label="Selected event">
    <div className="panel-title"><div><h2>Event details</h2><p>Explore the selected activity</p></div></div>
    {event && actor && repo ? <>
      <div className="navigator"><button disabled={!prev} onClick={() => viewEvent(prev ?? null)} type="button">← Prev</button>
        <button disabled={!next} onClick={() => viewEvent(next ?? null)} type="button">Next →</button></div>
      <div className="detail-body">
        {actor.avatar_url ? <img className="large-avatar" src={actor.avatar_url} alt="" width={280} height={280} /> : <span className="large-avatar avatar-fallback" aria-hidden="true">{actor.login.slice(0, 1).toUpperCase()}</span>}
        <h3><a href={`https://github.com/${encodeURIComponent(actor.login)}`} target="_blank" rel="noreferrer">{actor.login}</a></h3>
        <p className="muted">{fromNowIso(event.created_at)}</p>
        <span className={`action ${event.type === "WatchEvent" ? "star" : "fork"}`}>
          {event.type === "WatchEvent" ? <StarIcon /> : <BranchIcon />}{event.type === "WatchEvent" ? "Starred a repository" : "Forked a repository"}
        </span>
        <div className="detail-repo"><span>Repository</span>
          <a className="repo-link" href={`https://github.com/${repo.name.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noreferrer"><RepoIcon />{repo.name} <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </> : <p className="empty">Select an event from the live feed.</p>}
  </section>;
}
