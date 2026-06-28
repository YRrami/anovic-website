import Link from "next/link";
import { Archive, ChevronDown, Download, Filter, LayoutGrid, List, Plus, Search, SlidersHorizontal, Upload } from "lucide-react";
import CrmShell from "../_components/CrmShell";
import CrmSubmitButton from "../_components/CrmSubmitButton";
import { bulkUpdateLeads, createLead, importLeadsFile } from "../actions";
import type { CrmLead, CrmMember } from "../_lib/data";
import { canManageCrm, leadStages, memberName, money, requireCrmSession, shortDate } from "../_lib/data";

type Params = Promise<{ q?: string; status?: string; owner?: string; archived?: string; success?: string; error?: string }>;

export default async function LeadsPage({ searchParams }: { searchParams: Params }) {
  const { supabase, member } = await requireCrmSession();
  const params = await searchParams;
  const [{ data: leadsData }, { data: membersData }] = await Promise.all([
    supabase.from("crm_leads").select("*").order("updated_at", { ascending: false }),
    supabase.from("crm_members").select("user_id,email,full_name,role,is_active").eq("is_active", true).order("full_name"),
  ]);
  const members = (membersData || []) as CrmMember[];
  const names = new Map(members.map((item) => [item.user_id, item]));
  const query = (params.q || "").trim().toLowerCase();
  const showArchived = params.archived === "1";
  const allLeads = (leadsData || []) as CrmLead[];
  const leads = allLeads.filter((lead) => {
    const searchable = [lead.contact_name, lead.company_name, lead.category, lead.email, lead.phone].some((value) => value?.toLowerCase().includes(query));
    return (!query || searchable) && (showArchived ? Boolean(lead.archived_at) : !lead.archived_at) && (!params.status || lead.status === params.status) && (!params.owner || lead.owner_id === params.owner);
  });
  const manager = canManageCrm(member);
  const openCount = allLeads.filter((lead) => !lead.archived_at && !["won", "lost"].includes(lead.status)).length;
  const followUpCount = allLeads.filter((lead) => !lead.archived_at && lead.next_follow_up_at && !["won", "lost"].includes(lead.status)).length;

  return <CrmShell active="leads" member={member}>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="crm-kicker">Sales workspace</p><h1 className="crm-title">{showArchived ? "Archived leads" : "Leads"}</h1><p className="crm-subtitle">Find the next action, update the stage, and keep every conversation moving.</p></div>
      <div className="flex gap-2">
        <Link href="/crm/pipeline" className="crm-button-secondary"><LayoutGrid size={17} />Pipeline</Link>
        {!showArchived && <a href="#add-lead" className="crm-button"><Plus size={17} />Add lead</a>}
      </div>
    </header>

    {(params.success || params.error) && <p className={`crm-alert mt-5 ${params.error ? "crm-alert-error" : "crm-alert-success"}`}>{params.error || params.success}</p>}

    {!showArchived && <section className="mt-6 grid gap-3 sm:grid-cols-3">
      <div className="crm-card px-4 py-3"><p className="text-xs font-bold text-gray-500">Open leads</p><p className="mt-1 text-2xl font-black">{openCount}</p></div>
      <div className="crm-card px-4 py-3"><p className="text-xs font-bold text-gray-500">Follow-ups scheduled</p><p className="mt-1 text-2xl font-black">{followUpCount}</p></div>
      <div className="crm-card px-4 py-3"><p className="text-xs font-bold text-gray-500">Expected pipeline</p><p className="mt-1 text-2xl font-black">{money(allLeads.filter((lead) => !lead.archived_at && !["won", "lost"].includes(lead.status)).reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0))}</p></div>
    </section>}

    {!showArchived && <details id="add-lead" className="crm-card mt-5 scroll-mt-24 overflow-hidden" open={!allLeads.length}>
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 sm:px-5"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Plus size={18} /></span><span><strong className="block text-sm">Add a lead</strong><span className="text-xs font-bold text-gray-500">Start with the essentials</span></span></span><ChevronDown size={18} className="text-gray-400" /></summary>
      <form action={createLead} className="border-t border-gray-200 p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <label className="crm-label">Contact name<input className="crm-field" name="contact_name" required autoFocus /></label>
          <label className="crm-label">Company<input className="crm-field" name="company_name" /></label>
          <label className="crm-label">Category<input className="crm-field" name="category" placeholder="Industry or service" /></label>
          <label className="crm-label">Email<input className="crm-field" name="email" type="email" /></label>
          <label className="crm-label">Phone<input className="crm-field" name="phone" /></label>
          <label className="crm-label">Assigned to<select className="crm-field" name="owner_id" defaultValue={member.user_id}>{members.map((item) => <option value={item.user_id} key={item.user_id}>{memberName(item)}</option>)}</select></label>
        </div>
        <details className="mt-4 rounded-lg border border-gray-200 bg-gray-50"><summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-indigo-700">More details</summary><div className="grid gap-4 border-t border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-4"><label className="crm-label">Source<select className="crm-field bg-white" name="source" defaultValue="referral"><option value="referral">Referral</option><option value="website">Website</option><option value="social">Social media</option><option value="outbound">Outbound</option><option value="event">Event</option><option value="other">Other</option></select></label><label className="crm-label">Priority<select className="crm-field bg-white" name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="crm-label">Expected value (EGP)<input className="crm-field bg-white" name="estimated_value" type="number" min="0" step="1" defaultValue="0" /><input type="hidden" name="currency" value="EGP" /></label><label className="crm-label">Next action<input className="crm-field bg-white" name="next_follow_up_at" type="datetime-local" /></label><label className="crm-label sm:col-span-2 lg:col-span-4">Notes<textarea className="crm-field min-h-20 bg-white" name="summary" placeholder="Need, context, or next step" /></label></div></details>
        <div className="mt-4 flex justify-end"><CrmSubmitButton pendingLabel="Creating...">Create lead</CrmSubmitButton></div>
      </form>
    </details>}

    <section className="crm-card mt-5 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 lg:flex-row lg:items-center">
        <form className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          {showArchived && <input type="hidden" name="archived" value="1" />}
          <label className="relative min-w-0 flex-1"><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-gray-400" /><input className="crm-field pl-10" name="q" defaultValue={params.q} placeholder="Search leads..." /></label>
          <select className="crm-field sm:w-40" name="status" defaultValue={params.status || ""} aria-label="Filter by stage"><option value="">All stages</option>{leadStages.map((stage) => <option value={stage.value} key={stage.value}>{stage.label}</option>)}</select>
          <select className="crm-field sm:w-48" name="owner" defaultValue={params.owner || ""} aria-label="Filter by assigned person"><option value="">Everyone</option>{members.map((item) => <option value={item.user_id} key={item.user_id}>{memberName(item)}</option>)}</select>
          <button className="crm-button-secondary" type="submit"><Filter size={16} />Filter</button>
        </form>
        <details className="relative"><summary className="crm-button-secondary cursor-pointer list-none"><SlidersHorizontal size={16} />Tools</summary><div className="absolute right-0 top-12 z-20 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-xl"><Link href={showArchived ? "/crm/leads" : "/crm/leads?archived=1"} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold hover:bg-gray-50"><Archive size={16} />{showArchived ? "Active leads" : "Archived leads"}</Link><Link href="/crm/leads/export" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold hover:bg-gray-50"><Download size={16} />Export CSV</Link><a href="#import-leads" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold hover:bg-gray-50"><Upload size={16} />Import CSV</a></div></details>
      </div>

      <form action={bulkUpdateLeads}>
        <div className="crm-table-wrap"><table className="crm-table"><thead><tr><th className="w-10"><span className="sr-only">Select</span></th><th>Lead</th><th>Stage</th><th>Priority</th><th>Assigned to</th><th>Expected value</th><th>Next action</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead.id}><td><input type="checkbox" name="lead_id" value={lead.id} aria-label={`Select ${lead.contact_name}`} /></td><td><Link href={`/crm/leads/${lead.id}`} className="font-black text-gray-950 hover:text-indigo-700">{lead.contact_name}</Link><span className="block text-xs font-bold text-gray-500">{[lead.company_name, lead.category].filter(Boolean).join(" · ") || lead.email || "No company"}</span></td><td><span className="crm-badge bg-indigo-50 text-indigo-700">{leadStages.find((stage) => stage.value === lead.status)?.label}</span></td><td><span className={`crm-badge ${lead.priority === "urgent" ? "bg-red-50 text-red-700" : lead.priority === "high" ? "bg-yellow-50 text-yellow-800" : "bg-gray-100 text-gray-700"}`}>{lead.priority}</span></td><td>{memberName(names.get(lead.owner_id || ""))}</td><td className="font-black">{money(lead.estimated_value, lead.currency)}</td><td>{shortDate(lead.next_follow_up_at)}</td></tr>)}</tbody></table>{!leads.length && <div className="p-12 text-center"><List size={24} className="mx-auto text-gray-300" /><p className="mt-3 font-black">No matching leads</p><p className="mt-1 text-sm text-gray-500">Change the filters or add a new lead.</p></div>}</div>
        {leads.length > 0 && <details className="border-t border-gray-200 bg-gray-50"><summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-indigo-700">Bulk actions for selected leads</summary><div className="flex flex-wrap items-end gap-2 border-t border-gray-200 p-3"><label className="crm-label">Action<select className="crm-field min-w-40" name="bulk_operation"><option value="stage">Change stage</option>{manager && <option value="owner">Reassign</option>}<option value="archive">Archive</option></select></label><label className="crm-label">Stage<select className="crm-field min-w-36" name="bulk_status"><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="negotiation">Negotiation</option><option value="lost">Lost</option></select></label>{manager && <label className="crm-label">Assigned to<select className="crm-field min-w-44" name="bulk_owner">{members.map((item) => <option value={item.user_id} key={item.user_id}>{memberName(item)}</option>)}</select></label>}<CrmSubmitButton className="crm-button-secondary" pendingLabel="Updating...">Apply</CrmSubmitButton></div></details>}
      </form>
    </section>

    <details id="import-leads" className="crm-card mt-4 scroll-mt-24 overflow-hidden"><summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-black"><span className="flex items-center gap-2"><Upload size={17} className="text-indigo-600" />Smart lead import</span><span className="text-xs text-gray-500">Excel or CSV · up to 5,000 rows</span></summary><form action={importLeadsFile} className="flex flex-col gap-3 border-t border-gray-200 p-4 sm:flex-row sm:items-end"><label className="crm-label flex-1">Excel or CSV file<input className="crm-field" type="file" name="lead_file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" required /></label><CrmSubmitButton pendingLabel="Detecting columns...">Import file</CrmSubmitButton></form><p className="border-t border-gray-100 px-4 py-3 text-xs font-bold text-gray-500">Headers may be misspelled, reordered, or placed below title rows. The importer detects names, companies, categories, emails, phones, websites, sources, values, and notes across every worksheet.</p></details>
  </CrmShell>;
}
