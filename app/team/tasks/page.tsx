import Link from "next/link";
import type { Metadata } from "next";
import { Archive as ArchiveIcon, Check, LayoutGrid, List, Play, RotateCcw, Search, Trash2 } from "lucide-react";
import Avatar from "../_components/Avatar";
import TeamEmptyState from "../_components/TeamEmptyState";
import TeamShell from "../_components/TeamShell";
import TeamSubmitButton from "../_components/TeamSubmitButton";
import {
  canManageTeam,
  displayMemberName,
  formatDate,
  isMissingTableError,
  requireTeamSession,
  safeList,
  safeSingle,
  setupNotice,
  statusLabel,
  type TaskTimeEntry,
  type TeamMember,
  type TeamTask,
} from "../_lib/data";
import { archiveTask, createAssignedTask, deleteTask, updateTaskStatus } from "../actions";
import TaskTimer from "./TaskTimer";

export const metadata: Metadata = {
  title: "Tasks | Anovic Team",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  task?: string;
  status?: string;
  priority?: string;
  member?: string;
  q?: string;
  scope?: string;
  quick?: string;
  layout?: string;
}>;

const taskStatuses: TeamTask["status"][] = ["in_progress", "done"];
const priorities: TeamTask["priority"][] = ["low", "normal", "high", "urgent"];
const scopes = ["active", "mine", "all"] as const;
const quickFilters = ["all", "urgent", "today", "overdue", "completed"] as const;
const layouts = ["board", "list"] as const;
type TaskScope = (typeof scopes)[number];
type QuickFilter = (typeof quickFilters)[number];
type TaskLayout = (typeof layouts)[number];
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

const statusTone: Record<TeamTask["status"], string> = {
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-950",
  done: "border-gray-200 bg-white text-gray-600",
};

function taskMessage(value?: string) {
  if (value === "created") return { tone: "success", text: "Task assigned." };
  if (value === "updated") return { tone: "success", text: "Task status updated." };
  if (value === "archived") return { tone: "success", text: "Task moved to archive." };
  if (value === "restored") return { tone: "success", text: "Task restored to active work." };
  if (value === "deleted") return { tone: "success", text: "Completed task deleted." };
  if (value === "not-allowed") return { tone: "error", text: "Only admins can assign tasks." };
  if (value === "missing") return { tone: "error", text: "Add the required task details." };
  if (value === "archive-not-allowed") {
    return {
      tone: "error",
      text: "You can only archive your completed tasks. Admins can archive or restore any task.",
    };
  }
  if (value === "archive-failed") {
    return { tone: "error", text: "Task archive update failed. Run supabase/team-complete.sql and try again." };
  }
  if (value === "delete-not-allowed") {
    return { tone: "error", text: "Only completed tasks can be deleted." };
  }
  if (value === "delete-failed") {
    return { tone: "error", text: "Task delete failed. Run supabase/team-complete.sql and try again." };
  }
  if (value === "save-failed") {
    return { tone: "error", text: "Task save failed. Run supabase/team-complete.sql and try again." };
  }
  if (value === "task-function-missing") {
    return {
      tone: "error",
      text: "The task assignment function is missing in Supabase. Run supabase/team-complete.sql, then try again.",
    };
  }
  if (value === "task-permission") {
    return {
      tone: "error",
      text: "Supabase blocked task assignment. Run supabase/team-complete.sql to refresh owner role and task policies.",
    };
  }
  if (value === "update-failed") {
    return { tone: "error", text: "Task update failed. Check task permissions in Supabase." };
  }
  return null;
}

function cleanFilter<T extends string>(value: string | undefined, allowed: readonly T[]) {
  return allowed.includes(value as T) ? (value as T) : "all";
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isArchived(task: TeamTask) {
  return Boolean(task.archived_at);
}

function isOpen(task: TeamTask) {
  return task.status !== "done";
}

function isOverdue(task: TeamTask, today: string) {
  return Boolean(task.due_date && task.due_date < today && isOpen(task) && !isArchived(task));
}

function isDueToday(task: TeamTask, today: string) {
  return Boolean(task.due_date === today && isOpen(task) && !isArchived(task));
}

function dueTone(task: TeamTask, today: string) {
  if (isOverdue(task, today)) return "border-yellow-300 bg-yellow-50 text-black";
  if (isDueToday(task, today)) return "border-yellow-300 bg-yellow-50 text-black";
  return "border-gray-200 bg-white text-gray-700";
}

function taskSortScore(task: TeamTask, today: string) {
  const priorityScore = { urgent: 0, high: 1, normal: 2, low: 3 }[task.priority];
  const statusScore = { in_progress: 1, done: 5 }[task.status];
  const overdueScore = isOverdue(task, today) ? -20 : 0;
  const todayScore = isDueToday(task, today) ? -10 : 0;
  const dueScore = task.due_date ? 0 : 5;

  return overdueScore + todayScore + dueScore + statusScore + priorityScore / 10;
}

function taskMatchesQuickFilter(task: TeamTask, quick: QuickFilter, today: string) {
  if (quick === "all") return true;
  if (quick === "urgent") return task.priority === "urgent";
  if (quick === "today") return isDueToday(task, today);
  if (quick === "overdue") return isOverdue(task, today);
  return task.status === "done";
}

function statusAction(task: TeamTask) {
  return task.status === "done"
    ? ({ status: "in_progress", label: "Reopen" } as const)
    : task.started_at
      ? ({ status: "done", label: "Complete" } as const)
      : ({ status: "in_progress", label: "Start" } as const);
}

function formatEstimate(minutes: number | null | undefined) {
  if (!minutes) return "No estimate";
  if (minutes < 60) return `${minutes}m est.`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours}h ${rest}m est.` : `${hours}h est.`;
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

function taskElapsedSeconds(timer: TimerState) {
  if (!timer.runningStartedAt) return timer.baseSeconds;
  return timer.baseSeconds + Math.max(0, Math.floor((Date.now() - new Date(timer.runningStartedAt).getTime()) / 1000));
}

function StatusButton({ taskId, status, label }: { taskId: string; status: TeamTask["status"]; label: string }) {
  const Icon = label === "Complete" ? Check : label === "Reopen" ? RotateCcw : Play;
  return (
    <form action={updateTaskStatus}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={status} />
      <TeamSubmitButton className="inline-flex min-h-9 items-center rounded-md bg-indigo-700 px-3 text-xs font-black text-white transition hover:bg-indigo-800" pendingLabel="Updating">
        <Icon aria-hidden="true" size={14} className="mr-1.5" />{label}
      </TeamSubmitButton>
    </form>
  );
}

function ArchiveButton({ task, canArchive }: { task: TeamTask; canArchive: boolean }) {
  if (!canArchive) return null;

  return (
    <form action={archiveTask}>
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="mode" value="archive" />
      <TeamSubmitButton className="inline-flex min-h-9 items-center rounded-md border border-gray-200 bg-white px-3 text-xs font-black text-gray-900 transition hover:bg-gray-50" pendingLabel="Archiving">
        <ArchiveIcon aria-hidden="true" size={14} className="mr-1.5" />Archive
      </TeamSubmitButton>
    </form>
  );
}

function canArchiveTask(task: TeamTask, isManager: boolean, userId: string) {
  if (isManager) return true;
  return task.assigned_to === userId && task.status === "done";
}

function canDeleteTask(task: TeamTask, isManager: boolean, userId: string) {
  if (task.status !== "done") return false;
  return isManager || task.assigned_to === userId;
}

function DeleteTaskButton({
  task,
  canDelete,
}: {
  task: TeamTask;
  canDelete: boolean;
}) {
  if (!canDelete) return null;

  return (
    <form action={deleteTask}>
      <input type="hidden" name="taskId" value={task.id} />
      <TeamSubmitButton className="inline-flex min-h-9 items-center rounded-md border border-yellow-300 bg-yellow-50 px-3 text-xs font-black text-black transition hover:bg-yellow-100" pendingLabel="Deleting" confirmLabel="Confirm delete">
        <Trash2 aria-hidden="true" size={14} className="mr-1.5" />Delete
      </TeamSubmitButton>
    </form>
  );
}

function TaskCard({
  task,
  assignee,
  today,
  isManager,
  userId,
  timer,
}: {
  task: TeamTask;
  assignee: TeamMember | null;
  today: string;
  isManager: boolean;
  userId: string;
  timer: TimerState;
}) {
  const assigneeName = displayMemberName(assignee);
  const action = statusAction(task);
  const attention = task.priority === "urgent" || isDueToday(task, today) || isOverdue(task, today);
  const statusText = task.status === "in_progress" && !task.started_at ? "Ready" : statusLabel(task.status);
  const elapsedSeconds = taskElapsedSeconds(timer);
  const estimateSeconds = (task.estimated_minutes || 0) * 60;
  const estimateUsed = estimateSeconds > 0 ? Math.round((elapsedSeconds / estimateSeconds) * 100) : 0;

  return (
    <article className={`rounded-lg border p-4 transition hover:border-indigo-200 hover:shadow-[0_10px_28px_rgba(17,24,39,0.06)] ${attention ? "border-yellow-300 bg-yellow-50/55" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-black leading-6 text-black">{task.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase ${statusTone[task.status]}`}>
          {statusText}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase ${priorityTone[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase ${dueTone(task, today)}`}>
          {formatDate(task.due_date)}
        </span>
        <TaskTimer
          startedAt={task.started_at}
          completedAt={task.completed_at}
          baseSeconds={timer.baseSeconds}
          runningStartedAt={timer.runningStartedAt}
        />
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[0.68rem] font-black uppercase text-gray-700">
          {formatEstimate(task.estimated_minutes)}
        </span>
      </div>

      {estimateSeconds > 0 && <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500"><span>Estimate used</span><span>{estimateUsed}%</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${estimateUsed > 100 ? "bg-yellow-400" : "bg-indigo-600"}`} style={{ width: `${Math.min(100, estimateUsed)}%` }} /></div>
      </div>}

      <details className="mt-4 rounded-md border border-gray-200 bg-white/80 px-3 py-2">
        <summary className="cursor-pointer text-xs font-black text-indigo-700">Task details</summary>
        <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-gray-600">{task.description || "No brief added."}</p>
      </details>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={assigneeName} src={assignee?.avatar_url} size={34} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-black">{assigneeName}</p>
            <p className="truncate text-xs font-bold text-gray-500">
              {assignee?.job_title || assignee?.department || "Team member"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <StatusButton taskId={task.id} status={action.status} label={action.label} />
          <ArchiveButton task={task} canArchive={canArchiveTask(task, isManager, userId)} />
          <DeleteTaskButton task={task} canDelete={canDeleteTask(task, isManager, userId)} />
        </div>
      </div>
    </article>
  );
}

function TaskRow({
  task,
  assignee,
  today,
  isManager,
  userId,
  timer,
}: {
  task: TeamTask;
  assignee: TeamMember | null;
  today: string;
  isManager: boolean;
  userId: string;
  timer: TimerState;
}) {
  const assigneeName = displayMemberName(assignee);
  const action = statusAction(task);
  const statusText = task.status === "in_progress" && !task.started_at ? "Ready" : statusLabel(task.status);

  return (
    <article className="grid gap-4 border-t border-gray-200 bg-white px-4 py-4 lg:grid-cols-[minmax(0,1fr)_13rem_10rem_14rem] lg:items-center">
      <div className="min-w-0">
        <h3 className="truncate text-base font-black text-black">{task.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-gray-500">
          {task.description || "No brief added."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase ${statusTone[task.status]}`}>
            {statusText}
          </span>
          <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase ${priorityTone[task.priority]}`}>
            {task.priority}
          </span>
          <span className={`rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase ${dueTone(task, today)}`}>
            {formatDate(task.due_date)}
          </span>
          <TaskTimer
            startedAt={task.started_at}
            completedAt={task.completed_at}
            baseSeconds={timer.baseSeconds}
            runningStartedAt={timer.runningStartedAt}
          />
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[0.68rem] font-black uppercase text-gray-700">
            {formatEstimate(task.estimated_minutes)}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={assigneeName} src={assignee?.avatar_url} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-black">{assigneeName}</p>
          <p className="truncate text-xs font-bold text-gray-500">
            {assignee?.job_title || assignee?.department || "Team member"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">Progress</p>
        <p className="mt-1 text-sm font-black text-black">{statusText}</p>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <StatusButton taskId={task.id} status={action.status} label={action.label} />
        <ArchiveButton task={task} canArchive={canArchiveTask(task, isManager, userId)} />
        <DeleteTaskButton task={task} canDelete={canDeleteTask(task, isManager, userId)} />
      </div>
    </article>
  );
}

function QuickFilterLink({
  label,
  value,
  active,
  count,
}: {
  label: string;
  value: QuickFilter;
  active: boolean;
  count: number;
}) {
  return (
    <Link
      href={value === "all" ? "/team/tasks" : `/team/tasks?quick=${value}`}
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition ${
        active ? "border-indigo-300 bg-indigo-50 text-indigo-950" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="text-xs font-black">{label}</span>
      <strong className={`rounded-md px-2 py-1 text-xs font-black ${active ? "bg-indigo-700 text-white" : "bg-gray-100 text-gray-700"}`}>{count}</strong>
    </Link>
  );
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession();
  const [memberResult, membersResult] = await Promise.all([
    safeSingle<TeamMember>(
      supabase
        .from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
        .eq("id", user.id)
        .maybeSingle(),
    ),
    safeList<TeamMember>(
      supabase
        .from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
        .eq("is_active", true)
        .order("full_name", { ascending: true }),
    ),
  ]);

  const isManager = canManageTeam(memberResult.data, user.email);
  const today = localDateKey();
  const message = taskMessage(params.task);

  let autoArchiveSetupMissing = false;
  if (!memberResult.setupMissing) {
    const now = new Date();
    const archiveCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    let autoArchiveQuery = supabase
      .from("team_tasks")
      .update({ archived_at: now.toISOString(), archived_by: user.id })
      .eq("status", "done")
      .is("archived_at", null)
      .lt("completed_at", archiveCutoff);

    if (!isManager) {
      autoArchiveQuery = autoArchiveQuery.eq("assigned_to", user.id);
    }

    const { error } = await autoArchiveQuery;
    if (error) {
      if (isMissingTableError(error.message)) {
        autoArchiveSetupMissing = true;
      } else {
        console.error("Automatic task archive failed", error);
      }
    }
  }

  const tasksResult = await safeList<TeamTask>(
    supabase
      .from("team_tasks")
      .select("id,title,description,status,priority,due_date,estimated_minutes,assigned_to,created_by,created_at,started_at,completed_at,archived_at,archived_by")
      .order("created_at", { ascending: false }),
  );
  const taskTimeResult = await safeList<TaskTimeEntry>(
    (isManager
      ? supabase.from("task_time_entries").select("id,task_id,user_id,started_at,ended_at,duration_seconds")
      : supabase
          .from("task_time_entries")
          .select("id,task_id,user_id,started_at,ended_at,duration_seconds")
          .eq("user_id", user.id)
    ).order("started_at", { ascending: true }),
  );
  const setupMissing = memberResult.setupMissing || membersResult.setupMissing || tasksResult.setupMissing || taskTimeResult.setupMissing || autoArchiveSetupMissing;
  const memberById = new Map(membersResult.data.map((member) => [member.id, member]));
  const timerByTaskId = buildTimerMap(taskTimeResult.data);
  const statusFilter = cleanFilter<TeamTask["status"]>(params.status, taskStatuses);
  const priorityFilter = cleanFilter<TeamTask["priority"]>(params.priority, priorities);
  const scopeFilter = cleanFilter<TaskScope>(params.scope, scopes) as TaskScope;
  const quickFilter = cleanFilter<QuickFilter>(params.quick, quickFilters) as QuickFilter;
  const layout = cleanFilter<TaskLayout>(params.layout, layouts) as TaskLayout;
  const memberFilter = isManager && params.member ? params.member : "all";
  const queryFilter = String(params.q || "").trim().toLowerCase();
  const tasks = tasksResult.data.map((task) => ({
    ...task,
    status: task.status === "done" ? "done" : "in_progress",
  })) satisfies TeamTask[];
  const activeTasks = tasks.filter((task) => !isArchived(task));
  const baseTasks =
    scopeFilter === "mine"
        ? activeTasks.filter((task) => task.assigned_to === user.id)
        : activeTasks;
  const visibleTasks = baseTasks
    .filter((task) => statusFilter === "all" || task.status === statusFilter)
    .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
    .filter((task) => memberFilter === "all" || task.assigned_to === memberFilter)
    .filter((task) => taskMatchesQuickFilter(task, quickFilter, today))
    .filter((task) => {
      if (!queryFilter) return true;

      const assignee = task.assigned_to ? memberById.get(task.assigned_to) ?? null : null;
      return [task.title, task.description, task.priority, statusLabel(task.status), displayMemberName(assignee)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(queryFilter);
    })
    .sort((left, right) => taskSortScore(left, today) - taskSortScore(right, today));

  const openTasks = activeTasks.filter(isOpen);
  const myOpenTasks = openTasks.filter((task) => task.assigned_to === user.id);
  const completedTasks = activeTasks.filter((task) => task.status === "done");
  const urgentTasks = openTasks.filter((task) => task.priority === "urgent");
  const dueTodayTasks = openTasks.filter((task) => isDueToday(task, today));
  const overdueTasks = openTasks.filter((task) => isOverdue(task, today));
  const attentionTasks = [...new Set([...urgentTasks, ...dueTodayTasks, ...overdueTasks])];
  const inProgressVisible = visibleTasks.filter((task) => task.status === "in_progress");
  const completedVisible = visibleTasks.filter((task) => task.status === "done");
  const nextTask = [...myOpenTasks].sort((left, right) => taskSortScore(left, today) - taskSortScore(right, today))[0] ?? null;
  const workload = membersResult.data
    .map((member) => {
      const assigned = openTasks.filter((task) => task.assigned_to === member.id);
      return {
        member,
        open: assigned.length,
        attention: assigned.filter((task) => task.priority === "urgent" || isOverdue(task, today) || isDueToday(task, today)).length,
      };
    })
    .filter((row) => row.open > 0 || row.attention > 0)
    .sort((left, right) => right.attention - left.attention || right.open - left.open)
    .slice(0, 6);

  return (
    <TeamShell active="tasks" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Tasks</p>
          <h1 className="team-title">{isManager ? "Task command center" : "My task queue"}</h1>
          <p className="team-subtitle">
            {isManager
              ? "Assign, triage, close, archive, and delete completed work from one focused board."
              : "Work from a clear queue, update progress quickly, and keep completed work out of the way."}
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
            <p className="team-kicker">Mine</p>
            <strong className="team-stat-value">{myOpenTasks.length}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">Completed</p>
            <strong className="team-stat-value">{completedTasks.length}</strong>
          </div>
        </div>
      </div>

      {setupMissing && <div className="mb-6">{setupNotice()}</div>}

      {message && (
        <p
          className={`mb-6 rounded-xl border-2 px-5 py-4 text-sm font-black ${
            message.tone === "success"
              ? "border-gray-200 bg-white text-gray-800"
              : "border-yellow-300 bg-yellow-50 text-black"
          }`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          {isManager ? (
            <section className="team-panel p-5">
              <p className="team-kicker">New task</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-black">Assign work</h2>
              <form action={createAssignedTask} className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-black text-black">Title</span>
                  <input name="title" required className="team-field mt-2" placeholder="What needs to be done?" />
                </label>
                <label className="block">
                  <span className="text-sm font-black text-black">Owner</span>
                  <select name="assignedTo" required className="team-field mt-2">
                    <option value="">Choose teammate</option>
                    {membersResult.data.map((member) => (
                      <option key={member.id} value={member.id}>
                        {displayMemberName(member)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="block">
                    <span className="text-sm font-black text-black">Due</span>
                    <input name="dueDate" type="date" className="team-field mt-2" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-black">Priority</span>
                    <select name="priority" defaultValue="normal" className="team-field mt-2">
                      {priorities.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-black text-black">Estimate</span>
                    <input name="estimatedMinutes" type="number" min="0" step="5" className="team-field mt-2" placeholder="Minutes" />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-black text-black">Brief</span>
                  <textarea
                    name="description"
                    rows={4}
                    className="mt-2 w-full resize-none rounded-[0.65rem] border border-gray-200 bg-white px-4 py-3 text-sm font-bold leading-6 outline-none transition focus:border-indigo-600 focus:shadow-[0_0_0_4px_rgba(199,210,254,0.75)]"
                    placeholder="Outcome, links, context, or definition of done."
                  />
                </label>
                <input type="hidden" name="status" value="in_progress" />
                <TeamSubmitButton disabled={setupMissing} className="team-button w-full" pendingLabel="Assigning...">Assign task</TeamSubmitButton>
              </form>
            </section>
          ) : (
            <section className="team-panel p-5">
              <p className="team-kicker">Focus</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-black">
                {nextTask ? nextTask.title : "Queue clear"}
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-gray-500">
                {nextTask
                  ? nextTask.description || "This is your highest-priority open task."
                  : "You have no open tasks assigned right now."}
              </p>
              {nextTask && (
                <div className="mt-4">
                  <StatusButton
                    taskId={nextTask.id}
                    status={statusAction(nextTask).status}
                    label={statusAction(nextTask).label}
                  />
                </div>
              )}
            </section>
          )}

          {isManager && workload.length > 0 && (
            <section className="team-panel p-5">
              <p className="team-kicker">Workload</p>
              <div className="mt-4 space-y-3">
                {workload.map(({ member, open, attention }) => {
                  const name = displayMemberName(member);
                  return (
                    <Link
                      key={member.id}
                      href={`/team/tasks?member=${member.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={name} src={member.avatar_url} size={36} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-black">{name}</p>
                          <p className="text-xs font-bold text-gray-500">{open} open</p>
                        </div>
                      </div>
                      <span className={attention ? "rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-black text-black" : "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-black text-gray-700"}>
                        {attention}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </aside>

        <section className="space-y-5">
          <div className="grid gap-3 md:grid-cols-5">
            <QuickFilterLink label="All active" value="all" active={quickFilter === "all"} count={openTasks.length} />
            <QuickFilterLink label="Urgent" value="urgent" active={quickFilter === "urgent"} count={urgentTasks.length} />
            <QuickFilterLink label="Due today" value="today" active={quickFilter === "today"} count={dueTodayTasks.length} />
            <QuickFilterLink label="Overdue" value="overdue" active={quickFilter === "overdue"} count={overdueTasks.length} />
            <QuickFilterLink label="Completed" value="completed" active={quickFilter === "completed"} count={completedTasks.length} />
          </div>

          <section className="team-panel overflow-hidden">
            <div className="border-b border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="team-kicker">Task workspace</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-black">
                    {visibleTasks.length} task{visibleTasks.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/team/tasks?layout=board" className={layout === "board" ? "team-button min-h-10 px-4 text-xs" : "team-button-secondary min-h-10 px-4 text-xs"}>
                    <LayoutGrid aria-hidden="true" size={15} className="mr-2" />Board
                  </Link>
                  <Link href="/team/tasks?layout=list" className={layout === "list" ? "team-button min-h-10 px-4 text-xs" : "team-button-secondary min-h-10 px-4 text-xs"}>
                    <List aria-hidden="true" size={15} className="mr-2" />List
                  </Link>
                  <Link href="/team/archived-tasks" className="team-button-secondary min-h-10 px-4 text-xs">
                    <ArchiveIcon aria-hidden="true" size={15} className="mr-2" />Archive
                  </Link>
                </div>
              </div>

              <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <label className="block xl:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">Search</span>
                  <input name="q" defaultValue={params.q || ""} className="team-field mt-2" placeholder="Task, brief, owner..." />
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">Scope</span>
                  <select name="scope" defaultValue={scopeFilter} className="team-field mt-2">
                    {scopes.map((scope) => (
                      <option key={scope} value={scope}>
                        {scope}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">Status</span>
                  <select name="status" defaultValue={statusFilter} className="team-field mt-2">
                    <option value="all">All</option>
                    {taskStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">Priority</span>
                  <select name="priority" defaultValue={priorityFilter} className="team-field mt-2">
                    <option value="all">All</option>
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
                {isManager && (
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">Owner</span>
                    <select name="member" defaultValue={memberFilter} className="team-field mt-2">
                      <option value="all">Everyone</option>
                      {membersResult.data.map((member) => (
                        <option key={member.id} value={member.id}>
                          {displayMemberName(member)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <input type="hidden" name="layout" value={layout} />
                <input type="hidden" name="quick" value={quickFilter} />
                <TeamSubmitButton className={isManager ? "team-button xl:col-span-6" : "team-button md:col-span-2 xl:col-span-6"} pendingLabel="Filtering..."><Search aria-hidden="true" size={15} className="mr-2" />Apply filters</TeamSubmitButton>
              </form>
            </div>

            {visibleTasks.length === 0 ? (
              <TeamEmptyState title="No tasks found" description="Try a different filter or create a new task." href="/team/tasks" action="Clear filters" />
            ) : layout === "list" ? (
              visibleTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  assignee={task.assigned_to ? memberById.get(task.assigned_to) ?? null : null}
                  today={today}
                  isManager={isManager}
                  userId={user.id}
                  timer={timerByTaskId.get(task.id) || { baseSeconds: 0, runningStartedAt: null }}
                />
              ))
            ) : (
              <div className="grid gap-4 p-4 xl:grid-cols-2">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.12em] text-gray-500">In progress</h3>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-800">{inProgressVisible.length}</span>
                  </div>
                  <div className="space-y-3">
                    {inProgressVisible.length === 0 ? (
                      <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-bold text-gray-500">No active tasks in this view.</p>
                    ) : (
                      inProgressVisible.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          assignee={task.assigned_to ? memberById.get(task.assigned_to) ?? null : null}
                          today={today}
                          isManager={isManager}
                          userId={user.id}
                          timer={timerByTaskId.get(task.id) || { baseSeconds: 0, runningStartedAt: null }}
                        />
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.12em] text-gray-500">Completed</h3>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">{completedVisible.length}</span>
                  </div>
                  <div className="space-y-3">
                    {completedVisible.length === 0 ? (
                      <p className="rounded-xl border border-gray-200 bg-white p-4 text-sm font-bold text-gray-500">Completed tasks will stay here for 24 hours before archive.</p>
                    ) : (
                      completedVisible.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          assignee={task.assigned_to ? memberById.get(task.assigned_to) ?? null : null}
                          today={today}
                          isManager={isManager}
                          userId={user.id}
                          timer={timerByTaskId.get(task.id) || { baseSeconds: 0, runningStartedAt: null }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </TeamShell>
  );
}
