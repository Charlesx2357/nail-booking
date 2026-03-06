// src/app/api/_store.ts
export type Booking = {
  date: string;        // YYYY-MM-DD
  start: string;       // HH:MM
  durationMin: number; // 先固定 60
  wechatId: string;
  createdAt: number;
};

// 注意：这是“开发期内存存储”，重启 pnpm dev 会清空。
// 之后我们会替换成 Supabase(Postgres) 持久化。
const bookings: Booking[] = [];

export function listBookingsByDate(date: string): Booking[] {
  return bookings.filter((b) => b.date === date);
}

export function tryCreateBooking(input: Omit<Booking, "createdAt">): { ok: true } | { ok: false; reason: string } {
  const exists = bookings.some(
    (b) => b.date === input.date && b.start === input.start
  );
  if (exists) return { ok: false, reason: "该时间已被预约" };

  bookings.push({ ...input, createdAt: Date.now() });
  return { ok: true };
}
