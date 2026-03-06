import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return Response.json(
      { error: "Missing ?date=YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id, date, time, wechat_id, status, created_at")
    .eq("date", date)
    .order("time", { ascending: true });

  if (error) {
    return Response.json(
      { error: `Failed to load bookings: ${error.message}` },
      { status: 500 }
    );
  }

  return Response.json({
    date,
    bookings: data ?? [],
  });
}
