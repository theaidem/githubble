"use client";

import { useStore } from "@/store/useStore";
import { formatTime } from "@/utils/format";
import { StarIcon, BranchIcon } from "./icons";

export function EventsList() {
  const { entities, numOnPage, isFrozen, frozenIds, viewingEvent, viewEvent } = useStore();
  const ids = (isFrozen ? frozenIds : entities.eventIds).slice(0, numOnPage);
  return <section className="panel feed" id="activity" aria-label="Live events">
    <div className="panel-title"><div><h2>Live events</h2><p>Recent stars and forks from public repositories</p></div><span className={`stream-badge ${isFrozen ? "paused" : ""}`}>{isFrozen ? "Paused" : "Streaming"}</span></div>
    {ids.length === 0 && <p className="empty">Waiting for stars and forks from the next GitHub check…</p>}
    <ul>{ids.map((id) => {
      const event = entities.events[id];
      const actor = entities.actors[event?.actor];
      const repo = entities.repos[event?.repo];
      if (!event || !actor || !repo) return null;
      return <li key={id}><button type="button" className={`event-row ${viewingEvent === id ? "selected" : ""}`} onClick={() => viewEvent(id)}>
        {actor.avatar_url ? <img className="event-avatar" src={actor.avatar_url} alt="" width={36} height={36} /> : <span className="avatar-fallback" aria-hidden="true">{actor.login.slice(0, 1).toUpperCase()}</span>}
        <span className="event-copy"><span><strong>{actor.login}</strong> {event.type === "WatchEvent" ? "starred" : "forked"} <strong className="event-repo">{repo.name}</strong></span>
          <small><time dateTime={event.created_at}>{formatTime(event.created_at)}</time> · Public activity</small></span>
        <span className={`event-type-icon ${event.type === "WatchEvent" ? "star" : "fork"}`}>{event.type === "WatchEvent" ? <StarIcon /> : <BranchIcon />}</span>
      </button></li>;
    })}</ul>
  </section>;
}
