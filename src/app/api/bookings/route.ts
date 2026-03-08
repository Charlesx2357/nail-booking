import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { BOOKING_DURATION_MIN } from "@/lib/bookingConfig";

type Body = {
  date: string;
  start: string;
  wechatId: string;
};

function isValidDate(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function isValidTime(t: string) {
  return /^\d{2}:\d{2}$/.test(t);
}

function toMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

export async function POST(req: NextRequest) {
  console.log("POST /api/bookings reached");
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, start, wechatId } = body;

  if (!date || !start || !wechatId) {
    return Response.json(
      { error: "Missing fields: date/start/wechatId" },
      { status: 400 }
    );
  }

  if (!isValidDate(date) || !isValidTime(start)) {
    return Response.json(
      { error: "Invalid date or time format" },
      { status: 400 }
    );
  }

  if (wechatId.trim().length < 2) {
    return Response.json({ error: "微信号太短了" }, { status: 400 });
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("bookings")
    .select("time")
    .eq("date", date)
    .eq("status", "booked");

  if (existingError) {
    return Response.json(
      { error: `Failed to check booking conflicts: ${existingError.message}` },
      { status: 500 }
    );
  }

  const newStart = toMinutes(start);
  const newEnd = newStart + BOOKING_DURATION_MIN;

  const hasConflict = (existingRows ?? []).some((row) => {
    const oldStart = toMinutes(row.time.slice(0, 5));
    const oldEnd = oldStart + BOOKING_DURATION_MIN;
    return newStart < oldEnd && oldStart < newEnd;
  });

  if (hasConflict) {
    return Response.json({ error: "该时间段已被预约" }, { status: 409 });
  }

  const { error } = await supabase.from("bookings").insert({
    date,
    time: start,
    wechat_id: wechatId.trim(),
    status: "booked",
  });

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "该时间已被预约" }, { status: 409 });
    }

    return Response.json(
      { error: `Failed to create booking: ${error.message}` },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}