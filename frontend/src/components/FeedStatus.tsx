"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

export function FeedStatus() {
  const queued = useStore((state) => state.queued);
  const lastCheckedAt = useStore((state) => state.lastCheckedAt);
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = lastCheckedAt && now ? Math.max(0, Math.floor((now - lastCheckedAt) / 1000)) : null;
  return <p className="sync-status" role="status">
    GitHub updates this feed about once a minute · {seconds === null ? "Waiting for first check" : `Checked ${seconds}s ago`}
    {queued > 0 && ` · ${queued} recent event${queued === 1 ? "" : "s"} queued for playback`}
  </p>;
}
