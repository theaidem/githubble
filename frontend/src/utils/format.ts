import { format, formatDistanceToNow } from "date-fns";

// Format an ISO timestamp for the event list ("2:04:09 pm").
export function formatTime(iso: string): string {
  return format(new Date(iso), "h:mm:ss a");
}

// "3 minutes ago" style relative time for the event card.
export function fromNowIso(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

// Elapsed time since the session started ("1h 2m").
export function elapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
