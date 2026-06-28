import Image from "next/image";
import Link from "next/link";
import {
  Archive,
  ChartNoAxesCombined,
  Clock3,
  Command,
  LayoutDashboard,
  ListTodo,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut, updateMemberStatus } from "../actions";
import { canManageTeam, displayMemberName, type TeamMember, type TeamNotification, type TeamNotificationPreferences } from "../_lib/data";
import Avatar from "./Avatar";
import NotificationExperience from "./NotificationExperience";
import NotificationMenu from "./NotificationMenu";
import PresenceHeartbeat from "./PresenceHeartbeat";
import TeamRealtime from "./TeamRealtime";
import WorkspaceShellControls from "./WorkspaceShellControls";

type ActivePage = "dashboard" | "profile" | "tasks" | "archived-tasks" | "performance" | "chat" | "teammates" | "attendance" | "notifications" | "security" | "search" | "admin";
type NavIcon = "dashboard" | "profile" | "tasks" | "archive" | "performance" | "chat" | "people" | "attendance" | "security" | "command";
type BadgeKey = "openTasks" | "archivedTasks" | "unreadChats";
type NavItem = { label: string; href: string; icon: NavIcon; key: ActivePage; badgeKey?: BadgeKey };

const navSections: Array<{ label: string; items: NavItem[] }> = [
  { label: "Workspace", items: [
    { label: "Dashboard", href: "/team", icon: "dashboard", key: "dashboard" },
    { label: "Tasks", href: "/team/tasks", icon: "tasks", key: "tasks", badgeKey: "openTasks" },
    { label: "Archive", href: "/team/archived-tasks", icon: "archive", key: "archived-tasks", badgeKey: "archivedTasks" },
    { label: "Performance", href: "/team/performance", icon: "performance", key: "performance" },
  ]},
  { label: "People", items: [
    { label: "Chat", href: "/team/chat", icon: "chat", key: "chat", badgeKey: "unreadChats" },
    { label: "Teammates", href: "/team/teammates", icon: "people", key: "teammates" },
    { label: "Attendance", href: "/team/attendance", icon: "attendance", key: "attendance" },
    { label: "Profile", href: "/team/profile", icon: "profile", key: "profile" },
    { label: "Security", href: "/team/security", icon: "security", key: "security" },
  ]},
];

function NavIconGlyph({ icon }: { icon: NavIcon }) {
  const icons = {
    dashboard: LayoutDashboard,
    profile: UserRound,
    tasks: ListTodo,
    archive: Archive,
    performance: ChartNoAxesCombined,
    chat: MessageSquareText,
    people: UsersRound,
    attendance: Clock3,
    security: ShieldCheck,
    command: Command,
  } satisfies Record<NavIcon, typeof LayoutDashboard>;
  const Icon = icons[icon];
  return <Icon aria-hidden="true" size={17} strokeWidth={2.1} />;
}

function returnPathFor(active: ActivePage) {
  const paths: Record<ActivePage, string> = {
    dashboard: "/team", profile: "/team/profile", tasks: "/team/tasks",
    "archived-tasks": "/team/archived-tasks", performance: "/team/performance",
    chat: "/team/chat", teammates: "/team/teammates", attendance: "/team/attendance",
    notifications: "/team/notifications", security: "/team/security", search: "/team/search", admin: "/team/admin",
  };
  return paths[active];
}

function statusTone(status: TeamMember["status"], activeStatus?: TeamMember["status"]) {
  if (status === activeStatus) return "border-indigo-700 bg-indigo-700 text-white";
  if (status === "break" || status === "lunch") return "border-yellow-300 bg-yellow-50 text-black";
  return "border-gray-200 bg-white text-gray-700 hover:bg-gray-50";
}

async function readShellCounts(member: TeamMember | null, isManager: boolean) {
  if (!member?.id) return { openTasks: 0, archivedTasks: 0, unreadChats: 0 };
  try {
    const supabase = await createClient();
    let openTasksQuery = supabase.from("team_tasks").select("id", { count: "exact", head: true }).is("archived_at", null).neq("status", "done");
    let archivedTasksQuery = supabase.from("team_tasks").select("id", { count: "exact", head: true }).not("archived_at", "is", null);
    if (!isManager) {
      openTasksQuery = openTasksQuery.eq("assigned_to", member.id);
      archivedTasksQuery = archivedTasksQuery.eq("assigned_to", member.id);
    }
    const [openTasks, archivedTasks, unreadChats] = await Promise.all([
      openTasksQuery,
      archivedTasksQuery,
      supabase.from("team_messages").select("id", { count: "exact", head: true }).eq("recipient_id", member.id).is("read_at", null).is("deleted_at", null),
    ]);
    return { openTasks: openTasks.count || 0, archivedTasks: archivedTasks.count || 0, unreadChats: unreadChats.count || 0 };
  } catch {
    return { openTasks: 0, archivedTasks: 0, unreadChats: 0 };
  }
}

function defaultPreferences(userId = ""): TeamNotificationPreferences {
  return { user_id: userId, browser_notifications: false, toast_enabled: true, sound_enabled: true, task_alerts: true, chat_alerts: true, attendance_alerts: true, admin_alerts: true, email_digest: "off", quiet_hours_start: null, quiet_hours_end: null, timezone: "Africa/Cairo", last_digest_at: null, updated_at: new Date(0).toISOString() };
}

async function readShellNotifications(member: TeamMember | null) {
  if (!member?.id) return { unreadCount: 0, notifications: [] as TeamNotification[], preferences: defaultPreferences() };
  try {
    const supabase = await createClient();
    const [unread, recent, preference] = await Promise.all([
      supabase.from("team_notifications").select("id", { count: "exact", head: true }).eq("recipient_id", member.id).is("read_at", null),
      supabase.from("team_notifications").select("id,recipient_id,actor_id,type,title,body,href,entity_table,entity_id,read_at,created_at").eq("recipient_id", member.id).order("created_at", { ascending: false }).limit(8),
      supabase.from("team_notification_preferences").select("user_id,browser_notifications,toast_enabled,sound_enabled,task_alerts,chat_alerts,attendance_alerts,admin_alerts,email_digest,quiet_hours_start,quiet_hours_end,timezone,last_digest_at,updated_at").eq("user_id", member.id).maybeSingle<TeamNotificationPreferences>(),
    ]);
    if (unread.error || recent.error) return { unreadCount: 0, notifications: [] as TeamNotification[], preferences: defaultPreferences(member.id) };
    return { unreadCount: unread.count || 0, notifications: (recent.data || []) as TeamNotification[], preferences: preference.data || defaultPreferences(member.id) };
  } catch {
    return { unreadCount: 0, notifications: [] as TeamNotification[], preferences: defaultPreferences(member.id) };
  }
}

export default async function TeamShell({ active, member, children }: { active: ActivePage; member: TeamMember | null; children: React.ReactNode }) {
  const displayName = displayMemberName(member);
  const isManager = canManageTeam(member, member?.email);
  const [counts, notificationState] = await Promise.all([readShellCounts(member, isManager), readShellNotifications(member)]);
  const returnTo = returnPathFor(active);
  const sections = isManager
    ? [...navSections, { label: "Admin", items: [{ label: "Command", href: "/team/admin", icon: "command" as const, key: "admin" as const }] }]
    : navSections;

  return <main className="team-platform min-h-screen text-black">
    <a href="#team-main" className="team-skip-link">Skip to content</a>
    <TeamRealtime />
    {member && <><PresenceHeartbeat /><NotificationExperience userId={member.id} preferences={notificationState.preferences} /></>}

    <div className="team-shell-grid min-h-screen w-full">
      <aside id="team-sidebar" className="team-shell-sidebar team-sidebar text-white">
        <div className="team-sidebar-brand">
          <Link href="/team" aria-label="Team home" className="inline-flex shrink-0"><Image src="/logo white.png" alt="Anovic" width={158} height={38} className="h-auto w-32" priority /></Link>
          <span className="team-sidebar-brand-label text-xs font-bold text-gray-400">Workspace</span>
        </div>

        <div className="team-sidebar-profile mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-3">
          <div className="flex items-center gap-3"><Avatar name={displayName} src={member?.avatar_url} size={46} /><div className="team-sidebar-label min-w-0"><p className="truncate text-sm font-black">{displayName}</p><p className="mt-0.5 truncate text-xs font-bold text-gray-400">{member?.job_title || member?.role || "Team member"}</p></div></div>
          <div className="team-sidebar-label mt-3 flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-xs font-bold text-gray-300"><span>{isManager ? "Admin access" : "Employee"}</span><span>{member?.is_active === false ? "Inactive" : "Active"}</span></div>
          <div className="team-sidebar-label mt-2 rounded-md bg-white/10 px-3 py-2 text-xs font-bold capitalize text-gray-300">Status: <span className="text-white">{member?.status || "away"}</span></div>
        </div>

        <nav className="mt-5 space-y-5" aria-label="Workspace navigation">
          {sections.map((section) => <div key={section.label}>
            <p className="team-sidebar-section-label mb-2 px-3 text-xs font-bold text-gray-500">{section.label}</p>
            <div className="space-y-1">{section.items.map((item) => {
              const isActive = item.key === active;
              const badge = item.badgeKey ? counts[item.badgeKey] : 0;
              return <Link key={item.href} href={item.href} title={item.label} className={`team-sidebar-link flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition ${isActive ? "bg-indigo-600 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isActive ? "bg-white/15 text-white" : "bg-white/5 text-gray-400"}`}><NavIconGlyph icon={item.icon} /></span>
                <span className="team-sidebar-link-label flex-1">{item.label}</span>
                {badge > 0 && <span className={`team-sidebar-badge rounded-full px-2 py-0.5 text-xs font-black ${isActive ? "bg-white text-indigo-700" : "bg-yellow-300 text-black"}`}>{badge > 99 ? "99+" : badge}</span>}
              </Link>;
            })}</div>
          </div>)}
        </nav>

        <form action={signOut} className="team-sidebar-signout mt-8"><button type="submit" className="flex w-full items-center gap-3 rounded-md border border-white/10 px-3 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white hover:text-black"><span className="flex h-7 w-7 shrink-0 items-center justify-center"><LogOut aria-hidden="true" size={17} /></span><span className="team-sidebar-link-label">Sign out</span></button></form>
      </aside>

      <section id="team-main" className="min-w-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="team-topbar sticky top-3 z-30 mb-6 flex items-center gap-2 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-[0_8px_24px_rgba(17,24,39,0.07)] backdrop-blur">
            <WorkspaceShellControls activeLabel={active.replaceAll("-", " ")} />
            <div className="flex shrink-0 items-center gap-2">
              {member && <details className="group relative"><summary className="team-status-trigger cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span className={`h-2.5 w-2.5 rounded-full ${member.status === "online" ? "bg-indigo-600" : member.status === "break" || member.status === "lunch" ? "bg-yellow-400" : "bg-gray-400"}`} /><span className="hidden capitalize sm:inline">{member.status}</span></summary><div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-[0_20px_60px_rgba(17,24,39,0.18)]"><p className="px-2 pb-2 pt-1 text-xs font-bold text-gray-500">Set availability</p>{(["online", "break", "lunch", "away"] as TeamMember["status"][]).map((status) => <form key={status} action={updateMemberStatus}><input type="hidden" name="status" value={status} /><input type="hidden" name="returnTo" value={returnTo} /><button type="submit" className={`mb-1 flex min-h-9 w-full items-center rounded-md border px-3 text-left text-xs font-bold capitalize transition last:mb-0 ${statusTone(status, member.status)}`}>{status}</button></form>)}</div></details>}
              {member && <NotificationMenu notifications={notificationState.notifications} unreadCount={notificationState.unreadCount} returnTo={returnTo} />}
            </div>
          </div>
          {children}
        </div>
      </section>
    </div>
  </main>;
}
