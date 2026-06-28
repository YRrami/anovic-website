import { ShieldCheck } from "lucide-react";
import CrmShell from "../_components/CrmShell";
import { requireCrmSession } from "../_lib/data";
import CrmMfaControls from "./CrmMfaControls";

export default async function CrmSecurityPage() {
  const { member } = await requireCrmSession({ allowMfaSetup: true });
  return <CrmShell active="security" member={member}><div><p className="crm-kicker">Account protection</p><h1 className="crm-title">Security</h1><p className="crm-subtitle">Protect CRM access with a time-based authenticator.</p></div><section className="crm-card mt-7 max-w-2xl p-6"><div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><ShieldCheck size={22} /></span><div><h2 className="text-xl font-black">Multi-factor authentication</h2><p className="text-sm text-gray-500">Recommended for every CRM account.</p></div></div><CrmMfaControls /></section></CrmShell>;
}
