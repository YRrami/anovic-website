import Link from "next/link";
import type { Metadata } from "next";
import { LogIn, LogOut } from "lucide-react";
import Avatar from "../_components/Avatar";
import TeamShell from "../_components/TeamShell";
import TeamSubmitButton from "../_components/TeamSubmitButton";
import {
  canManageTeam,
  displayMemberName,
  formatTime,
  requireTeamSession,
  safeList,
  safeSingle,
  setupNotice,
  type AttendanceEntry,
  type StatusTimeEntry,
  type TeamMember,
} from "../_lib/data";
import { adminClockOutMember, clockIn, clockOut, updateMemberStatus } from "../actions";
import LiveDuration from "./LiveDuration";

export const metadata: Metadata = {
  title: "Attendance | Anovic Team",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ attendance?: string }>;
type PresenceState = "online" | "break" | "lunch" | "away" | "offline";

const statusOrder: PresenceState[] = ["online", "break", "lunch", "away", "offline"];

function attendanceMessage(value?: string) {
  if (value === "clocked-in") return "Clock in recorded.";
  if (value === "clocked-out") return "Clock out recorded.";
  if (value === "member-clocked-out") return "Team member clocked out.";
  if (value === "clock-in-first") return "Clock in before changing to Online, Break, or Lunch.";
  if (value === "already-clocked-out") return "That team member is already clocked out.";
  if (value === "not-allowed") return "Only admins can clock out team members.";
  if (value === "clock-out-failed") return "Clock out failed. Check attendance permissions.";
  if (value === "member-not-found") return "That team member could not be found.";
  if (value === "missing-member") return "Choose a team member first.";
  return null;
}

function presenceFor(member: TeamMember, entry: AttendanceEntry | undefined): PresenceState {
  if (!entry) return "offline";
  return member.status;
}

function statusClasses(state: PresenceState) {
  if (state === "online") return "bg-indigo-50 text-indigo-800";
  if (state === "break" || state === "lunch") return "bg-yellow-50 text-black";
  if (state === "away") return "bg-gray-100 text-gray-700";
  return "bg-gray-900 text-white";
}

function statusDot(state: PresenceState) {
  if (state === "online") return "bg-indigo-500";
  if (state === "break" || state === "lunch") return "bg-yellow-300";
  if (state === "away") return "bg-gray-400";
  return "bg-gray-900";
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours <= 0) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function sessionSeconds(entry: AttendanceEntry, nowMs: number) {
  const start = new Date(entry.clock_in).getTime();
  const end = entry.clock_out ? new Date(entry.clock_out).getTime() : nowMs;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function statusEntrySeconds(entry: StatusTimeEntry, dayStartMs: number, nowMs: number) {
  const start = Math.max(new Date(entry.started_at).getTime(), dayStartMs);
  const end = entry.ended_at ? Math.min(new Date(entry.ended_at).getTime(), nowMs) : nowMs;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function buildStatusTotals(entries: StatusTimeEntry[], dayStartMs: number, nowMs: number) {
  const totals = new Map<string, Record<PresenceState, number>>();

  for (const entry of entries) {
    const current = totals.get(entry.user_id) || {
      online: 0,
      break: 0,
      lunch: 0,
      away: 0,
      offline: 0,
    };

    current[entry.status] += statusEntrySeconds(entry, dayStartMs, nowMs);
    totals.set(entry.user_id, current);
  }

  return totals;
}

function formatDateTime(value: string | null) {
  if (!value) return "Now";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function memberTodaySeconds(memberId: string, entries: AttendanceEntry[], nowMs: number) {
  return entries
    .filter((entry) => entry.user_id === memberId)
    .reduce((total, entry) => total + sessionSeconds(entry, nowMs), 0);
}

function StatusButton({
  status,
  active,
}: {
  status: Exclude<PresenceState, "offline">;
  active: boolean;
}) {
  return (
    <form action={updateMemberStatus}>
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="returnTo" value="/team/attendance" />
      <TeamSubmitButton
        className={`min-h-10 rounded-md border px-3 text-xs font-black capitalize transition ${
          active
            ? "border-indigo-700 bg-indigo-700 text-white"
            : status === "break" || status === "lunch"
              ? "border-yellow-300 bg-yellow-50 text-black hover:bg-yellow-100"
              : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
        }`}
        pendingLabel="Updating"
      >{status}</TeamSubmitButton>
    </form>
  );
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayStart = dayStart.toISOString();
  const nowMs = new Date().getTime();
  const dayStartMs = dayStart.getTime();
  const memberResult = await safeSingle<TeamMember>(
    supabase
      .from("team_members")
      .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
      .eq("id", user.id)
      .maybeSingle(),
  );
  const isManager = canManageTeam(memberResult.data, user.email);
  const [membersResult, attendanceResult, openEntryResult, teamOpenEntriesResult, statusTimeResult] =
    await Promise.all([
      safeList<TeamMember>(
        supabase
          .from("team_members")
          .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
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
          .gte("clock_in", todayStart)
          .order("clock_in", { ascending: false }),
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
      safeList<StatusTimeEntry>(
        (isManager
          ? supabase.from("status_time_entries").select("id,user_id,task_id,status,started_at,ended_at,duration_seconds")
          : supabase
              .from("status_time_entries")
              .select("id,user_id,task_id,status,started_at,ended_at,duration_seconds")
              .eq("user_id", user.id)
        )
          .order("started_at", { ascending: false })
          .limit(500),
      ),
    ]);
  const openEntry = openEntryResult.data;
  const setupMissing =
    memberResult.setupMissing ||
    membersResult.setupMissing ||
    attendanceResult.setupMissing ||
    openEntryResult.setupMissing ||
    teamOpenEntriesResult.setupMissing ||
    statusTimeResult.setupMissing;
  const message = attendanceMessage(params.attendance);
  const memberById = new Map(membersResult.data.map((member) => [member.id, member]));
  const openEntryByMember = new Map<string, AttendanceEntry>();

  for (const entry of teamOpenEntriesResult.data) {
    if (!openEntryByMember.has(entry.user_id)) {
      openEntryByMember.set(entry.user_id, entry);
    }
  }

  const todayStatusEntries = statusTimeResult.data.filter((entry) => {
    const endedAt = entry.ended_at ? new Date(entry.ended_at).getTime() : nowMs;
    return endedAt >= dayStartMs;
  });
  const statusTotalsByMember = buildStatusTotals(todayStatusEntries, dayStartMs, nowMs);
  const myStatusTotals = statusTotalsByMember.get(user.id) || {
    online: 0,
    break: 0,
    lunch: 0,
    away: 0,
    offline: 0,
  };
  const openStatusByMember = new Map(
    statusTimeResult.data
      .filter((entry) => !entry.ended_at)
      .map((entry) => [entry.user_id, entry]),
  );
  const presenceCounts = membersResult.data.reduce(
    (counts, member) => {
      counts[presenceFor(member, openEntryByMember.get(member.id))] += 1;
      return counts;
    },
    { online: 0, break: 0, lunch: 0, away: 0, offline: 0 } as Record<PresenceState, number>,
  );
  const myTodaySeconds = memberTodaySeconds(user.id, attendanceResult.data, nowMs);
  const teamTodaySeconds = attendanceResult.data.reduce((total, entry) => total + sessionSeconds(entry, nowMs), 0);
  const activeMembers = membersResult.data.filter((member) => openEntryByMember.has(member.id));
  const recentStatusEntries = todayStatusEntries.slice(0, 12);
  const myStatusTotal = Object.values(myStatusTotals).reduce((sum, seconds) => sum + seconds, 0);
  const statusBarTone: Record<PresenceState, string> = {
    online: "bg-indigo-600", break: "bg-yellow-400", lunch: "bg-yellow-300", away: "bg-gray-400", offline: "bg-gray-700",
  };

  return (
    <TeamShell active="attendance" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Attendance</p>
          <h1 className="team-title">
            {isManager ? "Attendance command" : "My workday"}
          </h1>
          <p className="team-subtitle">
            Clock in, switch availability, monitor active sessions, and review today&apos;s online, break, lunch, away, and offline time.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:w-[34rem] sm:grid-cols-4">
          <div className="team-stat bg-indigo-700 text-white">
            <p className="team-kicker text-gray-300">Active</p>
            <strong className="team-stat-value">{activeMembers.length}</strong>
          </div>
          <div className="team-stat border-yellow-300 bg-yellow-50">
            <p className="team-kicker text-black">Break/Lunch</p>
            <strong className="team-stat-value">{presenceCounts.break + presenceCounts.lunch}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">Sessions</p>
            <strong className="team-stat-value">{attendanceResult.data.length}</strong>
          </div>
          <div className="team-stat">
            <p className="team-kicker">{isManager ? "Team time" : "My time"}</p>
            <strong className="team-stat-value text-[1.55rem]">
              {formatDuration(isManager ? teamTodaySeconds : myTodaySeconds)}
            </strong>
          </div>
        </div>
      </div>

      {setupMissing && <div className="mb-6">{setupNotice()}</div>}

      {message && (
        <p className="mb-6 rounded-xl border-2 border-yellow-300 bg-yellow-50 px-5 py-4 text-sm font-black text-black">
          {message}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_12px_36px_rgba(17,24,39,0.07)]">
            <div className="bg-gray-950 p-5 text-white">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-yellow-200">Clock control</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                {openEntry ? "You are live" : "Start your shift"}
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-gray-300">
                {openEntry
                  ? "Switch status during the day. Clock out only when you are finished."
                  : "Clock in to become available and start status tracking."}
              </p>
            </div>

            <div className="p-5">
              {openEntry ? (
                <>
                  <div className="rounded-xl bg-indigo-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-800">Current session</p>
                    <LiveDuration
                      startedAt={openEntry.clock_in}
                      className="mt-2 block text-4xl font-black tracking-tight text-indigo-950"
                    />
                    <p className="mt-2 text-sm font-bold text-gray-600">
                      Started at {formatTime(openEntry.clock_in)}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(["online", "break", "lunch", "away"] as Exclude<PresenceState, "offline">[]).map((status) => (
                      <StatusButton
                        key={status}
                        status={status}
                        active={memberResult.data?.status === status}
                      />
                    ))}
                  </div>
                  <form action={clockOut} className="mt-4">
                    <TeamSubmitButton className="team-button-secondary w-full" pendingLabel="Clocking out..." confirmLabel="Confirm clock out"><LogOut aria-hidden="true" size={15} className="mr-2" />Clock out</TeamSubmitButton>
                  </form>
                </>
              ) : (
                <form action={clockIn} className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-black text-black">Today&apos;s note</span>
                    <input
                      name="note"
                      type="text"
                      placeholder="Office, remote, client visit..."
                      className="team-field mt-2"
                    />
                  </label>
                  <TeamSubmitButton disabled={setupMissing} className="team-button w-full" pendingLabel="Clocking in..."><LogIn aria-hidden="true" size={15} className="mr-2" />Clock in</TeamSubmitButton>
                </form>
              )}
            </div>
          </section>

          <section className="team-panel p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="team-kicker">My time today</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-black">Status split</h2>
              </div>
              <Link href="/team/performance" className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">
                Performance
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              <div className="mb-4 flex h-3 overflow-hidden rounded-md bg-gray-100">{statusOrder.map((status) => {
                const width = myStatusTotal > 0 ? (myStatusTotals[status] / myStatusTotal) * 100 : 0;
                return width > 0 ? <span key={status} className={statusBarTone[status]} style={{ width: `${width}%` }} title={`${status}: ${formatDuration(myStatusTotals[status])}`} /> : null;
              })}</div>
              {statusOrder.map((status) => (
                <div key={status} className={`flex items-center justify-between rounded-lg px-4 py-3 ${statusClasses(status)}`}>
                  <span className="text-xs font-black capitalize">{status}</span>
                  <strong className="text-sm font-black">{formatDuration(myStatusTotals[status])}</strong>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          {isManager && (
            <section className="team-panel overflow-hidden">
              <div className="border-b border-gray-200 bg-white p-5">
                <p className="team-kicker">Live board</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-black">Team availability</h2>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
                {membersResult.data.map((member) => {
                  const entry = openEntryByMember.get(member.id);
                  const state = presenceFor(member, entry);
                  const name = displayMemberName(member);
                  const openStatus = openStatusByMember.get(member.id);

                  return (
                    <article key={member.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_12px_35px_rgba(17,24,39,0.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="relative">
                            <Avatar name={name} src={member.avatar_url} size={44} />
                            <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${statusDot(state)}`} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate font-black text-black">{name}</h3>
                            <p className="truncate text-sm font-bold text-gray-500">
                              {member.job_title || member.department || member.role}
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase ${statusClasses(state)}`}>
                          {state}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="team-kicker">Since</p>
                          <p className="mt-1 text-sm font-black text-black">
                            {openStatus ? formatTime(openStatus.started_at) : entry ? formatTime(entry.clock_in) : "Offline"}
                          </p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="team-kicker">Today</p>
                          <p className="mt-1 text-sm font-black text-black">
                            {formatDuration(memberTodaySeconds(member.id, attendanceResult.data, nowMs))}
                          </p>
                        </div>
                      </div>
                      {entry && (
                        <form action={adminClockOutMember} className="mt-3">
                          <input type="hidden" name="memberId" value={member.id} />
                          <input type="hidden" name="returnTo" value="/team/attendance" />
                          <TeamSubmitButton className="w-full rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-black text-black transition hover:bg-yellow-100" pendingLabel="Clocking out..." confirmLabel="Confirm clock out"><LogOut aria-hidden="true" size={14} className="mr-1.5" />Clock out member</TeamSubmitButton>
                        </form>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="team-panel overflow-hidden">
              <div className="border-b border-gray-200 bg-white p-5">
                <p className="team-kicker">{isManager ? "Today's team log" : "Today's log"}</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-black">Clock sessions</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {attendanceResult.data.length === 0 ? (
                  <p className="p-10 text-center text-sm font-bold text-gray-500">
                    No attendance entries today.
                  </p>
                ) : (
                  attendanceResult.data.map((entry) => {
                    const owner = memberById.get(entry.user_id) ?? null;
                    const name = displayMemberName(owner);

                    return (
                      <article key={entry.id} className="grid gap-4 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_10rem_8rem] lg:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={name} src={owner?.avatar_url} size={40} />
                          <div className="min-w-0">
                            <h3 className="truncate font-black text-black">{isManager ? name : "My session"}</h3>
                            <p className="truncate text-sm font-bold text-gray-500">
                              {formatDateTime(entry.clock_in)} - {formatDateTime(entry.clock_out)}
                            </p>
                            {entry.note && <p className="mt-1 truncate text-sm font-bold text-gray-500">{entry.note}</p>}
                          </div>
                        </div>
                        <div>
                          <p className="team-kicker">Duration</p>
                          <p className="mt-1 text-sm font-black text-black">
                            {entry.clock_out ? (
                              formatDuration(sessionSeconds(entry, nowMs))
                            ) : (
                              <LiveDuration startedAt={entry.clock_in} endedAt={entry.clock_out} />
                            )}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-center text-xs font-black uppercase ${
                          entry.clock_out ? "bg-gray-100 text-gray-700" : "bg-indigo-50 text-indigo-800"
                        }`}>
                          {entry.clock_out ? "Closed" : "Live"}
                        </span>
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            <div className="team-panel overflow-hidden">
              <div className="border-b border-gray-200 bg-white p-5">
                <p className="team-kicker">Status timeline</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-black">Latest changes</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentStatusEntries.length === 0 ? (
                  <p className="p-10 text-center text-sm font-bold text-gray-500">
                    Status changes will appear here after clock in.
                  </p>
                ) : (
                  recentStatusEntries.map((entry) => {
                    const owner = memberById.get(entry.user_id) ?? null;
                    const duration = statusEntrySeconds(entry, dayStartMs, nowMs);

                    return (
                      <article key={entry.id} className="flex items-center justify-between gap-3 bg-white p-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${statusDot(entry.status)}`} />
                            <h3 className="truncate text-sm font-black text-black">
                              {isManager ? displayMemberName(owner) : entry.status}
                            </h3>
                          </div>
                          <p className="mt-1 text-xs font-bold text-gray-500">
                            {entry.status} from {formatTime(entry.started_at)} to {formatTime(entry.ended_at)}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClasses(entry.status)}`}>
                          {formatDuration(duration)}
                        </span>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </section>
      </div>
    </TeamShell>
  );
}
