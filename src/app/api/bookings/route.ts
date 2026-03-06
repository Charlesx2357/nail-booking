import { NextRequest } from "next/server";
import { tryCreateBooking } from "../_store";

type Body = {
  date: string;       // YYYY-MM-DD
  start: string;      // HH:MM
  wechatId: string;
};

function isValidDate(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}
function isValidTime(t: string) {
  return /^\d{2}:\d{2}$/.test(t);
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, start, wechatId } = body;

  if (!date || !start || !wechatId) {
    return Response.json({ error: "Missing fields: date/start/wechatId" }, { status: 400 });
  }
  if (!isValidDate(date) || !isValidTime(start)) {
    return Response.json({ error: "Invalid date or time format" }, { status: 400 });
  }
  if (wechatId.trim().length < 3) {
    return Response.json({ error: "微信号太短了" }, { status: 400 });
  }

  // MVP：预约时长先固定 60 分钟
  const result = tryCreateBooking({
    date,
    start,
    durationMin: 60,
    wechatId: wechatId.trim(),
  });

  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: 409 });
  }

  return Response.json({ ok: true });
}
