import { beforeEach, describe, expect, it } from "vitest";
import { normalizeEvent } from "@/lib/normalize";
import { useStore } from "./useStore";

function receive(id: string, type: "WatchEvent" | "ForkEvent", actorId = 1, repoId = 2) {
  const event = normalizeEvent({ id, type, created_at: new Date().toISOString(),
    actor: { id: actorId, login: "octocat", avatar_url: "" }, repo: { id: repoId, name: "a/b" } });
  if (!event) throw new Error("invalid fixture");
  useStore.getState().receiveEvent(event);
}

describe("board store", () => {
  beforeEach(() => useStore.getState().reset());

  it("normalizes stars and forks, aggregates and deduplicates", () => {
    receive("1", "WatchEvent");
    receive("2", "ForkEvent");
    receive("1", "WatchEvent");
    const { entities, reports } = useStore.getState();
    expect(entities.eventIds).toEqual(["2", "1"]);
    expect(reports.actors[1]).toMatchObject({ stars: 1, forks: 1 });
    expect(reports.repos[2]).toMatchObject({ stars: 1, forks: 1 });
  });

  it("freezes visible ids but continues counting incoming events", () => {
    receive("1", "WatchEvent");
    useStore.getState().freeze(true);
    receive("2", "ForkEvent");
    expect(useStore.getState().frozenIds).toEqual(["1"]);
    expect(useStore.getState().entities.eventIds).toEqual(["2", "1"]);
    useStore.getState().freeze(false);
    expect(useStore.getState().frozenIds).toEqual([]);
  });

  it("reset clears session without dropping connection status", () => {
    useStore.getState().setOnline(3);
    useStore.getState().setQueued(2);
    receive("1", "WatchEvent");
    useStore.getState().reset();
    expect(useStore.getState().entities.eventIds).toEqual([]);
    expect(useStore.getState().online).toBe(3);
    expect(useStore.getState().queued).toBe(2);
  });

  it("ignores invalid API payloads", () => {
    expect(normalizeEvent({ type: "PushEvent" })).toBeNull();
    expect(normalizeEvent({ id: "1", type: "WatchEvent", actor: null })).toBeNull();
  });
});
