import Link from "next/link";
import { ArrowRight, CalendarClock, CircleDollarSign, ContactRound, Plus, TrendingUp, UsersRound } from "lucide-react";
import CrmShell from "./_components/CrmShell";
import type { CrmActivity, CrmLead, CrmMember } from "./_lib/data";
import { leadStages, memberName, money, requireCrmSession, shortDate } from "./_lib/data";

export default async function CrmDashboard({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { supabase, member } = await requireCrmSession();
  const params = await searchParams;
  const [leadsResult, clientsResult, activitiesResult, membersResult] = await Promise.all([
    supabase.from("crm_leads").select("*").is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("crm_clients").select("id,account_value,currency,status"),
    supabase.from("crm_activities").select("*").is("completed_at", null).not("due_at", "is", null).order("due_at", { ascending: true }).limit(6),
    supabase.from("crm_members").select("user_id,email,full_name,role,is_active"),
  ]);
  const leads = (leadsResult.data || []) as CrmLead[];
  const activities = (activitiesResult.data || []) as CrmActivity[];
  const members = (membersResult.data || []) as CrmMember[];
  const clients = clientsResult.data || [];
  const openLeads = leads.filter((lead) => !["won", "lost"].includes(lead.status));
  const pipelineValue = openLeads.reduce((total, lead) => total + Number(lead.estimated_value || 0), 0);
  const won = leads.filter((lead) => lead.status === "won").length;
  const closed = leads.filter((lead) => ["won", "lost"].includes(lead.status)).length;
  const conversionRate = closed ? Math.round((won / closed) * 100) : 0;
  const memberMap = new Map(members.map((item) => [item.user_id, item]));

  return <CrmShell active="dashboard" member={member}>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="crm-kicker">Today</p><h1 className="crm-title">Overview</h1><p className="crm-subtitle">Focus on upcoming actions, open leads, and client conversion.</p></div>
      <Link href="/crm/leads#new-lead" className="crm-button"><Plus size={17} />Add lead</Link>
    </div>
    {(params.success || params.error) && <p className={`crm-alert mt-6 ${params.error ? "crm-alert-error" : "crm-alert-success"}`}>{params.error || params.success}</p>}

    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Open leads", value: String(openLeads.length), meta: `${leads.length} total`, icon: ContactRound },
        { label: "Pipeline value", value: money(pipelineValue), meta: "Open opportunities", icon: CircleDollarSign },
        { label: "Conversion rate", value: `${conversionRate}%`, meta: `${won} leads won`, icon: TrendingUp },
        { label: "Active clients", value: String(clients.filter((client) => client.status !== "inactive").length), meta: `${clients.length} total clients`, icon: UsersRound },
      ].map((stat) => <article className="crm-card p-5" key={stat.label}><div className="flex items-center justify-between"><p className="text-sm font-bold text-gray-500">{stat.label}</p><stat.icon size={19} className="text-indigo-600" /></div><p className="mt-4 text-3xl font-black">{stat.value}</p><p className="mt-1 text-xs font-bold text-gray-500">{stat.meta}</p></article>)}
    </section>

    <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
      <div className="crm-card overflow-hidden">
        <div className="crm-card-header"><div><p className="crm-kicker">Pipeline</p><h2 className="text-xl font-black">Stage distribution</h2></div><Link href="/crm/pipeline" className="crm-text-link">Open board <ArrowRight size={15} /></Link></div>
        <div className="space-y-5 p-5 sm:p-6">
          {leadStages.filter((stage) => stage.value !== "lost").map((stage) => {
            const stageLeads = leads.filter((lead) => lead.status === stage.value);
            const width = leads.length ? Math.max(4, (stageLeads.length / leads.length) * 100) : 0;
            return <div key={stage.value}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold">{stage.label}</span><span className="font-black">{stageLeads.length} · {money(stageLeads.reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0))}</span></div><div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${width}%` }} /></div></div>;
          })}
          {!leads.length && <p className="py-10 text-center text-sm font-bold text-gray-500">Add your first lead to populate the pipeline.</p>}
        </div>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="crm-card-header"><div><p className="crm-kicker">Next actions</p><h2 className="text-xl font-black">Follow-ups</h2></div><CalendarClock size={20} className="text-indigo-600" /></div>
        <div className="divide-y divide-gray-100">
          {activities.map((activity) => <div className="p-5" key={activity.id}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{activity.title}</p><p className="mt-1 text-xs font-bold text-gray-500">{shortDate(activity.due_at)}</p></div><span className="crm-badge bg-yellow-50 text-yellow-800">Pending</span></div>{activity.lead_id && <Link href={`/crm/leads/${activity.lead_id}`} className="mt-3 inline-flex text-xs font-black text-indigo-700">View lead</Link>}</div>)}
          {!activities.length && <p className="p-8 text-center text-sm font-bold text-gray-500">No pending follow-ups.</p>}
        </div>
      </div>
    </section>

    <section className="crm-card mt-6 overflow-hidden">
      <div className="crm-card-header"><div><p className="crm-kicker">Recently added</p><h2 className="text-xl font-black">Latest leads</h2></div><Link href="/crm/leads" className="crm-text-link">View all <ArrowRight size={15} /></Link></div>
      <div className="crm-table-wrap"><table className="crm-table"><thead><tr><th>Lead</th><th>Stage</th><th>Assigned to</th><th>Expected value</th><th>Next action</th></tr></thead><tbody>{leads.slice(0, 6).map((lead) => <tr key={lead.id}><td><Link href={`/crm/leads/${lead.id}`} className="font-black text-gray-950 hover:text-indigo-700">{lead.contact_name}</Link><span className="block text-xs font-bold text-gray-500">{lead.company_name || "Independent"}</span></td><td><span className="crm-badge bg-indigo-50 text-indigo-700">{leadStages.find((stage) => stage.value === lead.status)?.label}</span></td><td>{memberName(memberMap.get(lead.owner_id || ""))}</td><td className="font-black">{money(lead.estimated_value, lead.currency)}</td><td>{shortDate(lead.next_follow_up_at)}</td></tr>)}</tbody></table>{!leads.length && <p className="p-10 text-center text-sm font-bold text-gray-500">No leads yet.</p>}</div>
    </section>
  </CrmShell>;
}
