"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageviewBeacon({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!enabled) return;
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "pageview", path: pathname }),
    });
  }, [enabled, pathname]);
  return null;
}
