import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    console.error("[user/sync] Supabase error:", error.message);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
