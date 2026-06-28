import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink, FileSpreadsheet, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import CrmShell from "../_components/CrmShell";
import CrmSubmitButton from "../_components/CrmSubmitButton";
import { changeCrmMemberAccess, importLeadsFromGoogleSheet, saveCrmIntegrations, setCrmAccess, setCrmMemberMfa, syncLeadsToGoogleSheets } from "../actions";
import type { CrmMember, CrmSettings } from "../_lib/data";
import { canManageCrm, memberName, requireCrmSession, shortDate } from "../_lib/data";

export default async function CrmSettingsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { supabase, member } = await requireCrmSession();
  if (!canManageCrm(member)) redirect("/crm");
  const params = await searchParams;
  const [{ data: memberData }, { data: settingsData }] = await Promise.all([
    supabase.from("crm_members").select("user_id,email,full_name,role,is_active,mfa_required").order("created_at"),
    supabase.from("crm_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const members = (memberData || []) as CrmMember[];
  const settings = settingsData as CrmSettings | null;

  return <CrmShell active="settings" member={member}>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="crm-kicker">Administration</p><h1 className="crm-title">Settings</h1><p className="crm-subtitle">Manage access, automatic lead imports, security, and integrations.</p></div>
      <div className="flex gap-2"><Link href="/crm/security" className="crm-button-secondary"><ShieldCheck size={16} />Security</Link><Link href="/crm/audit" className="crm-button-secondary">Audit log</Link></div>
    </header>
    {(params.success || params.error) && <p className={`crm-alert mt-6 ${params.error ? "crm-alert-error" : "crm-alert-success"}`}>{params.error || params.success}</p>}

    <section className="crm-card mt-7 overflow-hidden">
      <div className="crm-card-header"><div><p className="crm-kicker">Lead source</p><h2 className="text-xl font-black">Import from Google Sheets</h2></div><ArrowDownToLine size={21} className="text-indigo-600" /></div>
      <div className="grid gap-6 border-t border-gray-200 p-5 lg:grid-cols-[minmax(0,1fr)_340px] sm:p-6">
        <form action={saveCrmIntegrations} className="space-y-4">
          <label className="crm-label">Google Sheet URL<input className="crm-field" name="google_sheet_url" type="url" defaultValue={settings?.google_sheet_url || ""} placeholder="https://docs.google.com/spreadsheets/d/..." required /></label>
          <label className="crm-label">Sheet tab ID (gid)<input className="crm-field" name="google_import_gid" defaultValue={settings?.google_import_gid || "0"} placeholder="0" /></label>
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"><input className="mt-1" type="checkbox" name="google_import_enabled" defaultChecked={Boolean(settings?.google_import_enabled)} /><span><strong className="block text-sm">Automatically check every hour</strong><span className="mt-1 block text-xs font-bold leading-5 text-gray-500">Requires CRON_SECRET and SUPABASE_SERVICE_ROLE_KEY in production.</span></span></label>
          <input type="hidden" name="google_apps_script_webhook" value={settings?.google_apps_script_webhook || ""} />
          <CrmSubmitButton pendingLabel="Saving source...">Save Google Sheet</CrmSubmitButton>
        </form>
        <div className="rounded-lg bg-gray-950 p-5 text-white">
          <FileSpreadsheet size={22} className="text-yellow-300" /><h3 className="mt-4 font-black">Import status</h3>
          <p className="mt-2 text-sm leading-6 text-gray-300">The Sheet must be shared as <strong className="text-white">Anyone with the link can view</strong>. Existing leads are matched by lead_id, email, or phone and are not duplicated.</p>
          <dl className="mt-4 space-y-2 text-xs font-bold"><div className="flex justify-between gap-3"><dt className="text-gray-400">Last import</dt><dd>{shortDate(settings?.google_import_last_synced_at || null)}</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-400">Result</dt><dd className="text-right">{settings?.google_import_last_result || "Not run"}</dd></div></dl>
          <div className="mt-5 space-y-2">{settings?.google_sheet_url && <><form action={importLeadsFromGoogleSheet}><CrmSubmitButton className="crm-button-yellow w-full" pendingLabel="Importing..."><RefreshCw size={16} />Import new leads now</CrmSubmitButton></form><a href={settings.google_sheet_url} target="_blank" rel="noreferrer" className="crm-button-secondary w-full"><ExternalLink size={16} />Open source Sheet</a></>}</div>
        </div>
      </div>
    </section>

    <details className="crm-card mt-6 overflow-hidden">
      <summary className="crm-card-header cursor-pointer list-none"><div><p className="crm-kicker">Optional</p><h2 className="text-lg font-black">Export CRM leads to Google Sheets</h2></div><ArrowUpFromLine size={20} className="text-indigo-600" /></summary>
      <div className="grid gap-6 border-t border-gray-200 p-5 lg:grid-cols-[minmax(0,1fr)_320px] sm:p-6">
        <form action={saveCrmIntegrations} className="space-y-4">
          <input type="hidden" name="google_sheet_url" value={settings?.google_sheet_url || ""} /><input type="hidden" name="google_import_gid" value={settings?.google_import_gid || "0"} />{settings?.google_import_enabled && <input type="hidden" name="google_import_enabled" value="on" />}
          <label className="crm-label">Apps Script Web App URL<input className="crm-field" name="google_apps_script_webhook" type="url" defaultValue={settings?.google_apps_script_webhook || ""} placeholder="https://script.google.com/macros/s/.../exec" /></label>
          <label className="crm-label">Sync secret<input className="crm-field" name="google_sync_token" type="password" placeholder={settings?.google_sync_token ? "Configured - leave blank to keep it" : "Use a long random secret"} /></label>
          <CrmSubmitButton pendingLabel="Saving export...">Save export settings</CrmSubmitButton>
        </form>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5"><p className="text-sm font-black">Apps Script setup</p><p className="mt-2 text-xs font-bold leading-5 text-gray-500">Use <code>docs/crm-google-sheets-apps-script.js</code> when CRM should overwrite a reporting Sheet with its current leads.</p><div className="mt-4 space-y-2">{settings?.google_apps_script_webhook && <form action={syncLeadsToGoogleSheets}><CrmSubmitButton className="crm-button-secondary w-full" pendingLabel="Exporting..."><RefreshCw size={16} />Export CRM leads now</CrmSubmitButton></form>}<Link href="/crm/leads/export" className="crm-button-secondary w-full"><FileSpreadsheet size={16} />Download CSV</Link></div></div>
      </div>
    </details>

    <section className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <div className="crm-card p-5 sm:p-6"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><UserPlus size={21} /></span><h2 className="mt-5 text-xl font-black">Grant access</h2><p className="mt-2 text-sm leading-6 text-gray-500">The account must already exist in Supabase Authentication.</p><form action={setCrmAccess} className="mt-5 space-y-4"><label className="crm-label">Account email<input className="crm-field" name="email" type="email" required /></label><label className="crm-label">Role<select className="crm-field" name="role"><option value="sales">Sales</option><option value="admin">Admin</option></select></label><input type="hidden" name="is_active" value="true" /><CrmSubmitButton className="crm-button w-full" pendingLabel="Granting...">Grant CRM access</CrmSubmitButton></form></div>
      <div className="crm-card overflow-hidden"><div className="crm-card-header"><div><p className="crm-kicker">Authorized users</p><h2 className="text-xl font-black">CRM members</h2></div><ShieldCheck size={20} className="text-indigo-600" /></div><div className="divide-y divide-gray-100">{members.map((item) => <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_140px_150px_150px] md:items-center" key={item.user_id}><div className="min-w-0"><p className="truncate font-black">{memberName(item)}</p><p className="truncate text-xs font-bold text-gray-500">{item.email}</p></div>{item.role === "owner" ? <><span className="crm-badge w-fit bg-indigo-50 text-indigo-700">Owner</span><span className="text-xs font-bold text-gray-500">Permanent access</span></> : <form action={changeCrmMemberAccess.bind(null, item.email)} className="contents"><select className="crm-field" name="role" defaultValue={item.role}><option value="sales">Sales</option><option value="admin">Admin</option></select><div className="flex gap-2"><select className="crm-field min-w-0" name="is_active" defaultValue={String(item.is_active)}><option value="true">Active</option><option value="false">Inactive</option></select><CrmSubmitButton className="crm-icon-button shrink-0" pendingLabel=""><ShieldCheck size={16} /><span className="sr-only">Save access</span></CrmSubmitButton></div></form>}<form action={setCrmMemberMfa.bind(null, item.user_id)} className="flex gap-2"><select className="crm-field min-w-0" name="mfa_required" defaultValue={String(Boolean(item.mfa_required))}><option value="false">MFA optional</option><option value="true">MFA required</option></select><CrmSubmitButton className="crm-icon-button shrink-0" pendingLabel=""><ShieldCheck size={16} /><span className="sr-only">Save MFA rule</span></CrmSubmitButton></form></div>)}</div></div>
    </section>
  </CrmShell>;
}
