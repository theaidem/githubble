import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Board } from "./Board";
import { useStore } from "@/store/useStore";
import { normalizeEvent } from "@/lib/normalize";

vi.mock("@/hooks/useSse", () => ({ useSse: () => {} }));

beforeEach(() => { useStore.getState().reset(); useStore.getState().setConnected(); });
afterEach(() => vi.restoreAllMocks());

it("renders feed controls and allows freeze, page size and reset", () => {
  render(<Board />);
  expect(screen.getByRole("navigation", { name: "Dashboard sections" })).toHaveTextContent("Insights");
  expect(screen.getByRole("heading", { name: "Explore GitHub stars & forks" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Skip to activity" })).toHaveAttribute("href", "#activity");
  const freshness = screen.getByRole("complementary", { name: "About event freshness" });
  expect(freshness).toHaveTextContent("30 seconds to 6 hours late");
  expect(freshness).toHaveTextContent("newly received here");
  expect(screen.getByRole("link", { name: /GitHub API documentation/ })).toHaveAttribute("href", "https://docs.github.com/en/rest/activity/events#list-public-events");
  fireEvent.change(screen.getByLabelText("Events on page"), { target: { value: "50" } });
  expect(useStore.getState().numOnPage).toBe(50);
  fireEvent.click(screen.getByRole("button", { name: "Freeze" }));
  expect(useStore.getState().isFrozen).toBe(true);
  expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset session" }));
  expect(useStore.getState().isFrozen).toBe(false);
  expect(useStore.getState().numOnPage).toBe(30);
});

it("renders an incoming star, updates stats and opens the selected event", () => {
  render(<Board />);
  const event = normalizeEvent({ id: "123", type: "WatchEvent", created_at: "2026-10-16T12:00:00Z",
    actor: { id: 7, login: "octocat", avatar_url: "https://avatars.githubusercontent.com/u/7" }, repo: { id: 8, name: "octocat/hello" } });
  if (!event) throw new Error("invalid test event");
  act(() => useStore.getState().receiveEvent(event));
  expect(screen.getByRole("region", { name: "Live events" })).toHaveTextContent("octocat/hello");
  fireEvent.click(screen.getByRole("button", { name: /octocat starred octocat\/hello/i }));
  expect(useStore.getState().viewingEvent).toBe("123");
  const profileAvatar = screen.getByRole("region", { name: "Selected event" }).querySelector("img.large-avatar");
  expect(profileAvatar).toHaveAttribute("width", "280");
  expect(profileAvatar).toHaveAttribute("height", "280");
  expect(screen.getByText("Most starred repos").parentElement).toHaveTextContent("octocat/hello");
});
