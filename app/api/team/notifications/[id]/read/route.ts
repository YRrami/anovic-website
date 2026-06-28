import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, context: RouteContext<"/api/team/notifications/[id]/read">) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { error: updateError } = await supabase
    .from("team_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", userId);

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  return Response.json({ ok: true });
}
