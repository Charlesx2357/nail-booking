"use client";

import { useEffect, useMemo, useState } from "react";
import { todayLocal, toMinutes, toHHMM } from "@/lib/time";
import {PROTECTED_TIME_IN_MINUTE} from "@/lib/bookingConfig";
// function todayLocal(): string {
//   const d = new Date();
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// }
import { STEP_MIN, BOOKING_DURATION_MIN } from "@/lib/bookingConfig";

type MyBooking = {
  id: number;
  date: string;
  time: string;
  wechat_id: string;
  status: string;
  created_at: string;
};

export default function Home() {//看起来是给左侧赋值，但本质上是在声明组件的多个 state。每个 useState 都在 React 内部占据一个固定顺序的位置，并指定这个 state 的初始值和类型；左侧通过数组解构拿到当前值和对应的 setter 函数。

  const [date, setDate] = useState<string>(todayLocal());//右侧括号内的值只有在初始化时才有效果，第二次以后重新渲染则跳过
  const [loading, setLoading] = useState(false);//useState Function is order sensitive
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 预约交互状态
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [wechatId, setWechatId] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  const [lookupWechatId, setLookupWechatId] = useState("");
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null);

  function getBookingStartMs(booking: MyBooking): number {
    return new Date(`${booking.date}T${booking.time}`).getTime();
  }

  function canDeleteBooking(booking: MyBooking): boolean {
    const diffMs = getBookingStartMs(booking) - Date.now();
    return diffMs >= PROTECTED_TIME_IN_MINUTE * 60 * 1000;
  }

  // function toMinutes(t: string): number {
  //   const [hh, mm] = t.split(":").map(Number);
  //   return hh * 60 + mm;
  // }

  // function toHHMM(m: number): string {
  //   const hh = Math.floor(m / 60);
  //   const mm = m % 60;
  //   return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  // }
  const title = useMemo(
  () => `Course Starts at/开始时间`,[date]
);

  async function refreshSlots() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/available?date=${date}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j: { available: string[] } = await res.json();//turn json into JS object
      setSlots(j.available);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }
const renderableSlots = useMemo(() => {
  const slotMinutes = slots.map(toMinutes);
  const slotSet = new Set(slotMinutes);
  const requiredSteps = BOOKING_DURATION_MIN / STEP_MIN;

  return slotMinutes
    .filter((start) => {
      for (let i = 0; i < requiredSteps; i++) {
        const t = start + i * STEP_MIN;
        if (!slotSet.has(t)) {
          return false;
        }
      }
      return true;
    })
    .map(toHHMM);
}, [slots]);
  useEffect(() => {
    refreshSlots();

    const timer = setInterval(() => {
      refreshSlots();
    }, 30000);//polling interval setting

    // 切日期时清理预约状态
    setSelectedSlot(null);
    setWechatId("");
    setSubmitError(null);
    setSubmitOk(null);
    return () => clearInterval(timer);
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

      const successMessage = `预约成功/Reservation Succeeded\n${date} ${selectedSlot}\n${wechatId}`;

      setSubmitOk(`预约成功：${date} ${selectedSlot}`);
      alert(successMessage);
      
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

  async function lookupMyBookings() {
    const normalizedWechatId = lookupWechatId.trim();

    if (normalizedWechatId.length < 2) {
      setLookupError("请输入正确的微信号");
      setMyBookings([]);
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const res = await fetch(
        `/api/bookings?wechatId=${encodeURIComponent(normalizedWechatId)}`
      );

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      const j: { bookings: MyBooking[] } = await res.json();
      setMyBookings(j.bookings ?? []);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      setLookupError(message);
      setMyBookings([]);
    } finally {
      setLookupLoading(false);
    }
  }

  async function deleteMyBooking(bookingId: number) {
    const normalizedWechatId = lookupWechatId.trim();

    const targetBooking = myBookings.find((b) => b.id === bookingId);

    if (!targetBooking) {
      setLookupError("未找到该预约");
      return;
    }

    if (!canDeleteBooking(targetBooking)) {
      const message = `距离预约开始不足${PROTECTED_TIME_IN_MINUTE / 60}小时，无法删除`;
      setLookupError(message);
      alert(message);
      return;
    }

    if (normalizedWechatId.length < 2) {
      setLookupError("Please insert your contact / 请输入正确的微信号");
      return;
    }

    const confirmed = window.confirm("Confirm to delete? / 确定要删除这条预约吗？");
    if (!confirmed) return;

    setDeletingBookingId(bookingId);
    setLookupError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          wechatId: normalizedWechatId,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }

      setMyBookings((prev) => prev.filter((b) => b.id !== bookingId));
      alert("Deleted / 预约已删除");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Unknown error";
      setLookupError(message);
    } finally {
      setDeletingBookingId(null);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold">SugarCoat Nail</h1>

        <div className="rounded-xl border p-4 space-y-3">
          <label className="block text-sm font-medium">Date/选择日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border px-3 py-2"
          />

          <h2 className="text-lg font-medium">{title}</h2>

          {loading && <p className="text-sm">loading / 加载中…</p>}
          {error && <p className="text-sm text-red-600">错误：{error}</p>}

          {!loading && !error && (
            <>
              <div className="flex flex-wrap gap-2">
                {renderableSlots.length === 0 ? (
                  <span className="text-sm text-gray-500">No available time today / 当天没有可预约时间</span>
                ) : (
                  renderableSlots.map((t) => (
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
                      title="填写微信号预约"
                    >
                      {t}
                    </button>
                  ))
                )}
              </div>

              {selectedSlot && (
                <div className="mt-4 rounded-lg border p-3 space-y-2">
                  <div className="text-sm">
                    Selecting/你选择了：<span className="font-medium">{date} {selectedSlot}</span>
                  </div>

                  <label className="block text-sm font-medium">微信号</label>
                  <input
                    value={wechatId}
                    onChange={(e) => setWechatId(e.target.value)}
                    placeholder="eg：wxid_..."
                    className="w-full rounded-md border px-3 py-2"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={submitBooking}
                      disabled={submitLoading || wechatId.trim().length < 3}
                      className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      {submitLoading ? "提交中…/Submitting..." : "预约/Reservate"}
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
                      取消/cancel
                    </button>
                  </div>

                  {submitError && <div className="text-sm text-red-600">Reservation Failed / 预约失败：{submitError}</div>}
                  {submitOk && <div className="text-sm text-green-700">{submitOk}</div>}

                  <div className="text-xs text-gray-500">
                    
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border p-4 space-y-4">
          <h2 className="text-lg font-medium">My Reservations / 查询我的预约</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">微信号</label>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={lookupWechatId}
                onChange={(e) => setLookupWechatId(e.target.value)}
                placeholder="请输入预约时使用的微信号"
                className="rounded-md border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={lookupMyBookings}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Search / 查询
              </button>
            </div>
          </div>

          {lookupLoading && <p className="text-sm">Searching/查询中…</p>}
          {lookupError && <p className="text-sm text-red-600">错误：{lookupError}</p>}

          {!lookupLoading && !lookupError && (
            myBookings.length === 0 ? (
              <p className="text-sm text-gray-500">No reservations found/暂无预约记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-2 text-left">Date</th>
                      <th className="border px-4 py-2 text-left">Time</th>
                      {/* <th className="border px-4 py-2 text-left">Status</th> */}
                      <th className="border px-4 py-2 text-left">Created</th>
                      <th className="border px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="border px-4 py-2">{b.date}</td>
                        <td className="border px-4 py-2">{b.time.slice(0, 5)}</td>
                        {/* <td className="border px-4 py-2">{b.status}</td> */}
                        <td className="border px-4 py-2">{new Date(b.created_at).toLocaleString()}</td>
                        <td className="border px-4 py-2">
                          <button
                            type="button"
                            onClick={() => deleteMyBooking(b.id)}
                            disabled={deletingBookingId === b.id || !canDeleteBooking(b)}
                            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                            title={
                              canDeleteBooking(b)
                                ? ""
                                : `Less than ${PROTECTED_TIME_IN_MINUTE / 60} hours before start / 距离开始不足${PROTECTED_TIME_IN_MINUTE / 60}小时不可删除`
                            }
                          >
                            {deletingBookingId === b.id ? "Deleting..." : "Delete / 删除"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </main>)}
