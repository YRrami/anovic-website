"use client";

import Link from "next/link";
import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CrmRealtime() {
  const router = useRouter();
  const [toast, setToast] = useState<{ title: string; body?: string | null; href: string } | null>(null);
  useEffect(() => {
    const supabase = createClient();
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => router.refresh(), 250);
    };
    const channel = supabase.channel("crm-workspace")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_clients" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_activities" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_notifications" }, (payload) => { const value = payload.new as { title?: string; body?: string | null; href?: string }; if (value.title) setToast({ title: value.title, body: value.body, href: value.href || "/crm/notifications" }); refresh(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_contacts" }, refresh)
      .subscribe();
    return () => { window.clearTimeout(timer); void supabase.removeChannel(channel); };
  }, [router]);
  if (!toast) return null;
  return <aside className="fixed bottom-5 right-5 z-[80] w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-indigo-200 bg-white p-4 shadow-2xl" role="status"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Bell size={17} /></span><div className="min-w-0 flex-1"><Link href={toast.href} className="font-black hover:text-indigo-700">{toast.title}</Link>{toast.body && <p className="mt-1 text-sm leading-5 text-gray-600">{toast.body}</p>}</div><button type="button" className="crm-icon-button h-8 min-h-8 w-8" onClick={() => setToast(null)}><X size={15} /><span className="sr-only">Dismiss</span></button></div></aside>;
}
