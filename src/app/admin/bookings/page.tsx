"use client";

import { useEffect, useState } from "react";

function todayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type Booking = {
  id: number;
  date: string;
  time: string;
  wechat_id: string;
  status: string;
  created_at: string;
};

export default function AdminBookingsPage() {
  const [date, setDate] = useState(todayLocal());
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBookings() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/list?date=${date}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      const j: {
        futureBookings: Booking[];
        pastBookings: Booking[];
      } = await res.json();
      setFutureBookings(j.futureBookings ?? []);
      setPastBookings(j.pastBookings ?? []);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [date]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">后台管理 - 预约列表</h1>

        <div className="rounded-xl border p-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">选择日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </div>

          {loading && <p className="text-sm">加载中…</p>}
          {error && <p className="text-sm text-red-600">错误：{error}</p>}

          {!loading && !error && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-lg font-medium">未来30天预约</h2>
                {futureBookings.length === 0 ? (
                  <p className="text-sm text-gray-500">未来30天没有预约</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-4 py-2 text-left">日期</th>
                          <th className="border px-4 py-2 text-left">时间</th>
                          <th className="border px-4 py-2 text-left">微信号</th>
                          <th className="border px-4 py-2 text-left">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {futureBookings.map((b) => (
                          <tr key={`future-${b.id}`}>
                            <td className="border px-4 py-2">{b.date}</td>
                            <td className="border px-4 py-2">{b.time.slice(0,5)}</td>
                            <td className="border px-4 py-2">{b.wechat_id}</td>
                            <td className="border px-4 py-2">{b.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-2 text-lg font-medium">过去30天预约</h2>
                {pastBookings.length === 0 ? (
                  <p className="text-sm text-gray-500">过去30天没有预约</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-4 py-2 text-left">日期</th>
                          <th className="border px-4 py-2 text-left">时间</th>
                          <th className="border px-4 py-2 text-left">微信号</th>
                          <th className="border px-4 py-2 text-left">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pastBookings.map((b) => (
                          <tr key={`past-${b.id}`}>
                            <td className="border px-4 py-2">{b.date}</td>
                            <td className="border px-4 py-2">{b.time.slice(0,5)}</td>
                            <td className="border px-4 py-2">{b.wechat_id}</td>
                            <td className="border px-4 py-2">{b.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
