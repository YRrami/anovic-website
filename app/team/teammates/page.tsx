import type { Metadata } from "next";
import Link from "next/link";
import Avatar from "../_components/Avatar";
import TeamShell from "../_components/TeamShell";
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
  type TeamMember,
  type TeamTask,
} from "../_lib/data";

export const metadata: Metadata = {
  title: "Teammates | Anovic Team",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  q?: string;
  department?: string;
  status?: string;
  role?: string;
  presence?: string;
}>;

type PresenceState = "active" | "idle" | "offline";

const memberStatuses: TeamMember["status"][] = ["online", "break", "lunch", "away"];
const memberRoles: TeamMember["role"][] = ["owner", "admin", "manager", "employee"];
const presenceStates: PresenceState[] = ["active", "idle", "offline"];

function presenceFor(member: TeamMember, _entry: AttendanceEntry | undefined): PresenceState {
  void _entry;
  if (!member.is_active || !member.last_seen_at) return "offline";
  const now = Date.now();
  if (now - new Date(member.last_seen_at).getTime() > 90_000) return "offline";
  if (!member.last_active_at || now - new Date(member.last_active_at).getTime() > 5 * 60_000) return "idle";
  return "active";
}

function cleanFilter<T extends string>(value: string | undefined, allowed: readonly T[]) {
  return allowed.includes(value as T) ? (value as T) : "all";
}

function presenceClass(state: PresenceState) {
  if (state === "active") return "border-gray-200 bg-indigo-50 text-indigo-700";
  if (state === "idle") return "border-yellow-300 bg-yellow-50 text-black";
  return "border-gray-200 bg-gray-50 text-gray-800";
}

function memberStatusClass(status: TeamMember["status"]) {
  if (status === "online") return "bg-indigo-50 text-indigo-700";
  if (status === "break") return "bg-yellow-50 text-black";
  if (status === "lunch") return "bg-yellow-100 text-black";
  return "bg-yellow-50 text-black";
}

function roleClass(role: TeamMember["role"]) {
  if (role === "owner") return "bg-indigo-700 text-white";
  if (role === "admin") return "bg-gray-50 text-gray-800";
  if (role === "manager") return "bg-gray-50 text-gray-800";
  return "bg-gray-50 text-gray-900";
}

function profileScore(member: TeamMember) {
  const fields = [
    member.full_name,
    member.nickname,
    member.avatar_url,
    member.job_title,
    member.department,
    member.phone,
    member.status,
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function hasContact(member: TeamMember) {
  return Boolean(member.email || member.phone);
}

function isOpenTask(task: TeamTask) {
  return !task.archived_at && task.status !== "done";
}

function isOverdueTask(task: TeamTask, today: string) {
  return Boolean(task.due_date && task.due_date < today && isOpenTask(task));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function taskSummaryFor(memberId: string, tasks: TeamTask[], today: string) {
  const assigned = tasks.filter((task) => task.assigned_to === memberId && !task.archived_at);
  const open = assigned.filter(isOpenTask);

  return {
    open: open.length,
    overdue: open.filter((task) => isOverdueTask(task, today)).length,
    urgent: open.filter((task) => task.priority === "urgent").length,
    done: assigned.filter((task) => task.status === "done").length,
    next: [...open]
      .sort((left, right) => {
        const leftDue = left.due_date || "9999-12-31";
        const rightDue = right.due_date || "9999-12-31";
        return leftDue.localeCompare(rightDue);
      })[0],
  };
}

function MemberCard({
  member,
  presence,
  openEntry,
  isManager,
  currentUserId,
  tasks,
  today,
}: {
  member: TeamMember;
  presence: PresenceState;
  openEntry: AttendanceEntry | undefined;
  isManager: boolean;
  currentUserId: string;
  tasks: TeamTask[];
  today: string;
}) {
  const name = displayMemberName(member);
  const score = profileScore(member);
  const taskSummary = taskSummaryFor(member.id, tasks, today);
  const isCurrentUser = member.id === currentUserId;

  return (
    <article className="team-panel overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(17,24,39,0.10)]">
      <div className="border-b border-gray-200 bg-white/75 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={name} src={member.avatar_url} size={64} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-black text-black">{name}</h2>
                {isCurrentUser && (
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-[0.62rem] font-black uppercase text-gray-700">
                    You
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm font-bold text-gray-500">
                {member.job_title || "No position yet"}
              </p>
              {member.nickname && (
                <p className="mt-1 truncate text-xs font-black uppercase tracking-[0.12em] text-gray-400">
                  {member.nickname}
                </p>
              )}
            </div>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${presenceClass(presence)}`}>
            {isManager || isCurrentUser ? presence : member.status}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-black uppercase text-gray-700">
            {member.department || "Team"}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${roleClass(member.role)}`}>
            {member.role}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${memberStatusClass(member.status)}`}>
            {member.status}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[0.64rem] font-black uppercase tracking-[0.1em] text-gray-500">
              Profile
            </p>
            <strong className="mt-1 block text-lg font-black">{score}%</strong>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-gray-800">
            <p className="text-[0.64rem] font-black uppercase tracking-[0.1em]">
              Open
            </p>
            <strong className="mt-1 block text-lg font-black">
              {isManager || isCurrentUser ? taskSummary.open : "-"}
            </strong>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-gray-800">
            <p className="text-[0.64rem] font-black uppercase tracking-[0.1em]">
              Late
            </p>
            <strong className="mt-1 block text-lg font-black">
              {isManager || isCurrentUser ? taskSummary.overdue : "-"}
            </strong>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
            {openEntry ? "Clocked in" : isManager || isCurrentUser ? "Presence" : "Profile note"}
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-gray-900">
            {openEntry
              ? `${formatTime(openEntry.clock_in)}${openEntry.note ? ` - ${openEntry.note}` : ""}`
              : isManager || isCurrentUser
                ? "Not clocked in right now."
                : member.status === "break"
                  ? "Taking a break."
                  : member.status === "lunch"
                    ? "At lunch."
                  : `Current status is ${member.status}.`}
          </p>
        </div>

        {(isManager || isCurrentUser) && taskSummary.next && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-black">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-700">
              Next task
            </p>
            <p className="mt-2 text-sm font-black">{taskSummary.next.title}</p>
            <p className="mt-1 text-xs font-bold text-gray-700">
              {statusLabel(taskSummary.next.status)} - {formatDate(taskSummary.next.due_date)}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!isCurrentUser && (
            <Link
              href={`/team/chat?recipient=${member.id}`}
              className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-indigo-800"
            >
              Message
            </Link>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-900 transition hover:bg-gray-50"
            >
              Email
            </a>
          )}
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-900 transition hover:bg-gray-50"
            >
              Call
            </a>
          )}
          {!hasContact(member) && (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-400">
              No contact
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function TeammatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession();
  const today = localDateKey();
  const memberResult = await safeSingle<TeamMember>(
    supabase
      .from("team_members")
      .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active,last_seen_at,last_active_at,mfa_required")
      .eq("id", user.id)
      .maybeSingle(),
  );
  const isManager = canManageTeam(memberResult.data, user.email);
  const [membersResult, openEntriesResult, tasksResult] = await Promise.all([
    safeList<TeamMember>(
      supabase
        .from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active,last_seen_at,last_active_at,mfa_required")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
    ),
    safeList<AttendanceEntry>(
      (isManager
        ? supabase.from("attendance_entries").select("id,user_id,clock_in,clock_out,note")
        : supabase
            .from("attendance_entries")
            .select("id,user_id,clock_in,clock_out,note")
            .eq("user_id", user.id)
      )
        .is("clock_out", null)
        .order("clock_in", { ascending: false }),
    ),
    safeList<TeamTask>(
      (isManager
        ? supabase.from("team_tasks").select("id,title,description,status,priority,due_date,assigned_to,created_by,created_at,completed_at,archived_at,archived_by")
        : supabase
            .from("team_tasks")
            .select("id,title,description,status,priority,due_date,assigned_to,created_by,created_at,completed_at,archived_at,archived_by")
            .eq("assigned_to", user.id)
      ).order("created_at", { ascending: false }),
    ),
  ]);
  const openEntryByMember = new Map<string, AttendanceEntry>();

  for (const entry of openEntriesResult.data) {
    if (!openEntryByMember.has(entry.user_id)) {
      openEntryByMember.set(entry.user_id, entry);
    }
  }

  const departments = Array.from(
    new Set(membersResult.data.map((member) => member.department).filter(Boolean) as string[]),
  ).sort((left, right) => left.localeCompare(right));
  const queryFilter = String(params.q || "").trim().toLowerCase();
  const departmentFilter = departments.includes(String(params.department || ""))
    ? String(params.department)
    : "all";
  const statusFilter = cleanFilter<TeamMember["status"]>(params.status, memberStatuses);
  const roleFilter = cleanFilter<TeamMember["role"]>(params.role, memberRoles);
  const presenceFilter = cleanFilter<PresenceState>(params.presence, presenceStates);

  const visibleMembers = membersResult.data.filter((member) => {
    const presence = presenceFor(member, openEntryByMember.get(member.id));
    const haystack = [
      displayMemberName(member),
      member.nickname,
      member.email,
      member.job_title,
      member.department,
      member.role,
      member.status,
      presence,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      (!queryFilter || haystack.includes(queryFilter)) &&
      (departmentFilter === "all" || member.department === departmentFilter) &&
      (statusFilter === "all" || member.status === statusFilter) &&
      (roleFilter === "all" || member.role === roleFilter) &&
      (!isManager || presenceFilter === "all" || presence === presenceFilter)
    );
  });

  const presenceCounts = membersResult.data.reduce(
    (counts, member) => {
      counts[presenceFor(member, openEntryByMember.get(member.id))] += 1;
      return counts;
    },
    { active: 0, idle: 0, offline: 0 } as Record<PresenceState, number>,
  );
  const completeProfiles = membersResult.data.filter((member) => profileScore(member) >= 85).length;
  const managerCount = membersResult.data.filter((member) =>
    ["owner", "admin", "manager"].includes(member.role),
  ).length;
  const totalOpenTasks = tasksResult.data.filter(isOpenTask).length;
  const activeDepartments = departments.length || 1;
  const highlightedMembers = [...visibleMembers]
    .sort((left, right) => {
      const leftPresence = presenceFor(left, openEntryByMember.get(left.id));
      const rightPresence = presenceFor(right, openEntryByMember.get(right.id));
      const presenceOrder = { active: 0, idle: 1, offline: 2 };
      return (
        presenceOrder[leftPresence] -
          presenceOrder[rightPresence] ||
        profileScore(right) -
          profileScore(left) ||
        displayMemberName(left).localeCompare(displayMemberName(right))
      );
    })
    .slice(0, 3);

  return (
    <TeamShell active="teammates" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Teammates</p>
          <h1 className="team-title">Team directory</h1>
          <p className="team-subtitle">
            Search people, scan availability, see roles, and understand workload without leaving the platform.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-[34rem] sm:grid-cols-4">
          <div className="team-stat bg-indigo-700 text-white">
            <p className="team-kicker text-gray-400">Members</p>
            <strong className="team-stat-value">{membersResult.data.length}</strong>
          </div>
          <div className="team-stat border-gray-200 bg-gray-50">
            <p className="team-kicker text-gray-700">{isManager ? "Active" : "Complete"}</p>
            <strong className="team-stat-value">
              {isManager ? presenceCounts.active : completeProfiles}
            </strong>
          </div>
          <div className="team-stat border-gray-200 bg-gray-50">
            <p className="team-kicker text-gray-800">Depts</p>
            <strong className="team-stat-value">{activeDepartments}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">{isManager ? "Open tasks" : "Leads"}</p>
            <strong className="team-stat-value">{isManager ? totalOpenTasks : managerCount}</strong>
          </div>
        </div>
      </div>

      {(memberResult.setupMissing ||
        membersResult.setupMissing ||
        openEntriesResult.setupMissing ||
        tasksResult.setupMissing) && <div className="mb-6">{setupNotice()}</div>}

      <section className="team-panel p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="team-kicker">Directory controls</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {visibleMembers.length} teammate{visibleMembers.length === 1 ? "" : "s"} visible
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-gray-500">
              Profiles, roles, availability, and contact details in one place.
            </p>
          </div>
          <Link href="/team/teammates" className="team-button-secondary min-h-10 px-4 text-xs">
            Clear filters
          </Link>
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
              Search
            </span>
            <input
              name="q"
              defaultValue={params.q || ""}
              className="team-field mt-2"
              placeholder="Name, email, role..."
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
              Department
            </span>
            <select name="department" defaultValue={departmentFilter} className="team-field mt-2">
              <option value="all">All departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
              Status
            </span>
            <select name="status" defaultValue={statusFilter} className="team-field mt-2">
              <option value="all">All statuses</option>
              {memberStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
              Role
            </span>
            <select name="role" defaultValue={roleFilter} className="team-field mt-2">
              <option value="all">All roles</option>
              {memberRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
              Presence
            </span>
            <select
              name="presence"
              defaultValue={presenceFilter}
              className="team-field mt-2"
              disabled={!isManager}
            >
              <option value="all">{isManager ? "All presence" : "Admin only"}</option>
              {presenceStates.map((presence) => (
                <option key={presence} value={presence}>
                  {presence}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="team-button md:col-span-2 xl:col-span-5">
            Apply filters
          </button>
        </form>
      </section>

      {isManager && (
        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {presenceStates.map((state) => (
            <div key={state} className={`team-stat border ${presenceClass(state)}`}>
              <p className="team-kicker">{state}</p>
              <strong className="team-stat-value">{presenceCounts[state]}</strong>
            </div>
          ))}
        </section>
      )}

      <section className="mt-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="team-kicker">People cards</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Recommended view</h2>
          </div>
          <p className="text-sm font-bold text-gray-500">
            Strongest profile and availability signals first.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleMembers.length === 0 ? (
            <p className="team-panel p-6 text-sm font-bold text-gray-500 md:col-span-2 xl:col-span-3 2xl:col-span-4">
              No teammates match the current filters.
            </p>
          ) : (
            visibleMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                presence={presenceFor(member, openEntryByMember.get(member.id))}
                openEntry={openEntryByMember.get(member.id)}
                isManager={isManager}
                currentUserId={user.id}
                tasks={tasksResult.data}
                today={today}
              />
            ))
          )}
        </div>
      </section>

      {highlightedMembers.length > 0 && (
        <section className="team-panel mt-5 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="team-kicker">At a glance</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                {isManager ? "Most available now" : "Directory highlights"}
              </h2>
            </div>
            <p className="text-sm font-bold text-gray-500">
              Sorted by presence, profile strength, and name.
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {highlightedMembers.map((member) => {
              const name = displayMemberName(member);
              const presence = presenceFor(member, openEntryByMember.get(member.id));

              return (
                <article key={member.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={name} src={member.avatar_url} size={44} />
                      <div className="min-w-0">
                        <h3 className="truncate font-black">{name}</h3>
                        <p className="truncate text-sm font-bold text-gray-500">
                          {member.job_title || member.department || "Team member"}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${presenceClass(presence)}`}>
                      {isManager || member.id === user.id ? presence : member.status}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="team-panel mt-5 overflow-hidden">
        <div className="border-b border-gray-200 bg-white/75 p-5">
          <p className="team-kicker">Compact directory</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Scan list</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {visibleMembers.map((member) => {
            const name = displayMemberName(member);
            const presence = presenceFor(member, openEntryByMember.get(member.id));
            const taskSummary = taskSummaryFor(member.id, tasksResult.data, today);

            return (
              <article
                key={member.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_0.85fr_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={name} src={member.avatar_url} size={42} />
                  <div className="min-w-0">
                    <h3 className="truncate font-black">{name}</h3>
                    <p className="truncate text-sm font-bold text-gray-500">
                      {member.job_title || "No position yet"} - {member.department || "Team"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${roleClass(member.role)}`}>
                    {member.role}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${memberStatusClass(member.status)}`}>
                    {member.status}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${presenceClass(presence)}`}>
                    {isManager || member.id === user.id ? presence : "profile"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {(isManager || member.id === user.id) && (
                    <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-black uppercase text-gray-800">
                      {taskSummary.open} open
                    </span>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-900 transition hover:bg-gray-50"
                    >
                      Email
                    </a>
                  )}
                  {member.id !== user.id && (
                    <Link
                      href={`/team/chat?recipient=${member.id}`}
                      className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-indigo-800"
                    >
                      Message
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </TeamShell>
  );
}
