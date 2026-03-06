import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabaseClient";

type Body = {
  date: string;
  start: string; // "10:00"
  end: string;   // "12:00"
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

function toHHMM(m: number): string {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, start, end } = body;

  if (!date || !start || !end) {
    return Response.json(
      { error: "Missing fields: date/start/end" },
      { status: 400 }
    );
  }

  if (!isValidDate(date) || !isValidTime(start) || !isValidTime(end)) {
    return Response.json(
      { error: "Invalid date or time format" },
      { status: 400 }
    );
  }

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  if (startMin >= endMin) {
    return Response.json(
      { error: "start must be earlier than end" },
      { status: 400 }
    );
  }

  const rows = [];
  for (let t = startMin; t < endMin; t += 15) {
    rows.push({
      date,
      time: toHHMM(t),
      is_open: true,
    });
  }

  const { error } = await supabase
    .from("availability_slots")
    .upsert(rows, { onConflict: "date,time" });

  if (error) {
    return Response.json(
      { error: `Failed to generate slots: ${error.message}` },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    count: rows.length,
  });
}
