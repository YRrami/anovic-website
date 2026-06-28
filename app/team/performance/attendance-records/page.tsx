import Link from "next/link";
import type { Metadata } from "next";
import Avatar from "../../_components/Avatar";
import TeamShell from "../../_components/TeamShell";
import {
  canManageTeam,
  displayMemberName,
  requireTeamSession,
  safeList,
  safeSingle,
  setupNotice,
  type AttendanceEntry,
  type TeamMember,
} from "../../_lib/data";

export const metadata: Metadata = {
  title: "Attendance Records | Anovic Team",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  member?: string;
}>;

function sessionSeconds(entry: AttendanceEntry, now: number) {
  const start = new Date(entry.clock_in).getTime();
  const end = entry.clock_out ? new Date(entry.clock_out).getTime() : now;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours <= 0) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Active now";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function querySuffix(member?: string) {
  if (!member) return "";

  return `?member=${encodeURIComponent(member)}`;
}

export default async function AttendanceRecordsPage({
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
  const selectedMemberId = isManager ? params.member || "" : user.id;
  const membersQuery = isManager
    ? supabase
        .from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
    : supabase
        .from("team_members")
        .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
        .eq("id", user.id);
  let attendanceQuery = isManager
    ? supabase.from("attendance_entries").select("id,user_id,clock_in,clock_out,note")
    : supabase
        .from("attendance_entries")
        .select("id,user_id,clock_in,clock_out,note")
        .eq("user_id", user.id);

  if (selectedMemberId) {
    attendanceQuery = attendanceQuery.eq("user_id", selectedMemberId);
  }

  const [membersResult, attendanceResult] = await Promise.all([
    safeList<TeamMember>(membersQuery.order("full_name", { ascending: true })),
    safeList<AttendanceEntry>(attendanceQuery.order("clock_in", { ascending: false }).limit(500)),
  ]);
  const setupMissing = memberResult.setupMissing || membersResult.setupMissing || attendanceResult.setupMissing;
  const now = new Date().getTime();
  const memberById = new Map(membersResult.data.map((member) => [member.id, member]));
  const selectedMember = selectedMemberId ? memberById.get(selectedMemberId) || memberResult.data : null;
  const scopeLabel = isManager && !selectedMemberId ? "Everyone" : displayMemberName(selectedMember);
  const totalSeconds = attendanceResult.data.reduce((total, entry) => total + sessionSeconds(entry, now), 0);
  const activeRecords = attendanceResult.data.filter((entry) => !entry.clock_out);
  const closedRecords = attendanceResult.data.length - activeRecords.length;
  const exportHref = `/team/performance/attendance-records/export${querySuffix(selectedMemberId || undefined)}`;

  return (
    <TeamShell active="performance" member={memberResult.data}>
      <div className="team-page-header">
        <div>
          <p className="team-kicker">Attendance records</p>
          <h1 className="team-title">Clock-in history</h1>
          <p className="team-subtitle">
            Review complete workday records without crowding the performance dashboard.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/team/performance" className="team-button-secondary min-h-11 px-5 text-xs">
            Back to performance
          </Link>
          <Link href={exportHref} className="team-button min-h-11 px-5 text-xs">
            Export CSV
          </Link>
        </div>
      </div>

      {setupMissing && <div className="mb-6">{setupNotice()}</div>}

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="team-stat bg-indigo-700 text-white">
          <p className="team-kicker text-gray-300">Scope</p>
          <strong className="team-stat-value truncate text-[1.45rem]">{scopeLabel}</strong>
        </div>
        <div className="team-stat">
          <p className="team-kicker">Records</p>
          <strong className="team-stat-value">{attendanceResult.data.length}</strong>
        </div>
        <div className="team-stat border-yellow-300 bg-yellow-50">
          <p className="team-kicker text-black">Active</p>
          <strong className="team-stat-value">{activeRecords.length}</strong>
        </div>
        <div className="team-stat">
          <p className="team-kicker">Total time</p>
          <strong className="team-stat-value text-[1.55rem]">{formatDuration(totalSeconds)}</strong>
        </div>
      </div>

      <div className={`grid gap-5 ${isManager ? "xl:grid-cols-[20rem_minmax(0,1fr)]" : ""}`}>
        {isManager && (
          <aside className="team-panel p-5 xl:sticky xl:top-6 xl:self-start">
            <p className="team-kicker">Record scope</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-black">Choose member</h2>
            <div className="mt-4 space-y-2">
              <Link
                href="/team/performance/attendance-records"
                className={`block rounded-xl border px-4 py-3 text-sm font-black transition ${!selectedMemberId ? "border-indigo-300 bg-indigo-50 text-indigo-950" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                Everyone
              </Link>
              {membersResult.data.map((member) => (
                <Link
                  key={member.id}
                  href={`/team/performance/attendance-records?member=${member.id}`}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${selectedMemberId === member.id ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                >
                  <Avatar name={displayMemberName(member)} src={member.avatar_url} size={34} />
                  <span className="min-w-0 flex-1 truncate text-sm font-black text-black">
                    {displayMemberName(member)}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${member.status === "online" ? "bg-indigo-500" : member.status === "break" || member.status === "lunch" ? "bg-yellow-300" : "bg-gray-400"}`} />
                </Link>
              ))}
            </div>
          </aside>
        )}

        <section className="team-panel overflow-hidden">
          <div className="border-b border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="team-kicker">Records table</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-black">
                  {scopeLabel} attendance
                </h2>
              </div>
              <span className="w-fit rounded-lg bg-gray-100 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-700">
                {closedRecords} closed
              </span>
            </div>
          </div>

          {attendanceResult.data.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-gray-500">No attendance records</p>
              <p className="mt-2 text-sm font-bold text-gray-500">
                Clock-in and clock-out history appears here after sessions are recorded.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {attendanceResult.data.map((entry) => {
                const owner = memberById.get(entry.user_id) ?? null;
                const ownerName = displayMemberName(owner);

                return (
                  <article key={entry.id} className="grid gap-4 bg-white p-4 xl:grid-cols-[minmax(0,1.2fr)_13rem_13rem_9rem_8rem] xl:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={ownerName} src={owner?.avatar_url} size={42} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-black">{ownerName}</p>
                        <p className="truncate text-xs font-bold text-gray-500">
                          {owner?.job_title || owner?.department || owner?.email || "Team member"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="team-kicker">Clock in</p>
                      <p className="mt-1 text-sm font-black text-black">{formatDateTime(entry.clock_in)}</p>
                    </div>
                    <div>
                      <p className="team-kicker">Clock out</p>
                      <p className="mt-1 text-sm font-black text-black">{formatDateTime(entry.clock_out)}</p>
                    </div>
                    <div>
                      <p className="team-kicker">Duration</p>
                      <p className="mt-1 text-sm font-black text-black">{formatDuration(sessionSeconds(entry, now))}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-center text-xs font-black uppercase ${
                      entry.clock_out ? "bg-gray-100 text-gray-700" : "bg-indigo-50 text-indigo-800"
                    }`}>
                      {entry.clock_out ? "Closed" : "Active"}
                    </span>
                    {entry.note && (
                      <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-500 xl:col-span-5">
                        Note: {entry.note}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </TeamShell>
  );
}
