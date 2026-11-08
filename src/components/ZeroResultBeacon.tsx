"use client";

import { useEffect } from "react";

export function ZeroResultBeacon({ query, enabled }: { query: string; enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "search", query, resultCount: 0 }),
    });
  }, [enabled, query]);
  return null;
}
