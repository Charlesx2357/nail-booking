import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type Body = {
  date: string;
  time: string;
};

export async function POST(req: NextRequest) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, time } = body;

  if (!date || !time) {
    return Response.json(
      { error: "Missing fields: date/time" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("date", date)
    .eq("time", time);

  if (error) {
    return Response.json(
      { error: `Failed to delete slot: ${error.message}` },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
