import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  canManageTeam,
  displayMemberName,
  type AttendanceEntry,
  type TeamMember,
} from "../../../_lib/data";

export const dynamic = "force-dynamic";

const memberSelect = "id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active";

function sessionSeconds(entry: AttendanceEntry, now: number) {
  const start = new Date(entry.clock_in).getTime();
  const end = entry.clock_out ? new Date(entry.clock_out).getTime() : now;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

function csvDate(value: string | null) {
  if (!value) return "";

  return new Date(value).toISOString();
}

export async function GET(request: Request) {
  if (!getSupabaseConfig()) {
    return new Response("Supabase is not configured.", { status: 503 });
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = claims?.sub;
  const userEmail = typeof claims?.email === "string" ? claims.email : null;

  if (claimsError || !userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: currentMember, error: currentMemberError } = await supabase
    .from("team_members")
    .select(memberSelect)
    .eq("id", userId)
    .maybeSingle<TeamMember>();

  if (currentMemberError) {
    return new Response("Could not load team profile.", { status: 500 });
  }

  const isManager = canManageTeam(currentMember, userEmail);
  const requestedMember = new URL(request.url).searchParams.get("member")?.trim() || "";
  const scopedMember = isManager ? requestedMember : userId;
  const membersQuery = isManager
    ? supabase.from("team_members").select(memberSelect)
    : supabase.from("team_members").select(memberSelect).eq("id", userId);
  let attendanceQuery = isManager
    ? supabase.from("attendance_entries").select("id,user_id,clock_in,clock_out,note")
    : supabase.from("attendance_entries").select("id,user_id,clock_in,clock_out,note").eq("user_id", userId);

  if (scopedMember) {
    attendanceQuery = attendanceQuery.eq("user_id", scopedMember);
  }

  const [{ data: members, error: membersError }, { data: records, error: recordsError }] = await Promise.all([
    membersQuery.order("full_name", { ascending: true }),
    attendanceQuery.order("clock_in", { ascending: false }).limit(5000),
  ]);

  if (membersError || recordsError) {
    return new Response("Could not export attendance records.", { status: 500 });
  }

  const now = new Date().getTime();
  const memberById = new Map((members ?? []).map((member) => [member.id, member as TeamMember]));
  const header = [
    "Employee",
    "Email",
    "Clock In",
    "Clock Out",
    "Duration Minutes",
    "Status",
    "Note",
    "Record ID",
  ];
  const rows = (records ?? []).map((entry) => {
    const record = entry as AttendanceEntry;
    const owner = memberById.get(record.user_id) ?? null;
    const durationMinutes = (sessionSeconds(record, now) / 60).toFixed(2);

    return [
      displayMemberName(owner),
      owner?.email ?? "",
      csvDate(record.clock_in),
      csvDate(record.clock_out),
      durationMinutes,
      record.clock_out ? "Closed" : "Active",
      record.note ?? "",
      record.id,
    ];
  });
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const filename = `anovic-attendance-records-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
