import type { AppEvent, GitHubActor, GitHubRepo, Normalized } from "./types";

// Normalize a raw GitHub event (as returned by the public events feed) into the
// same shape normalizr used to produce: { result, entities: { events, actors,
// repos } }. This keeps the store reducers identical to the original.
export function normalizeEvent(raw: unknown): Normalized | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const a = r.actor as Partial<GitHubActor> | undefined;
  const repoRaw = r.repo as Partial<GitHubRepo> | undefined;
  if (
    (r.type !== "WatchEvent" && r.type !== "ForkEvent") ||
    typeof r.id !== "string" ||
    typeof r.created_at !== "string" ||
    typeof a?.id !== "number" ||
    typeof a.login !== "string" ||
    typeof repoRaw?.id !== "number" ||
    typeof repoRaw.name !== "string"
  ) return null;

  const actor: GitHubActor = {
    id: a.id,
    login: a.login,
    avatar_url: a.avatar_url ?? "",
  };

  // The public feed exposes repo as an object with a `name` ("owner/name").
  // Guard for the string form just in case.
  const repo: GitHubRepo = {
    id: repoRaw.id,
    name: repoRaw.name,
    description: repoRaw.description,
  };

  const event: AppEvent = {
    id: String(r.id),
    type: r.type as AppEvent["type"],
    actor: actor.id,
    repo: repo.id,
    created_at: r.created_at,
  };

  return {
    result: String(r.id),
    entities: {
      events: { [event.id]: event },
      actors: { [actor.id]: actor },
      repos: { [repo.id]: repo },
    },
  };
}
