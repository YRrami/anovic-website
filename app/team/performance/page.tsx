import Link from "next/link";
import type { Metadata } from "next";
import Avatar from "../_components/Avatar";
import TeamShell from "../_components/TeamShell";
import {
  canManageTeam,
  displayMemberName,
  formatDate,
  requireTeamSession,
  safeList,
  safeSingle,
  setupNotice,
  type AttendanceEntry,
  type StatusTimeEntry,
  type TaskTimeEntry,
  type TeamMember,
  type TeamTask,
} from "../_lib/data";

export const metadata: Metadata = {
  title: "Performance | Anovic Team",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  member?: string;
}>;

const statuses: StatusTimeEntry["status"][] = ["online", "break", "lunch", "away", "offline"];

function entrySeconds(entry: Pick<TaskTimeEntry | StatusTimeEntry, "started_at" | "ended_at" | "duration_seconds">, now: number) {
  if (entry.ended_at) return entry.duration_seconds || 0;

  return Math.max(0, Math.floor((now - new Date(entry.started_at).getTime()) / 1000));
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours <= 0) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function sessionSeconds(entry: AttendanceEntry, now: number) {
  const start = new Date(entry.clock_in).getTime();
  const end = entry.clock_out ? new Date(entry.clock_out).getTime() : now;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function formatVariance(actualSeconds: number, estimateMinutes: number | null | undefined) {
  if (!estimateMinutes) return "No estimate";

  const estimateSeconds = estimateMinutes * 60;
  const diffMinutes = Math.round((actualSeconds - estimateSeconds) / 60);

  if (diffMinutes === 0) return "On estimate";
  if (diffMinutes > 0) return `${diffMinutes}m over`;
  return `${Math.abs(diffMinutes)}m under`;
}

function taskSecondsMap(entries: TaskTimeEntry[], now: number) {
  const map = new Map<string, number>();

  for (const entry of entries) {
    map.set(entry.task_id, (map.get(entry.task_id) || 0) + entrySeconds(entry, now));
  }

  return map;
}

function statusSecondsMap(entries: StatusTimeEntry[], now: number) {
  const map = new Map<string, Record<StatusTimeEntry["status"], number>>();

  for (const entry of entries) {
    const current = map.get(entry.user_id) || {
      online: 0,
      break: 0,
      lunch: 0,
      away: 0,
      offline: 0,
    };

    current[entry.status] += entrySeconds(entry, now);
    map.set(entry.user_id, current);
  }

  return map;
}

function statusTone(status: StatusTimeEntry["status"]) {
  if (status === "online") return "bg-indigo-50 text-indigo-800";
  if (status === "break" || status === "lunch") return "bg-yellow-50 text-black";
  return "bg-gray-50 text-gray-700";
}

function querySuffix(member?: string) {
  if (!member) return "";

  return `?member=${encodeURIComponent(member)}`;
}

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession();
  const memberResult = await safeSingle<TeamMember>(
    supabase
      .from("team_members")
      .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
      .eq("id", user.id)
      .maybeSingle(),
  );
  const isManager = canManageTeam(memberResult.data, user.email);
  const [membersResult, tasksResult, taskTimeResult, statusTimeResult, attendanceResult] = await Promise.all([
    safeList<TeamMember>(
      (isManager
        ? supabase.from("team_members").select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
        : supabase
            .from("team_members")
            .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
            .eq("id", user.id)
      ).order("full_name", { ascending: true }),
    ),
    safeList<TeamTask>(
      (isManager
        ? supabase.from("team_tasks").select("id,title,description,status,priority,due_date,estimated_minutes,assigned_to,created_by,created_at,started_at,completed_at,archived_at,archived_by")
        : supabase
            .from("team_tasks")
            .select("id,title,description,status,priority,due_date,estimated_minutes,assigned_to,created_by,created_at,started_at,completed_at,archived_at,archived_by")
            .eq("assigned_to", user.id)
      ).order("created_at", { ascending: false }),
    ),
    safeList<TaskTimeEntry>(
      (isManager
        ? supabase.from("task_time_entries").select("id,task_id,user_id,started_at,ended_at,duration_seconds")
        : supabase
            .from("task_time_entries")
            .select("id,task_id,user_id,started_at,ended_at,duration_seconds")
            .eq("user_id", user.id)
      ).order("started_at", { ascending: false }),
    ),
    safeList<StatusTimeEntry>(
      (isManager
        ? supabase.from("status_time_entries").select("id,user_id,task_id,status,started_at,ended_at,duration_seconds")
        : supabase
            .from("status_time_entries")
            .select("id,user_id,task_id,status,started_at,ended_at,duration_seconds")
            .eq("user_id", user.id)
      ).order("started_at", { ascending: false }),
    ),
    safeList<AttendanceEntry>(
      (isManager
        ? supabase.from("attendance_entries").select("id,user_id,clock_in,clock_out,note")
        : supabase
            .from("attendance_entries")
            .select("id,user_id,clock_in,clock_out,note")
            .eq("user_id", user.id)
      ).order("clock_in", { ascending: false }),
    ),
  ]);

  const setupMissing =
    memberResult.setupMissing ||
    membersResult.setupMissing ||
    tasksResult.setupMissing ||
    taskTimeResult.setupMissing ||
    statusTimeResult.setupMissing ||
    attendanceResult.setupMissing;
  const now = new Date().getTime();
  const memberById = new Map(membersResult.data.map((member) => [member.id, member]));
  const selectedMemberId = isManager && params.member ? params.member : user.id;
  const scopedTasks = isManager && params.member
    ? tasksResult.data.filter((task) => task.assigned_to === params.member)
    : tasksResult.data;
  const scopedTaskIds = new Set(scopedTasks.map((task) => task.id));
  const scopedTaskEntries = taskTimeResult.data.filter((entry) =>
    isManager && params.member ? entry.user_id === params.member && scopedTaskIds.has(entry.task_id) : scopedTaskIds.has(entry.task_id),
  );
  const scopedStatusEntries = statusTimeResult.data.filter((entry) =>
    isManager && params.member ? entry.user_id === params.member : true,
  );
  const scopedAttendanceEntries = attendanceResult.data.filter((entry) =>
    isManager && params.member ? entry.user_id === params.member : true,
  );
  const secondsByTask = taskSecondsMap(scopedTaskEntries, now);
  const secondsByStatusMember = statusSecondsMap(scopedStatusEntries, now);
  const completedTasks = scopedTasks.filter((task) => task.status === "done");
  const openTasks = scopedTasks.filter((task) => task.status !== "done" && !task.archived_at);
  const totalActualSeconds = Array.from(secondsByTask.values()).reduce((total, seconds) => total + seconds, 0);
  const totalAttendanceSeconds = scopedAttendanceEntries.reduce((total, entry) => total + sessionSeconds(entry, now), 0);
  const activeAttendanceCount = scopedAttendanceEntries.filter((entry) => !entry.clock_out).length;
  const selectedMember = isManager && !params.member ? null : memberById.get(selectedMemberId) || memberResult.data;
  const selectedMemberLabel = isManager && !params.member ? "Everyone" : displayMemberName(selectedMember);
  const attendanceRecordsHref = `/team/performance/attendance-records${querySuffix(isManager ? params.member : undefined)}`;
  const attendanceExportHref = `/team/performance/attendance-records/export${querySuffix(isManager ? params.member : undefined)}`;

  const memberRows = membersResult.data.map((member) => {
    const assignedTasks = tasksResult.data.filter((task) => task.assigned_to === member.id);
    const taskIds = new Set(assignedTasks.map((task) => task.id));
    const actualSeconds = taskTimeResult.data
      .filter((entry) => entry.user_id === member.id && taskIds.has(entry.task_id))
      .reduce((total, entry) => total + entrySeconds(entry, now), 0);
    const statusTotals = secondsByStatusMember.get(member.id) || {
      online: 0,
      break: 0,
      lunch: 0,
      away: 0,
      offline: 0,
    };

    return {
      member,
      completed: assignedTasks.filter((task) => task.status === "done").length,
      open: assignedTasks.filter((task) => task.status !== "done" && !task.archived_at).length,
      actualSeconds,
      attendanceSeconds: attendanceResult.data
        .filter((entry) => entry.user_id === member.id)
        .reduce((total, entry) => total + sessionSeconds(entry, now), 0),
      attendanceSessions: attendanceResult.data.filter((entry) => entry.user_id === member.id).length,
      statusTotals,
    };
  });
  const scopedStatusTotals = Object.fromEntries(statuses.map((status) => [
    status,
    isManager && !params.member
      ? Array.from(secondsByStatusMember.values()).reduce((sum, row) => sum + row[status], 0)
      : (secondsByStatusMember.get(selectedMemberId)?.[status] || 0),
  ])) as Record<StatusTimeEntry["status"], number>;
  const statusTotalSeconds = Object.values(scopedStatusTotals).reduce((sum, seconds) => sum + seconds, 0);
  const statusBarTone: Record<StatusTimeEntry["status"], string> = {
    online: "bg-indigo-600", break: "bg-yellow-400", lunch: "bg-yellow-300", away: "bg-gray-400", offline: "bg-gray-700",
  };

  return (
    <TeamShell active="performance" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Performance</p>
          <h1 className="team-title">{isManager ? "Team performance" : "My performance"}</h1>
          <p className="team-subtitle">
            Track completed work, actual task time, estimates, and how time is split between online, break, lunch, away, and offline states.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-[34rem] sm:grid-cols-4">
          <div className="team-stat bg-indigo-700 text-white">
            <p className="team-kicker text-gray-300">Completed</p>
            <strong className="team-stat-value">{completedTasks.length}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">Open</p>
            <strong className="team-stat-value">{openTasks.length}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">Actual</p>
            <strong className="team-stat-value text-[1.55rem]">{formatDuration(totalActualSeconds)}</strong>
          </div>
          <div className="team-stat border-yellow-300 bg-yellow-50">
            <p className="team-kicker text-black">Attendance</p>
            <strong className="team-stat-value text-[1.55rem]">{formatDuration(totalAttendanceSeconds)}</strong>
          </div>
        </div>
      </div>

      {setupMissing && <div className="mb-6">{setupNotice()}</div>}

      <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-5">
          {isManager && (
            <section className="team-panel p-5">
              <p className="team-kicker">View member</p>
              <div className="mt-4 space-y-2">
                <Link
                  href="/team/performance"
                  className={`block rounded-xl border px-4 py-3 text-sm font-black transition ${!params.member ? "border-indigo-300 bg-indigo-50 text-indigo-950" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  Everyone
                </Link>
                {membersResult.data.map((member) => (
                  <Link
                    key={member.id}
                    href={`/team/performance?member=${member.id}`}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${params.member === member.id ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                  >
                    <Avatar name={displayMemberName(member)} src={member.avatar_url} size={34} />
                    <span className="min-w-0 truncate text-sm font-black text-black">{displayMemberName(member)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="team-panel p-5">
            <p className="team-kicker">Status totals</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-black">{selectedMemberLabel}</h2>
            <div className="mt-4 space-y-2">
              {statuses.map((status) => {
                const total = scopedStatusTotals[status];
                const share = statusTotalSeconds > 0 ? Math.round((total / statusTotalSeconds) * 100) : 0;

                return (
                  <div key={status} className={`rounded-lg px-3 py-3 ${statusTone(status)}`}>
                    <div className="flex items-center justify-between"><span className="text-xs font-black capitalize">{status}</span><strong className="text-sm font-black">{formatDuration(total)}</strong></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70"><div className={`h-full rounded-full ${statusBarTone[status]}`} style={{ width: `${share}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <section className="team-panel p-5">
            <div className="flex items-end justify-between gap-3"><div><p className="team-kicker">Time distribution</p><h2 className="mt-2 text-xl font-black">{selectedMemberLabel}</h2></div><strong className="text-sm font-black text-gray-500">{formatDuration(statusTotalSeconds)} tracked</strong></div>
            <div className="mt-5 flex h-4 overflow-hidden rounded-md bg-gray-100" aria-label="Status time distribution">{statuses.map((status) => {
              const width = statusTotalSeconds > 0 ? (scopedStatusTotals[status] / statusTotalSeconds) * 100 : 0;
              return width > 0 ? <div key={status} title={`${status}: ${formatDuration(scopedStatusTotals[status])}`} className={statusBarTone[status]} style={{ width: `${width}%` }} /> : null;
            })}</div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{statuses.map((status) => <span key={status} className="flex items-center gap-2 text-xs font-bold capitalize text-gray-600"><span className={`h-2.5 w-2.5 rounded-sm ${statusBarTone[status]}`} />{status}</span>)}</div>
          </section>

          {isManager && !params.member && (
            <section className="team-panel overflow-hidden">
              <div className="border-b border-gray-200 bg-white p-4">
                <p className="team-kicker">Team comparison</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-black">Members</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {memberRows.map((row) => (
                  <article key={row.member.id} className="grid gap-4 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_6rem_6rem_9rem_9rem_8rem] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={displayMemberName(row.member)} src={row.member.avatar_url} size={42} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">{displayMemberName(row.member)}</p>
                        <p className="truncate text-xs font-bold text-gray-500">{row.member.job_title || row.member.department || row.member.role}</p>
                        <div className="mt-2 h-1.5 max-w-40 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${row.completed + row.open > 0 ? Math.round((row.completed / (row.completed + row.open)) * 100) : 0}%` }} /></div>
                      </div>
                    </div>
                    <div>
                      <p className="team-kicker">Done</p>
                      <p className="mt-1 text-sm font-black text-black">{row.completed}</p>
                    </div>
                    <div>
                      <p className="team-kicker">Open</p>
                      <p className="mt-1 text-sm font-black text-black">{row.open}</p>
                    </div>
                    <div>
                      <p className="team-kicker">Actual</p>
                      <p className="mt-1 text-sm font-black text-black">{formatDuration(row.actualSeconds)}</p>
                    </div>
                    <div>
                      <p className="team-kicker">Attendance</p>
                      <p className="mt-1 text-sm font-black text-black">{formatDuration(row.attendanceSeconds)}</p>
                    </div>
                    <div>
                      <p className="team-kicker">Records</p>
                      <p className="mt-1 text-sm font-black text-black">{row.attendanceSessions}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="team-panel overflow-hidden">
            <div className="border-b border-gray-200 bg-white p-4">
              <p className="team-kicker">Task performance</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-black">Actual vs estimated</h2>
            </div>
            {scopedTasks.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-gray-500">No task data</p>
                <p className="mt-2 text-sm font-bold text-gray-500">Task performance appears here after tasks are assigned and started.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {scopedTasks.slice(0, 80).map((task) => {
                  const assignee = task.assigned_to ? memberById.get(task.assigned_to) ?? null : null;
                  const actualSeconds = secondsByTask.get(task.id) || 0;
                  const estimateSeconds = (task.estimated_minutes || 0) * 60;
                  const estimateRatio = estimateSeconds > 0 ? Math.round((actualSeconds / estimateSeconds) * 100) : 0;

                  return (
                    <article key={task.id} className="grid gap-4 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_12rem_9rem_10rem_10rem] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-black text-black">{task.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-[0.65rem] font-black uppercase ${task.status === "done" ? "bg-gray-100 text-gray-700" : "bg-indigo-50 text-indigo-800"}`}>
                            {task.status === "done" ? "completed" : "in progress"}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-gray-500">{task.description || "No brief added."}</p>
                        {estimateSeconds > 0 && <div className="mt-2 h-1.5 max-w-md overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${estimateRatio > 100 ? "bg-yellow-400" : "bg-indigo-600"}`} style={{ width: `${Math.min(100, estimateRatio)}%` }} /></div>}
                      </div>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={displayMemberName(assignee)} src={assignee?.avatar_url} size={34} />
                        <span className="min-w-0 truncate text-sm font-black text-black">{displayMemberName(assignee)}</span>
                      </div>
                      <div>
                        <p className="team-kicker">Due</p>
                        <p className="mt-1 text-sm font-black text-black">{formatDate(task.due_date)}</p>
                      </div>
                      <div>
                        <p className="team-kicker">Actual</p>
                        <p className="mt-1 text-sm font-black text-black">{formatDuration(actualSeconds)}</p>
                      </div>
                      <div>
                        <p className="team-kicker">Estimate</p>
                        <p className="mt-1 text-sm font-black text-black">{formatVariance(actualSeconds, task.estimated_minutes)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="team-panel p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <p className="team-kicker">Attendance records</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-black">
                  Open clock history in its own page
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-gray-500">
                  The detailed clock-in and clock-out table has been moved out of this dashboard so performance stays easier to scan.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href={attendanceRecordsHref} className="team-button min-h-11 px-5 text-xs">
                  Open records
                </Link>
                <Link href={attendanceExportHref} className="team-button-secondary min-h-11 px-5 text-xs">
                  Export CSV
                </Link>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="team-kicker">Scope</p>
                <p className="mt-2 truncate text-lg font-black text-black">{selectedMemberLabel}</p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <div>
                  <p className="team-kicker text-indigo-800">Records</p>
                  <p className="mt-2 text-lg font-black text-indigo-950">{scopedAttendanceEntries.length}</p>
                </div>
              </div>
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="team-kicker text-black">Active now</p>
                <p className="mt-2 text-lg font-black text-black">{activeAttendanceCount}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="team-kicker">Total time</p>
                <p className="mt-2 text-lg font-black text-black">{formatDuration(totalAttendanceSeconds)}</p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </TeamShell>
  );
}
