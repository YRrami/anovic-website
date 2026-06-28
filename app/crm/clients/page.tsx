import Link from "next/link";
import { Building2, ExternalLink, Mail, Phone } from "lucide-react";
import CrmShell from "../_components/CrmShell";
import CrmSubmitButton from "../_components/CrmSubmitButton";
import { updateClientStatus } from "../actions";
import type { CrmClient, CrmMember } from "../_lib/data";
import { memberName, money, requireCrmSession, shortDate } from "../_lib/data";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const { supabase, member } = await requireCrmSession();
  const params = await searchParams;
  const [{ data: clientsData }, { data: membersData }] = await Promise.all([
    supabase.from("crm_clients").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_members").select("user_id,email,full_name,role,is_active"),
  ]);
  const clients = (clientsData || []) as CrmClient[];
  const members = (membersData || []) as CrmMember[];
  const memberMap = new Map(members.map((item) => [item.user_id, item]));

  return <CrmShell active="clients" member={member}>
    <div><p className="crm-kicker">Converted business</p><h1 className="crm-title">Clients</h1><p className="crm-subtitle">Manage onboarding and active accounts created from qualified leads.</p></div>
    {(params.success || params.error) && <p className={`crm-alert mt-6 ${params.error ? "crm-alert-error" : "crm-alert-success"}`}>{params.error || params.success}</p>}
    <section className="mt-7 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {clients.map((client) => <article className="crm-card p-5 sm:p-6" key={client.id}>
        <div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Building2 size={21} /></span><span className={`crm-badge ${client.status === "active" ? "bg-green-50 text-green-700" : client.status === "onboarding" ? "bg-yellow-50 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>{client.status}</span></div>
        <Link href={`/crm/clients/${client.id}`} className="mt-5 block text-xl font-black hover:text-indigo-700">{client.company_name}</Link><p className="mt-1 text-sm font-bold text-gray-500">{client.contact_name || "No primary contact"}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4"><div><p className="text-[11px] font-black uppercase text-gray-400">Account value</p><p className="mt-1 font-black">{money(client.account_value, client.currency)}</p></div><div><p className="text-[11px] font-black uppercase text-gray-400">Assigned to</p><p className="mt-1 truncate text-sm font-black">{memberName(memberMap.get(client.owner_id || ""))}</p></div></div>
        <div className="mt-5 space-y-2 text-sm font-bold text-gray-600">{client.email && <a className="crm-contact-row" href={`mailto:${client.email}`}><Mail size={16} />{client.email}</a>}{client.phone && <a className="crm-contact-row" href={`tel:${client.phone}`}><Phone size={16} />{client.phone}</a>}{client.website && <a className="crm-contact-row" href={client.website} target="_blank" rel="noreferrer"><ExternalLink size={16} />Website</a>}</div>
        <p className="mt-5 text-xs font-bold text-gray-400">Client since {shortDate(client.created_at)}</p>
        <form action={updateClientStatus.bind(null, client.id)} className="mt-4 flex gap-2 border-t border-gray-100 pt-4"><select className="crm-field min-w-0" name="status" defaultValue={client.status}><option value="onboarding">Onboarding</option><option value="active">Active</option><option value="inactive">Inactive</option></select><CrmSubmitButton className="crm-button-secondary shrink-0" pendingLabel="Saving">Update</CrmSubmitButton></form>
      </article>)}
    </section>
    {!clients.length && <div className="crm-card mt-7 p-14 text-center"><Building2 size={28} className="mx-auto text-gray-300" /><h2 className="mt-4 text-lg font-black">No clients yet</h2><p className="mt-2 text-sm text-gray-500">Convert a qualified lead to begin the client directory.</p></div>}
  </CrmShell>;
}
