export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

function normalizeSupabaseUrl(value: string | undefined) {
  const rawUrl = value?.trim().replace(/\/+$/, "");

  if (!rawUrl) {
    return undefined;
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    return rawUrl;
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return config;
}
