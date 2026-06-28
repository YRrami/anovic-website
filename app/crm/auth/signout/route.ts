import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const url = new URL("/crm/login", request.url);
  if (new URL(request.url).searchParams.get("reason") === "access") url.searchParams.set("error", "access");
  return NextResponse.redirect(url);
}
