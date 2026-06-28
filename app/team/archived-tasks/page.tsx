import Link from "next/link";
import type { Metadata } from "next";
import Avatar from "../_components/Avatar";
import TeamShell from "../_components/TeamShell";
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
import { archiveTask, deleteTask } from "../actions";
import TaskTimer from "../tasks/TaskTimer";

export const metadata: Metadata = {
  title: "Archived Tasks | Anovic Team",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  task?: string;
  priority?: string;
  member?: string;
  q?: string;
}>;

const priorities: TeamTask["priority"][] = ["low", "normal", "high", "urgent"];
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

function taskMessage(value?: string) {
  if (value === "archived") return { tone: "success", text: "Task moved to archive." };
  if (value === "restored") return { tone: "success", text: "Task restored from archive." };
  if (value === "deleted") return { tone: "success", text: "Archived task deleted." };
  if (value === "archive-not-allowed") return { tone: "error", text: "Only admins can restore archived tasks." };
  if (value === "archive-failed") {
    return { tone: "error", text: "Archive update failed. Run supabase/team-complete.sql and try again." };
  }
  if (value === "delete-not-allowed") return { tone: "error", text: "Only completed tasks can be deleted." };
  if (value === "delete-failed") {
    return { tone: "error", text: "Task delete failed. Run supabase/team-complete.sql and try again." };
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function daysSince(value: string | null | undefined) {
  if (!value) return "Unknown age";

  const diff = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));

  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function isOverdue(task: TeamTask, today: string) {
  return Boolean(task.due_date && task.due_date < today);
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

function RestoreButton({ taskId, canRestore }: { taskId: string; canRestore: boolean }) {
  if (!canRestore) return null;

  return (
    <form action={archiveTask}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="mode" value="restore" />
      <button
        type="submit"
        className="rounded-lg bg-indigo-700 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-white transition hover:bg-indigo-800"
      >
        Restore
      </button>
    </form>
  );
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
      <input type="hidden" name="from" value="archive" />
      <button
        type="submit"
        className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-black transition hover:bg-yellow-100"
      >
        Delete
      </button>
    </form>
  );
}

function ArchivedTaskRow({
  task,
  assignee,
  canRestore,
  canDelete,
  today,
  timer,
}: {
  task: TeamTask;
  assignee: TeamMember | null;
  canRestore: boolean;
  canDelete: boolean;
  today: string;
  timer: TimerState;
}) {
  const assigneeName = displayMemberName(assignee);
  const late = isOverdue(task, today);

  return (
    <article className="grid gap-4 border-t border-gray-200 bg-white px-4 py-4 lg:grid-cols-[minmax(0,1fr)_13rem_13rem_8rem] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-black text-black">{task.title}</h3>
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[0.68rem] font-black uppercase text-gray-700">
            {statusLabel(task.status)}
          </span>
          {late && (
            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[0.65rem] font-black uppercase text-black">
              Was late
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-bold leading-6 text-gray-500">
          {task.description || "No brief added."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase ${priorityTone[task.priority]}`}>
            {task.priority}
          </span>
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[0.68rem] font-black uppercase text-gray-700">
            Due {formatDate(task.due_date)}
          </span>
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[0.68rem] font-black uppercase text-gray-700">
            Completed {formatDateTime(task.completed_at)}
          </span>
          <TaskTimer
            startedAt={task.started_at}
            completedAt={task.completed_at}
            baseSeconds={timer.baseSeconds}
            runningStartedAt={timer.runningStartedAt}
          />
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={assigneeName} src={assignee?.avatar_url} size={38} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-black">{assigneeName}</p>
          <p className="truncate text-xs font-bold text-gray-500">
            {assignee?.job_title || assignee?.department || "Team member"}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">Archived</p>
        <p className="mt-1 text-sm font-black text-black">{formatDateTime(task.archived_at)}</p>
        <p className="mt-1 text-xs font-bold text-gray-500">{daysSince(task.archived_at)}</p>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <RestoreButton taskId={task.id} canRestore={canRestore} />
        <DeleteTaskButton task={task} canDelete={canDelete} />
      </div>
    </article>
  );
}

export default async function ArchivedTasksPage({
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
  const now = new Date();
  const archiveCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  let autoArchiveSetupMissing = false;
  let autoArchiveQuery = supabase
    .from("team_tasks")
    .update({ archived_at: now.toISOString(), archived_by: user.id })
    .eq("status", "done")
    .is("archived_at", null)
    .lt("completed_at", archiveCutoff);

  if (!isManager) {
    autoArchiveQuery = autoArchiveQuery.eq("assigned_to", user.id);
  }

  const { error: autoArchiveError } = await autoArchiveQuery;
  if (autoArchiveError) {
    if (isMissingTableError(autoArchiveError.message)) {
      autoArchiveSetupMissing = true;
    } else {
      console.error("Automatic task archive failed", autoArchiveError);
    }
  }

  let tasksQuery = supabase
    .from("team_tasks")
    .select("id,title,description,status,priority,due_date,estimated_minutes,assigned_to,created_by,created_at,started_at,completed_at,archived_at,archived_by")
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  if (!isManager) {
    tasksQuery = tasksQuery.eq("assigned_to", user.id);
  }

  const tasksResult = await safeList<TeamTask>(tasksQuery);
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
  const priorityFilter = cleanFilter<TeamTask["priority"]>(params.priority, priorities);
  const memberFilter = isManager && params.member ? params.member : "all";
  const queryFilter = String(params.q || "").trim().toLowerCase();
  const tasks = tasksResult.data.map((task) => ({
    ...task,
    status: task.status === "done" ? "done" : "in_progress",
  })) satisfies TeamTask[];
  const visibleTasks = tasks
    .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
    .filter((task) => memberFilter === "all" || task.assigned_to === memberFilter)
    .filter((task) => {
      if (!queryFilter) return true;

      const assignee = task.assigned_to ? memberById.get(task.assigned_to) ?? null : null;
      return [task.title, task.description, task.priority, displayMemberName(assignee)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(queryFilter);
    });
  const message = taskMessage(params.task);
  const completedArchived = tasks.filter((task) => task.status === "done").length;
  const urgentArchived = tasks.filter((task) => task.priority === "urgent").length;
  const lateArchived = tasks.filter((task) => isOverdue(task, today)).length;

  return (
    <TeamShell active="archived-tasks" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Archive</p>
          <h1 className="team-title">Archived tasks</h1>
          <p className="team-subtitle">
            Completed tasks move here automatically 24 hours after completion, keeping active work clean.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:w-[31rem]">
          <div className="team-stat bg-indigo-700 text-white">
            <p className="team-kicker text-gray-300">Archived</p>
            <strong className="team-stat-value">{tasks.length}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">Completed</p>
            <strong className="team-stat-value">{completedArchived}</strong>
          </div>
          <div className="team-stat border-yellow-300 bg-yellow-50">
            <p className="team-kicker text-black">Late</p>
            <strong className="team-stat-value">{lateArchived + urgentArchived}</strong>
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

      <section className="team-panel overflow-hidden">
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="team-kicker">Stored work</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-black">
                {visibleTasks.length} archived task{visibleTasks.length === 1 ? "" : "s"}
              </h2>
            </div>
            <Link href="/team/tasks" className="team-button-secondary min-h-10 px-4 text-xs">
              Active tasks
            </Link>
          </div>

          <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="block xl:col-span-2">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">Search</span>
              <input name="q" defaultValue={params.q || ""} className="team-field mt-2" placeholder="Task, brief, owner..." />
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
              <label className="block xl:col-span-1">
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
            <button type="submit" className={isManager ? "team-button" : "team-button md:col-span-1 xl:col-span-2"}>
              Apply
            </button>
          </form>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-gray-500">No archived tasks</p>
            <p className="mt-2 text-sm font-bold text-gray-500">
              Completed tasks will appear here automatically after 24 hours.
            </p>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <ArchivedTaskRow
              key={task.id}
              task={task}
              assignee={task.assigned_to ? memberById.get(task.assigned_to) ?? null : null}
              canRestore={isManager}
              canDelete={task.status === "done" && (isManager || task.assigned_to === user.id)}
              today={today}
              timer={timerByTaskId.get(task.id) || { baseSeconds: 0, runningStartedAt: null }}
            />
          ))
        )}
      </section>
    </TeamShell>
  );
}
