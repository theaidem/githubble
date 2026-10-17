import { afterEach, expect, it, vi } from "vitest";
import { createPlayback } from "./playback";

afterEach(() => vi.useRealTimers());

it("spreads a polled batch across time instead of showing it all at once", () => {
  vi.useFakeTimers();
  const delivered: number[] = [];
  const sizes: number[] = [];
  const playback = createPlayback((id: number) => delivered.push(id), (size) => sizes.push(size));
  playback.enqueue(1);
  playback.enqueue(2);
  playback.enqueue(3);
  expect(delivered).toEqual([]);
  playback.releaseBatch();
  expect(delivered).toEqual([1]);
  expect(sizes.at(-1)).toBe(2);
  vi.advanceTimersByTime(6000);
  expect(delivered).toEqual([1, 2]);
  vi.advanceTimersByTime(6000);
  expect(delivered).toEqual([1, 2, 3]);
  expect(sizes.at(-1)).toBe(0);
});

it("clears the pending events and timer on session reset", () => {
  vi.useFakeTimers();
  const delivered: number[] = [];
  const playback = createPlayback((id: number) => delivered.push(id), () => {});
  playback.enqueue(1);
  playback.releaseBatch();
  playback.enqueue(2);
  playback.clear();
  vi.advanceTimersByTime(60_000);
  expect(delivered).toEqual([1]);
});

it("falls back to delivery if no batch-end signal arrives", () => {
  vi.useFakeTimers();
  const delivered: number[] = [];
  const playback = createPlayback((id: number) => delivered.push(id), () => {});
  playback.enqueue(1);
  vi.advanceTimersByTime(999);
  expect(delivered).toEqual([]);
  vi.advanceTimersByTime(1);
  expect(delivered).toEqual([1]);
});
