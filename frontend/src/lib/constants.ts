// Stream via the same-origin Next.js route: the browser never needs to know
// the backend's internal Docker hostname or a public backend port. The static
// GitHub Pages build overrides it with the public deployment's stream URL.
export const CONFIG = {
  numEventsOnPageValues: [15, 30, 50, 70, 90, 110],
  sseUrl: process.env.NEXT_PUBLIC_SSE_URL || "/api/events",
};
