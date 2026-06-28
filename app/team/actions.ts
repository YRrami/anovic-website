"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendTeamPush } from "@/lib/team/push";
import {
  canManageTeam,
  displayMemberName,
  type StatusTimeEntry,
  type TeamMember,
  type TeamTask,
} from "./_lib/data";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_CHAT_FILE_BYTES = 5 * 1024 * 1024;

async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/team/login");
  }

  return { supabase, user: data.user };
}

async function getCurrentMember() {
  const { supabase, user } = await getCurrentUser();
  const { data: member, error } = await supabase
    .from("team_members")
    .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
    .eq("id", user.id)
    .maybeSingle<TeamMember>();

  if (error) {
    console.error("Failed to load current team member", error);
  }

  return { supabase, user, member };
}

function cleanText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function requireChoice<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T) {
  const text = String(value || "");
  return allowed.includes(text as T) ? (text as T) : fallback;
}

function avatarExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function safeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "attachment"
  );
}

function avatarStoragePath(avatarUrl: string | null) {
  if (!avatarUrl) return null;

  const marker = "/storage/v1/object/public/team-avatars/";
  const markerIndex = avatarUrl.indexOf(marker);

  if (markerIndex === -1) return null;

  const rawPath = avatarUrl.slice(markerIndex + marker.length).split("?")[0];
  return rawPath ? decodeURIComponent(rawPath) : null;
}

async function removeAvatarObject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  avatarUrl: string | null,
) {
  const path = avatarStoragePath(avatarUrl);

  if (!path) return;

  const { error } = await supabase.storage.from("team-avatars").remove([path]);

  if (error) {
    console.error("Team avatar file cleanup failed", error);
  }
}

function storageFailureCode(error: { message?: string; statusCode?: string | number }) {
  const message = error.message?.toLowerCase() || "";
  const statusCode = String(error.statusCode || "");

  if (message.includes("bucket not found") || statusCode === "404") {
    return "bucket-missing";
  }

  if (
    message.includes("row-level security") ||
    message.includes("violates row-level security") ||
    statusCode === "403"
  ) {
    return "storage-policy";
  }

  return "upload-failed";
}

function profileFailureCode(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() || "";

  if (
    error.code === "PGRST202" ||
    message.includes("could not find the function") ||
    message.includes("schema cache")
  ) {
    return "profile-function-missing";
  }

  if (message.includes("permission denied") || message.includes("not authorized")) {
    return "profile-permission";
  }

  return "save-failed";
}

function taskFailureCode(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() || "";

  if (
    error.code === "PGRST202" ||
    message.includes("could not find the function") ||
    message.includes("schema cache")
  ) {
    return "task-function-missing";
  }

  if (
    error.code === "42501" ||
    message.includes("not allowed") ||
    message.includes("permission denied") ||
    message.includes("row-level security")
  ) {
    return "task-permission";
  }

  return "save-failed";
}

function chatFailureCode(error: { message?: string }) {
  const message = error.message?.toLowerCase() || "";

  if (message.includes("function") || message.includes("schema cache")) {
    return "chat-function-missing";
  }

  if (message.includes("bucket") || message.includes("storage")) {
    return "chat-storage";
  }

  if (message.includes("row-level security") || message.includes("permission denied")) {
    return "chat-permission";
  }

  return "chat-failed";
}

function messageTargetQuery(recipientId: string | null, groupId: string | null) {
  if (groupId) return `?group=${encodeURIComponent(groupId)}`;
  if (recipientId) return `?recipient=${encodeURIComponent(recipientId)}`;
  return "";
}

function safeTeamReturnTo(value: FormDataEntryValue | null) {
  const path = String(value || "").trim();

  if (!path.startsWith("/team/chat")) return "/team/chat";
  if (path.includes("://")) return "/team/chat";

  return path;
}

function safeTeamPath(value: FormDataEntryValue | null, fallback = "/team") {
  const path = String(value || "").trim();

  if (!path.startsWith("/team")) return fallback;
  if (path.includes("://")) return fallback;

  return path;
}

function parseEstimatedMinutes(value: FormDataEntryValue | null) {
  const minutes = Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isFinite(minutes) || minutes < 0) return null;

  return minutes;
}

function trackedSeconds(startedAt: string, endedAt: string) {
  return Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
}

type TeamSupabase = Awaited<ReturnType<typeof createClient>>;
type OpenTaskTimeEntry = {
  id: string;
  task_id: string;
  started_at: string;
};
type OpenStatusTimeEntry = {
  id: string;
  status: StatusTimeEntry["status"];
  task_id: string | null;
  started_at: string;
};
async function teamManagerIds(supabase: TeamSupabase, excludeId?: string) {
  let query = supabase
    .from("team_members")
    .select("id")
    .eq("is_active", true)
    .in("role", ["owner", "admin", "manager"]);

  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return (data || []).map((row) => row.id as string);
}

async function closeOpenTaskEntries(
  supabase: TeamSupabase,
  userId: string,
  taskId?: string | null,
) {
  let query = supabase
    .from("task_time_entries")
    .select("id,task_id,started_at")
    .eq("user_id", userId)
    .is("ended_at", null);

  if (taskId) {
    query = query.eq("task_id", taskId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Open task time read failed", error);
    return null;
  }

  let relatedTaskId: string | null = null;

  for (const entry of (data || []) as OpenTaskTimeEntry[]) {
    const endedAt = new Date().toISOString();
    relatedTaskId = relatedTaskId || entry.task_id;

    const { error: updateError } = await supabase
      .from("task_time_entries")
      .update({
        ended_at: endedAt,
        duration_seconds: trackedSeconds(entry.started_at, endedAt),
      })
      .eq("id", entry.id);

    if (updateError) {
      console.error("Open task time close failed", updateError);
    }
  }

  return relatedTaskId;
}

async function closeOpenStatusEntries(supabase: TeamSupabase, userId: string) {
  const { data, error } = await supabase
    .from("status_time_entries")
    .select("id,status,task_id,started_at")
    .eq("user_id", userId)
    .is("ended_at", null);

  if (error) {
    console.error("Open status time read failed", error);
    return null;
  }

  let relatedTaskId: string | null = null;

  for (const entry of (data || []) as OpenStatusTimeEntry[]) {
    const endedAt = new Date().toISOString();
    relatedTaskId = relatedTaskId || entry.task_id;

    const { error: updateError } = await supabase
      .from("status_time_entries")
      .update({
        ended_at: endedAt,
        duration_seconds: trackedSeconds(entry.started_at, endedAt),
      })
      .eq("id", entry.id);

    if (updateError) {
      console.error("Open status time close failed", updateError);
    }
  }

  return relatedTaskId;
}

async function startStatusEntry(
  supabase: TeamSupabase,
  userId: string,
  status: StatusTimeEntry["status"],
  taskId?: string | null,
) {
  const { error } = await supabase.from("status_time_entries").insert({
    user_id: userId,
    status,
    task_id: taskId || null,
  });

  if (error) {
    console.error("Status time start failed", error);
  }
}

async function findResumableTaskId(supabase: TeamSupabase, userId: string, preferredTaskId?: string | null) {
  if (preferredTaskId) {
    const { data } = await supabase
      .from("team_tasks")
      .select("id")
      .eq("id", preferredTaskId)
      .eq("assigned_to", userId)
      .eq("status", "in_progress")
      .is("archived_at", null)
      .maybeSingle<{ id: string }>();

    if (data?.id) return data.id;
  }

  const { data, error } = await supabase
    .from("team_tasks")
    .select("id")
    .eq("assigned_to", userId)
    .eq("status", "in_progress")
    .not("started_at", "is", null)
    .is("completed_at", null)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Resumable task lookup failed", error);
  }

  return data?.id || null;
}

async function startTaskEntryIfNeeded(supabase: TeamSupabase, userId: string, taskId: string) {
  const { data: existing, error: readError } = await supabase
    .from("task_time_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .is("ended_at", null)
    .maybeSingle<{ id: string }>();

  if (readError) {
    console.error("Open task time check failed", readError);
    return;
  }

  if (existing) return;

  const { error } = await supabase.from("task_time_entries").insert({
    user_id: userId,
    task_id: taskId,
  });

  if (error) {
    console.error("Task time start failed", error);
  }
}

async function applyMemberStatus(
  supabase: TeamSupabase,
  userId: string,
  status: StatusTimeEntry["status"],
  preferredTaskId?: string | null,
) {
  const previousStatusTaskId = await closeOpenStatusEntries(supabase, userId);
  const openTaskIdBeforePause = await closeOpenTaskEntries(supabase, userId);
  const relatedTaskId = openTaskIdBeforePause || previousStatusTaskId || preferredTaskId || null;

  if (status === "online") {
    const resumableTaskId = await findResumableTaskId(supabase, userId, relatedTaskId);
    await startStatusEntry(supabase, userId, "online", resumableTaskId);

    if (resumableTaskId) {
      await startTaskEntryIfNeeded(supabase, userId, resumableTaskId);
    }

    return;
  }

  await startStatusEntry(supabase, userId, status, relatedTaskId);
}

async function syncOpenStatusTask(
  supabase: TeamSupabase,
  userId: string,
  status: TeamMember["status"],
  taskId: string | null,
) {
  await closeOpenStatusEntries(supabase, userId);
  await startStatusEntry(supabase, userId, status, taskId);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/team/login");
}

export async function clockIn(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const note = String(formData.get("note") || "").trim();

  const { data: openEntry } = await supabase
    .from("attendance_entries")
    .select("id")
    .eq("user_id", user.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!openEntry) {
    await supabase.from("attendance_entries").insert({
      user_id: user.id,
      note: note || null,
    });
  }

  if (member) {
    await supabase.rpc("update_own_team_profile", {
      p_full_name: member.full_name,
      p_nickname: member.nickname,
      p_job_title: member.job_title,
      p_status: "online",
      p_department: member.department,
      p_phone: member.phone,
      p_avatar_url: member.avatar_url,
    });
  }

  await applyMemberStatus(supabase, user.id, "online");
  await sendTeamPush(await teamManagerIds(supabase, user.id), {
    title: `${displayMemberName(member)} clocked in`,
    body: note || "Attendance is now active.",
    href: "/team/attendance",
    tag: `attendance-clock-in-${user.id}`,
    category: "attendance",
  });

  revalidatePath("/team");
  revalidatePath("/team/profile");
  revalidatePath("/team/teammates");
  revalidatePath("/team/attendance");
  revalidatePath("/team/tasks");
  revalidatePath("/team/performance");
  redirect("/team/attendance?attendance=clocked-in");
}

export async function clockOut() {
  const { supabase, user, member } = await getCurrentMember();

  const { data: openEntry } = await supabase
    .from("attendance_entries")
    .select("id")
    .eq("user_id", user.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openEntry) {
    await supabase
      .from("attendance_entries")
      .update({ clock_out: new Date().toISOString() })
      .eq("id", openEntry.id);
  }

  if (member) {
    await supabase.rpc("update_own_team_profile", {
      p_full_name: member.full_name,
      p_nickname: member.nickname,
      p_job_title: member.job_title,
      p_status: "away",
      p_department: member.department,
      p_phone: member.phone,
      p_avatar_url: member.avatar_url,
    });
  }

  await applyMemberStatus(supabase, user.id, "offline");
  await sendTeamPush(await teamManagerIds(supabase, user.id), {
    title: `${displayMemberName(member)} clocked out`,
    body: "The attendance session has been closed.",
    href: "/team/attendance",
    tag: `attendance-clock-out-${user.id}`,
    category: "attendance",
  });

  revalidatePath("/team");
  revalidatePath("/team/profile");
  revalidatePath("/team/teammates");
  revalidatePath("/team/attendance");
  revalidatePath("/team/tasks");
  revalidatePath("/team/performance");
  redirect("/team/attendance?attendance=clocked-out");
}

export async function adminClockOutMember(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const memberId = cleanText(formData.get("memberId"));
  const returnTo = safeTeamPath(formData.get("returnTo"), "/team/attendance");

  if (!canManageTeam(member, user.email)) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}attendance=not-allowed`);
  }

  if (!memberId) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}attendance=missing-member`);
  }

  const { data: targetMember, error: memberError } = await supabase
    .from("team_members")
    .select("id,status")
    .eq("id", memberId)
    .maybeSingle<Pick<TeamMember, "id" | "status">>();

  if (memberError || !targetMember) {
    if (memberError) console.error("Admin clock out member lookup failed", memberError);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}attendance=member-not-found`);
  }

  const { data: openEntries, error: readError } = await supabase
    .from("attendance_entries")
    .select("id")
    .eq("user_id", memberId)
    .is("clock_out", null);

  if (readError) {
    console.error("Admin clock out attendance read failed", readError);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}attendance=clock-out-failed`);
  }

  if (!openEntries?.length) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}attendance=already-clocked-out`);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("attendance_entries")
    .update({ clock_out: now })
    .eq("user_id", memberId)
    .is("clock_out", null);

  if (updateError) {
    console.error("Admin clock out attendance update failed", updateError);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}attendance=clock-out-failed`);
  }

  const { error: memberUpdateError } = await supabase.rpc("admin_set_team_member_status", {
    p_member_id: memberId,
    p_status: "away",
  });

  if (memberUpdateError) {
    console.error("Admin clock out status update failed", memberUpdateError);
  }

  await applyMemberStatus(supabase, memberId, "offline");
  await sendTeamPush([memberId], {
    title: "You were clocked out",
    body: `${displayMemberName(member)} closed your attendance session.`,
    href: "/team/attendance",
    tag: `admin-clock-out-${memberId}`,
    category: "admin",
  });

  revalidatePath("/team");
  revalidatePath("/team/attendance");
  revalidatePath("/team/performance");
  revalidatePath("/team/tasks");
  revalidatePath("/team/teammates");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}attendance=member-clocked-out`);
}

export async function updateMemberStatus(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const returnTo = safeTeamPath(formData.get("returnTo"), "/team");
  const status = requireChoice<TeamMember["status"]>(
    formData.get("status"),
    ["online", "break", "lunch", "away"],
    "away",
  );

  if (!member) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}status=save-failed`);
  }

  const { data: openEntry } = await supabase
    .from("attendance_entries")
    .select("id")
    .eq("user_id", user.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!openEntry && status !== "away") {
    redirect(`/team/attendance?attendance=clock-in-first`);
  }

  const { error } = await supabase.rpc("update_own_team_profile", {
    p_full_name: member.full_name,
    p_nickname: member.nickname,
    p_job_title: member.job_title,
    p_status: status,
    p_department: member.department,
    p_phone: member.phone,
    p_avatar_url: member.avatar_url,
  });

  if (error) {
    console.error("Quick team status update failed", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}status=${profileFailureCode(error)}`);
  }

  if (status !== member.status) {
    await applyMemberStatus(supabase, user.id, status);
    await sendTeamPush(await teamManagerIds(supabase, user.id), {
      title: `${displayMemberName(member)} is now ${status}`,
      body: "Team availability changed.",
      href: "/team/teammates",
      tag: `status-${user.id}-${status}`,
      category: "attendance",
    });
  }

  revalidatePath("/team");
  revalidatePath("/team/profile");
  revalidatePath("/team/teammates");
  revalidatePath("/team/attendance");
  revalidatePath("/team/tasks");
  revalidatePath("/team/performance");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}status=updated`);
}

export async function updateProfile(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const avatar = formData.get("avatar");
  let avatarUrl = cleanText(formData.get("currentAvatarUrl"));
  const previousAvatarUrl = avatarUrl;
  const nextStatus = requireChoice<TeamMember["status"]>(
    formData.get("status"),
    ["online", "break", "lunch", "away"],
    "away",
  );

  if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith("image/")) {
      redirect("/team/profile?profile=bad-file");
    }

    if (avatar.size > MAX_AVATAR_BYTES) {
      redirect("/team/profile?profile=file-too-large");
    }

    const path = `${user.id}/${Date.now()}.${avatarExtension(avatar)}`;
    const { error: uploadError } = await supabase.storage
      .from("team-avatars")
      .upload(path, avatar, {
        contentType: avatar.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Team avatar upload failed", uploadError);
      redirect(`/team/profile?profile=${storageFailureCode(uploadError)}`);
    }

    const { data } = supabase.storage.from("team-avatars").getPublicUrl(path);
    avatarUrl = data.publicUrl;
    await removeAvatarObject(supabase, previousAvatarUrl);
  }

  const { error } = await supabase.rpc("update_own_team_profile", {
    p_full_name: cleanText(formData.get("fullName")),
    p_nickname: cleanText(formData.get("nickname")),
    p_job_title: cleanText(formData.get("jobTitle")),
    p_status: nextStatus,
    p_department: cleanText(formData.get("department")),
    p_phone: cleanText(formData.get("phone")),
    p_avatar_url: avatarUrl,
  });

  if (error) {
    console.error("Team profile save failed", error);
    redirect(`/team/profile?profile=${profileFailureCode(error)}`);
  }

  if (member && nextStatus !== member.status) {
    await applyMemberStatus(supabase, user.id, nextStatus);
    await sendTeamPush(await teamManagerIds(supabase, user.id), {
      title: `${displayMemberName(member)} is now ${nextStatus}`,
      body: "Team availability changed.",
      href: "/team/teammates",
      tag: `status-${user.id}-${nextStatus}`,
      category: "attendance",
    });
  }

  revalidatePath("/team/profile");
  revalidatePath("/team/teammates");
  revalidatePath("/team/admin");
  revalidatePath("/team/attendance");
  revalidatePath("/team/tasks");
  revalidatePath("/team/performance");
  redirect("/team/profile?profile=saved");
}

export async function removeProfilePicture() {
  const { supabase, member } = await getCurrentMember();

  if (!member) {
    redirect("/team/profile?profile=save-failed");
  }

  await removeAvatarObject(supabase, member.avatar_url);

  const { error } = await supabase.rpc("update_own_team_profile", {
    p_full_name: member.full_name,
    p_nickname: member.nickname,
    p_job_title: member.job_title,
    p_status: member.status,
    p_department: member.department,
    p_phone: member.phone,
    p_avatar_url: null,
  });

  if (error) {
    console.error("Profile picture removal failed", error);
    redirect(`/team/profile?profile=${profileFailureCode(error)}`);
  }

  revalidatePath("/team/profile");
  revalidatePath("/team/teammates");
  revalidatePath("/team/admin");
  redirect("/team/profile?profile=photo-removed");
}

export async function createAssignedTask(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();

  if (!canManageTeam(member, user.email)) {
    redirect("/team/tasks?task=not-allowed");
  }

  const title = cleanText(formData.get("title"));
  const assignedTo = cleanText(formData.get("assignedTo"));

  if (!title || !assignedTo) {
    redirect("/team/tasks?task=missing");
  }

  const priority = requireChoice<TeamTask["priority"]>(
    formData.get("priority"),
    ["low", "normal", "high", "urgent"],
    "normal",
  );
  const status = requireChoice<TeamTask["status"]>(
    formData.get("status"),
    ["in_progress", "done"],
    "in_progress",
  );
  const dueDate = cleanText(formData.get("dueDate"));

  const { data: createdTask, error } = await supabase.rpc("create_team_task", {
    p_title: title,
    p_description: cleanText(formData.get("description")),
    p_assigned_to: assignedTo,
    p_priority: priority,
    p_status: status,
    p_due_date: dueDate,
    p_estimated_minutes: parseEstimatedMinutes(formData.get("estimatedMinutes")),
  }).single<Pick<TeamTask, "id" | "title">>();

  if (error) {
    console.error("Task assignment failed", error);
    redirect(`/team/tasks?task=${taskFailureCode(error)}`);
  }

  await sendTeamPush([assignedTo], {
    title: "New task assigned",
    body: title,
    href: "/team/tasks?view=mine",
    tag: `task-assigned-${createdTask?.id || assignedTo}`,
    category: "tasks",
  });

  revalidatePath("/team");
  revalidatePath("/team/tasks");
  revalidatePath("/team/admin");
  revalidatePath("/team/performance");
  revalidatePath("/team/notifications");
  redirect("/team/tasks?task=created");
}

export async function updateTaskStatus(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const taskId = cleanText(formData.get("taskId"));

  if (!taskId) {
    redirect("/team/tasks?task=missing");
  }

  const status = requireChoice<TeamTask["status"]>(
    formData.get("status"),
    ["in_progress", "done"],
    "in_progress",
  );
  const now = new Date().toISOString();

  let currentTaskQuery = supabase
    .from("team_tasks")
    .select("id,title,assigned_to,created_by,started_at,status,completed_at")
    .eq("id", taskId)
    .is("archived_at", null);

  if (!canManageTeam(member, user.email)) {
    currentTaskQuery = currentTaskQuery.eq("assigned_to", user.id);
  }

  const { data: currentTask, error: readError } =
    await currentTaskQuery.maybeSingle<Pick<TeamTask, "id" | "title" | "assigned_to" | "created_by" | "started_at" | "status" | "completed_at">>();

  if (readError || !currentTask) {
    if (readError) console.error("Task status read failed", readError);
    redirect("/team/tasks?task=update-failed");
  }

  const nextStartedAt = status === "in_progress" && !currentTask.started_at ? now : currentTask.started_at;

  let query = supabase
    .from("team_tasks")
    .update({
      status,
      started_at: nextStartedAt,
      completed_at: status === "done" ? now : null,
    })
    .eq("id", taskId)
    .is("archived_at", null);

  if (!canManageTeam(member, user.email)) {
    query = query.eq("assigned_to", user.id);
  }

  const { error } = await query;

  if (error) {
    console.error("Task status update failed", error);
    redirect("/team/tasks?task=update-failed");
  }

  if (currentTask.assigned_to) {
    if (status === "done") {
      await closeOpenTaskEntries(supabase, currentTask.assigned_to, taskId);

      if (currentTask.assigned_to === user.id && member?.status === "online") {
        await syncOpenStatusTask(supabase, user.id, "online", null);
      }
    } else if (currentTask.assigned_to === user.id && member?.status === "online") {
      await startTaskEntryIfNeeded(supabase, user.id, taskId);
      await syncOpenStatusTask(supabase, user.id, "online", taskId);
    }
  }

  if (status !== currentTask.status && currentTask.created_by) {
    await sendTeamPush([currentTask.created_by], {
      title: status === "done" ? "Task completed" : "Task started",
      body: currentTask.title,
      href: status === "done" ? "/team/tasks?status=done" : "/team/tasks",
      tag: `task-${status}-${currentTask.id}`,
      category: "tasks",
    });
  }

  revalidatePath("/team/tasks");
  revalidatePath("/team/archived-tasks");
  revalidatePath("/team/admin");
  revalidatePath("/team");
  revalidatePath("/team/performance");
  revalidatePath("/team/notifications");
  redirect("/team/tasks?task=updated");
}

export async function archiveTask(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const taskId = cleanText(formData.get("taskId"));
  const mode = cleanText(formData.get("mode")) === "restore" ? "restore" : "archive";
  const isManager = canManageTeam(member, user.email);

  if (!taskId) {
    redirect("/team/tasks?task=missing");
  }

  if (mode === "restore" && !isManager) {
    redirect("/team/tasks?task=archive-not-allowed");
  }

  let query = supabase
    .from("team_tasks")
    .update(
      mode === "restore"
        ? { archived_at: null, archived_by: null }
        : { archived_at: new Date().toISOString(), archived_by: user.id },
    )
    .eq("id", taskId);

  if (!isManager) {
    query = query
      .eq("assigned_to", user.id)
      .eq("status", "done")
      .is("archived_at", null);
  }

  const { data, error } = await query.select("id");

  if (error) {
    console.error("Task archive update failed", error);
    redirect("/team/tasks?task=archive-failed");
  }

  if (!data?.length) {
    redirect("/team/tasks?task=archive-not-allowed");
  }

  revalidatePath("/team/tasks");
  revalidatePath("/team/archived-tasks");
  revalidatePath("/team/admin");
  revalidatePath("/team/performance");
  redirect(mode === "restore" ? "/team/archived-tasks?task=restored" : "/team/archived-tasks?task=archived");
}

export async function deleteTask(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const taskId = cleanText(formData.get("taskId"));
  const fromArchive = cleanText(formData.get("from")) === "archive";
  const isManager = canManageTeam(member, user.email);
  const redirectPath = fromArchive ? "/team/archived-tasks" : "/team/tasks";

  if (!taskId) {
    redirect(`${redirectPath}?task=missing`);
  }

  let query = supabase
    .from("team_tasks")
    .delete()
    .eq("id", taskId)
    .eq("status", "done");

  if (!isManager) {
    query = query.eq("assigned_to", user.id);
  }

  const { data, error } = await query.select("id");

  if (error) {
    console.error("Task delete failed", error);
    redirect(`${redirectPath}?task=delete-failed`);
  }

  if (!data?.length) {
    redirect(`${redirectPath}?task=delete-not-allowed`);
  }

  revalidatePath("/team");
  revalidatePath("/team/tasks");
  revalidatePath("/team/archived-tasks");
  revalidatePath("/team/admin");
  revalidatePath("/team/performance");
  redirect(`${redirectPath}?task=deleted`);
}

export async function sendTeamMessage(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const body = cleanText(formData.get("body"));
  const recipientId = cleanText(formData.get("recipientId"));
  const groupId = cleanText(formData.get("groupId"));
  const replyToMessageId = cleanText(formData.get("replyToMessageId"));
  const target = messageTargetQuery(recipientId, groupId);
  const attachment = formData.get("attachment");
  const mentionIds = new Set(
    formData
      .getAll("mentions")
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  );

  if (recipientId && groupId) {
    redirect("/team/chat?chat=bad-target");
  }

  if (!body && !(attachment instanceof File && attachment.size > 0)) {
    redirect(`/team/chat${target}${target ? "&" : "?"}chat=missing`);
  }

  if (body && body.length > 1200) {
    redirect(`/team/chat${target}${target ? "&" : "?"}chat=too-long`);
  }

  if (recipientId) {
    const { data: recipient, error: recipientError } = await supabase
      .from("team_members")
      .select("id,is_active")
      .eq("id", recipientId)
      .eq("is_active", true)
      .maybeSingle<Pick<TeamMember, "id" | "is_active">>();

    if (recipientError || !recipient) {
      redirect("/team/chat?chat=bad-recipient");
    }
  }

  if (groupId && !canManageTeam(member, user.email)) {
    const { data: groupMember, error: groupMemberError } = await supabase
      .from("team_chat_group_members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("member_id", user.id)
      .maybeSingle();

    if (groupMemberError || !groupMember) {
      redirect("/team/chat?chat=bad-group");
    }
  }

  if (replyToMessageId) {
    const { data: replyTarget, error: replyError } = await supabase
      .from("team_messages")
      .select("id")
      .eq("id", replyToMessageId)
      .maybeSingle<{ id: string }>();

    if (replyError || !replyTarget) {
      redirect(`/team/chat${target}${target ? "&" : "?"}chat=bad-reply`);
    }
  }

  const { data: message, error } = await supabase
    .from("team_messages")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId || null,
      group_id: groupId || null,
      reply_to_message_id: replyToMessageId || null,
      body: body || "Shared an attachment.",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !message) {
    console.error("Team message send failed", error);
    redirect(`/team/chat${target}${target ? "&" : "?"}chat=${error ? chatFailureCode(error) : "chat-failed"}`);
  }

  if (attachment instanceof File && attachment.size > 0) {
    if (attachment.size > MAX_CHAT_FILE_BYTES) {
      redirect(`/team/chat${target}${target ? "&" : "?"}chat=file-too-large`);
    }

    const path = `${user.id}/${message.id}/${Date.now()}-${safeFileName(attachment.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("team-chat-files")
      .upload(path, attachment, {
        contentType: attachment.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Team chat file upload failed", uploadError);
      redirect(`/team/chat${target}${target ? "&" : "?"}chat=${chatFailureCode(uploadError)}`);
    }

    const { data: publicFile } = supabase.storage.from("team-chat-files").getPublicUrl(path);
    const { error: attachmentError } = await supabase.from("team_message_attachments").insert({
      message_id: message.id,
      file_name: safeFileName(attachment.name),
      file_url: publicFile.publicUrl,
      file_type: attachment.type || null,
      file_size: attachment.size,
    });

    if (attachmentError) {
      console.error("Team chat attachment save failed", attachmentError);
      redirect(`/team/chat${target}${target ? "&" : "?"}chat=${chatFailureCode(attachmentError)}`);
    }
  }

  if (body) {
    const { data: mentionableMembers } = await supabase
      .from("team_members")
      .select("id,email,full_name,nickname")
      .eq("is_active", true);
    const lowerBody = body.toLowerCase();

    for (const mentionable of mentionableMembers || []) {
      const aliases = [
        mentionable.full_name,
        mentionable.nickname,
        mentionable.email?.split("@")[0],
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase().replace(/\s+/g, ""));

      if (
        aliases.some((alias) => lowerBody.includes(`@${alias}`)) ||
        mentionIds.has(mentionable.id)
      ) {
        mentionIds.add(mentionable.id);
      }
    }
  }

  mentionIds.delete(user.id);

  if (mentionIds.size > 0) {
    const { error: mentionsError } = await supabase.from("team_message_mentions").insert(
      Array.from(mentionIds).map((mentionedUserId) => ({
        message_id: message.id,
        mentioned_user_id: mentionedUserId,
      })),
    );

    if (mentionsError) {
      console.error("Team message mention save failed", mentionsError);
    }
  }

  const senderName = displayMemberName(member);
  const preview = body || "Shared an attachment.";
  const notificationHref = groupId ? `/team/chat?group=${groupId}` : recipientId ? `/team/chat?recipient=${user.id}` : "/team/chat";
  const pushRecipients = new Set<string>();
  let pushTitle = "New team room message";

  if (recipientId) {
    pushRecipients.add(recipientId);
    pushTitle = "New direct message";
  } else if (groupId) {
    const [{ data: group }, { data: groupMembers }] = await Promise.all([
      supabase
        .from("team_chat_groups")
        .select("name")
        .eq("id", groupId)
        .maybeSingle<{ name: string }>(),
      supabase
        .from("team_chat_group_members")
        .select("member_id")
        .eq("group_id", groupId),
    ]);
    const groupName = group?.name || "group";
    pushTitle = `New message in #${groupName}`;

    for (const groupMember of groupMembers || []) {
      if (groupMember.member_id !== user.id) pushRecipients.add(groupMember.member_id);
    }
  } else {
    const { data: activeMembers } = await supabase
      .from("team_members")
      .select("id")
      .eq("is_active", true);

    for (const activeMember of activeMembers || []) {
      if (activeMember.id !== user.id) pushRecipients.add(activeMember.id);
    }
  }

  const mentionedRecipients = Array.from(pushRecipients).filter((id) => mentionIds.has(id));
  const normalRecipients = Array.from(pushRecipients).filter((id) => !mentionIds.has(id));
  await Promise.all([
    sendTeamPush(normalRecipients, {
      title: pushTitle,
      body: `${senderName}: ${preview}`,
      href: notificationHref,
      tag: `message-${message.id}`,
      category: "chat",
    }),
    sendTeamPush(mentionedRecipients, {
      title: `${senderName} mentioned you`,
      body: preview,
      href: notificationHref,
      tag: `mention-${message.id}`,
      category: "chat",
    }),
  ]);

  revalidatePath("/team");
  revalidatePath("/team/chat");
  revalidatePath("/team/notifications");
  redirect(`/team/chat${target}${target ? "&" : "?"}chat=sent`);
}

export async function markChatRead(target: {
  recipientId?: string | null;
  groupId?: string | null;
}) {
  const { supabase, user } = await getCurrentUser();
  const recipientId = target.recipientId || null;
  const groupId = target.groupId || null;

  const { error } = await supabase.rpc("mark_team_chat_read", {
    p_recipient_id: recipientId,
    p_group_id: groupId,
  });

  if (error) {
    console.error("Team chat read marker failed", error);
    return;
  }

  if (recipientId) {
    const { error: readError } = await supabase
      .from("team_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .eq("sender_id", recipientId)
      .is("read_at", null);

    if (readError) {
      console.error("Direct message read_at update failed", readError);
    }
  }

  revalidatePath("/team/chat");
}

export async function markNotificationRead(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const notificationId = cleanText(formData.get("notificationId"));
  const returnTo = safeTeamPath(formData.get("returnTo"), "/team/notifications");

  if (notificationId) {
    const { error } = await supabase
      .from("team_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("recipient_id", user.id);

    if (error) {
      console.error("Team notification read update failed", error);
    }
  }

  revalidatePath("/team");
  revalidatePath("/team/notifications");
  redirect(returnTo);
}

export async function markAllNotificationsRead(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const returnTo = safeTeamPath(formData.get("returnTo"), "/team/notifications");

  const { error } = await supabase
    .from("team_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Team notifications bulk read update failed", error);
  }

  revalidatePath("/team");
  revalidatePath("/team/notifications");
  redirect(returnTo);
}

export async function openNotification(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const notificationId = cleanText(formData.get("notificationId"));

  if (!notificationId) redirect("/team/notifications");

  const { data: notification, error } = await supabase
    .from("team_notifications")
    .select("href")
    .eq("id", notificationId)
    .eq("recipient_id", user.id)
    .maybeSingle<{ href: string }>();

  if (error || !notification) redirect("/team/notifications");

  await supabase
    .from("team_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);

  revalidatePath("/team");
  revalidatePath("/team/notifications");
  redirect(safeTeamPath(notification.href, "/team/notifications"));
}

export async function deleteNotification(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const notificationId = cleanText(formData.get("notificationId"));

  if (notificationId) {
    const { error } = await supabase
      .from("team_notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_id", user.id);

    if (error) console.error("Team notification delete failed", error);
  }

  revalidatePath("/team");
  revalidatePath("/team/notifications");
  redirect("/team/notifications");
}

export async function deleteReadNotifications() {
  const { supabase, user } = await getCurrentUser();
  const { error } = await supabase
    .from("team_notifications")
    .delete()
    .eq("recipient_id", user.id)
    .not("read_at", "is", null);

  if (error) console.error("Read notification cleanup failed", error);

  revalidatePath("/team");
  revalidatePath("/team/notifications");
  redirect("/team/notifications?notice=read-deleted");
}

export async function updateNotificationPreferences(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const digest = requireChoice(
    formData.get("emailDigest"),
    ["off", "daily", "weekly"] as const,
    "off",
  );
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const quietStart = cleanText(formData.get("quietHoursStart"));
  const quietEnd = cleanText(formData.get("quietHoursEnd"));
  const timezone = cleanText(formData.get("timezone")) || "Africa/Cairo";
  const checked = (name: string) => formData.get(name) === "on";

  const { error } = await supabase.from("team_notification_preferences").upsert({
    user_id: user.id,
    browser_notifications: checked("browserNotifications"),
    toast_enabled: checked("toastEnabled"),
    sound_enabled: checked("soundEnabled"),
    task_alerts: checked("taskAlerts"),
    chat_alerts: checked("chatAlerts"),
    attendance_alerts: checked("attendanceAlerts"),
    admin_alerts: checked("adminAlerts"),
    email_digest: digest,
    quiet_hours_start: quietStart && timePattern.test(quietStart) ? quietStart : null,
    quiet_hours_end: quietEnd && timePattern.test(quietEnd) ? quietEnd : null,
    timezone: timezone.slice(0, 80),
  });

  if (error) {
    console.error("Notification preferences save failed", error);
    redirect("/team/notifications?notice=preferences-failed");
  }

  await supabase.rpc("log_team_auth_event", {
    p_action: "notifications.preferences_updated",
    p_metadata: { email_digest: digest },
  });

  revalidatePath("/team");
  revalidatePath("/team/notifications");
  redirect("/team/notifications?notice=preferences-saved");
}

export async function editTeamMessage(formData: FormData) {
  const { supabase } = await getCurrentUser();
  const messageId = cleanText(formData.get("messageId"));
  const body = cleanText(formData.get("body"));
  const returnTo = safeTeamReturnTo(formData.get("returnTo"));

  if (!messageId || !body || body.length > 1200) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=edit-failed`);
  }

  const { error } = await supabase.rpc("edit_team_message", {
    p_message_id: messageId,
    p_body: body,
  });

  if (error) {
    console.error("Team message edit failed", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=${chatFailureCode(error)}`);
  }

  revalidatePath("/team/chat");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=edited`);
}

export async function toggleTeamMessagePin(formData: FormData) {
  const { supabase } = await getCurrentUser();
  const messageId = cleanText(formData.get("messageId"));
  const returnTo = safeTeamReturnTo(formData.get("returnTo"));

  if (!messageId) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=pin-failed`);
  }

  const { error } = await supabase.rpc("toggle_team_message_pin", {
    p_message_id: messageId,
  });

  if (error) {
    console.error("Team message pin update failed", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=${chatFailureCode(error)}`);
  }

  revalidatePath("/team/chat");
  redirect(returnTo);
}

export async function reactToMessage(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const messageId = cleanText(formData.get("messageId"));
  const emoji = cleanText(formData.get("emoji"));
  const returnTo = safeTeamReturnTo(formData.get("returnTo"));
  const allowed = ["👍", "❤️", "😂", "🔥", "✅", "👀"];

  if (!messageId || !emoji || !allowed.includes(emoji)) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=reaction-failed`);
  }

  const { data: existing } = await supabase
    .from("team_message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle<{ id: string }>();

  if (existing) {
    const { error } = await supabase
      .from("team_message_reactions")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Team message reaction delete failed", error);
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=reaction-failed`);
    }
  } else {
    const { error } = await supabase.from("team_message_reactions").insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    });

    if (error) {
      console.error("Team message reaction save failed", error);
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=reaction-failed`);
    }
  }

  revalidatePath("/team/chat");
  redirect(returnTo);
}

export async function deleteTeamMessage(formData: FormData) {
  const { supabase, user, member } = await getCurrentMember();
  const messageId = cleanText(formData.get("messageId"));
  const returnTo = safeTeamReturnTo(formData.get("returnTo"));

  if (!messageId) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=delete-failed`);
  }

  if (!canManageTeam(member, user.email)) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=delete-not-allowed`);
  }

  const { error } = await supabase
    .from("team_messages")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      deleted_label: "Deleted by admin",
    })
    .eq("id", messageId);

  if (error) {
    console.error("Team message delete failed", error);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=delete-failed`);
  }

  revalidatePath("/team/chat");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}chat=deleted`);
}

export async function createChatGroup(formData: FormData) {
  const { supabase, user } = await getCurrentUser();
  const name = cleanText(formData.get("name"));
  const description = cleanText(formData.get("description"));
  const memberIds = new Set(
    formData
      .getAll("members")
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  );

  memberIds.add(user.id);

  if (!name) {
    redirect("/team/chat?chat=group-missing");
  }

  const { data: group, error } = await supabase
    .from("team_chat_groups")
    .insert({
      name,
      description,
      created_by: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !group) {
    console.error("Team chat group create failed", error);
    redirect(`/team/chat?chat=${error ? chatFailureCode(error) : "group-failed"}`);
  }

  const { error: memberError } = await supabase.from("team_chat_group_members").insert(
    Array.from(memberIds).map((memberId) => ({
      group_id: group.id,
      member_id: memberId,
    })),
  );

  if (memberError) {
    console.error("Team chat group members create failed", memberError);
    redirect(`/team/chat?group=${group.id}&chat=${chatFailureCode(memberError)}`);
  }

  revalidatePath("/team/chat");
  redirect(`/team/chat?group=${group.id}&chat=group-created`);
}
