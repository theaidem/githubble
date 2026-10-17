import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useStore } from "@/store/useStore";
import { useSse } from "./useSse";

class FakeEventSource {
  static instance: FakeEventSource;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  listeners = new Map<string, (event: MessageEvent) => void>();
  constructor(readonly url: string) { FakeEventSource.instance = this; }
  addEventListener(type: string, callback: (event: MessageEvent) => void) {
    this.listeners.set(type, callback);
  }
  emit(type: string, data: string) {
    const event = { data } as MessageEvent;
    if (type === "message") this.onmessage?.(event);
    else this.listeners.get(type)?.(event);
  }
  close() {}
}

function Harness() {
  useSse();
  const events = useStore((state) => state.entities.eventIds.length);
  const queued = useStore((state) => state.queued);
  return <p>{events} shown, {queued} queued</p>;
}

beforeEach(() => {
  useStore.getState().reset();
  vi.useFakeTimers();
  vi.stubGlobal("EventSource", FakeEventSource);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("paces actual SSE messages and clears the queue on reset", () => {
  render(<Harness />);
  expect(FakeEventSource.instance.url).toBe("/api/events");
  const event = (id: string) => JSON.stringify({ id, type: "WatchEvent", created_at: "2026-10-16T12:00:00Z",
    actor: { id: 1, login: "octocat" }, repo: { id: 2, name: "octocat/hello" } });
  act(() => {
    FakeEventSource.instance.emit("message", event("1"));
    FakeEventSource.instance.emit("message", event("2"));
    FakeEventSource.instance.emit("ratelimits", "token-1/4999/5000");
    FakeEventSource.instance.emit("checked", "2026-10-16T12:00:00Z");
  });
  expect(useStore.getState().lastCheckedAt).toBe(Date.parse("2026-10-16T12:00:00Z"));
  expect(screen.getByText("1 shown, 1 queued")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(6000));
  expect(screen.getByText("2 shown, 0 queued")).toBeInTheDocument();
  act(() => {
    FakeEventSource.instance.emit("message", event("3"));
    useStore.getState().reset();
  });
  act(() => vi.advanceTimersByTime(60_000));
  expect(screen.getByText("0 shown, 0 queued")).toBeInTheDocument();
});
