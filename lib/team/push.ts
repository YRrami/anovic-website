import "server-only";

import webPush from "web-push";
import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

export type PushCategory = "tasks" | "chat" | "attendance" | "admin" | "security";

export type TeamPushPayload = {
  title: string;
  body: string;
  href: string;
  tag: string;
  category: PushCategory;
};

type StoredSubscription = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type StoredPreference = {
  user_id: string;
  browser_notifications: boolean;
  task_alerts: boolean;
  chat_alerts: boolean;
  attendance_alerts: boolean;
  admin_alerts: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
};

function hasPushConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim(),
  );
}

function categoryEnabled(preference: StoredPreference | undefined, category: PushCategory) {
  if (!preference?.browser_notifications) return false;
  if (isQuietHours(preference)) return false;
  if (category === "tasks") return preference.task_alerts;
  if (category === "chat") return preference.chat_alerts;
  if (category === "attendance") return preference.attendance_alerts;
  return preference.admin_alerts;
}

function isQuietHours(preference: StoredPreference) {
  if (!preference.quiet_hours_start || !preference.quiet_hours_end) return false;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: preference.timezone || "Africa/Cairo",
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
    const start = toMinutes(preference.quiet_hours_start);
    const end = toMinutes(preference.quiet_hours_end);
    return start <= end ? current >= start && current < end : current >= start || current < end;
  } catch {
    return false;
  }
}

export async function sendTeamPush(recipientIds: Array<string | null | undefined>, payload: TeamPushPayload) {
  const recipients = Array.from(new Set(recipientIds.filter((id): id is string => Boolean(id))));

  if (!hasPushConfig() || !hasSupabaseAdminConfig() || recipients.length === 0) {
    return;
  }

  const supabase = createAdminClient();
  const [{ data: subscriptions, error: subscriptionError }, { data: preferences, error: preferenceError }] =
    await Promise.all([
      supabase
        .from("team_push_subscriptions")
        .select("user_id,endpoint,p256dh,auth")
        .in("user_id", recipients),
      supabase
        .from("team_notification_preferences")
        .select("user_id,browser_notifications,task_alerts,chat_alerts,attendance_alerts,admin_alerts,quiet_hours_start,quiet_hours_end,timezone")
        .in("user_id", recipients),
    ]);

  if (subscriptionError || preferenceError) {
    console.error("Push notification lookup failed", subscriptionError || preferenceError);
    return;
  }

  const preferenceByUser = new Map(
    ((preferences || []) as StoredPreference[]).map((preference) => [preference.user_id, preference]),
  );
  const eligible = ((subscriptions || []) as StoredSubscription[]).filter((subscription) =>
    categoryEnabled(preferenceByUser.get(subscription.user_id), payload.category),
  );

  if (eligible.length === 0) return;

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!.trim(),
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim(),
  );

  const staleEndpoints: string[] = [];
  await Promise.allSettled(
    eligible.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
          { TTL: 60 * 60, urgency: payload.category === "chat" ? "high" : "normal" },
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(subscription.endpoint);
          return;
        }
        console.error("Push notification delivery failed", error);
      }
    }),
  );

  if (staleEndpoints.length > 0) {
    await supabase.from("team_push_subscriptions").delete().in("endpoint", staleEndpoints);
  }
}
