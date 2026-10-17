// Shared domain types for the GitHub events feed and the normalized store.

export type GitHubEventType = "WatchEvent" | "ForkEvent";

export interface GitHubActor {
  id: number;
  login: string;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string; // "owner/name"
  description?: string;
}

export interface AppEvent {
  id: string;
  type: GitHubEventType;
  actor: number; // -> actors[id]
  repo: number; // -> repos[id]
  created_at: string;
}

// Shape produced by the normalizer (mirrors normalizr's output so the store
// logic is unchanged): { result, entities: { events, actors, repos } }.
export interface Normalized {
  result: string;
  entities: {
    events: Record<string, AppEvent>;
    actors: Record<number, GitHubActor>;
    repos: Record<number, GitHubRepo>;
  };
}
