"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDashboardData } from "../fetch/get/fetch";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Calendar, CheckCircle2, Clock, Phone, AlertCircle, RefreshCw } from "lucide-react";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID").format(value);

type OrderItem = {
  id: string | number;
  user_id?: string;
  assign_to?: string;
  paid_to?: string;
  payment_status?: string;
  payment_type?: string;
  commission_mode?: string;
  status?: string;
  created_at?: string;
  creator?: { name: string } | null;
  assigned_user?: { name: string } | null;
  paid_to_user?: { name: string } | null;
  customer_id?: string | number;
  customer?: {
    name: string;
    phone: string;
    google_maps?: string;
    label?: string;
  } | null;
  service_orders?: Array<{
    id?: string | number;
    amount?: number;
    amounth?: number;
    price?: number;
    service?: { name: string };
  }>;
  sparepart_orders?: Array<{
    id?: string | number;
    amount?: number;
    price?: number;
    capital_price?: number;
  }>;
  other_costs_orders?: Array<{
    id?: string | number;
    amount?: number;
    price?: number;
  }>;
  product_orders?: Array<{
    id?: string | number;
    amount?: number;
    price?: number;
    capital_price?: number;
  }>;
  complaint_schedules?: Array<{
    id?: string | number;
    order_id?: string | number;
    date?: string;
    time?: string;
    status?: string;
    description?: string;
  }>;
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [userName, setUserName] = useState<string>("Admin");
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");
  const [clientDate, setClientDate] = useState<Date | null>(null);

  useEffect(() => {
    // Set date strictly on client after mount to prevent Next.js prerender error
    const now = new Date();
    setClientDate(now);
    setCurrentDateFormatted(
      now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    // Get active user name from supabase auth
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const metaName =
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "Admin";
        setUserName(metaName);
      }
    });

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardData();
      if (res?.data) {
        const orderList = res.data.orders || (Array.isArray(res.data) ? res.data : []);
        setOrders(orderList);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper date parsing for an order
  const getOrderDate = (item: OrderItem): Date | null => {
    const schedule =
      Array.isArray(item.complaint_schedules) && item.complaint_schedules.length > 0
        ? item.complaint_schedules[0]
        : null;

    if (schedule?.date) {
      const d = new Date(`${schedule.date}T${schedule.time || "00:00:00"}`);
      if (!isNaN(d.getTime())) return d;
    }
    if (item.created_at) {
      const d = new Date(item.created_at);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  // Helper calculating order total revenue & profit
  const calculateOrderFinances = (item: OrderItem) => {
    let revenue = 0;
    let capital = 0;

    if (Array.isArray(item.service_orders)) {
      item.service_orders.forEach((so) => {
        const qty = Number(so.amount) || Number(so.amounth) || 1;
        const pr = Number(so.price) || 0;
        revenue += qty * pr;
      });
    }

    if (Array.isArray(item.sparepart_orders)) {
      item.sparepart_orders.forEach((sp) => {
        const qty = Number(sp.amount) || 1;
        const pr = Number(sp.price) || 0;
        const cap = Number(sp.capital_price) || 0;
        revenue += qty * pr;
        capital += qty * cap;
      });
    }

    if (Array.isArray(item.other_costs_orders)) {
      item.other_costs_orders.forEach((oc) => {
        const qty = Number(oc.amount) || 1;
        const pr = Number(oc.price) || 0;
        revenue += qty * pr;
      });
    }

    if (Array.isArray(item.product_orders)) {
      item.product_orders.forEach((po) => {
        const qty = Number(po.amount) || 1;
        const pr = Number(po.price) || 0;
        const cap = Number(po.capital_price) || 0;
        revenue += qty * pr;
        capital += qty * cap;
      });
    }

    const profit = revenue - capital;
    return { revenue, profit };
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    if (!clientDate) {
      return {
        completedTodayUnits: 0,
        completedMonthUnits: 0,
        activeOrdersCount: 0,
        omzetHariIni: 0,
        omzetBulanIni: 0,
        labaBulanIni: 0,
      };
    }

    const today = clientDate;
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    let completedTodayUnits = 0;
    let completedMonthUnits = 0;
    let activeOrdersCount = 0;
    let omzetHariIni = 0;
    let omzetBulanIni = 0;
    let labaBulanIni = 0;

    orders.forEach((item) => {
      const st = (item.status || "").toLowerCase();
      const ps = (item.payment_status || "").toLowerCase();
      const isCompleted = st === "completed" || st === "selesai";
      const isPaid = ps === "paid" || ps === "lunas";

      // Count units in service orders
      let unitCount = 0;
      if (Array.isArray(item.service_orders)) {
        item.service_orders.forEach((so) => {
          unitCount += Number(so.amount) || Number(so.amounth) || 1;
        });
      }
      if (unitCount === 0) unitCount = 1;

      const date = getOrderDate(item);
      const dateStr = date ? date.toISOString().split("T")[0] : "";
      const monthStr = dateStr ? dateStr.substring(0, 7) : "";

      // 1. Units completed
      if (isCompleted) {
        if (dateStr === todayStr) {
          completedTodayUnits += unitCount;
        }
        if (monthStr === currentMonthStr) {
          completedMonthUnits += unitCount;
        }
      }

      // 2. Active orders (terjadwal, dikerjakan, pending, tunggu part)
      const isCancelled = st === "cancelled" || st === "batal";
      if (!isCompleted && !isCancelled) {
        activeOrdersCount += 1;
      }

      // 3. Omzet and profit (Order selesai & lunas)
      if (isCompleted && isPaid) {
        const { revenue, profit } = calculateOrderFinances(item);
        if (dateStr === todayStr) {
          omzetHariIni += revenue;
        }
        if (monthStr === currentMonthStr) {
          omzetBulanIni += revenue;
          labaBulanIni += profit;
        }
      }
    });

    return {
      completedTodayUnits,
      completedMonthUnits,
      activeOrdersCount,
      omzetHariIni,
      omzetBulanIni,
      labaBulanIni,
    };
  }, [orders, clientDate]);

  // Today's schedule
  const todaySchedules = useMemo(() => {
    if (!clientDate) return [];

    const todayStr = clientDate.toISOString().split("T")[0];

    return orders
      .filter((item) => {
        const date = getOrderDate(item);
        if (!date) return false;
        const dateStr = date.toISOString().split("T")[0];
        return dateStr === todayStr;
      })
      .map((item) => {
        const schedule =
          Array.isArray(item.complaint_schedules) && item.complaint_schedules.length > 0
            ? item.complaint_schedules[0]
            : null;

        const serviceNames = (item.service_orders || [])
          .map((so) => so.service?.name || "Layanan")
          .join(", ") || "Servis AC";

        return {
          id: item.id,
          time: schedule?.time || "Hari ini",
          customerName: item.customer?.name || "Pelanggan",
          customerPhone: item.customer?.phone || "",
          address: item.customer?.google_maps || item.customer?.label || "",
          service: serviceNames,
          technician: item.assigned_user?.name || "Belum ada teknisi",
          status: item.status || "Terjadwal",
        };
      });
  }, [orders, clientDate]);

  // 12 Months Chart Data
  const monthlyData = useMemo(() => {
    if (!clientDate) return [];

    const result: { month: string; rawMonth: string; orders: number; revenue: number }[] = [];
    const now = clientDate;
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
    ];

    // Build array for last 12 months in chronological order
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearStr = String(d.getFullYear()).slice(-2);
      const monthLabel = `${monthNames[d.getMonth()]} ${yearStr}`;
      const rawMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      result.push({
        month: monthLabel,
        rawMonth,
        orders: 0,
        revenue: 0,
      });
    }

    orders.forEach((item) => {
      const st = (item.status || "").toLowerCase();
      const ps = (item.payment_status || "").toLowerCase();
      const isCompleted = st === "completed" || st === "selesai";
      const isPaid = ps === "paid" || ps === "lunas";

      if (isCompleted && isPaid) {
        const date = getOrderDate(item);
        if (!date) return;
        const rawMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const match = result.find((m) => m.rawMonth === rawMonth);
        if (match) {
          const { revenue } = calculateOrderFinances(item);
          match.orders += 1;
          match.revenue += revenue;
        }
      }
    });

    return result;
  }, [orders, clientDate]);

  const maxRevenue = useMemo(() => {
    return Math.max(...monthlyData.map((m) => m.revenue), 1);
  }, [monthlyData]);

  // WhatsApp Action reminders
  const waActions = useMemo(() => {
    if (!clientDate) {
      return [
        { title: "Konfirmasi jadwal besok", count: 0, color: "bg-slate-100 text-slate-600" },
        { title: "Minta review (garansi / baru selesai)", count: 0, color: "bg-slate-100 text-slate-600" },
        { title: "Pengingat cuci rutin (3 bln lalu)", count: 0, color: "bg-slate-100 text-slate-600" },
      ];
    }

    const today = clientDate;
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // 1. Confirm tomorrow's schedule
    const tomorrowOrders = orders.filter((item) => {
      const date = getOrderDate(item);
      const dateStr = date ? date.toISOString().split("T")[0] : "";
      const st = (item.status || "").toLowerCase();
      return dateStr === tomorrowStr && st !== "cancelled" && st !== "batal";
    }).length;

    // 2. Request review for completed orders within the last 7 days
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const completedRecent = orders.filter((item) => {
      const st = (item.status || "").toLowerCase();
      const isCompleted = st === "completed" || st === "selesai";
      if (!isCompleted) return false;
      const date = getOrderDate(item);
      return date && date >= sevenDaysAgo && date <= today;
    }).length;

    // 3. Regular AC wash reminder (completed orders around 3 months ago)
    const threeMonthsAgoStart = new Date(today);
    threeMonthsAgoStart.setMonth(today.getMonth() - 4);
    const threeMonthsAgoEnd = new Date(today);
    threeMonthsAgoEnd.setMonth(today.getMonth() - 3);

    const routineReminder = orders.filter((item) => {
      const st = (item.status || "").toLowerCase();
      const isCompleted = st === "completed" || st === "selesai";
      if (!isCompleted) return false;
      const date = getOrderDate(item);
      return date && date >= threeMonthsAgoStart && date <= threeMonthsAgoEnd;
    }).length;

    return [
      {
        title: "Konfirmasi jadwal besok",
        count: tomorrowOrders,
        color:
          tomorrowOrders > 0
            ? "bg-blue-100 text-blue-700"
            : "bg-slate-100 text-slate-600",
      },
      {
        title: "Minta review (garansi / baru selesai)",
        count: completedRecent,
        color:
          completedRecent > 0
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-600",
      },
      {
        title: "Pengingat cuci rutin (3 bln lalu)",
        count: routineReminder,
        color:
          routineReminder > 0
            ? "bg-amber-100 text-amber-700"
            : "bg-slate-100 text-slate-600",
      },
    ];
  }, [orders, clientDate]);

  const summary = [
    {
      title: "UNIT SELESAI HARI INI",
      value: `${metrics.completedTodayUnits}`,
      description: `${metrics.completedMonthUnits} unit bulan ini`,
      color: "text-gray-900",
    },
    {
      title: "ORDER BERJALAN",
      value: `${metrics.activeOrdersCount}`,
      description: "Terjadwal / dikerjakan / tunggu part",
      color: "text-orange-600",
    },
    {
      title: "OMZET HARI INI",
      value: `Rp ${formatRupiah(metrics.omzetHariIni)}`,
      description: "Order selesai & lunas",
      color: "text-emerald-700",
    },
    {
      title: "OMZET BULAN INI",
      value: `Rp ${formatRupiah(metrics.omzetBulanIni)}`,
      description: `Laba: Rp ${formatRupiah(metrics.labaBulanIni)}`,
      color: "text-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Halo, {userName} 👋
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {currentDateFormatted || "Memuat tanggal..."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              title="Refresh Data"
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            <Link
              href="/order/create"
              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Order Baru
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm"
            >
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                {item.title}
              </p>

              <h2
                className={`mt-1 text-lg font-bold leading-tight ${item.color}`}
              >
                {loading ? "..." : item.value}
              </h2>

              <p className="mt-1 text-[9px] text-slate-500">
                {loading ? "Memuat data..." : item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Schedule and WhatsApp */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          {/* Today's Schedule */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
              <h3 className="text-xs font-semibold text-slate-800">
                Jadwal Hari Ini ({todaySchedules.length})
              </h3>

              <Link
                href="/tugas"
                className="text-[10px] font-medium text-blue-600 hover:text-blue-800"
              >
                Lihat semua tugas →
              </Link>
            </div>

            {loading ? (
              <div className="flex min-h-[100px] items-center justify-center">
                <p className="text-[11px] text-slate-400">Memuat jadwal...</p>
              </div>
            ) : todaySchedules.length === 0 ? (
              <div className="flex min-h-[90px] flex-col items-center justify-center py-4">
                <Calendar className="mb-1 h-5 w-5 text-slate-300" />
                <p className="text-[11px] text-slate-400">
                  Tidak ada jadwal hari ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todaySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={() => router.push(`/order/${schedule.id}`)}
                    className="flex cursor-pointer items-center justify-between p-3 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                          <Clock size={10} />
                          {schedule.time}
                        </span>
                        <h4 className="truncate text-xs font-semibold text-slate-800">
                          {schedule.customerName}
                        </h4>
                      </div>
                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {schedule.service} • Teknisi: {schedule.technician}
                      </p>
                      {schedule.address && (
                        <p className="truncate text-[9px] text-slate-400">
                          {schedule.address}
                        </p>
                      )}
                    </div>

                    <div className="ml-3 shrink-0 text-right">
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium capitalize text-slate-700">
                        {schedule.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Actions */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3 py-3">
              <h3 className="text-xs font-semibold text-slate-800">
                Aksi WA Hari Ini
              </h3>
            </div>

            <div>
              {waActions.map((action, index) => (
                <div
                  key={action.title}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left ${
                    index !== waActions.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <span className="text-[10px] text-slate-700">
                    {action.title}
                  </span>

                  <span
                    className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-medium ${action.color}`}
                  >
                    {action.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
            <h3 className="text-xs font-semibold text-slate-800">
              Tren Omzet 12 Bulan Terakhir
            </h3>
            <Link
              href="/keuangan"
              className="text-[10px] font-medium text-blue-600 hover:text-blue-800"
            >
              Detail Keuangan →
            </Link>
          </div>

          <div className="px-3 pb-3 pt-5">
            {/* Chart */}
            <div className="flex h-[115px] items-end gap-1">
              {monthlyData.map((item) => {
                const height =
                  item.revenue > 0
                    ? Math.max((item.revenue / maxRevenue) * 100, 4)
                    : 0;

                return (
                  <div
                    key={item.rawMonth}
                    className="flex h-full min-w-0 flex-1 items-end justify-center"
                  >
                    <div
                      title={`${item.month}: Rp ${formatRupiah(item.revenue)} (${item.orders} order)`}
                      className={`w-full max-w-[90px] rounded-t-sm transition-all ${
                        item.revenue > 0
                          ? "bg-blue-500/80 hover:bg-blue-600"
                          : "bg-slate-100"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Month labels */}
            <div className="mt-0 flex gap-1">
              {monthlyData.map((item) => (
                <div
                  key={item.rawMonth}
                  className="min-w-0 flex-1 border-t border-blue-500 pt-1 text-center"
                >
                  <p className="truncate text-[8px] text-slate-500">
                    {item.month}
                  </p>
                  <p className="mt-1 text-[8px] font-medium text-slate-600">
                    {item.orders}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[9px] text-slate-400">
              Batang = omzet (di luar pajak), angka bawah = jumlah order selesai
              & lunas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
