import { create } from "zustand";
import type { AppEvent, GitHubActor, GitHubRepo, Normalized } from "@/lib/types";

type Bucket = { id: number; stars: number; forks: number };
type Entities = {
  events: Record<string, AppEvent>;
  actors: Record<number, GitHubActor>;
  repos: Record<number, GitHubRepo>;
  eventIds: string[];
};
type Reports = { actors: Record<number, Bucket>; repos: Record<number, Bucket> };

const emptyEntities = (): Entities => ({ events: {}, actors: {}, repos: {}, eventIds: [] });
const emptyReports = (): Reports => ({ actors: {}, repos: {} });

interface BoardState {
  entities: Entities;
  reports: Reports;
  loading: boolean;
  error: string | null;
  online: number | null;
  ratelimits: string | null;
  lastCheckedAt: number;
  queued: number;
  viewingEvent: string | null;
  numOnPage: number;
  isFrozen: boolean;
  frozenIds: string[];
  startedAt: number;
  setConnected: () => void;
  setError: (message: string) => void;
  receiveEvent: (event: Normalized) => void;
  setOnline: (count: number) => void;
  setRatelimits: (value: string) => void;
  setCheckedAt: (timestamp: number) => void;
  setQueued: (size: number) => void;
  viewEvent: (id: string | null) => void;
  setNumOnPage: (count: number) => void;
  freeze: (frozen: boolean) => void;
  reset: () => void;
}

export const useStore = create<BoardState>((set) => ({
  entities: emptyEntities(),
  reports: emptyReports(),
  loading: true,
  error: null,
  online: null,
  ratelimits: null,
  lastCheckedAt: 0,
  queued: 0,
  viewingEvent: null,
  numOnPage: 30,
  isFrozen: false,
  frozenIds: [],
  startedAt: 0,
  setConnected: () => set({ loading: false, error: null }),
  setError: (error) => set({ error, loading: false }),
  receiveEvent: (normalized) => set((state) => {
    const { result, entities } = normalized;
    if (state.entities.events[result]) return state;
    const event = entities.events[result];
    if (!event) return state;
    const actor = state.reports.actors[event.actor] ?? { id: event.actor, stars: 0, forks: 0 };
    const repo = state.reports.repos[event.repo] ?? { id: event.repo, stars: 0, forks: 0 };
    const key = event.type === "WatchEvent" ? "stars" : "forks";
    return {
      startedAt: state.startedAt || Date.now(),
      entities: {
        events: { ...state.entities.events, ...entities.events },
        actors: { ...state.entities.actors, ...entities.actors },
        repos: { ...state.entities.repos, ...entities.repos },
        eventIds: [result, ...state.entities.eventIds],
      },
      reports: {
        actors: { ...state.reports.actors, [event.actor]: { ...actor, [key]: actor[key] + 1 } },
        repos: { ...state.reports.repos, [event.repo]: { ...repo, [key]: repo[key] + 1 } },
      },
    };
  }),
  setOnline: (online) => set({ online }),
  setRatelimits: (ratelimits) => set({ ratelimits, lastCheckedAt: Date.now() }),
  setCheckedAt: (lastCheckedAt) => set({ lastCheckedAt }),
  setQueued: (queued) => set({ queued }),
  viewEvent: (viewingEvent) => set({ viewingEvent }),
  setNumOnPage: (numOnPage) => set({ numOnPage }),
  freeze: (isFrozen) => set((state) => ({
    isFrozen,
    frozenIds: isFrozen ? state.entities.eventIds.slice(0, state.numOnPage) : [],
  })),
  reset: () => set({
    entities: emptyEntities(), reports: emptyReports(), viewingEvent: null,
    numOnPage: 30, isFrozen: false, frozenIds: [], startedAt: 0,
  }),
}));
