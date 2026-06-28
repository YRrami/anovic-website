import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArrowLeft, Building2, CalendarCheck, Check, CircleDollarSign, ExternalLink, FileText, Mail, MessageCircle, Phone, RefreshCw, RotateCcw, Trash2, Upload } from "lucide-react";
import CrmShell from "../../_components/CrmShell";
import CrmSubmitButton from "../../_components/CrmSubmitButton";
import { addLeadActivity, archiveLead, completeActivity, convertLead, deleteLead, restoreLead, updateLead, uploadCrmAttachment } from "../../actions";
import type { CrmActivity, CrmAttachment, CrmLead, CrmMember } from "../../_lib/data";
import { canManageCrm, leadStages, memberName, money, requireCrmSession, shortDate } from "../../_lib/data";

export default async function LeadDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const { id } = await params;
  const notice = await searchParams;
  const { supabase, member } = await requireCrmSession();
  const [{ data: leadData }, { data: activitiesData }, { data: membersData }, { data: attachmentData }] = await Promise.all([
    supabase.from("crm_leads").select("*").eq("id", id).maybeSingle(),
    supabase.from("crm_activities").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("crm_members").select("user_id,email,full_name,role,is_active").eq("is_active", true).order("full_name"),
    supabase.from("crm_attachments").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
  ]);
  if (!leadData) notFound();
  const lead = leadData as CrmLead;
  const activities = (activitiesData || []) as CrmActivity[];
  const members = (membersData || []) as CrmMember[];
  const attachments = await Promise.all(((attachmentData || []) as CrmAttachment[]).map(async (attachment) => { const { data } = await supabase.storage.from("crm-files").createSignedUrl(attachment.storage_path, 3600); return { ...attachment, signed_url: data?.signedUrl || null }; }));
  const converted = Boolean(lead.converted_client_id);

  return <CrmShell active="leads" member={member}>
    <Link href="/crm/leads" className="crm-text-link mb-5"><ArrowLeft size={16} />Back to leads</Link>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className="crm-badge bg-indigo-50 text-indigo-700">{leadStages.find((stage) => stage.value === lead.status)?.label}</span><span className="crm-badge bg-gray-100 text-gray-700">{lead.priority} priority</span>{converted && <span className="crm-badge bg-green-50 text-green-700">Converted</span>}{lead.archived_at && <span className="crm-badge bg-yellow-50 text-yellow-900">Archived</span>}</div><h1 className="crm-title mt-3">{lead.contact_name}</h1><p className="crm-subtitle">{lead.company_name || "Independent opportunity"}</p></div><div className="text-right"><p className="text-xs font-bold text-gray-500">Expected value</p><p className="mt-1 text-3xl font-black">{money(lead.estimated_value, lead.currency)}</p></div></div>
    {(notice.success || notice.error) && <p className={`crm-alert mt-6 ${notice.error ? "crm-alert-error" : "crm-alert-success"}`}>{notice.error || notice.success}</p>}
    <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
      <div className="space-y-6">
        <section className="crm-card overflow-hidden"><div className="crm-card-header"><div><p className="crm-kicker">Opportunity record</p><h2 className="text-xl font-black">Lead details</h2></div><Building2 size={20} className="text-indigo-600" /></div>
          <form action={updateLead.bind(null, lead.id)} className="grid gap-4 border-t border-gray-200 p-5 sm:grid-cols-2 sm:p-6">
            <label className="crm-label">Contact name<input className="crm-field" name="contact_name" defaultValue={lead.contact_name} required /></label><label className="crm-label">Company<input className="crm-field" name="company_name" defaultValue={lead.company_name || ""} /></label>
            <label className="crm-label">Category<input className="crm-field" name="category" defaultValue={lead.category || ""} placeholder="Industry or service" /></label>
            <label className="crm-label">Email<input className="crm-field" name="email" type="email" defaultValue={lead.email || ""} /></label><label className="crm-label">Phone<input className="crm-field" name="phone" defaultValue={lead.phone || ""} /></label>
            <label className="crm-label">Website<input className="crm-field" name="website" type="url" defaultValue={lead.website || ""} /></label><label className="crm-label">Source<input className="crm-field" name="source" defaultValue={lead.source} /></label>
            <label className="crm-label">Stage<select className="crm-field" name="status" defaultValue={lead.status} disabled={converted}>{leadStages.map((stage) => <option value={stage.value} key={stage.value}>{stage.label}</option>)}</select>{converted && <input type="hidden" name="status" value="won" />}</label>
            <label className="crm-label">Priority<select className="crm-field" name="priority" defaultValue={lead.priority}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <label className="crm-label">Expected value (EGP)<input className="crm-field" name="estimated_value" type="number" min="0" step="1" defaultValue={lead.estimated_value} /><input type="hidden" name="currency" value="EGP" /></label>
            <label className="crm-label">Assigned to<select className="crm-field" name="owner_id" defaultValue={lead.owner_id || member.user_id}>{members.map((item) => <option value={item.user_id} key={item.user_id}>{memberName(item)}</option>)}</select></label>
            <label className="crm-label sm:col-span-2">Next action<input className="crm-field" name="next_follow_up_at" type="datetime-local" defaultValue={lead.next_follow_up_at?.slice(0, 16) || ""} /></label>
            <label className="crm-label sm:col-span-2">Summary<textarea className="crm-field min-h-28 resize-y" name="summary" defaultValue={lead.summary || ""} /></label>
            {lead.status === "lost" && <label className="crm-label sm:col-span-2">Lost reason<textarea className="crm-field min-h-20" name="lost_reason" defaultValue={lead.lost_reason || ""} /></label>}
            <div className="flex justify-end sm:col-span-2"><CrmSubmitButton pendingLabel="Updating...">Save lead</CrmSubmitButton></div>
          </form>
        </section>

        <section className="crm-card overflow-hidden"><div className="crm-card-header"><div><p className="crm-kicker">Timeline</p><h2 className="text-xl font-black">Activity and follow-ups</h2></div><CalendarCheck size={20} className="text-indigo-600" /></div>
          <form action={addLeadActivity.bind(null, lead.id)} className="grid gap-3 border-y border-gray-200 bg-gray-50 p-5 sm:grid-cols-2">
            <label className="crm-label">Activity<select className="crm-field bg-white" name="activity_type"><option value="note">Note</option><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option><option value="follow_up">Follow-up</option></select></label><label className="crm-label">Title<input className="crm-field bg-white" name="title" required /></label>
            <label className="crm-label">Due date<input className="crm-field bg-white" name="due_at" type="datetime-local" /></label><label className="crm-label">Details<textarea className="crm-field min-h-20 bg-white" name="body" /></label><div className="flex justify-end sm:col-span-2"><CrmSubmitButton pendingLabel="Adding...">Add activity</CrmSubmitButton></div>
          </form>
          <div className="divide-y divide-gray-100">{activities.map((activity) => <article className="p-5 sm:p-6" key={activity.id}><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className="crm-badge bg-gray-100 text-gray-700">{activity.activity_type.replace("_", " ")}</span>{activity.completed_at && <span className="crm-badge bg-green-50 text-green-700">Completed</span>}</div><h3 className="mt-3 font-black">{activity.title}</h3>{activity.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{activity.body}</p>}<p className="mt-3 text-xs font-bold text-gray-400">Created {shortDate(activity.created_at)}{activity.due_at ? ` · Due ${shortDate(activity.due_at)}` : ""}</p></div>{activity.due_at && !activity.completed_at && <form action={completeActivity.bind(null, activity.id, lead.id)}><CrmSubmitButton className="crm-icon-button" pendingLabel=""><Check size={17} /><span className="sr-only">Complete activity</span></CrmSubmitButton></form>}</div></article>)}{!activities.length && <p className="p-10 text-center text-sm font-bold text-gray-500">No activity recorded yet.</p>}</div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="crm-card p-5"><p className="crm-kicker">Contact</p><div className="mt-4 space-y-3">{lead.email && <a href={`mailto:${lead.email}`} className="crm-contact-row"><Mail size={17} />{lead.email}</a>}{lead.phone && <><a href={`tel:${lead.phone}`} className="crm-contact-row"><Phone size={17} />{lead.phone}</a><a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="crm-contact-row"><MessageCircle size={17} />Open WhatsApp</a></>}{lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="crm-contact-row"><ExternalLink size={17} />Website</a>}{!lead.email && !lead.phone && !lead.website && <p className="text-sm font-bold text-gray-500">No contact channels saved.</p>}</div></section>
        <section className="rounded-lg bg-gray-950 p-5 text-white"><CircleDollarSign size={22} className="text-yellow-300" /><h2 className="mt-4 text-xl font-black">Convert to client</h2><p className="mt-2 text-sm leading-6 text-gray-300">Create an onboarding client and preserve this lead, its owner, value, and complete activity history.</p>{converted ? <Link href="/crm/clients" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-yellow-300">Open client directory <ExternalLink size={15} /></Link> : <form action={convertLead.bind(null, lead.id)} className="mt-5"><CrmSubmitButton className="crm-button-yellow w-full" pendingLabel="Converting..."><RefreshCw size={16} />Convert lead</CrmSubmitButton></form>}</section>
        <section className="crm-card overflow-hidden"><div className="crm-card-header"><div><p className="crm-kicker">Documents</p><h2 className="text-lg font-black">Files</h2></div><FileText size={19} className="text-indigo-600" /></div><div className="divide-y divide-gray-100">{attachments.map((file) => <div className="flex items-center gap-3 p-4" key={file.id}><FileText size={17} className="shrink-0 text-gray-400" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{file.file_name}</p><p className="text-xs font-bold text-gray-400">{Math.max(1, Math.round(file.file_size / 1024))} KB</p></div>{file.signed_url && <a href={file.signed_url} target="_blank" rel="noreferrer" className="crm-icon-button"><ExternalLink size={15} /><span className="sr-only">Open file</span></a>}</div>)}{!attachments.length && <p className="p-5 text-sm font-bold text-gray-500">No files attached.</p>}</div><form action={uploadCrmAttachment.bind(null, "lead", lead.id)} className="border-t border-gray-200 p-4"><input className="crm-field text-xs" type="file" name="attachment" required /><CrmSubmitButton className="crm-button-secondary mt-3 w-full" pendingLabel="Uploading..."><Upload size={16} />Attach file</CrmSubmitButton></form></section>
        <section className="crm-card p-5"><p className="crm-kicker">Record controls</p><div className="mt-4 space-y-2">{lead.archived_at ? <><form action={restoreLead.bind(null, lead.id)}><CrmSubmitButton className="crm-button-secondary w-full" pendingLabel="Restoring..."><RotateCcw size={16} />Restore lead</CrmSubmitButton></form>{canManageCrm(member) && <form action={deleteLead.bind(null, lead.id)}><CrmSubmitButton className="crm-button-secondary w-full text-red-700" pendingLabel="Deleting..."><Trash2 size={16} />Delete permanently</CrmSubmitButton></form>}</> : <form action={archiveLead.bind(null, lead.id)}><CrmSubmitButton className="crm-button-secondary w-full" pendingLabel="Archiving..."><Archive size={16} />Archive lead</CrmSubmitButton></form>}</div></section>
      </aside>
    </div>
  </CrmShell>;
}
