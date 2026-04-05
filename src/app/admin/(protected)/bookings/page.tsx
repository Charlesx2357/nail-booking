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
  removal_type?: string | null;
  style_type?: string | null;
  duration_min?: number | null;
};

function formatRemovalType(value?: string | null): string {
  switch (value) {
    case "none":
      return "No removal";
    case "extension_removal":
      return "Extension removal";
    case "natural_removal":
      return "Natural nail removal";
    default:
      return "-";
  }
}

function formatStyleType(value?: string | null): string {
  switch (value) {
    case "basic":
      return "Basic";
    case "extension":
      return "Extension";
    default:
      return "-";
  }
}

function formatCourse(booking: Booking): string {
  const removal = formatRemovalType(booking.removal_type);
  const style = formatStyleType(booking.style_type);
  const duration = booking.duration_min ?? "-";
  return `${removal} / ${style} / ${duration} min`;
}

function BookingTable({
  title,
  bookings,
}: {
  title: string;
  bookings: Booking[];
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-medium">{title}</h2>

      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">no data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-4 py-2 text-left">date</th>
                <th className="border px-4 py-2 text-left">time</th>
                <th className="border px-4 py-2 text-left">contact</th>
                <th className="border px-4 py-2 text-left">course</th>
                <th className="border px-4 py-2 text-left">status</th>
                <th className="border px-4 py-2 text-left">created</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="border px-4 py-2">{b.date}</td>
                  <td className="border px-4 py-2">{b.time.slice(0, 5)}</td>
                  <td className="border px-4 py-2">{b.wechat_id}</td>
                  <td className="border px-4 py-2">{formatCourse(b)}</td>
                  <td className="border px-4 py-2">{b.status}</td>
                  <td className="border px-4 py-2">
                    {new Date(b.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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
  },[date]);

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
              <BookingTable
                title={`reservation in future ${BOOKING_WINDOW_DAYS} days`}
                bookings={futureBookings}
              />

              <BookingTable
                title={`reservation in past ${BOOKING_WINDOW_DAYS} days`}
                bookings={pastBookings}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
