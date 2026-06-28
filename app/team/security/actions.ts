"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/team/login");
  return { supabase, user: data.user };
}

export async function updateTeamPassword(formData: FormData) {
  const { supabase } = await authenticatedClient();
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmation") || "");
  const strongPassword = password.length >= 12 && /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

  if (!strongPassword || password !== confirmation) {
    redirect("/team/security?security=password-invalid");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("Team password update failed", error);
    redirect("/team/security?security=password-failed");
  }

  await supabase.rpc("log_team_auth_event", {
    p_action: "auth.password_changed",
    p_metadata: {},
  });
  revalidatePath("/team/security");
  redirect("/team/security?security=password-updated");
}

export async function signOutOtherSessions() {
  const { supabase } = await authenticatedClient();
  await supabase.rpc("log_team_auth_event", {
    p_action: "auth.other_sessions_revoked",
    p_metadata: {},
  });
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    console.error("Other session revocation failed", error);
    redirect("/team/security?security=sessions-failed");
  }
  redirect("/team/security?security=sessions-revoked");
}
