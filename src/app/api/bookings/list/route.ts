import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { BOOKING_WINDOW_DAYS } from "@/lib/bookingConfig";
import { formatLocalDate } from "@/lib/time";


export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return Response.json(
      { error: "Missing date parameter" },
      { status: 400 }
    );
  }

  const baseDate = new Date(`${date}T00:00:00`);

  const futureEnd = new Date(baseDate);
  futureEnd.setDate(futureEnd.getDate() + BOOKING_WINDOW_DAYS);

  const pastStart = new Date(baseDate);
  const yesterday = new Date(baseDate);

  pastStart.setDate(pastStart.getDate() - BOOKING_WINDOW_DAYS);
  yesterday.setDate(yesterday.getDate()-1);

  const futureEndStr = formatLocalDate(futureEnd);
  const pastStartStr = formatLocalDate(pastStart);
  const yesterdayStr = formatLocalDate(yesterday);

  const { data: futureBookings, error: futureError } = await supabase
    .from("bookings")
    .select("id, date, time, wechat_id, status, created_at, removal_type, style_type, duration_min")
    .gte("date", date)
    .lte("date", futureEndStr)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  const { data: pastBookings, error: pastError } = await supabase
    .from("bookings")
    .select("id, date, time, wechat_id, status, created_at, removal_type, style_type, duration_min")
    .gte("date", pastStartStr)
    .lte("date", yesterdayStr)
    .order("date", { ascending: false })
    .order("time", { ascending: true });

  if (futureError || pastError) {
    return Response.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }

  return Response.json({
    futureBookings: futureBookings ?? [],
    pastBookings: pastBookings ?? []
  });
}