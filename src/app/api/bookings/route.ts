import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  BASE_BOOKING_DURATION_MIN,
  PROTECTED_TIME_IN_MINUTE,
  REMOVAL_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/bookingConfig";
type RemovalType = keyof typeof REMOVAL_OPTIONS;
type StyleType = keyof typeof STYLE_OPTIONS;

type Body = {
  date: string;
  start: string;
  wechatId: string;
  removalType: RemovalType;
  styleType: StyleType;
};

type DeleteBody = {
  id: number;
  wechatId: string;
};

function isValidRemovalType(value: string): value is RemovalType {
  return value in REMOVAL_OPTIONS;
}

function isValidStyleType(value: string): value is StyleType {
  return value in STYLE_OPTIONS;
}

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
export async function GET(req: NextRequest) {
  const wechatId = req.nextUrl.searchParams.get("wechatId");

  if (!wechatId || wechatId.trim().length < 2) {
    return Response.json(
      { error: "Missing or invalid ?wechatId=" },
      { status: 400 }
    );
  }

  const normalizedWechatId = wechatId.trim();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, date, time, wechat_id, status, created_at, removal_type, style_type, duration_min")
    .eq("wechat_id", normalizedWechatId)
    .order("date", { ascending: false })
    .order("time", { ascending: true });

  if (error) {
    return Response.json(
      { error: `Failed to load bookings: ${error.message}` },
      { status: 500 }
    );
  }

  return Response.json({
    bookings: data ?? [],
  });
}

export async function POST(req: NextRequest) {
  console.log("POST /api/bookings reached");
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, start, wechatId, removalType, styleType } = body;

  if (!date || !start || !wechatId || !removalType || !styleType) {
    return Response.json(
      { error: "Missing fields: date/start/wechatId/removalType/styleType" },
      { status: 400 }
    );
  }

  if (!isValidDate(date) || !isValidTime(start)) {
    return Response.json(
      { error: "Invalid date or time format" },
      { status: 400 }
    );
  }
  if (!isValidRemovalType(removalType) || !isValidStyleType(styleType)) {
    return Response.json(
      { error: "Invalid removalType or styleType" },
      { status: 400 }
    );
  }

  if (wechatId.trim().length < 2) {
    return Response.json({ error: "微信号太短了" }, { status: 400 });
  }
  const normalizedWechatId = wechatId.trim();
  const bookingDurationMin =
    BASE_BOOKING_DURATION_MIN +
    REMOVAL_OPTIONS[removalType] +
    STYLE_OPTIONS[styleType];

  const { data: existingRows, error: existingError } = await supabase
    .from("bookings")
    .select("time, duration_min")
    .eq("date", date)
    .eq("status", "booked");

  if (existingError) {
    return Response.json(
      { error: `Failed to check booking conflicts: ${existingError.message}` },
      { status: 500 }
    );
  }

  const newStart = toMinutes(start);
  const newEnd = newStart + bookingDurationMin;

  const hasConflict = (existingRows ?? []).some((row) => {
    const oldStart = toMinutes(row.time.slice(0, 5));
    const oldDurationMin = row.duration_min ?? BASE_BOOKING_DURATION_MIN;
    const oldEnd = oldStart + oldDurationMin;
    return newStart < oldEnd && oldStart < newEnd;
  });

  if (hasConflict) {
    return Response.json({ error: "该时间段已被预约" }, { status: 409 });
  }

  const { error } = await supabase.from("bookings").insert({
    date,
    time: start,
    wechat_id: normalizedWechatId,
    status: "booked",
    removal_type: removalType,
    style_type: styleType,
    duration_min: bookingDurationMin,
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

export async function DELETE(req: NextRequest) {
  let body: DeleteBody;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, wechatId } = body;

  if (!id || !wechatId) {
    return Response.json(
      { error: "Missing fields: id/wechatId" },
      { status: 400 }
    );
  }

  if (wechatId.trim().length < 2) {
    return Response.json({ error: "微信号太短了" }, { status: 400 });
  }

  const normalizedWechatId = wechatId.trim();

  const { data: targetBooking, error: targetError } = await supabase
    .from("bookings")
    .select("id, wechat_id")
    .eq("id", id)
    .maybeSingle();

  if (targetError) {
    return Response.json(
      { error: `Failed to load booking: ${targetError.message}` },
      { status: 500 }
    );
  }

  if (!targetBooking) {
    return Response.json({ error: "预约不存在" }, { status: 404 });
  }

  if (targetBooking.wechat_id !== normalizedWechatId) {
    return Response.json({ error: "只能删除自己的预约" }, { status: 403 });
  }
const { data: bookingTimeRow, error: bookingTimeError } = await supabase
  .from("bookings")
  .select("date, time")
  .eq("id", id)
  .maybeSingle();

if (bookingTimeError) {
  return Response.json(
    { error: `Failed to load booking time: ${bookingTimeError.message}` },
    { status: 500 }
  );
}

if (!bookingTimeRow) {
  return Response.json({ error: "预约不存在" }, { status: 404 });
}

const bookingStartMs = new Date(`${bookingTimeRow.date}T${bookingTimeRow.time}`).getTime();
const diffMs = bookingStartMs - Date.now();

if (diffMs < PROTECTED_TIME_IN_MINUTE * 60 * 1000) {
  return Response.json({ error: `距离预约开始不足${PROTECTED_TIME_IN_MINUTE / 60}小时，无法删除` }, { status: 403 });
}
  const { error: deleteError } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id)
    .eq("wechat_id", normalizedWechatId);

  if (deleteError) {
    return Response.json(
      { error: `Failed to delete booking: ${deleteError.message}` },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}