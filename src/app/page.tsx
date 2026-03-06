"use client";

import { useEffect, useMemo, useState } from "react";

function todayLocal(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Home() {
  const [date, setDate] = useState<string>(todayLocal());
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 预约交互状态
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [wechatId, setWechatId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  const title = useMemo(() => `可预约时间（${date}，15分钟粒度）`, [date]);

  async function refreshSlots() {
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

  useEffect(() => {
    refreshSlots();
    // 切日期时清理预约状态
    setSelectedSlot(null);
    setWechatId("");
    setSubmitError(null);
    setSubmitOk(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function submitBooking() {
    if (!selectedSlot) return;

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitOk(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          start: selectedSlot,
          wechatId,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      setSubmitOk(`预约成功：${date} ${selectedSlot}`);
      setSelectedSlot(null);
      setWechatId("");

      // 预约成功后刷新 slots，让该时间消失
      await refreshSlots();
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      setSubmitError(message);
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">自宅美甲预约（MVP）</h1>

        <div className="rounded-xl border p-4 space-y-3">
          <label className="block text-sm font-medium">选择日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border px-3 py-2"
          />

          <h2 className="text-lg font-medium">{title}</h2>

          {loading && <p className="text-sm">加载中…</p>}
          {error && <p className="text-sm text-red-600">错误：{error}</p>}

          {!loading && !error && (
            <>
              <div className="flex flex-wrap gap-2">
                {slots.length === 0 ? (
                  <span className="text-sm text-gray-500">当天没有可预约时间</span>
                ) : (
                  slots.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(t);
                        setSubmitError(null);
                        setSubmitOk(null);
                      }}
                      className={`rounded-full border px-3 py-1 text-sm hover:bg-gray-50 ${
                        selectedSlot === t ? "bg-gray-100" : ""
                      }`}
                      title="点击后填写微信号预约"
                    >
                      {t}
                    </button>
                  ))
                )}
              </div>

              {selectedSlot && (
                <div className="mt-4 rounded-lg border p-3 space-y-2">
                  <div className="text-sm">
                    你选择了：<span className="font-medium">{date} {selectedSlot}</span>
                  </div>

                  <label className="block text-sm font-medium">微信号（暂不验证）</label>
                  <input
                    value={wechatId}
                    onChange={(e) => setWechatId(e.target.value)}
                    placeholder="例如：wxid_..."
                    className="w-full rounded-md border px-3 py-2"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={submitBooking}
                      disabled={submitLoading || wechatId.trim().length < 3}
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      {submitLoading ? "提交中…" : "确认预约"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSlot(null);
                        setWechatId("");
                        setSubmitError(null);
                        setSubmitOk(null);
                      }}
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      取消
                    </button>
                  </div>

                  {submitError && <div className="text-sm text-red-600">预约失败：{submitError}</div>}
                  {submitOk && <div className="text-sm text-green-700">{submitOk}</div>}

                  <div className="text-xs text-gray-500">
                    说明：当前预约暂存在本地开发服务器内存中，重启 pnpm dev 会清空。下一步会接入 Supabase 永久保存。
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}