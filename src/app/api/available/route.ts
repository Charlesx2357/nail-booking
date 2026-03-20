import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  STEP_MIN,
  BASE_BOOKING_DURATION_MIN,
  REMOVAL_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/bookingConfig";
import { toMinutes, toHHMM } from "@/lib/time";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const removalType = req.nextUrl.searchParams.get("removalType") as keyof typeof REMOVAL_OPTIONS | null;
  const styleType = req.nextUrl.searchParams.get("styleType") as keyof typeof STYLE_OPTIONS | null;

  if (!date) {
    return Response.json(
      { error: "Missing ?date=YYYY-MM-DD" },
      { status: 400 }
    );
  }

  if (!removalType || !(removalType in REMOVAL_OPTIONS) || !styleType || !(styleType in STYLE_OPTIONS)) {
    return Response.json(
      { error: "Missing or invalid removalType/styleType" },
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

  const bookingDurationMin =
    BASE_BOOKING_DURATION_MIN +
    REMOVAL_OPTIONS[removalType] +
    STYLE_OPTIONS[styleType];

  const { data: bookingRows, error: bookingError } = await supabase
    .from("bookings")
    .select("time, duration_min")
    .eq("date", date)
    .eq("status", "booked");
  
  if (bookingError){
    return Response.json(
      {error:`Failed to load bookings:${bookingError.message}`},
      {status:500}
    );
  }

  const openSlotMinutes: number[] = (slotRows ?? []).map((row) =>
    toMinutes(row.time.slice(0, 5))
  );
  const openSlotSet = new Set(openSlotMinutes);

  const unavailable = new Set<number>();

  (bookingRows ?? []).forEach((row) => {
    const start = toMinutes(row.time.slice(0, 5));
    const duration = row.duration_min ?? BASE_BOOKING_DURATION_MIN;
    const steps = Math.ceil(duration / STEP_MIN);
    for (let i = 0; i < steps; i++) {
      unavailable.add(start + i * STEP_MIN);
    }
  });

  const requiredSteps = Math.ceil(bookingDurationMin / STEP_MIN);

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