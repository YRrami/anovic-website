import Link from "next/link";
import type { Metadata } from "next";
import Avatar from "./_components/Avatar";
import TeamShell from "./_components/TeamShell";
import {
  canManageTeam,
  displayMemberName,
  formatDate,
  formatTime,
  requireTeamSession,
  safeList,
  safeSingle,
  setupNotice,
  type AttendanceEntry,
  type TaskTimeEntry,
  type TeamMember,
  type TeamMessage,
  type TeamTask,
} from "./_lib/data";
import { clockIn, clockOut, updateTaskStatus } from "./actions";
import TaskTimer from "./tasks/TaskTimer";

export const metadata: Metadata = {
  title: "Team Dashboard | Anovic Team",
  robots: { index: false, follow: false },
};

type PresenceState = "active" | "idle" | "offline";
type TimerState = {
  baseSeconds: number;
  runningStartedAt: string | null;
};

const priorityTone: Record<TeamTask["priority"], string> = {
  low: "bg-gray-50 text-gray-700",
  normal: "bg-gray-50 text-gray-800",
  high: "bg-yellow-50 text-black",
  urgent: "bg-yellow-100 text-black",
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isOpen(task: TeamTask) {
  return !task.archived_at && task.status !== "done";
}

function isOverdue(task: TeamTask, today: string) {
  return Boolean(task.due_date && task.due_date < today && isOpen(task));
}

function isDueToday(task: TeamTask, today: string) {
  return Boolean(task.due_date === today && isOpen(task));
}

function taskSortScore(task: TeamTask, today: string) {
  const priorityScore = { urgent: 0, high: 1, normal: 2, low: 3 }[task.priority];
  const overdueScore = isOverdue(task, today) ? -20 : 0;
  const todayScore = isDueToday(task, today) ? -10 : 0;
  const dueScore = task.due_date ? 0 : 5;

  return overdueScore + todayScore + dueScore + priorityScore / 10;
}

function presenceFor(member: TeamMember, _entry: AttendanceEntry | undefined): PresenceState {
  void _entry;
  if (!member.is_active || !member.last_seen_at) return "offline";
  const now = Date.now();
  if (now - new Date(member.last_seen_at).getTime() > 90_000) return "offline";
  if (!member.last_active_at || now - new Date(member.last_active_at).getTime() > 5 * 60_000) return "idle";
  return "active";
}

function presenceClass(state: PresenceState) {
  if (state === "active") return "bg-indigo-50 text-indigo-700";
  if (state === "idle") return "bg-yellow-50 text-black";
  return "bg-gray-50 text-gray-800";
}

function StatusButton({ taskId, status, label }: { taskId: string; status: TeamTask["status"]; label: string }) {
  return (
    <form action={updateTaskStatus}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className="team-button-secondary min-h-10 px-4 text-xs">
        {label}
      </button>
    </form>
  );
}

function focusAction(task: TeamTask) {
  return task.started_at
    ? ({ status: "done", label: "Complete" } as const)
    : ({ status: "in_progress", label: "Start task" } as const);
}

function buildTimerMap(entries: TaskTimeEntry[]) {
  const map = new Map<string, TimerState>();

  for (const entry of entries) {
    const current = map.get(entry.task_id) || { baseSeconds: 0, runningStartedAt: null };

    if (entry.ended_at) {
      current.baseSeconds += entry.duration_seconds || 0;
    } else {
      current.runningStartedAt = entry.started_at;
    }

    map.set(entry.task_id, current);
  }

  return map;
}

function TaskPreview({
  task,
  assignee,
}: {
  task: TeamTask;
  assignee: TeamMember | null;
}) {
  const assigneeName = displayMemberName(assignee);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-black">{task.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-gray-500">
            {task.description || "No brief added."}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase ${priorityTone[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={assigneeName} src={assignee?.avatar_url} size={30} />
          <span className="truncate text-xs font-black text-gray-700">{assigneeName}</span>
        </div>
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[0.68rem] font-black uppercase text-gray-700">
          {formatDate(task.due_date)}
        </span>
      </div>
    </article>
  );
}

export default async function TeamDashboardPage() {
  const { supabase, user } = await requireTeamSession();
  const today = localDateKey();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const memberResult = await safeSingle<TeamMember>(
    supabase
      .from("team_members")
      .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active,last_seen_at,last_active_at,mfa_required")
      .eq("id", user.id)
      .maybeSingle(),
  );
  const isManager = canManageTeam(memberResult.data, user.email);
  const [membersResult, tasksResult, taskTimeResult, openEntryResult, teamOpenEntriesResult, attendanceResult, messagesResult] =
    await Promise.all([
      safeList<TeamMember>(
        supabase
          .from("team_members")
          .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active,last_seen_at,last_active_at,mfa_required")
          .eq("is_active", true)
          .order("full_name", { ascending: true }),
      ),
      safeList<TeamTask>(
        (isManager
          ? supabase.from("team_tasks").select("id,title,description,status,priority,due_date,estimated_minutes,assigned_to,created_by,created_at,started_at,completed_at,archived_at,archived_by")
          : supabase
              .from("team_tasks")
              .select("id,title,description,status,priority,due_date,estimated_minutes,assigned_to,created_by,created_at,started_at,completed_at,archived_at,archived_by")
              .eq("assigned_to", user.id)
        )
          .order("created_at", { ascending: false })
          .limit(60),
      ),
      safeList<TaskTimeEntry>(
        (isManager
          ? supabase.from("task_time_entries").select("id,task_id,user_id,started_at,ended_at,duration_seconds")
          : supabase
              .from("task_time_entries")
              .select("id,task_id,user_id,started_at,ended_at,duration_seconds")
              .eq("user_id", user.id)
        ).order("started_at", { ascending: true }),
      ),
      safeSingle<AttendanceEntry>(
        supabase
          .from("attendance_entries")
          .select("id,user_id,clock_in,clock_out,note")
          .eq("user_id", user.id)
          .is("clock_out", null)
          .order("clock_in", { ascending: false })
          .limit(1)
          .maybeSingle(),
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
      safeList<AttendanceEntry>(
        (isManager
          ? supabase.from("attendance_entries").select("id,user_id,clock_in,clock_out,note")
          : supabase
              .from("attendance_entries")
              .select("id,user_id,clock_in,clock_out,note")
              .eq("user_id", user.id)
        )
          .gte("clock_in", todayStart)
          .order("clock_in", { ascending: false })
          .limit(8),
      ),
      safeList<TeamMessage>(
        supabase
          .from("team_messages")
          .select("id,sender_id,recipient_id,group_id,reply_to_message_id,body,created_at,read_at,edited_at,edited_by,pinned_at,pinned_by,deleted_at,deleted_by,deleted_label")
          .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(5),
      ),
    ]);

  const setupMissing =
    memberResult.setupMissing ||
    membersResult.setupMissing ||
    tasksResult.setupMissing ||
    taskTimeResult.setupMissing ||
    openEntryResult.setupMissing ||
    teamOpenEntriesResult.setupMissing ||
    attendanceResult.setupMissing ||
    messagesResult.setupMissing;
  const memberById = new Map(membersResult.data.map((member) => [member.id, member]));
  const timerByTaskId = buildTimerMap(taskTimeResult.data);
  const openEntryByMember = new Map<string, AttendanceEntry>();

  for (const entry of teamOpenEntriesResult.data) {
    if (!openEntryByMember.has(entry.user_id)) {
      openEntryByMember.set(entry.user_id, entry);
    }
  }

  const tasks = tasksResult.data.map((task) => ({
    ...task,
    status: task.status === "done" ? "done" : "in_progress",
  })) satisfies TeamTask[];
  const activeTasks = tasks.filter((task) => !task.archived_at);
  const openTasks = activeTasks.filter(isOpen);
  const completedTasks = activeTasks.filter((task) => task.status === "done");
  const attentionTasks = openTasks.filter((task) => isOverdue(task, today) || isDueToday(task, today) || task.priority === "urgent");
  const myTasks = openTasks.filter((task) => task.assigned_to === user.id);
  const focusTask = [...myTasks].sort((left, right) => taskSortScore(left, today) - taskSortScore(right, today))[0] ?? null;
  const visiblePriorityTasks = [...(isManager ? openTasks : myTasks)]
    .sort((left, right) => taskSortScore(left, today) - taskSortScore(right, today))
    .slice(0, 4);
  const presenceCounts = membersResult.data.reduce(
    (counts, member) => {
      counts[presenceFor(member, openEntryByMember.get(member.id))] += 1;
      return counts;
    },
    { active: 0, idle: 0, offline: 0 } as Record<PresenceState, number>,
  );
  const unreadMessages = messagesResult.data.filter((message) => message.recipient_id === user.id && !message.read_at).length;
  const openEntry = openEntryResult.data;
  const displayName = displayMemberName(memberResult.data);
  const focusTaskAction = focusTask ? focusAction(focusTask) : null;

  return (
    <TeamShell active="dashboard" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Dashboard</p>
          <h1 className="team-title">Good workday, {displayName}</h1>
          <p className="team-subtitle">
            Your operational home for tasks, attendance, messages, and the team signals that need attention today.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-[34rem] sm:grid-cols-4">
          <div className="team-stat bg-indigo-700 text-white">
            <p className="team-kicker text-gray-300">Open</p>
            <strong className="team-stat-value">{openTasks.length}</strong>
          </div>
          <div className="team-stat border-yellow-300 bg-yellow-50">
            <p className="team-kicker text-black">Attention</p>
            <strong className="team-stat-value">{attentionTasks.length}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">Completed</p>
            <strong className="team-stat-value">{completedTasks.length}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">Unread</p>
            <strong className="team-stat-value">{unreadMessages}</strong>
          </div>
        </div>
      </div>

      {setupMissing && <div className="mb-6">{setupNotice()}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_24rem]">
        <section className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="team-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="team-kicker">Focus task</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-black">
                    {focusTask ? focusTask.title : "No active task assigned"}
                  </h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-gray-500">
                    {focusTask
                      ? focusTask.description || "This is the next task that needs your attention."
                      : "When work is assigned to you, the highest-priority item appears here."}
                  </p>
                </div>
                <Link href="/team/tasks?view=mine" className="team-button-secondary min-h-10 px-4 text-xs">
                  My tasks
                </Link>
              </div>
              {focusTask && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase ${priorityTone[focusTask.priority]}`}>
                    {focusTask.priority}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[0.68rem] font-black uppercase text-gray-700">
                    {formatDate(focusTask.due_date)}
                  </span>
                  <TaskTimer
                    startedAt={focusTask.started_at}
                    completedAt={focusTask.completed_at}
                    baseSeconds={(timerByTaskId.get(focusTask.id) || { baseSeconds: 0, runningStartedAt: null }).baseSeconds}
                    runningStartedAt={(timerByTaskId.get(focusTask.id) || { baseSeconds: 0, runningStartedAt: null }).runningStartedAt}
                  />
                  {focusTaskAction && (
                    <StatusButton taskId={focusTask.id} status={focusTaskAction.status} label={focusTaskAction.label} />
                  )}
                </div>
              )}
            </article>

            <article className="team-panel p-5">
              <p className="team-kicker">Attendance</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-black">
                {openEntry ? `Clocked in at ${formatTime(openEntry.clock_in)}` : "You are clocked out"}
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-gray-500">
                {openEntry
                  ? "Your current session is active. Clock out when you finish this work block."
                  : "Start a work block so your team status is visible."}
              </p>
              <form action={openEntry ? clockOut : clockIn} className="mt-5">
                {openEntry ? (
                  <input type="hidden" name="entryId" value={openEntry.id} />
                ) : (
                  <input type="hidden" name="note" value="Started from dashboard" />
                )}
                <button type="submit" disabled={setupMissing} className={openEntry ? "team-button-secondary w-full" : "team-button w-full"}>
                  {openEntry ? "Clock out" : "Clock in"}
                </button>
              </form>
            </article>
          </div>

          <section className="team-panel p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="team-kicker">Priority work</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-black">What needs movement</h2>
              </div>
              <Link href="/team/tasks" className="team-button-secondary min-h-10 px-4 text-xs">
                Open tasks
              </Link>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {visiblePriorityTasks.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm font-bold text-gray-500 lg:col-span-2">
                  No active priority tasks right now.
                </p>
              ) : (
                visiblePriorityTasks.map((task) => (
                  <TaskPreview
                    key={task.id}
                    task={task}
                    assignee={task.assigned_to ? memberById.get(task.assigned_to) ?? null : null}
                  />
                ))
              )}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          {isManager && (
            <section className="team-panel p-5">
              <p className="team-kicker">Team status</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["active", "idle", "offline"] as PresenceState[]).map((state) => (
                  <div key={state} className={`rounded-xl px-3 py-3 text-center ${presenceClass(state)}`}>
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.12em]">{state}</p>
                    <strong className="mt-1 block text-2xl font-black">{presenceCounts[state]}</strong>
                  </div>
                ))}
              </div>
              <Link href="/team/admin" className="team-button-secondary mt-4 w-full">
                Admin command
              </Link>
            </section>
          )}

          <section className="team-panel p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="team-kicker">Recent messages</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-black">Chat pulse</h2>
              </div>
              <Link href="/team/chat" className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">
                Open
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {messagesResult.data.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-bold text-gray-500">
                  No recent direct messages.
                </p>
              ) : (
                messagesResult.data.map((message) => {
                  const author = memberById.get(message.sender_id) ?? null;
                  return (
                    <article key={message.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-black text-black">{displayMemberName(author)}</p>
                        <span className="text-xs font-bold text-gray-400">{formatTime(message.created_at)}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-gray-500">{message.body}</p>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <section className="team-panel p-5">
            <p className="team-kicker">Today</p>
            <div className="mt-4 space-y-3">
              {attendanceResult.data.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-bold text-gray-500">
                  No clock events yet today.
                </p>
              ) : (
                attendanceResult.data.slice(0, 5).map((entry) => {
                  const owner = memberById.get(entry.user_id) ?? null;
                  return (
                    <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">{displayMemberName(owner)}</p>
                        <p className="text-xs font-bold text-gray-500">
                          {formatTime(entry.clock_in)} - {entry.clock_out ? formatTime(entry.clock_out) : "Now"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase ${entry.clock_out ? "bg-gray-100 text-gray-700" : "bg-indigo-50 text-indigo-700"}`}>
                        {entry.clock_out ? "Done" : "Live"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </aside>
      </div>
    </TeamShell>
  );
}
