import type { Metadata } from "next";
import TeamShell from "../_components/TeamShell";
import { requireTeamSession, safeList, safeSingle, setupNotice, type TeamAuditLog, type TeamMember } from "../_lib/data";
import MfaControls from "./MfaControls";
import { signOutOtherSessions, updateTeamPassword } from "./actions";

export const metadata: Metadata = { title: "Security | Anovic Team", robots: { index: false, follow: false } };

type SecuritySearchParams = Promise<{ security?: string; mfa?: string }>;

function messageFor(value?: string, mfa?: string) {
  if (mfa === "required") return "Multi-factor authentication is required for this account. Enroll or verify below.";
  if (value === "password-updated") return "Password updated.";
  if (value === "password-invalid") return "Use at least 12 characters with a number and symbol, and make both fields match.";
  if (value === "password-failed") return "Password update failed.";
  if (value === "sessions-revoked") return "Other sessions were signed out.";
  if (value === "sessions-failed") return "Other sessions could not be revoked.";
  return null;
}

export default async function SecurityPage({ searchParams }: { searchParams: SecuritySearchParams }) {
  const params = await searchParams;
  const { supabase, user } = await requireTeamSession({ allowMfaSetup: true });
  const [memberResult, auditResult] = await Promise.all([
    safeSingle<TeamMember>(supabase.from("team_members").select("id,email,full_name,nickname,avatar_url,role,status,job_title,department,phone,is_active,last_seen_at,last_active_at,mfa_required").eq("id", user.id).maybeSingle()),
    safeList<TeamAuditLog>(supabase.from("team_audit_logs").select("id,actor_id,action,entity_table,entity_id,target_user_id,metadata,created_at").or(`actor_id.eq.${user.id},target_user_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(20)),
  ]);
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const message = messageFor(params.security, params.mfa);

  return <TeamShell active="security" member={memberResult.data}>
    <div className="team-page-header"><div><p className="team-kicker">Account security</p><h1 className="team-title">Protect your workspace access</h1><p className="team-subtitle">Password, authenticator, session, and account activity controls.</p></div><div className="team-stat sm:w-56"><p className="team-kicker">Session assurance</p><strong className="team-stat-value text-2xl">{assurance?.currentLevel?.toUpperCase() || "AAL1"}</strong></div></div>
    {(memberResult.setupMissing || auditResult.setupMissing) && <div className="mb-5">{setupNotice()}</div>}
    {message && <p className="mb-5 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-black" role="status">{message}</p>}

    <div className="grid gap-5 xl:grid-cols-2">
      <section className="team-panel p-5"><p className="team-kicker">Multi-factor authentication</p><h2 className="mt-2 text-2xl font-black">Authenticator app</h2><p className="mt-2 text-sm font-bold leading-6 text-gray-500">Use a time-based 6-digit code after your password. {memberResult.data?.mfa_required ? "Your administrator requires this protection." : "Enrollment is currently optional."}</p><div className="mt-5"><MfaControls /></div></section>
      <section className="team-panel p-5"><p className="team-kicker">Password</p><h2 className="mt-2 text-2xl font-black">Change password</h2><form action={updateTeamPassword} className="mt-5 space-y-4"><label className="block text-sm font-black">New password<input className="team-field mt-2" type="password" name="password" autoComplete="new-password" minLength={12} required /></label><label className="block text-sm font-black">Confirm password<input className="team-field mt-2" type="password" name="confirmation" autoComplete="new-password" minLength={12} required /></label><p className="text-xs font-bold leading-5 text-gray-500">At least 12 characters, including a number and symbol.</p><button className="team-button" type="submit">Update password</button></form></section>
      <section className="team-panel p-5"><p className="team-kicker">Sessions</p><h2 className="mt-2 text-2xl font-black">Signed-in devices</h2><p className="mt-2 text-sm font-bold leading-6 text-gray-500">Revoke every session except this browser. Supabase rotates and validates the current session automatically.</p><form action={signOutOtherSessions} className="mt-5"><button className="team-button-secondary" type="submit">Sign out other sessions</button></form></section>
      <section className="team-panel overflow-hidden"><div className="border-b border-gray-200 p-5"><p className="team-kicker">Audit history</p><h2 className="mt-2 text-2xl font-black">Recent account activity</h2></div><div className="divide-y divide-gray-200">{auditResult.data.length === 0 ? <p className="p-5 text-sm font-bold text-gray-500">No audit events yet.</p> : auditResult.data.map((event) => <article key={event.id} className="p-4"><p className="text-sm font-black text-black">{event.action.replaceAll("_", " ")}</p><p className="mt-1 text-xs font-bold text-gray-500">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</p></article>)}</div></section>
    </div>
  </TeamShell>;
}
