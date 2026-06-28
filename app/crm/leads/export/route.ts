import { stringify } from "csv-stringify/sync";
import { requireCrmSession } from "../../_lib/data";

export async function GET() {
  const { supabase } = await requireCrmSession();
  const primary = await supabase.from("crm_leads")
    .select("contact_name,company_name,category,email,phone,website,source,status,priority,estimated_value,currency,next_follow_up_at,summary,created_at")
    .is("archived_at", null).order("created_at", { ascending: false });
  let data: Record<string, unknown>[] = primary.data || [];
  let error = primary.error;
  if (error?.message.includes("category")) {
    const fallback = await supabase.from("crm_leads")
      .select("contact_name,company_name,email,phone,website,source,status,priority,estimated_value,currency,next_follow_up_at,summary,created_at")
      .is("archived_at", null).order("created_at", { ascending: false });
    data = fallback.data || [];
    error = fallback.error;
  }
  if (error) return new Response("Lead export failed.", { status: 500 });
  const csv = stringify(data, { header: true, columns: ["contact_name", "company_name", "category", "email", "phone", "website", "source", "status", "priority", "estimated_value", "currency", "next_follow_up_at", "summary", "created_at"] });
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=anovic-crm-leads.csv", "cache-control": "no-store" } });
}
