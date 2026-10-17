// Stream via the same-origin Next.js route: the browser never needs to know
// the backend's internal Docker hostname or a public backend port.
export const CONFIG = {
  numEventsOnPageValues: [15, 30, 50, 70, 90, 110],
  sseUrl: "/api/events",
};
