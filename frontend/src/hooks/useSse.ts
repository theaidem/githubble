"use client";

import { useEffect } from "react";
import { CONFIG } from "@/lib/constants";
import { normalizeEvent } from "@/lib/normalize";
import { createPlayback } from "@/lib/playback";
import type { Normalized } from "@/lib/types";
import { useStore } from "@/store/useStore";

export function useSse() {
  useEffect(() => {
    const buffered = new Set<string>();
    const playback = createPlayback<Normalized>(
      (event) => {
        buffered.delete(event.result);
        useStore.getState().receiveEvent(event);
      },
      (size) => useStore.getState().setQueued(size),
    );
    const unsubscribe = useStore.subscribe((state, previous) => {
      if (state.resetVersion !== previous.resetVersion) {
        buffered.clear();
        playback.clear();
      }
    });
    const source = new EventSource(CONFIG.sseUrl);
    source.onopen = () => useStore.getState().setConnected();
    source.onerror = () => useStore.getState().setError("Connection lost. Reconnecting…");
    source.onmessage = (message) => {
      try {
        const event = normalizeEvent(JSON.parse(message.data));
        if (event && !buffered.has(event.result) && !useStore.getState().entities.events[event.result]) {
          buffered.add(event.result);
          playback.enqueue(event);
        }
      } catch {
        console.warn("Invalid event received from SSE feed");
      }
    };
    source.addEventListener("online", (message) => {
      const count = Number((message as MessageEvent).data);
      if (Number.isFinite(count)) useStore.getState().setOnline(count);
    });
    source.addEventListener("ratelimits", (message) => {
      useStore.getState().setRatelimits((message as MessageEvent).data);
      playback.releaseBatch();
    });
    source.addEventListener("checked", (message) => {
      const timestamp = Date.parse((message as MessageEvent).data);
      if (Number.isFinite(timestamp)) useStore.getState().setCheckedAt(timestamp);
    });
    return () => {
      source.close();
      unsubscribe();
      playback.clear();
      buffered.clear();
    };
  }, []);
}
