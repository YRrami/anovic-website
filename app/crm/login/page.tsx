import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, LockKeyhole, ShieldCheck } from "lucide-react";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { signInCrm } from "./actions";

export const metadata: Metadata = { title: "Private Team CRM | Anovic", robots: { index: false, follow: false } };

type Params = Promise<{ error?: string; next?: string; setup?: string }>;

function safeNext(value?: string) {
  return value?.startsWith("/crm") && !value.startsWith("/crm/login") && !value.startsWith("//") && !value.includes("://") ? value : "/crm";
}

export default async function CrmLoginPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const nextPath = safeNext(params.next);
  const config = getSupabaseConfig();
  if (config) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) {
      const { data: member } = await supabase.from("crm_members").select("is_active").eq("user_id", data.claims.sub).maybeSingle<{ is_active: boolean }>();
      if (member?.is_active) redirect(nextPath);
    }
  }

  const message = params.setup === "missing" ? "Supabase environment keys are missing."
    : params.setup === "sql" ? "Run the latest CRM SQL setup before signing in."
      : params.error === "missing" ? "Enter your email and password."
        : params.error === "invalid" ? "The email or password is incorrect."
          : params.error === "access" ? "This account does not have access to the Private Team CRM."
            : null;

  return (
    <main className="crm-platform min-h-screen px-4 py-8 text-gray-950 sm:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_440px]">
        <div className="hidden max-w-xl lg:block">
          <Link href="/" className="inline-flex" aria-label="Anovic home"><Image src="/logo.png" alt="Anovic" width={256} height={43} style={{ width: "11rem", height: "auto" }} /></Link>
          <div className="mt-16 flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-600 text-white"><BriefcaseBusiness size={28} /></div>
          <p className="mt-8 text-xs font-black uppercase text-indigo-700">Private Team CRM and Lead System</p>
          <h1 className="mt-4 text-5xl font-black leading-none">Turn qualified opportunities into lasting client relationships.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">A separate, secure sales workspace for lead ownership, follow-ups, pipeline decisions, and client conversion.</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/60 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-black uppercase text-indigo-700">Private access</p><h2 className="mt-2 text-3xl font-black">CRM sign in</h2></div>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><LockKeyhole size={20} /></span>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-600">Use an authorized Supabase account. CRM access is separate from employee-platform access.</p>
          {message && <p role="status" className="mt-5 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-bold">{message}</p>}
          <form action={signInCrm} className="mt-7 space-y-5">
            <input type="hidden" name="next" value={nextPath} />
            <label className="block text-sm font-bold">Email<input className="crm-field mt-2" name="email" type="email" autoComplete="email" required placeholder="name@company.com" /></label>
            <label className="block text-sm font-bold">Password<input className="crm-field mt-2" name="password" type="password" autoComplete="current-password" required placeholder="Enter your password" /></label>
            <button className="crm-button w-full" type="submit">Sign in securely</button>
          </form>
          <div className="mt-6 flex items-center gap-3 border-t border-gray-200 pt-5 text-xs font-bold text-gray-500"><ShieldCheck size={18} className="text-indigo-600" />Access is controlled by CRM-specific database policies.</div>
        </div>
      </section>
    </main>
  );
}
