import { BarChart3, CircleDollarSign, Clock3, TrendingUp } from "lucide-react";
import CrmShell from "../_components/CrmShell";
import type { CrmLead, CrmMember } from "../_lib/data";
import { leadStages, memberName, money, requireCrmSession } from "../_lib/data";

export default async function CrmReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { supabase, member } = await requireCrmSession();
  const params = await searchParams;
  let leadQuery = supabase.from("crm_leads").select("*").is("archived_at", null).order("created_at");
  if (params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from)) leadQuery = leadQuery.gte("created_at", `${params.from}T00:00:00Z`);
  if (params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to)) leadQuery = leadQuery.lte("created_at", `${params.to}T23:59:59Z`);
  const [{ data: leadData }, { data: memberData }] = await Promise.all([leadQuery, supabase.from("crm_members").select("user_id,email,full_name,role,is_active")]);
  const leads = (leadData || []) as CrmLead[];
  const members = (memberData || []) as CrmMember[];
  const won = leads.filter((lead) => lead.status === "won");
  const lost = leads.filter((lead) => lead.status === "lost");
  const closed = won.length + lost.length;
  const conversion = closed ? Math.round((won.length / closed) * 100) : 0;
  const cycleDays = won.filter((lead) => lead.converted_at).map((lead) => Math.max(0, (new Date(lead.converted_at!).getTime() - new Date(lead.created_at).getTime()) / 86_400_000));
  const averageCycle = cycleDays.length ? Math.round(cycleDays.reduce((sum, value) => sum + value, 0) / cycleDays.length) : 0;
  const ownerStats = members.map((owner) => { const owned = leads.filter((lead) => lead.owner_id === owner.user_id); const ownerWon = owned.filter((lead) => lead.status === "won"); return { owner, leads: owned.length, won: ownerWon.length, value: ownerWon.reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0) }; }).filter((row) => row.leads);
  const sources = Array.from(new Set(leads.map((lead) => lead.source))).map((source) => ({ source, count: leads.filter((lead) => lead.source === source).length, won: leads.filter((lead) => lead.source === source && lead.status === "won").length })).sort((a, b) => b.count - a.count);
  return <CrmShell active="reports" member={member}>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="crm-kicker">Analytics</p><h1 className="crm-title">Sales reports</h1><p className="crm-subtitle">Conversion, revenue, lead sources, and salesperson performance.</p></div><form className="flex flex-wrap items-end gap-2"><label className="crm-label">From<input className="crm-field" type="date" name="from" defaultValue={params.from} /></label><label className="crm-label">To<input className="crm-field" type="date" name="to" defaultValue={params.to} /></label><button className="crm-button-secondary" type="submit">Apply dates</button></form></div>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Leads", value: leads.length, icon: BarChart3 }, { label: "Conversion", value: `${conversion}%`, icon: TrendingUp }, { label: "Won value", value: money(won.reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0)), icon: CircleDollarSign }, { label: "Average sales cycle", value: `${averageCycle}d`, icon: Clock3 },
    ].map((item) => <article className="crm-card p-5" key={item.label}><div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-500">{item.label}</p><item.icon size={19} className="text-indigo-600" /></div><p className="mt-4 text-3xl font-black">{item.value}</p></article>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-2"><div className="crm-card overflow-hidden"><div className="crm-card-header"><div><p className="crm-kicker">Team</p><h2 className="text-xl font-black">Salesperson performance</h2></div></div><div className="crm-table-wrap"><table className="crm-table"><thead><tr><th>Assigned to</th><th>Leads</th><th>Won</th><th>Won value</th></tr></thead><tbody>{ownerStats.map((row) => <tr key={row.owner.user_id}><td className="font-black">{memberName(row.owner)}</td><td>{row.leads}</td><td>{row.won}</td><td className="font-black">{money(row.value)}</td></tr>)}</tbody></table></div></div><div className="crm-card overflow-hidden"><div className="crm-card-header"><div><p className="crm-kicker">Acquisition</p><h2 className="text-xl font-black">Lead sources</h2></div></div><div className="space-y-4 p-5">{sources.map((row) => <div key={row.source}><div className="mb-2 flex justify-between text-sm font-bold"><span className="capitalize">{row.source}</span><span>{row.count} leads · {row.won} won</span></div><div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${leads.length ? Math.max(3, row.count / leads.length * 100) : 0}%` }} /></div></div>)}</div></div></section>
    <section className="crm-card mt-6 overflow-hidden"><div className="crm-card-header"><div><p className="crm-kicker">Funnel</p><h2 className="text-xl font-black">Stage totals</h2></div></div><div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">{leadStages.map((stage) => { const stageLeads = leads.filter((lead) => lead.status === stage.value); return <div className="rounded-lg bg-gray-50 p-4" key={stage.value}><p className="text-xs font-black uppercase text-gray-500">{stage.label}</p><p className="mt-2 text-2xl font-black">{stageLeads.length}</p><p className="mt-1 text-xs font-bold text-gray-500">{money(stageLeads.reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0))}</p></div>; })}</div>{lost.length > 0 && <div className="border-t border-gray-200 p-5"><p className="crm-kicker">Lost reasons</p><div className="mt-3 flex flex-wrap gap-2">{Array.from(new Set(lost.map((lead) => lead.lost_reason || "Not specified"))).map((reason) => <span className="crm-badge bg-yellow-50 text-yellow-900" key={reason}>{reason}: {lost.filter((lead) => (lead.lost_reason || "Not specified") === reason).length}</span>)}</div></div>}</section>
  </CrmShell>;
}
