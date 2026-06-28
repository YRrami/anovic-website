import type { Metadata } from "next";
import { requireTeamSession } from "../_lib/data";
import { updateTeamPassword } from "../security/actions";

export const metadata: Metadata = { title: "Reset Password | Anovic Team", robots: { index: false, follow: false } };

export default async function ResetPasswordPage() {
  await requireTeamSession({ allowMfaSetup: true });
  return <main className="team-platform min-h-screen px-4 py-10 text-black sm:px-6"><section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center"><div className="team-panel w-full p-6 sm:p-8"><p className="team-kicker">Account recovery</p><h1 className="mt-3 text-3xl font-black">Choose a new password</h1><p className="mt-3 text-sm font-bold leading-6 text-gray-500">Use at least 12 characters with a number and symbol.</p><form action={updateTeamPassword} className="mt-6 space-y-4"><label className="block text-sm font-black">New password<input className="team-field mt-2" type="password" name="password" minLength={12} autoComplete="new-password" required /></label><label className="block text-sm font-black">Confirm password<input className="team-field mt-2" type="password" name="confirmation" minLength={12} autoComplete="new-password" required /></label><button className="team-button w-full" type="submit">Update password</button></form></div></section></main>;
}
