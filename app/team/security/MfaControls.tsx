"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string; status: string };
type Enrollment = { id: string; qrCode: string; secret: string };

export default function MfaControls() {
  const router = useRouter();
  const [factor, setFactor] = useState<Factor | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [aal, setAal] = useState("aal1");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshState() {
    const supabase = createClient();
    const [{ data: factors }, { data: assurance }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    const verified = factors?.totp.find((item) => item.status === "verified") || null;
    setFactor(verified);
    setAal(assurance?.currentLevel || "aal1");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshState(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function enroll() {
    setBusy(true); setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Anovic Workspace",
    });
    if (error) setMessage(error.message);
    else if (data) setEnrollment({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    setBusy(false);
  }

  async function verify(factorId: string, action: "enroll" | "challenge") {
    if (!/^\d{6}$/.test(code)) { setMessage("Enter the 6-digit authenticator code."); return; }
    setBusy(true); setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) setMessage(error.message);
    else {
      if (action === "enroll") {
        await supabase.rpc("log_team_auth_event", { p_action: "auth.mfa_enrolled", p_metadata: {} });
      }
      setEnrollment(null); setCode(""); setMessage(action === "enroll" ? "Authenticator enabled." : "Session verified with MFA.");
      await refreshState(); router.refresh();
    }
    setBusy(false);
  }

  async function remove() {
    if (!factor) return;
    setBusy(true); setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) setMessage(error.message);
    else {
      await supabase.rpc("log_team_auth_event", { p_action: "auth.mfa_removed", p_metadata: {} });
      setMessage("Authenticator removed."); setFactor(null); setAal("aal1"); router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div><p className="text-sm font-black">Authenticator app</p><p className="mt-1 text-xs font-bold text-gray-500">{factor ? "Enrolled" : "Not enrolled"} - session {aal.toUpperCase()}</p></div>
        <span className={factor ? "rounded-full bg-indigo-700 px-3 py-1 text-xs font-black uppercase text-white" : "rounded-full bg-yellow-100 px-3 py-1 text-xs font-black uppercase text-black"}>{factor ? "Protected" : "Optional"}</span>
      </div>

      {!factor && !enrollment && <button type="button" disabled={busy} onClick={enroll} className="team-button min-h-10 px-4 text-xs">Set up authenticator</button>}

      {enrollment && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        {/* A data URL is supplied directly by Supabase Auth for this one-time QR code. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enrollment.qrCode} alt="Authenticator QR code" className="h-48 w-48 border border-gray-200 bg-white p-2" />
        <p className="mt-3 break-all text-xs font-bold text-gray-600">Manual key: {enrollment.secret}</p>
        <div className="mt-4 flex gap-2"><input className="team-field max-w-40" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000" /><button type="button" disabled={busy} onClick={() => verify(enrollment.id, "enroll")} className="team-button min-h-11 px-4 text-xs">Verify</button></div>
      </div>}

      {factor && aal !== "aal2" && <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4"><p className="text-sm font-black">Verify this session</p><div className="mt-3 flex gap-2"><input className="team-field max-w-40" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000" /><button type="button" disabled={busy} onClick={() => verify(factor.id, "challenge")} className="team-button min-h-11 px-4 text-xs">Verify</button></div></div>}

      {factor && <button type="button" disabled={busy} onClick={remove} className="team-button-secondary min-h-10 px-4 text-xs">Remove authenticator</button>}
      {message && <p className="text-sm font-bold text-gray-600" role="status">{message}</p>}
    </div>
  );
}
