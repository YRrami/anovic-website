import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { requestPasswordReset, signIn } from "./actions";

export const metadata: Metadata = {
  title: "Team Login | Anovic",
  description: "Private Anovic team platform login.",
  robots: {
    index: false,
    follow: false,
  },
};

type LoginSearchParams = Promise<{
  error?: string;
  next?: string;
  setup?: string;
  reset?: string;
}>;

function safeNextPath(value?: string) {
  if (
    !value ||
    !value.startsWith("/team") ||
    value.startsWith("/team/login") ||
    value.startsWith("//") ||
    value.includes("://")
  ) {
    return "/team";
  }

  return value;
}

function loginMessage(error?: string, setup?: string) {
  if (setup === "missing") {
    return {
      tone: "warning",
      text: "Supabase is not configured yet. Add your project URL and publishable key to .env.local before team members can sign in.",
    };
  }

  if (error === "missing") {
    return { tone: "error", text: "Enter your email and password." };
  }

  if (error === "invalid") {
    return { tone: "error", text: "The email or password is incorrect." };
  }

  if (error === "unconfirmed") {
    return {
      tone: "error",
      text: "This account exists but the email is not confirmed yet. Confirm it in Supabase Auth or create the user with auto-confirm enabled.",
    };
  }

  if (error === "auth") {
    return {
      tone: "error",
      text: "Supabase rejected the sign-in request. Check the user account, password, and Auth settings.",
    };
  }

  if (error === "inactive") {
    return { tone: "error", text: "This team account is inactive. Contact an administrator." };
  }

  return null;
}

export default async function TeamLoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;
  const config = getSupabaseConfig();
  const nextPath = safeNextPath(params.next);

  if (config) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) {
      redirect(nextPath);
    }
  }

  const message = params.reset === "sent"
    ? { tone: "success", text: "If that account exists, a secure password reset link has been sent." }
    : loginMessage(params.error, params.setup);
  const isSetupMissing = !config || params.setup === "missing";

  return (
    <main className="team-platform min-h-screen px-4 py-10 text-black sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="hidden lg:block">
            <Link href="/" aria-label="Back to Anovic home" className="inline-flex">
              <Image
                src="/logo.png"
                alt="Anovic"
                width={256}
                height={43}
                style={{ width: "11rem", height: "auto" }}
                loading="eager"
              />
            </Link>

            <div className="mt-12 max-w-md">
              <p className="team-kicker">Private team platform</p>
              <h1 className="mt-5 text-5xl font-black leading-[0.96] tracking-[-0.03em]">
                Manage work behind the scenes.
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-800">
                A secure internal space for tasks, attendance, and employee operations.
              </p>
            </div>
          </div>

          <div className="team-panel mx-auto w-full max-w-md p-6 backdrop-blur sm:p-8">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link href="/" aria-label="Back to Anovic home" className="lg:hidden">
                <Image
                  src="/logo.png"
                  alt="Anovic"
                  width={256}
                  height={43}
                  style={{ width: "8rem", height: "auto" }}
                  loading="eager"
                />
              </Link>
              <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-gray-900">
                Staff only
              </span>
            </div>

            <div>
              <p className="team-kicker">Team login</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Sign in to continue
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-800">
                Access is restricted to Anovic team members with Supabase accounts.
              </p>
            </div>

            {message && (
              <p
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${
                  message.tone === "warning"
                    ? "border-yellow-300 bg-yellow-50 text-black"
                    : "border-yellow-300 bg-yellow-50 text-black"
                }`}
                role="status"
              >
                {message.text}
              </p>
            )}

            <form action={signIn} className="mt-8 space-y-5">
              <input type="hidden" name="next" value={nextPath} />

              <label className="block">
                <span className="text-sm font-black text-black">Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isSetupMissing}
                  className="team-field mt-2 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="name@anovic.net"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-black">Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isSetupMissing}
                  className="team-field mt-2 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="Enter your password"
                />
              </label>

              <button
                type="submit"
                disabled={isSetupMissing}
                className="team-button w-full"
              >
                Sign in
              </button>
            </form>

            <details className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <summary className="cursor-pointer text-sm font-black text-indigo-700">Forgot password?</summary>
              <form action={requestPasswordReset} className="mt-4 space-y-3">
                <label className="block text-sm font-black">Account email<input className="team-field mt-2" type="email" name="email" required placeholder="name@anovic.net" /></label>
                <button type="submit" className="team-button-secondary min-h-10 w-full px-4 text-xs">Send reset link</button>
              </form>
            </details>

            <p className="mt-6 text-xs font-bold leading-6 text-gray-500">
              Do not share this page publicly. Team access is enforced by Supabase Auth.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
