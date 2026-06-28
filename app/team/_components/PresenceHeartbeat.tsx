"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const HEARTBEAT_MS = 30_000;
const ACTIVE_WINDOW_MS = 75_000;

function clientId() {
  const key = "anovic-team-presence-client";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

export default function PresenceHeartbeat() {
  const pathname = usePathname();
  const lastActivity = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    const id = clientId();
    let stopped = false;
    lastActivity.current = Date.now();

    const touch = async (forceActive = false) => {
      if (stopped) return;
      const isActive = forceActive || (
        document.visibilityState === "visible" &&
        Date.now() - lastActivity.current < ACTIVE_WINDOW_MS
      );
      const { error } = await supabase.rpc("touch_team_presence", {
        p_client_id: id,
        p_current_path: pathname || "/team",
        p_is_active: isActive,
        p_visibility_state: document.visibilityState === "hidden" ? "hidden" : "visible",
      });
      if (error && !error.message.includes("schema cache")) {
        console.error("Presence heartbeat failed", error);
      }
    };

    const recordActivity = () => {
      lastActivity.current = Date.now();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") recordActivity();
      void touch(document.visibilityState === "visible");
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    void touch(true);
    const timer = window.setInterval(() => void touch(), HEARTBEAT_MS);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, recordActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname]);

  return null;
}
