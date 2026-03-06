import { NextRequest } from "next/server";
import { listBookingsByDate } from "../_store";

const STEP_MIN = 15;

function getAvailabilityBlocksForDate() {
  return [
    { start: "10:00", end: "12:00" },
    { start: "13:00", end: "17:00" },
  ];
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

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return Response.json(
      { error: "Missing ?date=YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const blocks = getAvailabilityBlocksForDate();
  const bookings = listBookingsByDate(date);

  const slots: number[] = [];
  for (const b of blocks) {
    const start = toMinutes(b.start);
    const end = toMinutes(b.end);

    for (let t = start; t + STEP_MIN <= end; t += STEP_MIN) {
      slots.push(t);
    }
  }

  const unavailable = new Set<number>();
  for (const bk of bookings) {
    const bookingStart = toMinutes(bk.start);
    const bookingEnd = bookingStart + bk.durationMin;

    for (const t of slots) {
      if (t >= bookingStart && t < bookingEnd) {
        unavailable.add(t);
      }
    }
  }

  const available = slots
    .filter((t) => !unavailable.has(t))
    .map(toHHMM);

  return Response.json({
    date,
    stepMin: STEP_MIN,
    available,
  });
}