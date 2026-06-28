import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Save, UserPlus } from "lucide-react";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import Avatar from "../_components/Avatar";
import TeamShell from "../_components/TeamShell";
import TeamSubmitButton from "../_components/TeamSubmitButton";
import {
  canManageTeam,
  displayMemberName,
  formatDate,
  formatTime,
  requireTeamSession,
  safeList,
  safeSingle,
  setupNotice,
  statusLabel,
  type AttendanceEntry,
  type TeamAuditLog,
  type TeamMember,
  type TeamTask,
} from "../_lib/data";
import { inviteTeamMember, updateTeamMemberAccess } from "./actions";

export const metadata: Metadata = {
  title: "Admin | Anovic Team",
  robots: { index: false, follow: false },
};

type PresenceState = "active" | "idle" | "offline";

function presenceFor(member: TeamMember, _entry: AttendanceEntry | undefined): PresenceState {
  void _entry;
  if (!member.is_active || !member.last_seen_at) return "offline";
  const now = Date.now();
  if (now - new Date(member.last_seen_at).getTime() > 90_000) return "offline";
  if (!member.last_active_at || now - new Date(member.last_active_at).getTime() > 5 * 60_000) return "idle";
  return "active";
}

function statusClass(state: PresenceState) {
  if (state === "active") return "bg-indigo-50 text-indigo-700";
  if (state === "idle") return "bg-yellow-50 text-black";
  return "bg-gray-50 text-gray-800";
}

type AdminSearchParams = Promise<{ access?: string }>;

function accessMessage(value?: string) {
  if (value === "invited") return "Invitation sent and team access created.";
  if (value === "updated") return "Member access updated.";
  if (value === "service-key-missing") return "Add SUPABASE_SERVICE_ROLE_KEY to the server environment to send invitations.";
  if (value === "invite-invalid") return "Enter a valid invitation email.";
  if (value === "invite-failed") return "Invitation failed. Check Supabase Auth email settings and whether the account already exists.";
  if (value === "update-failed") return "Access update failed. Run the latest SQL and verify your role.";
  return null;
}

export default async function AdminPage({ searchParams }: { searchParams: AdminSearchParams }) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession();
  const memberResult = await safeSingle<TeamMember>(
    supabase
      .from("team_members")
      .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active,last_seen_at,last_active_at,mfa_required")
      .eq("id", user.id)
      .maybeSingle(),
  );

  if (!canManageTeam(memberResult.data, user.email)) {
    redirect("/team/profile");
  }

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const [membersResult, openEntriesResult, attendanceResult, tasksResult, auditResult] = await Promise.all([
    safeList<TeamMember>(
      supabase
        .from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active,last_seen_at,last_active_at,mfa_required")
        .order("full_name", { ascending: true }),
    ),
    safeList<AttendanceEntry>(
      supabase
        .from("attendance_entries")
        .select("id,user_id,clock_in,clock_out,note")
        .is("clock_out", null)
        .order("clock_in", { ascending: false }),
    ),
    safeList<AttendanceEntry>(
      supabase
        .from("attendance_entries")
        .select("id,user_id,clock_in,clock_out,note")
        .gte("clock_in", todayStart)
        .order("clock_in", { ascending: false })
        .limit(20),
    ),
    safeList<TeamTask>(
      supabase
        .from("team_tasks")
        .select("id,title,description,status,priority,due_date,assigned_to,created_by,archived_at,archived_by")
        .order("created_at", { ascending: false })
        .limit(20),
    ),
    safeList<TeamAuditLog>(
      supabase
        .from("team_audit_logs")
        .select("id,actor_id,action,entity_table,entity_id,target_user_id,metadata,created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ),
  ]);

  const setupMissing =
    memberResult.setupMissing ||
    membersResult.setupMissing ||
    openEntriesResult.setupMissing ||
    attendanceResult.setupMissing ||
    tasksResult.setupMissing ||
    auditResult.setupMissing;
  const memberById = new Map(membersResult.data.map((member) => [member.id, member]));
  const openEntryByMember = new Map<string, AttendanceEntry>();

  for (const entry of openEntriesResult.data) {
    if (!openEntryByMember.has(entry.user_id)) {
      openEntryByMember.set(entry.user_id, entry);
    }
  }

  const presenceCounts = membersResult.data.reduce(
    (counts, member) => {
      counts[presenceFor(member, openEntryByMember.get(member.id))] += 1;
      return counts;
    },
    { active: 0, idle: 0, offline: 0 } as Record<PresenceState, number>,
  );
  const activeTasks = tasksResult.data.filter((task) => !task.archived_at);
  const openTaskCount = activeTasks.filter((task) => task.status !== "done").length;
  const message = accessMessage(params.access);

  return (
    <TeamShell active="admin" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Admin</p>
          <h1 className="team-title">Team command center</h1>
          <p className="team-subtitle">
            Monitor attendance, workload, and team availability from one operational view.
          </p>
        </div>
      </div>

      {setupMissing && <div className="mb-6">{setupNotice()}</div>}
      {message && <p className="mb-5 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-black" role="status">{message}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="team-stat bg-indigo-700 text-white">
          <p className="team-kicker text-gray-400">Members</p>
          <strong className="team-stat-value">{membersResult.data.length}</strong>
        </div>
        <div className="team-stat border-gray-200 bg-gray-50">
          <p className="team-kicker text-gray-700">Active</p>
          <strong className="team-stat-value">{presenceCounts.active}</strong>
        </div>
        <div className="team-stat border-yellow-300 bg-yellow-50">
          <p className="team-kicker text-black">Idle</p>
          <strong className="team-stat-value">{presenceCounts.idle}</strong>
        </div>
        <div className="team-stat">
          <p className="team-kicker">Open tasks</p>
          <strong className="team-stat-value">{openTaskCount}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="team-panel p-5">
          <p className="team-kicker">Account provisioning</p>
          <h2 className="mt-2 text-2xl font-black">Invite teammate</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-gray-500">The invite link lets the teammate create a password. Access is added automatically.</p>
          {!hasSupabaseAdminConfig() && <p className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-xs font-black">Server service-role configuration is required.</p>}
          <form action={inviteTeamMember} className="mt-5 space-y-3">
            <input className="team-field" name="fullName" placeholder="Full name" maxLength={120} />
            <input className="team-field" type="email" name="email" placeholder="name@anovic.net" required />
            <select className="team-field" name="role" defaultValue="employee"><option value="employee">Employee</option><option value="manager">Manager</option>{memberResult.data?.role === "owner" && <option value="admin">Admin</option>}</select>
            <TeamSubmitButton className="team-button w-full" disabled={!hasSupabaseAdminConfig()} pendingLabel="Sending invite..."><UserPlus aria-hidden="true" size={15} className="mr-2" />Send secure invite</TeamSubmitButton>
          </form>
        </section>

        <section className="team-panel overflow-hidden">
          <div className="border-b border-gray-200 p-5"><p className="team-kicker">Access controls</p><h2 className="mt-2 text-2xl font-black">Roles, account state, and MFA</h2></div>
          <div className="divide-y divide-gray-200">
            {membersResult.data.map((teamMember) => <form key={teamMember.id} action={updateTeamMemberAccess} className="grid gap-3 p-4 lg:grid-cols-[minmax(10rem,1fr)_9rem_auto_auto_auto] lg:items-center">
              <input type="hidden" name="memberId" value={teamMember.id} />
              <div className="min-w-0"><p className="truncate text-sm font-black">{displayMemberName(teamMember)}</p><p className="truncate text-xs font-bold text-gray-500">{teamMember.email}</p></div>
              <select name="role" defaultValue={teamMember.role} className="team-field py-2 text-sm"><option value="employee">Employee</option><option value="manager">Manager</option>{memberResult.data?.role === "owner" && <><option value="admin">Admin</option><option value="owner">Owner</option></>}</select>
              <label className="flex items-center gap-2 text-xs font-black"><input type="checkbox" name="isActive" defaultChecked={teamMember.is_active} className="h-4 w-4 accent-indigo-700" />Active</label>
              <label className="flex items-center gap-2 text-xs font-black"><input type="checkbox" name="mfaRequired" defaultChecked={teamMember.mfa_required} className="h-4 w-4 accent-indigo-700" />Require MFA</label>
              <TeamSubmitButton className="team-button-secondary min-h-9 px-3 text-xs" pendingLabel="Saving"><Save aria-hidden="true" size={14} className="mr-1.5" />Save</TeamSubmitButton>
            </form>)}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="team-panel p-5">
          <p className="team-kicker">Members now</p>
          <div className="mt-5 divide-y divide-gray-200">
            {membersResult.data.map((member) => {
              const openEntry = openEntryByMember.get(member.id);
              const state = presenceFor(member, openEntry);
              const name = displayMemberName(member);

              return (
                <article key={member.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={name} src={member.avatar_url} size={44} />
                    <div className="min-w-0">
                      <h2 className="truncate font-black">{name}</h2>
                      <p className="truncate text-sm font-bold text-gray-500">
                        {openEntry ? `Clocked in ${formatTime(openEntry.clock_in)}` : "Offline"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClass(state)}`}>
                    {state}
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="team-panel p-5">
          <p className="team-kicker">Recent tasks</p>
          <div className="mt-5 divide-y divide-gray-200">
            {activeTasks.length === 0 ? (
              <p className="py-10 text-sm font-bold text-gray-500">No tasks created yet.</p>
            ) : (
              activeTasks.map((task) => {
                const assignee = task.assigned_to ? memberById.get(task.assigned_to) : null;

                return (
                  <article key={task.id} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-black">{task.title}</h2>
                        <p className="mt-1 text-sm font-bold text-gray-500">
                          {displayMemberName(assignee ?? null)} - {formatDate(task.due_date)}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-black uppercase text-gray-900">
                        {statusLabel(task.status)}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="team-panel mt-5 p-5">
        <p className="team-kicker">Today&apos;s clock events</p>
        <div className="mt-5 divide-y divide-gray-200">
          {attendanceResult.data.length === 0 ? (
            <p className="py-10 text-sm font-bold text-gray-500">No clock events today.</p>
          ) : (
            attendanceResult.data.map((entry) => {
              const member = memberById.get(entry.user_id) ?? null;

              return (
                <article key={entry.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <h2 className="font-black">{displayMemberName(member)}</h2>
                    <p className="mt-1 text-sm font-bold text-gray-500">
                      {formatTime(entry.clock_in)} - {formatTime(entry.clock_out)}
                      {entry.note ? ` - ${entry.note}` : ""}
                    </p>
                  </div>
                  <span className={entry.clock_out ? "font-black text-gray-500" : "font-black text-gray-700"}>
                    {entry.clock_out ? "Completed" : "Active"}
                  </span>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="team-panel mt-5 overflow-hidden">
        <div className="border-b border-gray-200 p-5"><p className="team-kicker">Security audit</p><h2 className="mt-2 text-2xl font-black">Recent workspace activity</h2></div>
        <div className="divide-y divide-gray-200">
          {auditResult.data.length === 0 ? <p className="p-5 text-sm font-bold text-gray-500">Audit events appear after the updated SQL is active.</p> : auditResult.data.map((event) => {
            const actor = event.actor_id ? memberById.get(event.actor_id) : null;
            return <article key={event.id} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_12rem]"><div><p className="text-sm font-black">{event.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs font-bold text-gray-500">Actor: {displayMemberName(actor || null)}{event.entity_table ? ` - ${event.entity_table}` : ""}</p></div><p className="text-xs font-black text-gray-500 sm:text-right">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</p></article>;
          })}
        </div>
      </section>
    </TeamShell>
  );
}
