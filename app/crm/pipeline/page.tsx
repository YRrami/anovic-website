import Link from "next/link";
import { ArrowRight, CircleDollarSign } from "lucide-react";
import CrmShell from "../_components/CrmShell";
import CrmSubmitButton from "../_components/CrmSubmitButton";
import { updateLeadStage } from "../actions";
import type { CrmLead, CrmMember } from "../_lib/data";
import { leadStages, memberName, money, requireCrmSession, shortDate } from "../_lib/data";

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { supabase, member } = await requireCrmSession();
  const params = await searchParams;
  const [{ data: leadsData }, { data: membersData }] = await Promise.all([
    supabase.from("crm_leads").select("*").is("archived_at", null).order("updated_at", { ascending: false }),
    supabase.from("crm_members").select("user_id,email,full_name,role,is_active"),
  ]);
  const leads = (leadsData || []) as CrmLead[];
  const members = (membersData || []) as CrmMember[];
  const memberMap = new Map(members.map((item) => [item.user_id, item]));
  const activeStages = leadStages.filter((stage) => !["won", "lost"].includes(stage.value));
  const activeLeads = leads.filter((lead) => !["won", "lost"].includes(lead.status));

  return <CrmShell active="pipeline" member={member}>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="crm-kicker">Stages</p><h1 className="crm-title">Pipeline</h1><p className="crm-subtitle">See every open lead by stage and move it forward from the card.</p></div><div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3"><p className="text-xs font-bold text-indigo-700">Expected value</p><p className="mt-1 flex items-center gap-2 text-lg font-black"><CircleDollarSign size={18} />{money(activeLeads.reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0))}</p></div></div>
    {(params.success || params.error) && <p className={`crm-alert mt-6 ${params.error ? "crm-alert-error" : "crm-alert-success"}`}>{params.error || params.success}</p>}
    <div className="crm-pipeline mt-7">
      {activeStages.map((stage) => {
        const stageLeads = leads.filter((lead) => lead.status === stage.value);
        return <section className="crm-pipeline-column" key={stage.value}>
          <header className="flex items-center justify-between border-b border-gray-200 p-4"><div><h2 className="font-black">{stage.label}</h2><p className="mt-1 text-xs font-bold text-gray-500">{stageLeads.length} leads</p></div><span className="crm-badge bg-gray-100 text-gray-700">{money(stageLeads.reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0))}</span></header>
          <div className="space-y-3 p-3">
            {stageLeads.map((lead) => <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" key={lead.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/crm/leads/${lead.id}`} className="block truncate font-black hover:text-indigo-700">{lead.contact_name}</Link><p className="mt-1 truncate text-xs font-bold text-gray-500">{lead.company_name || "Independent"}</p></div><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${lead.priority === "urgent" ? "bg-red-500" : lead.priority === "high" ? "bg-yellow-400" : "bg-indigo-500"}`} title={`${lead.priority} priority`} /></div>
              <p className="mt-4 text-xl font-black">{money(lead.estimated_value, lead.currency)}</p>
              <div className="mt-3 border-t border-gray-100 pt-3 text-xs font-bold text-gray-500"><p>Assigned to {memberName(memberMap.get(lead.owner_id || ""))}</p><p className="mt-1">Next action: {shortDate(lead.next_follow_up_at)}</p></div>
              <form action={updateLeadStage.bind(null, lead.id)} className="mt-4 flex gap-2"><select className="crm-field min-w-0 text-xs" name="status" defaultValue={lead.status}>{activeStages.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}<option value="lost">Lost</option></select><CrmSubmitButton className="crm-icon-button shrink-0" pendingLabel=""><ArrowRight size={16} /><span className="sr-only">Move lead</span></CrmSubmitButton></form>
            </article>)}
            {!stageLeads.length && <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-xs font-bold text-gray-400">No leads</div>}
          </div>
        </section>;
      })}
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {(["won", "lost"] as const).map((status) => <Link href={`/crm/leads?status=${status}`} className="crm-card flex items-center justify-between p-5 hover:border-indigo-300" key={status}><div><p className="crm-kicker">Closed</p><h2 className="mt-1 text-lg font-black">{status === "won" ? "Won leads" : "Lost leads"}</h2><p className="mt-1 text-sm font-bold text-gray-500">{leads.filter((lead) => lead.status === status).length} records</p></div><ArrowRight size={20} className="text-indigo-600" /></Link>)}
    </div>
  </CrmShell>;
}
