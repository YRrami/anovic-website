"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { fetchGoogleSheetRows, importLeadRows, parseCsvRows, parseTabularRows, type LeadImportRow } from "@/lib/crm/import";
import type { CrmMember } from "./_lib/data";
import { canManageCrm } from "./_lib/data";

const stages = new Set(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);
const activityTypes = new Set(["note", "call", "email", "meeting", "follow_up"]);

function text(form: FormData, key: string, max = 500) {
  const value = String(form.get(key) || "").trim();
  return value ? value.slice(0, max) : null;
}

function withoutCategory<T extends { category: unknown }>(record: T): Omit<T, "category"> {
  const copy: Partial<T> = { ...record };
  delete copy.category;
  return copy as Omit<T, "category">;
}

function crmRedirect(path: string, type: "success" | "error", message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}${type}=${encodeURIComponent(message)}`);
}

async function actionSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/crm/login");
  const { data: member } = await supabase.from("crm_members").select("user_id,email,full_name,role,is_active,mfa_required").eq("user_id", id).maybeSingle<CrmMember>();
  if (!member?.is_active) redirect("/crm/auth/signout?reason=access");
  if (member.mfa_required) {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel !== "aal2") redirect("/crm/security?mfa=required");
  }
  return { supabase, member };
}

export async function createLead(form: FormData) {
  const { supabase, member } = await actionSession();
  const contactName = text(form, "contact_name", 120);
  if (!contactName) crmRedirect("/crm/leads", "error", "Contact name is required.");
  const ownerId = text(form, "owner_id", 80) || member.user_id;
  const estimatedValue = Math.max(0, Number(form.get("estimated_value") || 0));
  const priority = text(form, "priority", 20) || "normal";
  const email = text(form, "email", 200)?.toLowerCase();
  const phone = text(form, "phone", 60);
  if (email || phone) {
    let duplicateQuery = supabase.from("crm_leads").select("id,contact_name").is("archived_at", null).limit(1);
    duplicateQuery = email ? duplicateQuery.eq("email", email) : duplicateQuery.eq("phone", phone!);
    const { data: duplicates } = await duplicateQuery;
    if (duplicates?.length) crmRedirect(`/crm/leads/${duplicates[0].id}`, "error", "A lead with this email or phone already exists.");
  }
  const leadPayload = {
    contact_name: contactName,
    company_name: text(form, "company_name", 160),
    category: text(form, "category", 100),
    email,
    phone,
    website: text(form, "website", 300),
    source: text(form, "source", 80) || "other",
    priority: priorities.has(priority) ? priority : "normal",
    estimated_value: Number.isFinite(estimatedValue) ? estimatedValue : 0,
    currency: text(form, "currency", 3)?.toUpperCase() || "EGP",
    owner_id: ownerId,
    next_follow_up_at: text(form, "next_follow_up_at", 40),
    summary: text(form, "summary", 2000),
    created_by: member.user_id,
  };
  let { data: lead, error } = await supabase.from("crm_leads").insert(leadPayload).select("id").single<{ id: string }>();
  if (error?.message.includes("category")) {
    const legacyPayload = withoutCategory(leadPayload);
    ({ data: lead, error } = await supabase.from("crm_leads").insert(legacyPayload).select("id").single<{ id: string }>());
  }
  if (error || !lead) crmRedirect("/crm/leads", "error", error?.message || "Lead could not be created.");
  revalidatePath("/crm");
  revalidatePath("/crm/leads");
  revalidatePath("/crm/pipeline");
  crmRedirect(`/crm/leads/${lead.id}`, "success", "Lead created.");
}

export async function updateLead(leadId: string, form: FormData) {
  const { supabase } = await actionSession();
  const contactName = text(form, "contact_name", 120);
  const status = text(form, "status", 30) || "new";
  const priority = text(form, "priority", 20) || "normal";
  if (!contactName || !stages.has(status) || !priorities.has(priority)) crmRedirect(`/crm/leads/${leadId}`, "error", "Check the required lead fields.");
  const amount = Math.max(0, Number(form.get("estimated_value") || 0));
  const leadUpdates = {
    contact_name: contactName,
    company_name: text(form, "company_name", 160), category: text(form, "category", 100), email: text(form, "email", 200)?.toLowerCase(), phone: text(form, "phone", 60), website: text(form, "website", 300),
    source: text(form, "source", 80) || "other", status, priority,
    estimated_value: Number.isFinite(amount) ? amount : 0, currency: text(form, "currency", 3)?.toUpperCase() || "EGP",
    owner_id: text(form, "owner_id", 80), next_follow_up_at: text(form, "next_follow_up_at", 40), summary: text(form, "summary", 2000), lost_reason: status === "lost" ? text(form, "lost_reason", 1000) : null,
  };
  let { error } = await supabase.from("crm_leads").update(leadUpdates).eq("id", leadId);
  if (error?.message.includes("category")) {
    const legacyUpdates = withoutCategory(leadUpdates);
    ({ error } = await supabase.from("crm_leads").update(legacyUpdates).eq("id", leadId));
  }
  if (error) crmRedirect(`/crm/leads/${leadId}`, "error", error.message);
  revalidatePath("/crm"); revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline"); revalidatePath(`/crm/leads/${leadId}`);
  crmRedirect(`/crm/leads/${leadId}`, "success", "Lead updated.");
}

export async function updateLeadStage(leadId: string, form: FormData) {
  const { supabase } = await actionSession();
  const status = text(form, "status", 30) || "";
  if (!stages.has(status) || status === "won") crmRedirect("/crm/pipeline", "error", "Use client conversion to mark a lead as won.");
  const { error } = await supabase.from("crm_leads").update({ status }).eq("id", leadId).is("converted_client_id", null);
  if (error) crmRedirect("/crm/pipeline", "error", error.message);
  revalidatePath("/crm"); revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline");
  crmRedirect("/crm/pipeline", "success", "Pipeline stage updated.");
}

export async function addLeadActivity(leadId: string, form: FormData) {
  const { supabase, member } = await actionSession();
  const title = text(form, "title", 160);
  const activityType = text(form, "activity_type", 30) || "note";
  if (!title || !activityTypes.has(activityType)) crmRedirect(`/crm/leads/${leadId}`, "error", "Activity title is required.");
  const { error } = await supabase.from("crm_activities").insert({ lead_id: leadId, activity_type: activityType, title, body: text(form, "body", 3000), due_at: text(form, "due_at", 40), created_by: member.user_id });
  if (error) crmRedirect(`/crm/leads/${leadId}`, "error", error.message);
  revalidatePath(`/crm/leads/${leadId}`); revalidatePath("/crm");
  crmRedirect(`/crm/leads/${leadId}`, "success", "Activity added.");
}

export async function completeActivity(activityId: string, leadId: string) {
  const { supabase } = await actionSession();
  const { error } = await supabase.from("crm_activities").update({ completed_at: new Date().toISOString() }).eq("id", activityId);
  if (error) crmRedirect(`/crm/leads/${leadId}`, "error", error.message);
  revalidatePath(`/crm/leads/${leadId}`); revalidatePath("/crm");
  crmRedirect(`/crm/leads/${leadId}`, "success", "Follow-up completed.");
}

export async function convertLead(leadId: string) {
  const { supabase } = await actionSession();
  const { data, error } = await supabase.rpc("convert_crm_lead", { p_lead_id: leadId });
  if (error || !data) crmRedirect(`/crm/leads/${leadId}`, "error", error?.message || "Lead conversion failed.");
  revalidatePath("/crm"); revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline"); revalidatePath("/crm/clients");
  crmRedirect("/crm/clients", "success", "Lead converted to an onboarding client.");
}

export async function updateClientStatus(clientId: string, form: FormData) {
  const { supabase } = await actionSession();
  const status = text(form, "status", 20);
  if (!status || !new Set(["onboarding", "active", "inactive"]).has(status)) crmRedirect("/crm/clients", "error", "Invalid client status.");
  const { error } = await supabase.from("crm_clients").update({ status }).eq("id", clientId);
  if (error) crmRedirect("/crm/clients", "error", error.message);
  revalidatePath("/crm"); revalidatePath("/crm/clients");
  crmRedirect("/crm/clients", "success", "Client status updated.");
}

export async function updateClientDetails(clientId: string, form: FormData) {
  const { supabase } = await actionSession();
  const companyName = text(form, "company_name", 160);
  const paymentStatus = text(form, "payment_status", 20) || "not_set";
  if (!companyName || !new Set(["not_set", "pending", "paid", "overdue"]).has(paymentStatus)) crmRedirect(`/crm/clients/${clientId}`, "error", "Check the client fields.");
  const value = Math.max(0, Number(form.get("account_value") || 0));
  const { error } = await supabase.from("crm_clients").update({ company_name: companyName, contact_name: text(form, "contact_name", 120), email: text(form, "email", 200)?.toLowerCase(), phone: text(form, "phone", 60), website: text(form, "website", 300), service_summary: text(form, "service_summary", 2000), contract_start: text(form, "contract_start", 20), renewal_date: text(form, "renewal_date", 20), payment_status: paymentStatus, account_value: Number.isFinite(value) ? value : 0, currency: text(form, "currency", 3)?.toUpperCase() || "EGP" }).eq("id", clientId);
  if (error) crmRedirect(`/crm/clients/${clientId}`, "error", error.message);
  revalidatePath("/crm/clients"); revalidatePath(`/crm/clients/${clientId}`);
  crmRedirect(`/crm/clients/${clientId}`, "success", "Client details updated.");
}

export async function setCrmAccess(form: FormData) {
  const { supabase, member } = await actionSession();
  if (!canManageCrm(member)) crmRedirect("/crm", "error", "Admin access required.");
  const email = text(form, "email", 200)?.toLowerCase();
  const role = text(form, "role", 20) || "sales";
  const active = form.get("is_active") !== "false";
  if (!email || !email.includes("@") || !new Set(["admin", "sales"]).has(role)) crmRedirect("/crm/settings", "error", "Enter a valid account and role.");
  const { error } = await supabase.rpc("set_crm_member_access", { p_email: email, p_role: role, p_is_active: active });
  if (error) crmRedirect("/crm/settings", "error", error.message);
  revalidatePath("/crm/settings");
  crmRedirect("/crm/settings", "success", "CRM access updated.");
}

export async function changeCrmMemberAccess(email: string, form: FormData) {
  const copy = new FormData();
  copy.set("email", email); copy.set("role", String(form.get("role") || "sales")); copy.set("is_active", String(form.get("is_active") || "true"));
  return setCrmAccess(copy);
}

export async function setCrmMemberMfa(userId: string, form: FormData) {
  const { supabase, member } = await actionSession();
  if (!canManageCrm(member)) crmRedirect("/crm/settings", "error", "Admin access required.");
  const { error } = await supabase.rpc("set_crm_member_mfa", { p_user_id: userId, p_required: form.get("mfa_required") === "true" });
  if (error) crmRedirect("/crm/settings", "error", error.message);
  revalidatePath("/crm/settings"); crmRedirect("/crm/settings", "success", "MFA requirement updated.");
}

export async function archiveLead(leadId: string) {
  const { supabase, member } = await actionSession();
  const { error } = await supabase.from("crm_leads").update({ archived_at: new Date().toISOString(), archived_by: member.user_id }).eq("id", leadId);
  if (error) crmRedirect(`/crm/leads/${leadId}`, "error", error.message);
  revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline");
  crmRedirect("/crm/leads?archived=1", "success", "Lead archived.");
}

export async function restoreLead(leadId: string) {
  const { supabase } = await actionSession();
  const { error } = await supabase.from("crm_leads").update({ archived_at: null, archived_by: null }).eq("id", leadId);
  if (error) crmRedirect("/crm/leads?archived=1", "error", error.message);
  revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline");
  crmRedirect(`/crm/leads/${leadId}`, "success", "Lead restored.");
}

export async function deleteLead(leadId: string) {
  const { supabase, member } = await actionSession();
  if (!canManageCrm(member)) crmRedirect("/crm/leads", "error", "Admin access required.");
  const { error } = await supabase.from("crm_leads").delete().eq("id", leadId).not("archived_at", "is", null);
  if (error) crmRedirect("/crm/leads?archived=1", "error", error.message);
  revalidatePath("/crm/leads");
  crmRedirect("/crm/leads?archived=1", "success", "Archived lead permanently deleted.");
}

export async function bulkUpdateLeads(form: FormData) {
  const { supabase, member } = await actionSession();
  const ids = form.getAll("lead_id").map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 200);
  if (!ids.length) crmRedirect("/crm/leads", "error", "Select at least one lead.");
  const operation = text(form, "bulk_operation", 30);
  let update: Record<string, string | null> = {};
  if (operation === "archive") update = { archived_at: new Date().toISOString(), archived_by: member.user_id };
  else if (operation === "stage") {
    const status = text(form, "bulk_status", 30) || "";
    if (!stages.has(status) || status === "won") crmRedirect("/crm/leads", "error", "Choose a valid stage.");
    update = { status };
  } else if (operation === "owner") {
    if (!canManageCrm(member)) crmRedirect("/crm/leads", "error", "Admin access required for reassignment.");
    update = { owner_id: text(form, "bulk_owner", 80) };
  } else crmRedirect("/crm/leads", "error", "Choose a bulk operation.");
  const { error } = await supabase.from("crm_leads").update(update).in("id", ids);
  if (error) crmRedirect("/crm/leads", "error", error.message);
  revalidatePath("/crm"); revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline");
  crmRedirect("/crm/leads", "success", `${ids.length} leads updated.`);
}

export async function importLeadsCsv(form: FormData) {
  const { supabase, member } = await actionSession();
  const { data: allowed } = await supabase.rpc("crm_check_rate_limit", { p_action: "csv_import", p_max_requests: 5, p_window_seconds: 300 });
  if (!allowed) crmRedirect("/crm/leads", "error", "Import limit reached. Try again in five minutes.");
  const file = form.get("csv");
  if (!(file instanceof File) || !file.size || file.size > 2_000_000) crmRedirect("/crm/leads", "error", "Choose a CSV file under 2 MB.");
  let rows: Record<string, string>[];
  try {
    rows = parse(await file.text(), { columns: (headers: string[]) => headers.map((header) => header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")), skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });
  } catch { crmRedirect("/crm/leads", "error", "The CSV file could not be parsed."); }
  if (!rows!.length || rows!.length > 1000) crmRedirect("/crm/leads", "error", "CSV imports must contain between 1 and 1,000 rows.");
  const { data: existing } = await supabase.from("crm_leads").select("email").not("email", "is", null);
  const emails = new Set((existing || []).map((item) => String(item.email).toLowerCase()));
  const records = rows!.flatMap((row) => {
    const contactName = (row.contact_name || row.name || "").slice(0, 120);
    const email = (row.email || "").toLowerCase().slice(0, 200) || null;
    if (!contactName || (email && emails.has(email))) return [];
    if (email) emails.add(email);
    const value = Math.max(0, Number(row.estimated_value || row.value || 0));
    return [{ contact_name: contactName, company_name: (row.company_name || row.company || "").slice(0, 160) || null, email, phone: (row.phone || "").slice(0, 60) || null, source: (row.source || "import").slice(0, 80), status: stages.has(row.status) ? row.status : "new", priority: priorities.has(row.priority) ? row.priority : "normal", estimated_value: Number.isFinite(value) ? value : 0, currency: (row.currency || "EGP").slice(0, 3).toUpperCase(), owner_id: member.user_id, summary: (row.summary || row.notes || "").slice(0, 2000) || null, created_by: member.user_id }];
  });
  if (!records.length) crmRedirect("/crm/leads", "error", "No new valid leads were found. Duplicate emails were skipped.");
  const { error } = await supabase.from("crm_leads").insert(records);
  if (error) crmRedirect("/crm/leads", "error", error.message);
  revalidatePath("/crm"); revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline");
  crmRedirect("/crm/leads", "success", `${records.length} leads imported.`);
}

function excelCellText(cellValue: ExcelJS.CellValue) {
  if (cellValue === null || cellValue === undefined) return "";
  if (cellValue instanceof Date) return cellValue.toISOString();
  if (typeof cellValue !== "object") return String(cellValue);
  if ("text" in cellValue) return String(cellValue.text || "");
  if ("result" in cellValue) return String(cellValue.result || "");
  if ("richText" in cellValue) return cellValue.richText.map((part) => part.text).join("");
  return "";
}

export async function importLeadsFile(form: FormData) {
  const { supabase, member } = await actionSession();
  const { data: allowed } = await supabase.rpc("crm_check_rate_limit", { p_action: "lead_file_import", p_max_requests: 5, p_window_seconds: 300 });
  if (!allowed) crmRedirect("/crm/leads", "error", "Import limit reached. Try again in five minutes.");
  const file = form.get("lead_file");
  if (!(file instanceof File) || !file.size || file.size > 8_000_000) crmRedirect("/crm/leads", "error", "Choose an Excel or CSV file under 8 MB.");
  const extension = file.name.toLowerCase().split(".").pop();
  let rows: LeadImportRow[] = [];
  try {
    if (extension === "csv") rows = parseCsvRows(await file.text());
    else if (extension === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const workbookBytes = await file.arrayBuffer();
      await workbook.xlsx.load(workbookBytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      if (!workbook.worksheets.length) throw new Error("Workbook has no worksheets.");
      rows = workbook.worksheets.flatMap((worksheet) => {
        const matrix: string[][] = [];
        for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
          const values: string[] = [];
          const row = worksheet.getRow(rowNumber);
          for (let column = 1; column <= Math.max(worksheet.columnCount, row.cellCount); column += 1) values[column - 1] = excelCellText(row.getCell(column).value);
          matrix.push(values);
        }
        return parseTabularRows(matrix);
      });
    } else crmRedirect("/crm/leads", "error", "Use an .xlsx or .csv file.");
    const result = await importLeadRows(supabase, rows, member.user_id, extension === "xlsx" ? "excel" : "csv");
    revalidatePath("/crm"); revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline");
    crmRedirect("/crm/leads", "success", `${result.imported} leads imported; ${result.skipped} duplicate or invalid rows skipped.`);
  } catch (error) {
    crmRedirect("/crm/leads", "error", error instanceof Error ? error.message : "Lead file import failed.");
  }
}

export async function importLeadsFromGoogleSheet() {
  const { supabase, member } = await actionSession();
  if (!canManageCrm(member)) crmRedirect("/crm/settings", "error", "Admin access required.");
  const { data: allowed } = await supabase.rpc("crm_check_rate_limit", { p_action: "google_import", p_max_requests: 8, p_window_seconds: 300 });
  if (!allowed) crmRedirect("/crm/settings", "error", "Google import limit reached. Try again in five minutes.");
  const { data: settings } = await supabase.from("crm_settings").select("google_sheet_url,google_import_gid").eq("id", 1).maybeSingle();
  if (!settings?.google_sheet_url) crmRedirect("/crm/settings", "error", "Save a Google Sheet URL first.");
  try {
    const rows = await fetchGoogleSheetRows(settings.google_sheet_url, settings.google_import_gid || "0");
    const result = await importLeadRows(supabase, rows, member.user_id, "google_sheet");
    await supabase.from("crm_settings").update({ google_import_last_synced_at: new Date().toISOString(), google_import_last_result: `${result.imported} imported, ${result.skipped} skipped` }).eq("id", 1);
    revalidatePath("/crm"); revalidatePath("/crm/leads"); revalidatePath("/crm/pipeline"); revalidatePath("/crm/settings");
    crmRedirect("/crm/settings", "success", `${result.imported} new leads imported from Google Sheets; ${result.skipped} rows skipped.`);
  } catch (error) { crmRedirect("/crm/settings", "error", error instanceof Error ? error.message : "Google Sheet import failed."); }
}

export async function uploadCrmAttachment(parentType: "lead" | "client", parentId: string, form: FormData) {
  const { supabase, member } = await actionSession();
  const file = form.get("attachment");
  if (!(file instanceof File) || !file.size || file.size > 8_388_608) crmRedirect(parentType === "lead" ? `/crm/leads/${parentId}` : `/crm/clients/${parentId}`, "error", "Choose an allowed file under 8 MB.");
  const allowed = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "text/csv", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
  if (!allowed.has(file.type)) crmRedirect(parentType === "lead" ? `/crm/leads/${parentId}` : `/crm/clients/${parentId}`, "error", "This file type is not allowed.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
  const path = `${member.user_id}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("crm-files").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) crmRedirect(parentType === "lead" ? `/crm/leads/${parentId}` : `/crm/clients/${parentId}`, "error", uploadError.message);
  const { error } = await supabase.from("crm_attachments").insert({ lead_id: parentType === "lead" ? parentId : null, client_id: parentType === "client" ? parentId : null, file_name: file.name.slice(0, 200), storage_path: path, mime_type: file.type, file_size: file.size, uploaded_by: member.user_id });
  if (error) { await supabase.storage.from("crm-files").remove([path]); crmRedirect(parentType === "lead" ? `/crm/leads/${parentId}` : `/crm/clients/${parentId}`, "error", error.message); }
  revalidatePath(parentType === "lead" ? `/crm/leads/${parentId}` : `/crm/clients/${parentId}`);
  crmRedirect(parentType === "lead" ? `/crm/leads/${parentId}` : `/crm/clients/${parentId}`, "success", "File attached.");
}

export async function addClientContact(clientId: string, form: FormData) {
  const { supabase, member } = await actionSession();
  const fullName = text(form, "full_name", 120);
  if (!fullName) crmRedirect(`/crm/clients/${clientId}`, "error", "Contact name is required.");
  const { error } = await supabase.from("crm_contacts").insert({ client_id: clientId, full_name: fullName, job_title: text(form, "job_title", 120), email: text(form, "email", 200)?.toLowerCase(), phone: text(form, "phone", 60), is_primary: form.get("is_primary") === "on", created_by: member.user_id });
  if (error) crmRedirect(`/crm/clients/${clientId}`, "error", error.message);
  revalidatePath(`/crm/clients/${clientId}`);
  crmRedirect(`/crm/clients/${clientId}`, "success", "Client contact added.");
}

export async function markCrmNotificationRead(notificationId: string, returnTo = "/crm/notifications") {
  const { supabase } = await actionSession();
  await supabase.from("crm_notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
  revalidatePath("/crm"); revalidatePath("/crm/notifications"); redirect(returnTo.startsWith("/crm") ? returnTo : "/crm/notifications");
}

export async function markAllCrmNotificationsRead() {
  const { supabase, member } = await actionSession();
  await supabase.from("crm_notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", member.user_id).is("read_at", null);
  revalidatePath("/crm"); revalidatePath("/crm/notifications"); redirect("/crm/notifications");
}

function validGoogleSheetUrl(value: string | null) { try { const url = new URL(value || ""); return url.protocol === "https:" && url.hostname === "docs.google.com" && url.pathname.startsWith("/spreadsheets/") ? url.toString() : null; } catch { return null; } }
function validAppsScriptUrl(value: string | null) { try { const url = new URL(value || ""); return url.protocol === "https:" && ["script.google.com", "script.googleusercontent.com"].includes(url.hostname) ? url.toString() : null; } catch { return null; } }

export async function saveCrmIntegrations(form: FormData) {
  const { supabase, member } = await actionSession();
  if (!canManageCrm(member)) crmRedirect("/crm/settings", "error", "Admin access required.");
  const sheetUrlRaw = text(form, "google_sheet_url", 500);
  const webhookRaw = text(form, "google_apps_script_webhook", 1000);
  const sheetUrl = sheetUrlRaw ? validGoogleSheetUrl(sheetUrlRaw) : null;
  const webhook = webhookRaw ? validAppsScriptUrl(webhookRaw) : null;
  if ((sheetUrlRaw && !sheetUrl) || (webhookRaw && !webhook)) crmRedirect("/crm/settings", "error", "Use a Google Sheets URL and a deployed Google Apps Script URL.");
  const token = text(form, "google_sync_token", 200);
  const payload: Record<string, unknown> = { id: 1, google_sheet_url: sheetUrl, google_apps_script_webhook: webhook, google_import_enabled: form.get("google_import_enabled") === "on", google_import_gid: text(form, "google_import_gid", 30) || "0", updated_by: member.user_id };
  if (token) payload.google_sync_token = token;
  const { error } = await supabase.from("crm_settings").upsert(payload);
  if (error) crmRedirect("/crm/settings", "error", error.message);
  revalidatePath("/crm/settings"); crmRedirect("/crm/settings", "success", "Integration settings saved.");
}

export async function syncLeadsToGoogleSheets() {
  const { supabase, member } = await actionSession();
  if (!canManageCrm(member)) crmRedirect("/crm/settings", "error", "Admin access required.");
  const { data: allowed } = await supabase.rpc("crm_check_rate_limit", { p_action: "google_sync", p_max_requests: 5, p_window_seconds: 300 });
  if (!allowed) crmRedirect("/crm/settings", "error", "Google sync limit reached. Try again in five minutes.");
  const [{ data: settings }, { data: leads }] = await Promise.all([supabase.from("crm_settings").select("google_apps_script_webhook,google_sync_token").eq("id", 1).maybeSingle(), supabase.from("crm_leads").select("contact_name,company_name,email,phone,source,status,priority,estimated_value,currency,next_follow_up_at,created_at").is("archived_at", null).order("created_at")]);
  const webhook = validAppsScriptUrl(settings?.google_apps_script_webhook || null);
  if (!webhook) crmRedirect("/crm/settings", "error", "Configure the Google Apps Script webhook first.");
  try {
    const response = await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: settings?.google_sync_token || "", leads: leads || [] }), redirect: "follow", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Google returned ${response.status}`);
  } catch (error) { crmRedirect("/crm/settings", "error", error instanceof Error ? error.message : "Google Sheets sync failed."); }
  crmRedirect("/crm/settings", "success", `${leads?.length || 0} leads synced to Google Sheets.`);
}
