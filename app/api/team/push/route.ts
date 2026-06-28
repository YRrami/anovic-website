import { createClient } from "@/lib/supabase/server";

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return { supabase, userId: error || !userId ? null : userId };
}

export async function POST(request: Request) {
  const { supabase, userId } = await authenticatedClient();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as PushSubscriptionBody | null;
  const endpoint = body?.endpoint?.trim();
  const p256dh = body?.keys?.p256dh?.trim();
  const auth = body?.keys?.auth?.trim();

  if (!endpoint?.startsWith("https://") || !p256dh || !auth) {
    return Response.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  const { error } = await supabase.from("team_push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: endpoint.slice(0, 2048),
      p256dh: p256dh.slice(0, 512),
      auth: auth.slice(0, 512),
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    },
    { onConflict: "endpoint" },
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });

  await supabase.from("team_notification_preferences").upsert({
    user_id: userId,
    browser_notifications: true,
  });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { supabase, userId } = await authenticatedClient();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  const endpoint = body?.endpoint?.trim();

  if (endpoint) {
    await supabase
      .from("team_push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);
  } else {
    await supabase.from("team_push_subscriptions").delete().eq("user_id", userId);
  }

  await supabase.from("team_notification_preferences").upsert({
    user_id: userId,
    browser_notifications: false,
  });

  return Response.json({ ok: true });
}
