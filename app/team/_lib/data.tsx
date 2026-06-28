import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type TeamMember = {
  id: string;
  email: string | null;
  full_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "manager" | "employee";
  status: "online" | "break" | "lunch" | "away";
  job_title: string | null;
  department: string | null;
  phone: string | null;
  is_active: boolean;
  last_seen_at?: string | null;
  last_active_at?: string | null;
  mfa_required?: boolean;
};

export const ADMIN_EMAIL = "johnjohn444465@gmail.com";

export type TeamTask = {
  id: string;
  title: string;
  description: string | null;
  status: "in_progress" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  due_date: string | null;
  estimated_minutes?: number | null;
  assigned_to: string | null;
  created_by?: string | null;
  created_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
};

export type AttendanceEntry = {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  note: string | null;
};

export type TaskTimeEntry = {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

export type StatusTimeEntry = {
  id: string;
  user_id: string;
  task_id: string | null;
  status: TeamMember["status"] | "offline";
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

export type TeamMessage = {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  group_id: string | null;
  reply_to_message_id: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
  edited_at: string | null;
  edited_by: string | null;
  pinned_at: string | null;
  pinned_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_label: string | null;
};

export type TeamChatRead = {
  id: string;
  user_id: string;
  recipient_id: string | null;
  group_id: string | null;
  last_read_at: string;
};

export type TeamChatGroup = {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

export type TeamMessageAttachment = {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type TeamMessageMention = {
  id: string;
  message_id: string;
  mentioned_user_id: string;
  created_at: string;
};

export type TeamMessageReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type TeamNotification = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type:
    | "task_assigned"
    | "task_updated"
    | "task_due"
    | "message"
    | "mention"
    | "attendance"
    | "status"
    | "admin"
    | "security"
    | "system";
  title: string;
  body: string | null;
  href: string;
  entity_table: string | null;
  entity_id: string | null;
  read_at: string | null;
  dedupe_key?: string | null;
  expires_at?: string | null;
  created_at: string;
};

export type TeamNotificationPreferences = {
  user_id: string;
  browser_notifications: boolean;
  toast_enabled: boolean;
  sound_enabled: boolean;
  task_alerts: boolean;
  chat_alerts: boolean;
  attendance_alerts: boolean;
  admin_alerts: boolean;
  email_digest: "off" | "daily" | "weekly";
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  last_digest_at: string | null;
  updated_at: string;
};

export type TeamAuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_table: string | null;
  entity_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type QueryResult<T> = {
  data: T;
  setupMissing: boolean;
};

export function isMissingTableError(message?: string) {
  return Boolean(
    message?.includes("Could not find the table") ||
      message?.includes("schema cache") ||
      message?.includes("relation") ||
      message?.includes("does not exist") ||
      message?.includes("column"),
  );
}

export async function safeList<T>(
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<QueryResult<T[]>> {
  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error.message)) {
      return { data: [], setupMissing: true };
    }

    throw new Error(error.message);
  }

  return { data: data ?? [], setupMissing: false };
}

export async function safeSingle<T>(
  query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<QueryResult<T | null>> {
  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error.message)) {
      return { data: null, setupMissing: true };
    }

    throw new Error(error.message);
  }

  return { data: data ?? null, setupMissing: false };
}

export async function requireTeamSession(options: { allowMfaSetup?: boolean } = {}) {
  if (!getSupabaseConfig()) {
    redirect("/team/login?setup=missing");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/team/login");
  }

  const { data: member } = await supabase
    .from("team_members")
    .select("is_active,mfa_required")
    .eq("id", claims.sub)
    .maybeSingle<{ is_active: boolean; mfa_required: boolean }>();

  if (member?.is_active === false) {
    redirect("/team/auth/signout?reason=inactive");
  }

  if (member?.mfa_required && !options.allowMfaSetup) {
    const [{ data: factors }, { data: assurance }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    const hasVerifiedFactor = Boolean(factors?.totp.some((factor) => factor.status === "verified"));

    if (!hasVerifiedFactor || assurance?.currentLevel !== "aal2") {
      redirect("/team/security?mfa=required");
    }
  }

  return {
    supabase,
    user: {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
    },
  };
}

export function canManageTeam(
  member: Pick<TeamMember, "role" | "email"> | null,
  email?: string | null,
) {
  return (
    email?.toLowerCase() === ADMIN_EMAIL ||
    member?.email?.toLowerCase() === ADMIN_EMAIL ||
    member?.role === "owner" ||
    member?.role === "admin" ||
    member?.role === "manager"
  );
}

export function displayMemberName(member: Pick<TeamMember, "full_name" | "nickname" | "email"> | null) {
  return member?.full_name || member?.nickname || member?.email || "Team member";
}

export function initials(value: string | null | undefined) {
  const clean = value?.trim();

  if (!clean) return "A";

  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatTime(value: string | null) {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDate(value: string | null) {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function statusLabel(status: TeamTask["status"]) {
  if (status === "done") return "Completed";
  return "In Progress";
}

export function setupNotice() {
  return (
    <div className="rounded-[1.25rem] border-2 border-yellow-300 bg-yellow-50 px-5 py-4 text-sm font-bold leading-7 text-black">
      Database setup needs the latest SQL. Run
      <code className="mx-1 rounded bg-white px-2 py-1">
        supabase/team-complete.sql
      </code>
      in Supabase SQL Editor, then refresh this page.
    </div>
  );
}
