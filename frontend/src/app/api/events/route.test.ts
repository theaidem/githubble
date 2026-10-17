import { afterEach, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllGlobals());

it("streams upstream SSE through a same-origin endpoint", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response("event: online\ndata: 1\n\n", {
    headers: { "Content-Type": "text/event-stream" },
  }));
  vi.stubGlobal("fetch", fetchMock);
  const response = await GET(new Request("http://localhost:3001/api/events"));
  expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  expect(await response.text()).toContain("data: 1");
  expect(fetchMock).toHaveBeenCalledWith("http://localhost:3003/sse", expect.objectContaining({ cache: "no-store" }));
});

it("responds with 502 when backend is unavailable", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));
  const response = await GET(new Request("http://localhost:3001/api/events"));
  expect(response.status).toBe(502);
});
