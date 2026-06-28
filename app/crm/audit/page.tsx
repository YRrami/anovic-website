import { redirect } from "next/navigation";
import { FileClock } from "lucide-react";
import CrmShell from "../_components/CrmShell";
import type { CrmMember } from "../_lib/data";
import { canManageCrm, memberName, requireCrmSession, shortDate } from "../_lib/data";

type Audit = { id: number; actor_id: string | null; action: string; entity_table: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string };

export default async function CrmAuditPage() {
  const { supabase, member } = await requireCrmSession();
  if (!canManageCrm(member)) redirect("/crm");
  const [{ data: logsData }, { data: membersData }] = await Promise.all([supabase.from("crm_audit_logs").select("*").order("created_at", { ascending: false }).limit(200), supabase.from("crm_members").select("user_id,email,full_name,role,is_active")]);
  const logs = (logsData || []) as Audit[]; const members = (membersData || []) as CrmMember[]; const names = new Map(members.map((item) => [item.user_id, memberName(item)]));
  return <CrmShell active="audit" member={member}><div><p className="crm-kicker">Security history</p><h1 className="crm-title">Audit log</h1><p className="crm-subtitle">The latest 200 CRM data mutations, visible only to CRM administrators.</p></div><section className="crm-card mt-7 overflow-hidden"><div className="crm-table-wrap"><table className="crm-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Record</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td>{shortDate(log.created_at)}</td><td className="font-black">{log.actor_id ? names.get(log.actor_id) || "Former member" : "System"}</td><td><span className="crm-badge bg-indigo-50 text-indigo-700">{log.action}</span></td><td>{log.entity_table.replace("crm_", "")}</td><td className="font-mono text-xs">{log.entity_id?.slice(0, 8) || "--"}</td></tr>)}</tbody></table>{!logs.length && <div className="p-14 text-center"><FileClock className="mx-auto text-gray-300" /><p className="mt-4 font-black">No audit records yet</p></div>}</div></section></CrmShell>;
}
