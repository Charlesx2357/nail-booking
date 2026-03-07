import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

const STEP_MIN = 15;
const BOOKING_DURATION_MIN = 60;
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return Response.json(
      { error: "Missing ?date=YYYY-MM-DD" },
      { status: 400 }
    );
  }
  function toMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function toHHMM(m: number): string {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
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
  const bookings = (bookingRows ?? []).map((row) => ({
    start: row.time.slice(0, 5),
    durationMin: BOOKING_DURATION_MIN,
  }));

  const openSlotMinutes: number[] = (slotRows ?? []).map((row) =>
    toMinutes(row.time.slice(0, 5))
  );
  const openSlotSet = new Set(openSlotMinutes);

  const unavailable = new Set<number>();

  for (const bk of bookings) {
    const bookingStart = toMinutes(bk.start);
    const bookingEnd = bookingStart + bk.durationMin;

    for (let t = bookingStart; t < bookingEnd; t += STEP_MIN) {
      unavailable.add(t);
    }
  }

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