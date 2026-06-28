import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import CrmShell from "../_components/CrmShell";
import CrmSubmitButton from "../_components/CrmSubmitButton";
import { markAllCrmNotificationsRead, markCrmNotificationRead } from "../actions";
import type { CrmNotification } from "../_lib/data";
import { requireCrmSession, shortDate } from "../_lib/data";

export default async function CrmNotificationsPage() {
  const { supabase, member } = await requireCrmSession();
  const { data } = await supabase.from("crm_notifications").select("*").eq("recipient_id", member.user_id).order("created_at", { ascending: false }).limit(100);
  const notifications = (data || []) as CrmNotification[];
  return <CrmShell active="notifications" member={member}>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="crm-kicker">Updates</p><h1 className="crm-title">Notifications</h1><p className="crm-subtitle">Assignments, stage changes, follow-ups, and CRM system activity.</p></div>{notifications.some((item) => !item.read_at) && <form action={markAllCrmNotificationsRead}><CrmSubmitButton className="crm-button-secondary" pendingLabel="Updating..."><CheckCheck size={17} />Mark all read</CrmSubmitButton></form>}</div>
    <section className="crm-card mt-7 overflow-hidden"><div className="divide-y divide-gray-100">{notifications.map((item) => <article className={`p-5 sm:p-6 ${item.read_at ? "bg-white" : "bg-indigo-50/50"}`} key={item.id}><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-700 shadow-sm"><Bell size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="crm-badge bg-gray-100 text-gray-700">{item.type.replaceAll("_", " ")}</span>{!item.read_at && <span className="crm-badge bg-yellow-100 text-yellow-900">New</span>}</div><Link href={item.href} className="mt-3 block font-black hover:text-indigo-700">{item.title}</Link>{item.body && <p className="mt-1 text-sm leading-6 text-gray-600">{item.body}</p>}<p className="mt-2 text-xs font-bold text-gray-400">{shortDate(item.created_at)}</p></div>{!item.read_at && <form action={markCrmNotificationRead.bind(null, item.id, item.href)}><CrmSubmitButton className="crm-icon-button" pendingLabel=""><CheckCheck size={16} /><span className="sr-only">Mark read</span></CrmSubmitButton></form>}</div></article>)}{!notifications.length && <div className="p-14 text-center"><Bell size={28} className="mx-auto text-gray-300" /><p className="mt-4 font-black">No notifications</p></div>}</div></section>
  </CrmShell>;
}
