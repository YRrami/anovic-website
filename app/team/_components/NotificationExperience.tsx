"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TeamNotification, TeamNotificationPreferences } from "../_lib/data";

type NotificationExperienceProps = {
  userId: string;
  preferences: TeamNotificationPreferences;
};

function playAlert(contextRef: React.MutableRefObject<AudioContext | null>) {
  const AudioContextClass = window.AudioContext;
  const context = contextRef.current || new AudioContextClass();
  contextRef.current = context;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 720;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}

function isQuietHours(preferences: TeamNotificationPreferences) {
  if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) return false;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: preferences.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
    const current = hour * 60 + minute;
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours * 60 + minutes;
    };
    const start = toMinutes(preferences.quiet_hours_start);
    const end = toMinutes(preferences.quiet_hours_end);
    return start <= end ? current >= start && current < end : current >= start || current < end;
  } catch {
    return false;
  }
}

export default function NotificationExperience({ userId, preferences }: NotificationExperienceProps) {
  const router = useRouter();
  const [toast, setToast] = useState<TeamNotification | null>(null);
  const dismissTimer = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    const primeAudio = () => {
      if (!audioContext.current) audioContext.current = new window.AudioContext();
      void audioContext.current.resume();
    };
    window.addEventListener("pointerdown", primeAudio, { once: true });
    return () => window.removeEventListener("pointerdown", primeAudio);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`team-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          const notification = payload.new as TeamNotification;
          const quiet = isQuietHours(preferences);

          if (preferences.toast_enabled) {
            setToast(notification);
            if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
            dismissTimer.current = window.setTimeout(() => setToast(null), 7000);
          }

          if (preferences.sound_enabled && !quiet) {
            try {
              playAlert(audioContext);
            } catch {
              // Browsers can block audio until the first user interaction.
            }
          }

          if (
            preferences.browser_notifications &&
            !quiet &&
            document.visibilityState !== "visible" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const registration = await navigator.serviceWorker?.ready;
            await registration?.showNotification(notification.title, {
              body: notification.body || "Open Anovic Workspace to view the update.",
              icon: "/logo.png",
              badge: "/logo.png",
              tag: notification.id,
              data: { href: notification.href, notificationId: notification.id },
            });
          }

          router.refresh();
        },
      )
      .subscribe();

    return () => {
      if (dismissTimer.current) window.clearTimeout(dismissTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [preferences, router, userId]);

  async function openToast() {
    if (!toast) return;
    await fetch(`/api/team/notifications/${encodeURIComponent(toast.id)}/read`, {
      method: "POST",
    });
    const href = toast.href;
    setToast(null);
    router.push(href);
    router.refresh();
  }

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-[min(24rem,calc(100vw-2.5rem))] rounded-xl border border-indigo-200 bg-white p-4 shadow-[0_24px_80px_rgba(17,24,39,0.24)]" role="status">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-700 text-sm font-black text-white">N</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-black">{toast.title}</p>
          {toast.body && <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-gray-500">{toast.body}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={openToast} className="team-button min-h-9 px-3 text-xs">Open</button>
            <button type="button" onClick={() => setToast(null)} className="team-button-secondary min-h-9 px-3 text-xs">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
}
