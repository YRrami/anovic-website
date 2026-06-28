"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canManageTeam, type TeamMember } from "../_lib/data";

async function managerContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/team/login");
  const { data: member } = await supabase.from("team_members")
    .select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active")
    .eq("id", data.user.id).maybeSingle<TeamMember>();
  if (!canManageTeam(member, data.user.email)) redirect("/team/profile");
  return { supabase, user: data.user, member };
}

export async function inviteTeamMember(formData: FormData) {
  const { user, member } = await managerContext();
  if (!hasSupabaseAdminConfig()) redirect("/team/admin?access=service-key-missing");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") || "").trim().slice(0, 120);
  const requestedRole = String(formData.get("role") || "employee");
  const allowedRoles = member?.role === "owner" ? ["employee", "manager", "admin"] : ["employee", "manager"];
  const role = allowedRoles.includes(requestedRole) ? requestedRole : "employee";
  if (!email.includes("@")) redirect("/team/admin?access=invite-invalid");

  const requestHeaders = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || requestHeaders.get("origin") || "http://localhost:3001";
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName || undefined },
    redirectTo: `${new URL(origin).origin}/team/auth/callback?next=/team/reset-password`,
  });
  if (error || !data.user) {
    console.error("Team invitation failed", error);
    redirect("/team/admin?access=invite-failed");
  }

  await admin.from("team_members").upsert({
    id: data.user.id, email, full_name: fullName || null, role, status: "away", is_active: true,
  });
  await admin.from("team_notification_preferences").upsert({ user_id: data.user.id });
  await admin.from("team_audit_logs").insert({
    actor_id: user.id,
    action: "auth.user_invited",
    entity_table: "team_members",
    entity_id: data.user.id,
    target_user_id: data.user.id,
    metadata: { email, role },
  });

  revalidatePath("/team/admin");
  revalidatePath("/team/teammates");
  redirect("/team/admin?access=invited");
}

export async function updateTeamMemberAccess(formData: FormData) {
  const { supabase } = await managerContext();
  const memberId = String(formData.get("memberId") || "").trim();
  const role = String(formData.get("role") || "employee");
  const isActive = formData.get("isActive") === "on";
  const mfaRequired = formData.get("mfaRequired") === "on";
  if (!memberId) redirect("/team/admin?access=member-missing");

  const { error } = await supabase.rpc("manage_team_member_access", {
    p_member_id: memberId,
    p_role: role,
    p_is_active: isActive,
    p_mfa_required: mfaRequired,
  });
  if (error) {
    console.error("Team member access update failed", error);
    redirect("/team/admin?access=update-failed");
  }

  revalidatePath("/team/admin");
  revalidatePath("/team/teammates");
  redirect("/team/admin?access=updated");
}
