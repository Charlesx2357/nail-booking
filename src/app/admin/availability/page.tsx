"use client";

import { useEffect, useState } from "react";

function todayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminAvailabilityPage() {
  const [date, setDate] = useState(todayLocal());
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("12:00");
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSlots() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/available?date=${date}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      const j: { available: string[] } = await res.json();
      setSlots(j.available);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function generateSlots() {
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/availability/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, start, end }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      const j: { count: number } = await res.json();
      setMessage(`已生成 ${j.count} 个时间槽`);
      await loadSlots();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      setError(message);
    }
  }

  async function deleteSlot(time: string) {
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/availability/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      setMessage(`已删除 ${time}`);
      await loadSlots();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      setError(message);
    }
  }

  useEffect(() => {
    loadSlots();
  }, [date]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">后台管理 - 可预约时间</h1>

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

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">开始时间</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">结束时间</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-md border px-3 py-2"
              />
            </div>

            <button
              type="button"
              onClick={generateSlots}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              生成 15 分钟时间槽
            </button>
          </div>

          {message && <p className="text-sm text-green-700">{message}</p>}
          {error && <p className="text-sm text-red-600">错误：{error}</p>}
          {loading && <p className="text-sm">加载中…</p>}

          {!loading && (
            <div>
              <h2 className="mb-2 text-lg font-medium">当天已开放的时间</h2>

              {slots.length === 0 ? (
                <p className="text-sm text-gray-500">当天还没有可预约时间</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => deleteSlot(t)}
                      className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
                      title="点击删除这个时间槽"
                    >
                      {t} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}