"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOrders, getServices } from "../fetch/get/fetch";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type TaskItem = {
  id: number | string;
  dateStr: string;
  isOverdue: boolean;
  status: string;
  technician: string;
  service: string;
  address?: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  paymentStatus: string;
  paymentType?: string;
  dateObj: Date | null;
  rawStatus: string;
};

export default function TaskPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser({ id: data.user.id, email: data.user.email });
      }
    });
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [resOrders, resServices] = await Promise.all([
        getOrders(),
        getServices(),
      ]);

      const rawOrders = resOrders?.data || [];
      const serviceList = resServices?.data || [];

      // Create lookup map for service names by id
      const serviceMap = new Map<string | number, string>();
      if (Array.isArray(serviceList)) {
        serviceList.forEach((s: any) => {
          if (s.id && s.name) {
            serviceMap.set(s.id, s.name);
            serviceMap.set(String(s.id), s.name);
          }
        });
      }

      const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
      ];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mapped: TaskItem[] = rawOrders.map((item: any) => {
        // Date
        const schedule =
          Array.isArray(item.complaint_schedules) && item.complaint_schedules.length > 0
            ? item.complaint_schedules[0]
            : null;

        let dateObj: Date | null = null;
        if (schedule?.date) {
          dateObj = new Date(`${schedule.date}T${schedule.time || "00:00:00"}`);
        } else if (item.created_at) {
          dateObj = new Date(item.created_at);
        }

        let formattedDate = "-";
        let isOverdue = false;

        if (dateObj && !isNaN(dateObj.getTime())) {
          const taskDateOnly = new Date(dateObj);
          taskDateOnly.setHours(0, 0, 0, 0);

          const dayName = days[dateObj.getDay()];
          const dayNum = String(dateObj.getDate()).padStart(2, "0");
          const monthName = months[dateObj.getMonth()];

          const rawStatus = (item.status || "").toString().toLowerCase();
          const isDone =
            rawStatus === "completed" ||
            rawStatus === "selesai" ||
            rawStatus === "cancelled" ||
            rawStatus === "batal";

          if (!isDone && taskDateOnly.getTime() < today.getTime()) {
            isOverdue = true;
            formattedDate = `${dayName}, ${dayNum} ${monthName} (terlambat)`;
          } else {
            formattedDate = `${dayName}, ${dayNum} ${monthName}`;
          }
        }

        // Status mapping
        const rawStatus = (item.status || "pending").toString().toLowerCase();
        let displayStatus = item.status || "Terjadwal";
        if (rawStatus === "pending") displayStatus = "Terjadwal";
        else if (
          rawStatus === "in_progress" ||
          rawStatus === "progress" ||
          rawStatus === "dikerjakan"
        )
          displayStatus = "Dikerjakan";
        else if (rawStatus === "completed" || rawStatus === "selesai")
          displayStatus = "Selesai";
        else if (
          rawStatus === "cancelled" ||
          rawStatus === "canceled" ||
          rawStatus === "batal"
        )
          displayStatus = "Batal";
        else if (
          rawStatus === "menunggu sparepart" ||
          rawStatus === "waiting_sparepart"
        )
          displayStatus = "Menunggu Sparepart";

        // Technician name
        const technician = item.assigned_user?.name || "Belum ditugaskan";

        // Service description
        const serviceNames: string[] = [];
        if (Array.isArray(item.service_orders)) {
          item.service_orders.forEach((so: any) => {
            const srvId = so.services_id ?? so.service_id;
            const name =
              so.service?.name ||
              so.services?.name ||
              (srvId ? serviceMap.get(srvId) : null);
            if (name) {
              const qty = Number(so.amount || so.amounth || 1);
              serviceNames.push(qty > 1 ? `${qty}x ${name}` : name);
            }
          });
        }

        if (Array.isArray(item.product_orders)) {
          item.product_orders.forEach((po: any) => {
            if (po.name) serviceNames.push(po.name);
          });
        }

        let serviceDesc = "";
        if (serviceNames.length > 0) {
          serviceDesc = serviceNames.join(", ");
        } else if (schedule?.complaint_schedule) {
          serviceDesc = schedule.complaint_schedule;
        } else {
          serviceDesc = "Layanan AC";
        }

        // Address
        const address =
          item.customer?.google_maps ||
          item.customer?.label ||
          item.customer?.address ||
          "";

        // Amounts
        let total = 0;
        if (Array.isArray(item.service_orders)) {
          item.service_orders.forEach((s: any) => {
            total +=
              (Number(s.price) || 0) * (Number(s.amount) || Number(s.amounth) || 1);
          });
        }
        if (Array.isArray(item.sparepart_orders)) {
          item.sparepart_orders.forEach((sp: any) => {
            total += (Number(sp.price) || 0) * (Number(sp.amount) || 1);
          });
        }
        if (Array.isArray(item.other_costs_orders)) {
          item.other_costs_orders.forEach((oc: any) => {
            total += (Number(oc.price) || 0) * (Number(oc.amount) || 1);
          });
        }
        if (Array.isArray(item.product_orders)) {
          item.product_orders.forEach((po: any) => {
            total += (Number(po.price) || 0) * (Number(po.amount) || 1);
          });
        }

        return {
          id: item.id,
          dateStr: formattedDate,
          isOverdue,
          status: displayStatus,
          technician,
          service: serviceDesc,
          address,
          customerName: item.customer?.name,
          customerPhone: item.customer?.phone,
          amount: total,
          paymentStatus: (item.payment_status || "unpaid").toString().toLowerCase(),
          paymentType: (item.payment_type || "").toString().toLowerCase(),
          dateObj,
          rawStatus,
        };
      });

      setTasks(mapped);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const todayDateStr = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  // Split tasks into sections
  const { todayAndPending, upcoming, recentlyCompleted } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAndPendingList: TaskItem[] = [];
    const upcomingList: TaskItem[] = [];
    const completedList: TaskItem[] = [];

    tasks.forEach((t) => {
      const isCompleted =
        t.rawStatus === "completed" || t.rawStatus === "selesai";
      const isCancelled =
        t.rawStatus === "cancelled" ||
        t.rawStatus === "canceled" ||
        t.rawStatus === "batal";

      if (isCancelled) {
        return;
      }

      if (isCompleted) {
        completedList.push(t);
        return;
      }

      if (t.dateObj && !isNaN(t.dateObj.getTime())) {
        const d = new Date(t.dateObj);
        d.setHours(0, 0, 0, 0);

        if (d.getTime() > today.getTime()) {
          upcomingList.push(t);
        } else {
          // today or past/overdue
          todayAndPendingList.push(t);
        }
      } else {
        todayAndPendingList.push(t);
      }
    });

    // Sort upcoming by date ascending
    upcomingList.sort((a, b) => {
      const timeA = a.dateObj?.getTime() || 0;
      const timeB = b.dateObj?.getTime() || 0;
      return timeA - timeB;
    });

    // Sort completed by date descending
    completedList.sort((a, b) => {
      const timeA = a.dateObj?.getTime() || 0;
      const timeB = b.dateObj?.getTime() || 0;
      return timeB - timeA;
    });

    return {
      todayAndPending: todayAndPendingList,
      upcoming: upcomingList,
      recentlyCompleted: completedList,
    };
  }, [tasks]);

  // Summaries calculation
  const { monthlyCommission, unpaidAmount, cashHeld } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let commission = 0;
    let unpaid = 0;
    let cash = 0;

    tasks.forEach((t) => {
      const isCompleted =
        t.rawStatus === "completed" || t.rawStatus === "selesai";
      const isCancelled =
        t.rawStatus === "cancelled" ||
        t.rawStatus === "canceled" ||
        t.rawStatus === "batal";

      if (isCancelled) return;

      const isPaid = t.paymentStatus === "paid" || t.paymentStatus === "lunas";

      // 1. Unpaid: unfinished or completed but not paid
      if (!isPaid) {
        unpaid += t.amount;
      }

      // 2. Cash held: paid by cash
      if (isPaid && (t.paymentType === "cash" || t.paymentType === "tunai")) {
        cash += t.amount;
      }

      // 3. Commission this month: completed orders in current month
      if (isCompleted && t.dateObj && !isNaN(t.dateObj.getTime())) {
        if (
          t.dateObj.getMonth() === currentMonth &&
          t.dateObj.getFullYear() === currentYear
        ) {
          commission += t.amount;
        }
      }
    });

    return {
      monthlyCommission: commission,
      unpaidAmount: unpaid,
      cashHeld: cash,
    };
  }, [tasks]);

  const formatRupiah = (amount: number) =>
    `Rp ${amount.toLocaleString("id-ID")}`;

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-3 text-slate-800 sm:p-5">
      <div className="mx-auto max-w-6xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight">Tugas Saya</h1>
            <p className="text-[10px] text-slate-500">{todayDateStr}</p>
          </div>
          <Link
            href="/order"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            Semua Order →
          </Link>
        </header>

        {/* Summary cards */}
        <section className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SummaryCard
            label="OMSET SELESAI BLN INI"
            amount={formatRupiah(monthlyCommission)}
            amountColor="text-emerald-700"
          />

          <SummaryCard
            label="BELUM DIBAYAR"
            amount={formatRupiah(unpaidAmount)}
            amountColor="text-slate-900"
          />

          <SummaryCard
            label="KAS DIPEGANG"
            amount={formatRupiah(cashHeld)}
            amountColor="text-orange-700"
          />
        </section>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <p className="text-xs text-slate-400">Memuat data tugas...</p>
          </div>
        ) : (
          <>
            {/* Today's & pending tasks */}
            <TaskSection
              title={`Hari ini & tertunda (${todayAndPending.length})`}
            >
              {todayAndPending.length > 0 ? (
                <div className="space-y-2">
                  {todayAndPending.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tugas/${task.id}`}
                      className="block"
                    >
                      <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-400 hover:shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={`text-[10px] font-medium ${
                                task.isOverdue
                                  ? "text-rose-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {task.dateStr}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-800">
                              {task.technician}
                              {task.customerName ? ` · ${task.customerName}` : ""}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {task.status && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${getStatusBadge(
                                  task.status
                                )}`}
                              >
                                {task.status}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-slate-700">
                              {formatRupiah(task.amount)}
                            </span>
                          </div>
                        </div>

                        <p className="mt-1 text-[10px] text-slate-600">
                          <span className="mr-1 text-slate-400">↳</span>
                          {task.service}
                        </p>

                        {task.address && (
                          <p className="mt-1 flex items-start gap-1 text-[10px] leading-relaxed text-slate-500">
                            <span className="text-rose-500">♦</span>
                            {task.address}
                          </p>
                        )}
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState message="Tidak ada tugas hari ini atau tertunda." />
              )}
            </TaskSection>

            {/* Upcoming tasks */}
            <TaskSection title={`Mendatang (${upcoming.length})`}>
              {upcoming.length > 0 ? (
                <div className="space-y-2">
                  {upcoming.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tugas/${task.id}`}
                      className="block"
                    >
                      <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-400 hover:shadow">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] font-medium text-slate-600">
                            {task.dateStr}
                          </p>
                          <span className="text-[10px] font-bold text-slate-700">
                            {formatRupiah(task.amount)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-semibold text-slate-800">
                          {task.service}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {task.technician}
                          {task.customerName ? ` · ${task.customerName}` : ""}
                        </p>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState message="Tidak ada tugas mendatang." />
              )}
            </TaskSection>

            {/* Recently completed */}
            <TaskSection title={`Baru selesai (${recentlyCompleted.length})`}>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {recentlyCompleted.length > 0 ? (
                  recentlyCompleted.slice(0, 10).map((task, index) => (
                    <Link
                      key={task.id}
                      href={`/tugas/${task.id}`}
                      className="block transition hover:bg-slate-50"
                    >
                      <div
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                          index !== Math.min(recentlyCompleted.length, 10) - 1
                            ? "border-b border-slate-200"
                            : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] text-slate-700">
                            <span className="font-medium text-slate-900">
                              {task.technician}
                            </span>
                            {" · "}
                            {task.service}
                          </p>
                          {task.customerName && (
                            <p className="truncate text-[9px] text-slate-400">
                              {task.customerName}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2 text-right">
                          <span className="text-[10px] font-medium text-slate-700">
                            {formatRupiah(task.amount)}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {task.dateStr}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-[10px] text-slate-400">
                    Belum ada tugas selesai.
                  </div>
                )}
              </div>
            </TaskSection>
          </>
        )}
      </div>
    </main>
  );
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "selesai") return "bg-emerald-100 text-emerald-700";
  if (s === "dikerjakan") return "bg-sky-100 text-sky-700";
  if (s === "terjadwal") return "bg-blue-100 text-blue-700";
  if (s === "menunggu sparepart") return "bg-amber-100 text-amber-700";
  if (s === "batal") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function SummaryCard({
  label,
  amount,
  amountColor,
}: {
  label: string;
  amount: string;
  amountColor: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[9px] font-medium text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${amountColor}`}>{amount}</p>
    </div>
  );
}

function TaskSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <h2 className="mb-2 text-[10px] font-medium text-slate-700">{title}</h2>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[50px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4">
      <p className="text-[10px] text-slate-400">{message}</p>
    </div>
  );
}
