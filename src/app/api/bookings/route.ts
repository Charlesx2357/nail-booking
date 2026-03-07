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

  const baseDate = new Date(`${date}T00:00:00`);

  const futureEndDate = new Date(baseDate);
  futureEndDate.setDate(futureEndDate.getDate() + 30);
  const futureEndDateStr = futureEndDate.toISOString().slice(0, 10);

  const pastStartDate = new Date(baseDate);
  pastStartDate.setDate(pastStartDate.getDate() - 30);
  const pastStartDateStr = pastStartDate.toISOString().slice(0, 10);

  const { data: futureBookings, error: futureError } = await supabase
    .from("bookings")
    .select("id, date, time, wechat_id, status, created_at")
    .gte("date", date)
    .lte("date", futureEndDateStr)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  const { data: pastBookings, error: pastError } = await supabase
    .from("bookings")
    .select("id, date, time, wechat_id, status, created_at")
    .gte("date", pastStartDateStr)
    .lte("date", date)
    .order("date", { ascending: false })
    .order("time", { ascending: true });

  if (futureError) {
    return Response.json(
      { error: `Failed to load future bookings: ${futureError.message}` },
      { status: 500 }
    );
  }

  if (pastError) {
    return Response.json(
      { error: `Failed to load past bookings: ${pastError.message}` },
      { status: 500 }
    );
  }

  return Response.json({
    selectedDate: date,
    futureEndDate: futureEndDateStr,
    pastStartDate: pastStartDateStr,
    futureBookings: futureBookings ?? [],
    pastBookings: pastBookings ?? [],
  });
}