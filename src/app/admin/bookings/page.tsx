"use client";

import { useEffect, useState } from "react";
import { todayLocal } from "@/lib/time";
import { BOOKING_WINDOW_DAYS } from "@/lib/bookingConfig";

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
        <h1 className="text-2xl font-semibold">managemant - reservation chart</h1>

        <div className="rounded-xl border p-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">select date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border px-3 py-2"
            />
          </div>

          {loading && <p className="text-sm">loading…</p>}
          {error && <p className="text-sm text-red-600">error：{error}</p>}

          {!loading && !error && (
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-lg font-medium">reservation in future {BOOKING_WINDOW_DAYS} days</h2>
                {futureBookings.length === 0 ? (
                  <p className="text-sm text-gray-500">no reservation in future {BOOKING_WINDOW_DAYS} days</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-4 py-2 text-left">date</th>
                          <th className="border px-4 py-2 text-left">time</th>
                          <th className="border px-4 py-2 text-left">contact</th>
                          <th className="border px-4 py-2 text-left">status</th>
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
                <h2 className="mb-2 text-lg font-medium">reservation in past {BOOKING_WINDOW_DAYS} days</h2>
                {pastBookings.length === 0 ? (
                  <p className="text-sm text-gray-500">no resercation in past {BOOKING_WINDOW_DAYS} days</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border px-4 py-2 text-left">date</th>
                          <th className="border px-4 py-2 text-left">time</th>
                          <th className="border px-4 py-2 text-left">contact</th>
                          <th className="border px-4 py-2 text-left">status</th>
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
