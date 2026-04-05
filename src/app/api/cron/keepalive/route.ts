import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { error } = await supabase
    .from("availability_slots")
    .select("time")
    .limit(1);

  if (error) {
    console.error("CRON ERROR:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
