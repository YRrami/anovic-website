"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChatRealtime({
  userId,
  channelKey,
}: {
  userId: string;
  channelKey: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notificationState, setNotificationState] = useState("default");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`team-chat-sync-${channelKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages" },
        (payload) => {
          const nextMessage = payload.new as {
            body?: string;
            sender_id?: string;
          };

          startTransition(() => {
            router.refresh();
          });

          if (
            nextMessage.sender_id !== userId &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("New Anovic message", {
              body: nextMessage.body || "A teammate sent a message.",
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "team_messages" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_message_mentions" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_message_reactions" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_chat_reads" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_message_attachments" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_chat_groups" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_chat_group_members" },
        () => {
          startTransition(() => {
            router.refresh();
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelKey, router, userId]);

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;

    const permission = await Notification.requestPermission();
    setNotificationState(permission);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${
          isPending ? "bg-yellow-100 text-black" : "bg-indigo-700 text-white"
        }`}
      >
        {isPending ? "Syncing" : "Live sync"}
      </span>
      {notificationState !== "granted" && notificationState !== "unsupported" && (
        <button
          type="button"
          onClick={enableNotifications}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-700 transition hover:bg-gray-50"
        >
          Enable notifications
        </button>
      )}
    </div>
  );
}
