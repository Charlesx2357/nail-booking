import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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
  futureEnd.setDate(futureEnd.getDate() + 30);

  const pastStart = new Date(baseDate);
  const yesterday = new Date(baseDate);
  
  pastStart.setDate(pastStart.getDate() - 30);
  yesterday.setDate(yesterday.getDate()-1);

  const futureEndStr = futureEnd.toISOString().slice(0, 10);
  const pastStartStr = pastStart.toISOString().slice(0, 10);


  const yesterdayStr = yesterday.toISOString().slice(0,10);

  const { data: futureBookings, error: futureError } = await supabase
    .from("bookings")
    .select("*")
    .gte("date", date)
    .lte("date", futureEndStr)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  const { data: pastBookings, error: pastError } = await supabase
    .from("bookings")
    .select("*")
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