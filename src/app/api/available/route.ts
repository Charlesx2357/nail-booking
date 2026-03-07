import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const STEP_MIN = 15;

// function getAvailabilityBlocksForDate() {
//   return [
//     { start: "10:00", end: "12:00" },
//     { start: "13:00", end: "17:00" },
//   ];
// }

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return Response.json(
      { error: "Missing ?date=YYYY-MM-DD" },
      { status: 400 }
    );
  }

  // const blocks = getAvailabilityBlocksForDate();
  const { data: slotRows, error: slotError } = await supabase
    .from("availability_slots")//equivalent SQL sentence
    .select("time")
    .eq("date", date)
    .eq("is_open", true)
    .order("time", { ascending: true });

  if (slotError) {
    return Response.json(
      { error: `Failed to load availability: ${slotError.message}` },
      { status: 500 }
    );
  }
  const { data: bookingRows, error: bookingError } = await supabase
    .from("bookings")
    .select("time")
    .eq("date", date)
    .eq("status", "booked");
  
  if (bookingError){
    return Response.json(
      {error:`Failed to load bookings:${bookingError.message}`},
      {status:500}
    );
  }
  const bookedTimes = new Set(
    (bookingRows ?? []).map((row) => row.time.slice(0, 5))
  );
  
  const available = (slotRows ?? [])
    .map((row) => row.time.slice(0, 5))
    .filter((time) => !bookedTimes.has(time));

  return Response.json({
    date,
    stepMin: STEP_MIN,
    available,
  });
}