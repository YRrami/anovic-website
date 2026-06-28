import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const CRM_OWNER_EMAIL = "johnjohn444465@gmail.com";

export type CrmMember = {
  user_id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "sales";
  is_active: boolean;
  mfa_required?: boolean;
};

export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export type CrmLead = {
  id: string;
  contact_name: string;
  company_name: string | null;
  category: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  source: string;
  status: LeadStatus;
  priority: "low" | "normal" | "high" | "urgent";
  estimated_value: number;
  currency: string;
  owner_id: string | null;
  next_follow_up_at: string | null;
  summary: string | null;
  lost_reason: string | null;
  converted_client_id: string | null;
  converted_at: string | null;
  archived_at: string | null;
  archived_by: string | null;
  external_source: string | null;
  external_key: string | null;
  imported_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmClient = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: "onboarding" | "active" | "inactive";
  account_value: number;
  currency: string;
  owner_id: string | null;
  converted_from_lead: string | null;
  service_summary: string | null;
  contract_start: string | null;
  renewal_date: string | null;
  payment_status: "not_set" | "pending" | "paid" | "overdue";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmActivity = {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  activity_type: "note" | "call" | "email" | "meeting" | "follow_up" | "status_change" | "system";
  title: string;
  body: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type CrmContact = {
  id: string; client_id: string; full_name: string; job_title: string | null;
  email: string | null; phone: string | null; is_primary: boolean; created_by: string | null; created_at: string;
};

export type CrmAttachment = {
  id: string; lead_id: string | null; client_id: string | null; file_name: string;
  storage_path: string; mime_type: string | null; file_size: number; uploaded_by: string | null; created_at: string;
  signed_url?: string | null;
};

export type CrmNotification = {
  id: string; recipient_id: string; actor_id: string | null;
  type: "lead_assigned" | "lead_updated" | "follow_up" | "client" | "system";
  title: string; body: string | null; href: string; entity_table: string | null;
  entity_id: string | null; read_at: string | null; created_at: string;
};

export type CrmSettings = {
  id: number; google_sheet_url: string | null; google_apps_script_webhook: string | null;
  google_sync_token: string | null; google_import_enabled: boolean; google_import_gid: string;
  google_import_last_synced_at: string | null; google_import_last_result: string | null;
  updated_by: string | null; updated_at: string;
};

export const leadStages: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export async function requireCrmSession(options: { allowMfaSetup?: boolean } = {}) {
  if (!getSupabaseConfig()) redirect("/crm/login?setup=missing");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) redirect("/crm/login");

  const { data: member, error: memberError } = await supabase
    .from("crm_members")
    .select("user_id,email,full_name,role,is_active,mfa_required")
    .eq("user_id", claims.sub)
    .maybeSingle<CrmMember>();

  if (memberError) {
    const message = memberError.message.toLowerCase();
    if (message.includes("crm_members") || message.includes("schema cache") || message.includes("relation")) {
      redirect("/crm/login?setup=sql");
    }
    redirect("/crm/login?error=access");
  }
  if (!member?.is_active) redirect("/crm/auth/signout?reason=access");

  if (member.mfa_required && !options.allowMfaSetup) {
    const [{ data: factors }, { data: assurance }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    const verified = Boolean(factors?.totp.some((factor) => factor.status === "verified"));
    if (!verified || assurance?.currentLevel !== "aal2") redirect("/crm/security?mfa=required");
  }

  return { supabase, member, user: { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null } };
}

export function canManageCrm(member: Pick<CrmMember, "role" | "email">) {
  return member.email.toLowerCase() === CRM_OWNER_EMAIL || member.role === "owner" || member.role === "admin";
}

export function memberName(member: Pick<CrmMember, "full_name" | "email"> | null | undefined) {
  return member?.full_name || member?.email || "Unassigned";
}

export function money(value: number | string | null | undefined, currency = "EGP") {
  return new Intl.NumberFormat("en-EG", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function shortDate(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function crmSetupNotice() {
  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-5 py-4 text-sm font-bold text-gray-950">
      CRM tables are not installed. Run the latest <code className="rounded bg-white px-2 py-1">supabase/team-complete.sql</code> in Supabase, then refresh.
    </div>
  );
}
