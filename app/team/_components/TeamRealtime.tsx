"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const realtimeTables = [
  "team_members",
  "team_tasks",
  "attendance_entries",
  "task_time_entries",
  "status_time_entries",
  "team_messages",
  "team_chat_groups",
  "team_message_mentions",
  "team_message_reactions",
];

export default function TeamRealtime() {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("team-platform-sync");
    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }

      refreshTimer.current = window.setTimeout(() => {
        router.refresh();
      }, 350);
    };

    for (const table of realtimeTables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      );
    }

    channel.subscribe();

    return () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }

      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
