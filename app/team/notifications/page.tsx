import type { Metadata } from "next";
import Link from "next/link";
import PushNotificationControl from "../_components/PushNotificationControl";
import TeamShell from "../_components/TeamShell";
import {
  deleteNotification,
  deleteReadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  openNotification,
  updateNotificationPreferences,
} from "../actions";
import {
  isMissingTableError,
  requireTeamSession,
  safeSingle,
  setupNotice,
  type TeamMember,
  type TeamNotification,
  type TeamNotificationPreferences,
} from "../_lib/data";

export const metadata: Metadata = {
  title: "Notifications | Anovic Team",
  robots: { index: false, follow: false },
};

type NotificationSearchParams = Promise<{
  page?: string;
  q?: string;
  type?: string;
  state?: string;
  notice?: string;
}>;

const notificationTypes: TeamNotification["type"][] = [
  "task_assigned", "task_updated", "task_due", "message", "mention",
  "attendance", "status", "admin", "security", "system",
];

const defaultPreferences = (userId: string): TeamNotificationPreferences => ({
  user_id: userId,
  browser_notifications: false,
  toast_enabled: true,
  sound_enabled: true,
  task_alerts: true,
  chat_alerts: true,
  attendance_alerts: true,
  admin_alerts: true,
  email_digest: "off",
  quiet_hours_start: null,
  quiet_hours_end: null,
  timezone: "Africa/Cairo",
  last_digest_at: null,
  updated_at: new Date(0).toISOString(),
});

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
}

function notificationTone(type: TeamNotification["type"]) {
  if (type.startsWith("task")) return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (type === "mention") return "border-yellow-300 bg-yellow-50 text-black";
  if (type === "message") return "border-gray-200 bg-gray-50 text-gray-800";
  if (type === "attendance" || type === "status") return "border-yellow-200 bg-yellow-50 text-gray-900";
  return "border-gray-900 bg-gray-900 text-white";
}

function queryHref(params: { q?: string; type?: string; state?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.type) query.set("type", params.type);
  if (params.state) query.set("state", params.state);
  if (params.page && params.page > 1) query.set("page", String(params.page));
  const suffix = query.toString();
  return `/team/notifications${suffix ? `?${suffix}` : ""}`;
}

function noticeText(value?: string) {
  if (value === "preferences-saved") return "Notification preferences saved.";
  if (value === "preferences-failed") return "Preferences could not be saved. Run the latest SQL setup.";
  if (value === "read-deleted") return "Read notifications deleted.";
  return null;
}

export default async function NotificationsPage({ searchParams }: { searchParams: NotificationSearchParams }) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession();
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  const pageSize = 20;
  const search = (params.q || "").trim().slice(0, 100);
  const type = notificationTypes.includes(params.type as TeamNotification["type"])
    ? params.type as TeamNotification["type"]
    : "";
  const state = params.state === "unread" || params.state === "read" ? params.state : "";

  const [memberResult, preferenceResult] = await Promise.all([
    safeSingle<TeamMember>(
      supabase.from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
        .eq("id", user.id).maybeSingle(),
    ),
    safeSingle<TeamNotificationPreferences>(
      supabase.from("team_notification_preferences")
        .select("user_id,browser_notifications,toast_enabled,sound_enabled,task_alerts,chat_alerts,attendance_alerts,admin_alerts,email_digest,quiet_hours_start,quiet_hours_end,timezone,last_digest_at,updated_at")
        .eq("user_id", user.id).maybeSingle(),
    ),
  ]);

  let notificationQuery = supabase.from("team_notifications")
    .select("id,recipient_id,actor_id,type,title,body,href,entity_table,entity_id,read_at,dedupe_key,expires_at,created_at", { count: "exact" })
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });
  if (type) notificationQuery = notificationQuery.eq("type", type);
  if (state === "unread") notificationQuery = notificationQuery.is("read_at", null);
  if (state === "read") notificationQuery = notificationQuery.not("read_at", "is", null);
  if (search) notificationQuery = notificationQuery.textSearch("search_document", search, { type: "plain", config: "simple" });

  const { data, error, count } = await notificationQuery.range((page - 1) * pageSize, page * pageSize - 1);
  const notifications = (data || []) as TeamNotification[];
  const setupMissing = memberResult.setupMissing || preferenceResult.setupMissing || Boolean(error && isMissingTableError(error.message));
  if (error && !isMissingTableError(error.message)) throw new Error(error.message);

  const preferences = preferenceResult.data || defaultPreferences(user.id);
  const total = count || 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const unreadCountResult = await supabase.from("team_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id).is("read_at", null);
  const unreadCount = unreadCountResult.count || 0;
  const notice = noticeText(params.notice);

  return (
    <TeamShell active="notifications" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Notifications</p>
          <h1 className="team-title">Workspace inbox</h1>
          <p className="team-subtitle">Task, chat, attendance, security, and admin alerts with per-device delivery controls.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-[26rem]">
          <div className="team-stat bg-indigo-700 text-white"><p className="team-kicker text-gray-300">Unread</p><strong className="team-stat-value">{unreadCount}</strong></div>
          <div className="team-stat"><p className="team-kicker">Results</p><strong className="team-stat-value">{total}</strong></div>
        </div>
      </div>

      {setupMissing && <div className="mb-6">{setupNotice()}</div>}
      {notice && <p className="mb-5 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-black text-black" role="status">{notice}</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="team-panel overflow-hidden">
          <div className="border-b border-gray-200 bg-white p-5">
            <form className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_11rem_9rem_auto]">
              <input className="team-field" type="search" name="q" defaultValue={search} placeholder="Search notifications" />
              <select className="team-field" name="type" defaultValue={type}>
                <option value="">All types</option>
                {notificationTypes.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
              </select>
              <select className="team-field" name="state" defaultValue={state}>
                <option value="">Any state</option><option value="unread">Unread</option><option value="read">Read</option>
              </select>
              <button className="team-button min-h-11 px-4 text-xs" type="submit">Filter</button>
            </form>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Link href="/team/notifications" className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">Clear filters</Link>
              <div className="flex gap-2">
                {unreadCount > 0 && <form action={markAllNotificationsRead}><input type="hidden" name="returnTo" value="/team/notifications" /><button className="team-button-secondary min-h-9 px-3 text-xs">Mark all read</button></form>}
                <form action={deleteReadNotifications}><button className="team-button-secondary min-h-9 px-3 text-xs">Delete read</button></form>
              </div>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-10 text-center"><p className="text-sm font-black uppercase tracking-[0.14em] text-gray-500">No matching notifications</p></div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <article key={notification.id} className={`p-5 ${notification.read_at ? "bg-white" : "bg-indigo-50/50"}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ${notificationTone(notification.type)}`}>{notification.type.replaceAll("_", " ")}</span>
                        {!notification.read_at && <span className="rounded-full bg-yellow-300 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-black">New</span>}
                      </div>
                      <form action={openNotification} className="mt-3"><input type="hidden" name="notificationId" value={notification.id} /><button type="submit" className="text-left text-lg font-black tracking-tight text-black hover:text-indigo-700">{notification.title}</button></form>
                      {notification.body && <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-gray-500">{notification.body}</p>}
                      <p className="mt-2 text-xs font-bold text-gray-400">{formatNotificationTime(notification.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {!notification.read_at && <form action={markNotificationRead}><input type="hidden" name="notificationId" value={notification.id} /><input type="hidden" name="returnTo" value={queryHref({ q: search, type, state, page })} /><button className="team-button-secondary min-h-9 px-3 text-xs">Read</button></form>}
                      <form action={deleteNotification}><input type="hidden" name="notificationId" value={notification.id} /><button className="team-button-secondary min-h-9 px-3 text-xs">Delete</button></form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pageCount > 1 && <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4 text-sm font-black"><span>Page {page} of {pageCount}</span><div className="flex gap-2">{page > 1 && <Link className="team-button-secondary min-h-9 px-3 text-xs" href={queryHref({ q: search, type, state, page: page - 1 })}>Previous</Link>}{page < pageCount && <Link className="team-button-secondary min-h-9 px-3 text-xs" href={queryHref({ q: search, type, state, page: page + 1 })}>Next</Link>}</div></div>}
        </section>

        <aside className="space-y-5">
          <section className="team-panel p-5">
            <p className="team-kicker">This device</p><h2 className="mt-2 text-xl font-black">Browser delivery</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-gray-500">Receive alerts while this tab is in the background or the browser is closed.</p>
            <div className="mt-4"><PushNotificationControl publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null} /></div>
          </section>

          <section className="team-panel p-5">
            <p className="team-kicker">Preferences</p><h2 className="mt-2 text-xl font-black">Alert controls</h2>
            <form action={updateNotificationPreferences} className="mt-5 space-y-4">
              <input type="hidden" name="browserNotifications" value={preferences.browser_notifications ? "on" : ""} />
              {[
                ["toastEnabled", "In-app toasts", preferences.toast_enabled],
                ["soundEnabled", "Notification sounds", preferences.sound_enabled],
                ["taskAlerts", "Task alerts", preferences.task_alerts],
                ["chatAlerts", "Chat and mentions", preferences.chat_alerts],
                ["attendanceAlerts", "Attendance and status", preferences.attendance_alerts],
                ["adminAlerts", "Admin and security", preferences.admin_alerts],
              ].map(([name, label, checked]) => <label key={String(name)} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-3 text-sm font-black"><span>{String(label)}</span><input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} className="h-4 w-4 accent-indigo-700" /></label>)}
              <label className="block text-sm font-black">Email digest<select name="emailDigest" defaultValue={preferences.email_digest} className="team-field mt-2"><option value="off">Off</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs font-black">Quiet start<input className="team-field mt-2" type="time" name="quietHoursStart" defaultValue={preferences.quiet_hours_start?.slice(0, 5) || ""} /></label><label className="text-xs font-black">Quiet end<input className="team-field mt-2" type="time" name="quietHoursEnd" defaultValue={preferences.quiet_hours_end?.slice(0, 5) || ""} /></label></div>
              <label className="block text-sm font-black">Timezone<input className="team-field mt-2" name="timezone" defaultValue={preferences.timezone} maxLength={80} /></label>
              <button className="team-button w-full" type="submit">Save preferences</button>
            </form>
          </section>
        </aside>
      </div>
    </TeamShell>
  );
}
