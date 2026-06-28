"use server";

import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function safeCrmPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/crm") && !path.startsWith("/crm/login") && !path.startsWith("//") && !path.includes("://") ? path : "/crm";
}

export async function signInCrm(formData: FormData) {
  const nextPath = safeCrmPath(formData.get("next"));
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!getSupabaseConfig()) redirect("/crm/login?setup=missing");
  if (!email || !password) redirect(`/crm/login?error=missing&next=${encodeURIComponent(nextPath)}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect(`/crm/login?error=invalid&next=${encodeURIComponent(nextPath)}`);

  const { data: member } = await supabase.from("crm_members").select("is_active").eq("user_id", data.user.id).maybeSingle<{ is_active: boolean }>();
  if (!member?.is_active) {
    await supabase.auth.signOut({ scope: "local" });
    redirect("/crm/login?error=access");
  }
  redirect(nextPath);
}
