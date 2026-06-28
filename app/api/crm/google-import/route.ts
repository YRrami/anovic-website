import { createAdminClient, hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { fetchGoogleSheetRows, importLeadRows } from "@/lib/crm/import";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSupabaseAdminConfig()) return Response.json({ error: "Server admin configuration missing" }, { status: 503 });
  const supabase = createAdminClient();
  const [{ data: settings, error: settingsError }, { data: owner, error: ownerError }] = await Promise.all([
    supabase.from("crm_settings").select("google_sheet_url,google_import_gid,google_import_enabled").eq("id", 1).maybeSingle(),
    supabase.from("crm_members").select("user_id").eq("email", "johnjohn444465@gmail.com").eq("is_active", true).maybeSingle(),
  ]);
  if (settingsError || ownerError) return Response.json({ error: settingsError?.message || ownerError?.message }, { status: 500 });
  if (!settings?.google_import_enabled || !settings.google_sheet_url) return Response.json({ skipped: "Automatic Google import is disabled" });
  if (!owner?.user_id) return Response.json({ error: "CRM owner account is missing" }, { status: 409 });
  try {
    const rows = await fetchGoogleSheetRows(settings.google_sheet_url, settings.google_import_gid || "0");
    const result = await importLeadRows(supabase, rows, owner.user_id, "google_sheet");
    const summary = `${result.imported} imported, ${result.skipped} skipped`;
    await supabase.from("crm_settings").update({ google_import_last_synced_at: new Date().toISOString(), google_import_last_result: summary }).eq("id", 1);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Sheet import failed";
    await supabase.from("crm_settings").update({ google_import_last_synced_at: new Date().toISOString(), google_import_last_result: `Failed: ${message.slice(0, 300)}` }).eq("id", 1);
    return Response.json({ error: message }, { status: 500 });
  }
}
