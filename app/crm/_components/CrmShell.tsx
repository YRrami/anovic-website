import Link from "next/link";
import { BarChart3, Bell, BriefcaseBusiness, Building2, ChevronDown, ContactRound, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CrmRealtime from "./CrmRealtime";
import type { CrmMember } from "../_lib/data";
import { canManageCrm, memberName } from "../_lib/data";

type ActivePage = "dashboard" | "leads" | "pipeline" | "clients" | "reports" | "notifications" | "audit" | "security" | "settings";

const nav = [
  { key: "dashboard", href: "/crm", label: "Dashboard", icon: LayoutDashboard },
  { key: "leads", href: "/crm/leads", label: "Leads", icon: ContactRound },
  { key: "pipeline", href: "/crm/pipeline", label: "Pipeline", icon: BarChart3 },
  { key: "clients", href: "/crm/clients", label: "Clients", icon: Building2 },
  { key: "reports", href: "/crm/reports", label: "Reports", icon: BarChart3 },
] as const;

export default async function CrmShell({ active, member, children }: { active: ActivePage; member: CrmMember; children: React.ReactNode }) {
  const manager = canManageCrm(member);
  const supabase = await createClient();
  const { count: unreadCount } = await supabase.from("crm_notifications").select("id", { count: "exact", head: true }).eq("recipient_id", member.user_id).is("read_at", null);
  const mobileNav = [...nav, ...(manager ? [{ key: "settings" as const, href: "/crm/settings", label: "Settings", icon: Settings }] : [])];
  return (
    <div className="crm-platform min-h-screen text-gray-950">
      <CrmRealtime />
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <Link href="/crm" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white"><BriefcaseBusiness size={19} /></span>
            <span className="min-w-0"><strong className="block truncate text-sm">Private Team CRM</strong><span className="block truncate text-[11px] font-bold text-gray-500">Lead and client system</span></span>
          </Link>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Link href="/crm/security" className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-700">{memberName(member)}</Link>
            <Link href="/crm/notifications" className="crm-icon-button relative" title="Notifications"><Bell size={17} />{Boolean(unreadCount) && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-300 px-1 text-[10px] font-black text-black">{Math.min(unreadCount || 0, 99)}</span>}</Link>
            <Link href="/crm/auth/signout" className="crm-icon-button" title="Sign out"><LogOut size={17} /></Link>
          </div>
          <details className="relative ml-auto sm:hidden">
            <summary className="crm-icon-button list-none"><ChevronDown size={18} /><span className="sr-only">Open navigation</span></summary>
            <div className="absolute right-0 top-12 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
              {mobileNav.map((item) => <Link key={item.key} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold hover:bg-gray-100"><item.icon size={17} />{item.label}</Link>)}
              <Link href="/crm/auth/signout" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-bold hover:bg-gray-100"><LogOut size={17} />Sign out</Link>
            </div>
          </details>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-gray-200 bg-white p-4 lg:block">
          <nav className="sticky top-20 space-y-1">
            <p className="mb-3 px-3 text-[11px] font-black uppercase text-gray-400">Sales workspace</p>
            {nav.map((item) => <Link key={item.key} href={item.href} className={`crm-nav-link ${active === item.key ? "crm-nav-link-active" : ""}`}><item.icon size={18} />{item.label}</Link>)}
            {manager && <><p className="mb-3 mt-7 px-3 text-[11px] font-black uppercase text-gray-400">Administration</p><Link href="/crm/settings" className={`crm-nav-link ${active === "settings" || active === "audit" ? "crm-nav-link-active" : ""}`}><Settings size={18} />Settings</Link></>}
          </nav>
        </aside>
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
