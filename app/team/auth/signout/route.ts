import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reason = url.searchParams.get("reason");
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const target = new URL("/team/login", url.origin);
  if (reason === "inactive") target.searchParams.set("error", "inactive");
  return NextResponse.redirect(target);
}
