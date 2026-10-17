"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { elapsed } from "@/utils/format";
import { BranchIcon, PeopleIcon, RepoIcon, StarIcon } from "./icons";

export function Stats() {
  const { reports, entities, startedAt } = useStore();
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const top = (records: typeof reports.actors, kind: "stars" | "forks") =>
    Object.values(records).filter((item) => item[kind] > 0)
      .sort((a, b) => b[kind] - a[kind] || a.id - b.id).slice(0, 3);
  const list = (title: string, records: typeof reports.actors, kind: "stars" | "forks", actor: boolean) =>
    <div className="stat-group"><h3>{kind === "stars" ? <StarIcon /> : <BranchIcon />}{title}</h3><ol>{top(records, kind).map((item) => {
      const name = actor ? entities.actors[item.id]?.login : entities.repos[item.id]?.name;
      return <li key={item.id}><a href={`https://github.com/${name?.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noreferrer">{name ?? "Unknown"}</a><strong className="count-badge">{item[kind]}</strong></li>;
    })}{top(records, kind).length === 0 && <li className="stat-empty">No activity yet</li>}</ol></div>;
  return <aside className="panel stats" id="insights" aria-label="Session statistics">
    <div className="panel-title"><div><h2>Insights</h2><p>Top activity this session</p></div></div>
    <p className="stats-summary"><PeopleIcon /> {Object.keys(entities.actors).length} actors <span>·</span> <RepoIcon /> Session {startedAt && now ? elapsed(now - startedAt) : "0s"}</p>
    {list("Top stargazers", reports.actors, "stars", true)}
    {list("Top forkers", reports.actors, "forks", true)}
    {list("Most starred repos", reports.repos, "stars", false)}
    {list("Most forked repos", reports.repos, "forks", false)}
  </aside>;
}
