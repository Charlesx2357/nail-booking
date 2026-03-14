import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { STEP_MIN, BOOKING_DURATION_MIN } from "@/lib/bookingConfig";
import { toMinutes, toHHMM } from "@/lib/time";
import { buildUnavailableSlots } from "@/lib/bookingLogic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return Response.json(
      { error: "Missing ?date=YYYY-MM-DD" },
      { status: 400 }
    );
  }

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
  const bookings = (bookingRows ?? []).map((row) => ({
    start: row.time.slice(0, 5),
    durationMin: BOOKING_DURATION_MIN,
  }));

  const openSlotMinutes: number[] = (slotRows ?? []).map((row) =>
    toMinutes(row.time.slice(0, 5))
  );
  const openSlotSet = new Set(openSlotMinutes);


const bookingStarts = (bookingRows ?? []).map((row) =>
  toMinutes(row.time.slice(0, 5))
);

const unavailable = buildUnavailableSlots(
  bookingStarts,
  BOOKING_DURATION_MIN,
  STEP_MIN
);
  const requiredSteps = BOOKING_DURATION_MIN / STEP_MIN;

  const available = openSlotMinutes
    .filter((start) => {
      for (let i = 0; i < requiredSteps; i++) {
        const t = start + i * STEP_MIN;
        if (!openSlotSet.has(t) || unavailable.has(t)) {
          return false;
        }
      }
      return true;
    })
    .map(toHHMM);

  return Response.json({
    date,
    stepMin: STEP_MIN,
    available,
  });
}