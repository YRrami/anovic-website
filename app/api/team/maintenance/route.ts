import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DigestPreference = {
  user_id: string;
  email_digest: "daily" | "weekly";
  last_digest_at: string | null;
};

type DigestNotification = {
  recipient_id: string;
  title: string;
  body: string | null;
  href: string;
  created_at: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] || character);
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSupabaseAdminConfig()) return Response.json({ error: "Server admin configuration missing" }, { status: 503 });

  const supabase = createAdminClient();
  const { data: maintenance, error: maintenanceError } = await supabase.rpc("run_team_maintenance");
  if (maintenanceError) return Response.json({ error: maintenanceError.message }, { status: 500 });

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!resendKey || !fromEmail || !siteOrigin) {
    return Response.json({ maintenance, digests: "Email provider not configured" });
  }

  const { data: preferenceRows, error: preferenceError } = await supabase
    .from("team_notification_preferences")
    .select("user_id,email_digest,last_digest_at")
    .neq("email_digest", "off");
  if (preferenceError) return Response.json({ error: preferenceError.message }, { status: 500 });

  const now = Date.now();
  const duePreferences = ((preferenceRows || []) as DigestPreference[]).filter((preference) => {
    if (!preference.last_digest_at) return true;
    const age = now - new Date(preference.last_digest_at).getTime();
    return age >= (preference.email_digest === "weekly" ? 6.5 * 24 * 60 * 60_000 : 20 * 60 * 60_000);
  });
  const userIds = duePreferences.map((preference) => preference.user_id);
  if (userIds.length === 0) return Response.json({ maintenance, digests: 0 });

  const [{ data: members }, { data: notifications }] = await Promise.all([
    supabase.from("team_members").select("id,email,full_name,nickname").in("id", userIds).eq("is_active", true),
    supabase.from("team_notifications").select("recipient_id,title,body,href,created_at").in("recipient_id", userIds).is("read_at", null).order("created_at", { ascending: false }).limit(500),
  ]);
  const notificationsByUser = new Map<string, DigestNotification[]>();
  for (const notification of (notifications || []) as DigestNotification[]) {
    notificationsByUser.set(notification.recipient_id, [...(notificationsByUser.get(notification.recipient_id) || []), notification]);
  }

  let sent = 0;
  for (const member of members || []) {
    if (!member.email) continue;
    const items = (notificationsByUser.get(member.id) || []).slice(0, 25);
    if (items.length === 0) continue;
    const name = member.full_name || member.nickname || member.email;
    const htmlItems = items.map((item) => `<li style="margin:0 0 14px"><a href="${escapeHtml(new URL(item.href, siteOrigin).href)}" style="font-weight:700;color:#4338ca">${escapeHtml(item.title)}</a>${item.body ? `<br><span style="color:#6b7280">${escapeHtml(item.body)}</span>` : ""}</li>`).join("");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [member.email],
        subject: `${items.length} unread Anovic workspace update${items.length === 1 ? "" : "s"}`,
        html: `<div style="font-family:Arial,sans-serif;color:#111827"><h1 style="font-size:22px">Your Anovic workspace digest</h1><p>Hello ${escapeHtml(name)}, here are your unread updates.</p><ul style="padding-left:20px">${htmlItems}</ul><p><a href="${escapeHtml(new URL("/team/notifications", siteOrigin).href)}">Open notification center</a></p></div>`,
      }),
    });
    if (response.ok) {
      sent += 1;
      await supabase.from("team_notification_preferences").update({ last_digest_at: new Date().toISOString() }).eq("user_id", member.id);
    } else {
      console.error("Notification digest email failed", await response.text());
    }
  }

  return Response.json({ maintenance, digests: sent });
}
