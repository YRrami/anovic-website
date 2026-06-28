"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function safeTeamRedirect(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";

  if (
    !path.startsWith("/team") ||
    path.startsWith("/team/login") ||
    path.startsWith("//") ||
    path.includes("://")
  ) {
    return "/team";
  }

  return path;
}

function loginErrorCode(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "unconfirmed";
  }

  if (normalized.includes("invalid") || normalized.includes("credentials")) {
    return "invalid";
  }

  return "auth";
}

export async function signIn(formData: FormData) {
  const nextPath = safeTeamRedirect(formData.get("next"));
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!getSupabaseConfig()) {
    redirect("/team/login?setup=missing");
  }

  if (!email || !password) {
    redirect(`/team/login?error=missing&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const code = loginErrorCode(error.message);
    redirect(`/team/login?error=${code}&next=${encodeURIComponent(nextPath)}`);
  }

  const { data: authData } = await supabase.auth.getUser();
  if (authData.user) {
    const { data: member } = await supabase
      .from("team_members")
      .select("is_active")
      .eq("id", authData.user.id)
      .maybeSingle<{ is_active: boolean }>();
    if (member?.is_active === false) {
      await supabase.auth.signOut({ scope: "local" });
      redirect("/team/login?error=inactive");
    }
    await supabase.rpc("log_team_auth_event", { p_action: "auth.sign_in", p_metadata: {} });
  }

  redirect(nextPath);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) redirect("/team/login?error=missing");

  const requestHeaders = await headers();
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const requestOrigin = requestHeaders.get("origin");
  const origin = configuredOrigin || requestOrigin || "http://localhost:3001";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(origin).origin}/team/auth/callback?next=/team/reset-password`,
  });

  if (error) console.error("Password reset request failed", error);
  redirect("/team/login?reset=sent");
}
