"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrders, getServices } from "../fetch/get/fetch";
import { updateOrderStatus } from "../fetch/update/fetch";

const tabs = [
  "Laba Rugi",
  "Pendapatan Lainnya",
  "Pengeluaran",
  "Setoran Kas",
  "Piutang",
  "Komisi",
];

type CashOrder = {
  id: string;
  invoice: string;
  customer: string;
  date: string;
  amount: number;
  rawDate: string;
};

type CashGroup = {
  id: string;
  name: string;
  orders: CashOrder[];
};

type CashHistory = {
  id: string;
  date: string;
  name: string;
  orders: number;
  amount: number;
  receivedBy: string;
};

type CommissionHistoryItem = {
  id: string;
  date: string;
  executor: string;
  order: string;
  amount: number;
};

type ReceivableItem = {
  id: string;
  invoice: string;
  customer: string;
  date: string;
  status: string;
  technician: string;
  amount: number;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, " ");

function SummaryCard({
  title,
  value,
  subtitle,
  color = "text-slate-900",
}: {
  title: string;
  value: number;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <p className="truncate text-[9px] font-medium uppercase text-slate-500">
        {title}
      </p>
      <p className={`mt-1 text-base font-bold leading-tight ${color}`}>
        {formatRupiah(value)}
      </p>
      {subtitle && <p className="mt-1 text-[9px] text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("Laba Rugi");
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState<any[]>([]);

  // Filters
  const [month, setMonth] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Setoran kas
  const [cashHistory, setCashHistory] = useState<CashHistory[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [cashNotes, setCashNotes] = useState<Record<string, string>>({});
  const [receivingGroup, setReceivingGroup] = useState<string | null>(null);

  // Komisi
  const [commissionHistory, setCommissionHistory] = useState<CommissionHistoryItem[]>([]);

  // Initialize current month on client after mount (avoids prerender new Date() error)
  useEffect(() => {
    const now = new Date();
    setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }, []);

  // Load cash history from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("robocool_cash_history");
      if (saved) {
        setCashHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cash history from localStorage", e);
    }
  }, []);

  // Save cash history
  const saveCashHistory = (newHistory: CashHistory[]) => {
    setCashHistory(newHistory);
    try {
      localStorage.setItem("robocool_cash_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to save cash history", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const resOrders = await getOrders();
      if (resOrders?.data && Array.isArray(resOrders.data)) {
        setRawOrders(resOrders.data);
      }
    } catch (error) {
      console.error("Failed to fetch finance orders data", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper date parsing for an order
  const getOrderDate = (item: any): Date | null => {
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

  // Filter orders according to date / month filter
  const filteredOrders = useMemo(() => {
    return rawOrders.filter((order) => {
      const date = getOrderDate(order);
      if (!date) return !startDate && !endDate && !month;
      const orderDateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const orderMonthStr = orderDateStr.substring(0, 7); // YYYY-MM

      if (startDate && endDate) {
        return orderDateStr >= startDate && orderDateStr <= endDate;
      } else if (startDate) {
        return orderDateStr >= startDate;
      } else if (endDate) {
        return orderDateStr <= endDate;
      } else if (month) {
        return orderMonthStr === month;
      }
      return true;
    });
  }, [rawOrders, month, startDate, endDate]);

  // Calculations for Laba Rugi and Summary
  // Only completed orders that are paid
  const completedAndPaidOrders = useMemo(() => {
    return filteredOrders.filter((item) => {
      const st = (item.status || "").toLowerCase();
      const ps = (item.payment_status || "").toLowerCase();
      const isCompleted = st === "completed" || st === "selesai";
      const isPaid = ps === "paid" || ps === "lunas";
      return isCompleted && isPaid;
    });
  }, [filteredOrders]);

  // Breakdown calculations
  const financeBreakdown = useMemo(() => {
    let serviceIncome = 0;
    let sparepartIncome = 0;
    let sparepartCapital = 0;
    let otherCostIncome = 0;
    let productIncome = 0;
    let productCapital = 0;
    let technicianCommission = 0;

    completedAndPaidOrders.forEach((item) => {
      let orderTotal = 0;

      // Services
      if (Array.isArray(item.service_orders)) {
        item.service_orders.forEach((so: any) => {
          const qty = Number(so.amount) || Number(so.amounth) || 1;
          const pr = Number(so.price) || 0;
          serviceIncome += qty * pr;
          orderTotal += qty * pr;
        });
      }

      // Spareparts
      if (Array.isArray(item.sparepart_orders)) {
        item.sparepart_orders.forEach((sp: any) => {
          const qty = Number(sp.amount) || 1;
          const pr = Number(sp.price) || 0;
          const cap = Number(sp.capital_price) || 0;
          sparepartIncome += qty * pr;
          sparepartCapital += qty * cap;
          orderTotal += qty * pr;
        });
      }

      // Other Costs
      if (Array.isArray(item.other_costs_orders)) {
        item.other_costs_orders.forEach((oc: any) => {
          const qty = Number(oc.amount) || 1;
          const pr = Number(oc.price) || 0;
          otherCostIncome += qty * pr;
          orderTotal += qty * pr;
        });
      }

      // Products
      if (Array.isArray(item.product_orders)) {
        item.product_orders.forEach((po: any) => {
          const qty = Number(po.amount) || 1;
          const pr = Number(po.price) || 0;
          const cap = Number(po.capital_price) || 0;
          productIncome += qty * pr;
          productCapital += qty * cap;
          orderTotal += qty * pr;
        });
      }

      // Commission estimation based on commission_mode
      const mode = (item.commission_mode || "").toString();
      if (mode.includes("%")) {
        const pct = parseFloat(mode.replace("%", "")) || 0;
        technicianCommission += (orderTotal * pct) / 100;
      } else if (!isNaN(Number(mode)) && Number(mode) > 0) {
        technicianCommission += Number(mode);
      }
    });

    const incomeRows = [
      { label: "Pendapatan jasa", value: serviceIncome },
      { label: "Penjualan sparepart & biaya lain", value: sparepartIncome + otherCostIncome },
      { label: "Penjualan produk (unit AC)", value: productIncome },
      { label: "Pendapatan lainnya", value: 0 },
    ];

    const expenseRows = [
      { label: "Harga beli sparepart (modal)", value: sparepartCapital },
      { label: "Harga beli produk (modal)", value: productCapital },
      { label: "Komisi pelaksana", value: technicianCommission },
      { label: "Pengeluaran operasional", value: 0 },
    ];

    const totalIncome = incomeRows.reduce((sum, r) => sum + r.value, 0);
    const totalExpense = expenseRows.reduce((sum, r) => sum + r.value, 0);
    const netProfit = totalIncome - totalExpense;

    return {
      incomeRows,
      expenseRows,
      totalIncome,
      totalExpense,
      netProfit,
      technicianCommission,
      paidCount: completedAndPaidOrders.length,
    };
  }, [completedAndPaidOrders]);

  // Setoran Kas groups
  // Orders with cash payment (payment_type = tunai/cash) held by technician (paid_to is null or matches assigned technician, not yet deposited to admin)
  const cashGroups = useMemo<CashGroup[]>(() => {
    const groupsMap = new Map<string, CashGroup>();

    rawOrders.forEach((item) => {
      const pType = (item.payment_type || "").toLowerCase();
      const pStatus = (item.payment_status || "").toLowerCase();
      const isCash = pType === "tunai" || pType === "cash";
      const isPaid = pStatus === "paid" || pStatus === "lunas";

      // If paid via cash and not yet deposited directly to company account / owner (paid_to is null or unpaid deposit)
      // Check if paid_to is set
      const isDeposited = Boolean(item.paid_to);

      if (isCash && isPaid && !isDeposited) {
        const techName = item.assigned_user?.name || item.creator?.name || "Tanpa Teknisi";
        const techId = item.assign_to || item.user_id || "unassigned";

        const date = getOrderDate(item);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const dateStr = date
          ? `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]}`
          : "-";
        const invoice = date
          ? `INV/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(item.id).slice(-4).toUpperCase()}`
          : `INV/${String(item.id).slice(-4).toUpperCase()}`;

        // Order total
        let total = 0;
        if (Array.isArray(item.service_orders)) {
          item.service_orders.forEach((s: any) => {
            total += (Number(s.price) || 0) * (Number(s.amount) || Number(s.amounth) || 1);
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

        const orderItem: CashOrder = {
          id: String(item.id),
          invoice,
          customer: item.customer?.name || "Pelanggan",
          date: dateStr,
          amount: total,
          rawDate: date ? date.toISOString() : "",
        };

        if (!groupsMap.has(techId)) {
          groupsMap.set(techId, {
            id: techId,
            name: techName,
            orders: [],
          });
        }
        groupsMap.get(techId)!.orders.push(orderItem);
      }
    });

    return Array.from(groupsMap.values());
  }, [rawOrders]);

  // Piutang (Receivables)
  // Orders completed or ongoing that are unpaid (payment_status != paid/lunas)
  const receivables = useMemo<ReceivableItem[]>(() => {
    return filteredOrders
      .filter((item) => {
        const ps = (item.payment_status || "unpaid").toLowerCase();
        const st = (item.status || "").toLowerCase();
        const isUnpaid = ps !== "paid" && ps !== "lunas";
        const isNotCancelled = st !== "cancelled" && st !== "canceled" && st !== "batal";
        return isUnpaid && isNotCancelled;
      })
      .map((item) => {
        const date = getOrderDate(item);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const dateStr = date
          ? `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`
          : "-";
        const invoice = date
          ? `INV/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(item.id).slice(-4).toUpperCase()}`
          : `INV/${String(item.id).slice(-4).toUpperCase()}`;

        let total = 0;
        if (Array.isArray(item.service_orders)) {
          item.service_orders.forEach((s: any) => {
            total += (Number(s.price) || 0) * (Number(s.amount) || Number(s.amounth) || 1);
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
          id: String(item.id),
          invoice,
          customer: item.customer?.name || "Pelanggan",
          date: dateStr,
          status: item.status || "Terjadwal",
          technician: item.assigned_user?.name || "Belum ditugaskan",
          amount: total,
        };
      });
  }, [filteredOrders]);

  // Komisi list (from completed & paid orders)
  const commissions = useMemo(() => {
    return completedAndPaidOrders
      .map((item) => {
        const date = getOrderDate(item);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const dateStr = date
          ? `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`
          : "-";
        const invoice = date
          ? `INV/${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(item.id).slice(-4).toUpperCase()}`
          : `INV/${String(item.id).slice(-4).toUpperCase()}`;

        let orderTotal = 0;
        if (Array.isArray(item.service_orders)) {
          item.service_orders.forEach((s: any) => {
            orderTotal += (Number(s.price) || 0) * (Number(s.amount) || Number(s.amounth) || 1);
          });
        }
        if (Array.isArray(item.sparepart_orders)) {
          item.sparepart_orders.forEach((sp: any) => {
            orderTotal += (Number(sp.price) || 0) * (Number(sp.amount) || 1);
          });
        }
        if (Array.isArray(item.other_costs_orders)) {
          item.other_costs_orders.forEach((oc: any) => {
            orderTotal += (Number(oc.price) || 0) * (Number(oc.amount) || 1);
          });
        }
        if (Array.isArray(item.product_orders)) {
          item.product_orders.forEach((po: any) => {
            orderTotal += (Number(po.price) || 0) * (Number(po.amount) || 1);
          });
        }

        let commAmount = 0;
        const mode = (item.commission_mode || "").toString();
        if (mode.includes("%")) {
          const pct = parseFloat(mode.replace("%", "")) || 0;
          commAmount = (orderTotal * pct) / 100;
        } else if (!isNaN(Number(mode)) && Number(mode) > 0) {
          commAmount = Number(mode);
        }

        return {
          id: String(item.id),
          date: dateStr,
          executor: item.assigned_user?.name || item.creator?.name || "Pelaksana",
          order: invoice,
          commissionMode: item.commission_mode || "0%",
          orderTotal,
          amount: commAmount,
        };
      })
      .filter((c) => c.amount > 0);
  }, [completedAndPaidOrders]);

  const toggleOrder = (orderId: string) => {
    setSelectedOrders((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  // Receive cash deposit from technician
  const receiveCashDeposit = async (group: CashGroup) => {
    const ordersToReceive = group.orders.filter((order) =>
      selectedOrders.includes(order.id),
    );

    if (ordersToReceive.length === 0) {
      window.alert("Pilih minimal satu order untuk menerima setoran.");
      return;
    }

    const total = ordersToReceive.reduce((sum, order) => sum + order.amount, 0);

    const confirmed = window.confirm(
      `Terima setoran ${group.name} sebesar ${formatRupiah(total)}?`,
    );

    if (!confirmed) return;

    try {
      setReceivingGroup(group.id);

      const note = cashNotes[group.id]?.trim() || "Diterima admin kasir";

      // Update orders in DB: mark paid_to
      await Promise.all(
        ordersToReceive.map((ord) =>
          updateOrderStatus({
            id: ord.id,
            paid_to: note,
          }),
        ),
      );

      const now = new Date();
      const formattedDate = now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const formattedTime = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const newHistoryEntry: CashHistory = {
        id: `history-${Date.now()}`,
        date: `${formattedDate} ${formattedTime}`,
        name: group.name,
        orders: ordersToReceive.length,
        amount: total,
        receivedBy: note,
      };

      saveCashHistory([newHistoryEntry, ...cashHistory]);

      // Refresh orders from database
      await fetchData();

      setSelectedOrders((current) =>
        current.filter((id) => !ordersToReceive.some((o) => o.id === id)),
      );

      setCashNotes((current) => ({
        ...current,
        [group.id]: "",
      }));
    } catch (err) {
      console.error("Failed to receive cash deposit", err);
      window.alert("Gagal memproses setoran kas. Silakan coba lagi.");
    } finally {
      setReceivingGroup(null);
    }
  };

  const downloadReport = (type: "PDF" | "Excel") => {
    window.alert(`Export ${type} berhasil disiapkan untuk periode ${month || "semua"}.`);
  };

  const subtitles: Record<string, string> = {
    "Laba Rugi": "Laporan pendapatan, biaya, dan laba bersih",
    "Pendapatan Lainnya": "Kelola pendapatan di luar order",
    Pengeluaran: "Kelola pengeluaran operasional",
    "Setoran Kas": "Uang tunai dari pelanggan yang masih dipegang teknisi",
    Piutang: "Kelola piutang pelanggan",
    Komisi: "Komisi pelaksana dari order yang sudah selesai & lunas",
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-5 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Keuangan</h1>
            <p className="mt-1 text-sm text-slate-500">
              {subtitles[activeTab]}
            </p>
          </div>

          {!["Setoran Kas", "Komisi"].includes(activeTab) && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("Pendapatan Lainnya")}
                className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                + Pendapatan Lainnya
              </button>
              <button
                onClick={() => downloadReport("PDF")}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"
              >
                ▣ PDF
              </button>
              <button
                onClick={() => downloadReport("Excel")}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"
              >
                ▣ Excel
              </button>
            </div>
          )}
        </header>

        {/* Navigation */}
        <nav className="mt-5 flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                activeTab === tab
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {loading && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-center text-xs text-slate-500 shadow-sm">
            Memuat data keuangan dari database...
          </div>
        )}

        {/* ================= SETORAN KAS ================= */}
        {activeTab === "Setoran Kas" && (
          <div className="mt-5 space-y-4">
            {/* Pending cash deposits */}
            {cashGroups.length > 0 ? (
              cashGroups.map((group) => {
                const selectedGroupOrders = group.orders.filter((order) =>
                  selectedOrders.includes(order.id),
                );

                const selectedTotal = selectedGroupOrders.reduce(
                  (sum, order) => sum + order.amount,
                  0,
                );

                return (
                  <section
                    key={group.id}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Executor header */}
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <h2 className="text-sm font-medium">{group.name}</h2>
                      <span className="text-sm font-bold text-orange-600">
                        {formatRupiah(
                          group.orders.reduce(
                            (sum, order) => sum + order.amount,
                            0,
                          ),
                        )}
                      </span>
                    </div>

                    {/* Orders */}
                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                      {group.orders.map((order) => (
                        <label
                          key={order.id}
                          className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2 hover:bg-slate-50"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => toggleOrder(order.id)}
                              className="h-3.5 w-3.5 shrink-0 accent-blue-600"
                            />
                            <span className="truncate text-xs text-slate-600">
                              <span className="font-medium">
                                {order.invoice}
                              </span>
                              <span className="ml-1 text-slate-400">
                                · {order.customer} ({order.date})
                              </span>
                            </span>
                          </span>

                          <span className="shrink-0 text-xs font-medium">
                            {formatRupiah(order.amount)}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Notes and receive button */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 p-3 sm:flex-row">
                      <input
                        type="text"
                        value={cashNotes[group.id] || ""}
                        onChange={(event) =>
                          setCashNotes((current) => ({
                            ...current,
                            [group.id]: event.target.value,
                          }))
                        }
                        placeholder="Catatan penerima (opsional, contoh: Irfan)"
                        className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        onClick={() => receiveCashDeposit(group)}
                        disabled={
                          selectedGroupOrders.length === 0 ||
                          receivingGroup === group.id
                        }
                        className="h-9 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {receivingGroup === group.id
                          ? "Memproses..."
                          : "Terima Setoran"}
                      </button>
                    </div>

                    {selectedGroupOrders.length > 0 && (
                      <div className="px-4 pb-3 text-right text-[11px] text-slate-500">
                        Dipilih: {selectedGroupOrders.length} order ·{" "}
                        {formatRupiah(selectedTotal)}
                      </div>
                    )}
                  </section>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-600">
                  Tidak ada setoran kas yang belum diterima.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Order dengan pembayaran tunai yang belum disetor teknisi akan otomatis tampil di sini.
                </p>
              </div>
            )}

            {/* Cash deposit history */}
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold">Riwayat Setoran</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Dari</th>
                      <th className="px-3 py-3 text-center font-medium">
                        Order
                      </th>
                      <th className="px-3 py-3 text-right font-medium">
                        Nominal
                      </th>
                      <th className="px-3 py-3 font-medium">Diterima</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {cashHistory.length > 0 ? (
                      cashHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                            {item.date}
                          </td>
                          <td className="px-3 py-3">{item.name}</td>
                          <td className="px-3 py-3 text-center">
                            {item.orders}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right font-medium">
                            {formatRupiah(item.amount)}
                          </td>
                          <td className="px-3 py-3">{item.receivedBy}</td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => {
                                const confirmed = window.confirm(
                                  "Batalkan catatan riwayat setoran ini?",
                                );

                                if (confirmed) {
                                  saveCashHistory(
                                    cashHistory.filter(
                                      (history) => history.id !== item.id,
                                    ),
                                  );
                                }
                              }}
                              className="text-[10px] text-rose-500 hover:text-rose-700"
                            >
                              Batalkan
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-8 text-center text-slate-400"
                        >
                          Belum ada riwayat setoran.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ================= KOMISI ================= */}
        {activeTab === "Komisi" && (
          <div className="mt-5 space-y-5">
            {/* Commissions summary */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryCard
                title="Total Komisi Pelaksana"
                value={financeBreakdown.technicianCommission}
                subtitle={`${commissions.length} order dengan komisi`}
                color="text-orange-600"
              />
              <SummaryCard
                title="Rata-rata Komisi / Order"
                value={
                  commissions.length > 0
                    ? Math.round(financeBreakdown.technicianCommission / commissions.length)
                    : 0
                }
                color="text-slate-800"
              />
            </section>

            {/* Commissions list */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-4">
                <h2 className="text-base font-semibold">
                  Komisi Pelaksana (Order Selesai & Lunas)
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Pelaksana</th>
                      <th className="px-3 py-3 font-medium">Order</th>
                      <th className="px-3 py-3 font-medium">Skema Komisi</th>
                      <th className="px-3 py-3 text-right font-medium">Nilai Order</th>
                      <th className="px-3 py-3 text-right font-medium">
                        Nominal Komisi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {commissions.length > 0 ? (
                      commissions.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3 text-slate-600">{item.date}</td>
                          <td className="px-3 py-3 font-medium">{item.executor}</td>
                          <td className="px-3 py-3 text-blue-600">{item.order}</td>
                          <td className="px-3 py-3 text-slate-500">{item.commissionMode}</td>
                          <td className="px-3 py-3 text-right text-slate-600">
                            {formatRupiah(item.orderTotal)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-orange-600">
                            {formatRupiah(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="h-[68px] px-3 py-5 text-center text-sm text-slate-500"
                        >
                          Belum ada komisi dari order selesai & lunas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ================= PIUTANG ================= */}
        {activeTab === "Piutang" && (
          <div className="mt-5 space-y-4">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SummaryCard
                title="Total Piutang Belum Lunas"
                value={receivables.reduce((s, r) => s + r.amount, 0)}
                subtitle={`${receivables.length} order belum lunas`}
                color="text-rose-600"
              />
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold">Daftar Piutang Pelanggan</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tanggal</th>
                      <th className="px-3 py-3 font-medium">Invoice</th>
                      <th className="px-3 py-3 font-medium">Pelanggan</th>
                      <th className="px-3 py-3 font-medium">Teknisi</th>
                      <th className="px-3 py-3 font-medium">Status Order</th>
                      <th className="px-3 py-3 text-right font-medium">Tagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receivables.length > 0 ? (
                      receivables.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3 text-slate-600">{r.date}</td>
                          <td className="px-3 py-3 font-medium text-blue-600">{r.invoice}</td>
                          <td className="px-3 py-3">{r.customer}</td>
                          <td className="px-3 py-3 text-slate-500">{r.technician}</td>
                          <td className="px-3 py-3">
                            <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              {r.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-rose-600">
                            {formatRupiah(r.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                          Tidak ada piutang yang belum lunas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ================= OTHER FINANCE TABS (Laba Rugi, Pendapatan Lainnya, Pengeluaran) ================= */}
        {!["Setoran Kas", "Komisi", "Piutang"].includes(activeTab) && (
          <>
            {/* Date filters */}
            <section className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="month"
                  className="text-xs font-medium text-slate-600"
                >
                  Bulan
                </label>
                <input
                  id="month"
                  type="month"
                  value={month}
                  onChange={(event) => {
                    setMonth(event.target.value);
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="start-date"
                    className="text-xs font-medium text-slate-600"
                  >
                    Dari
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      if (event.target.value) setMonth("");
                    }}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <span className="pb-2 text-xs text-slate-400">atau</span>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="end-date"
                    className="text-xs font-medium text-slate-600"
                  >
                    Sampai
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => {
                      setEndDate(event.target.value);
                      if (event.target.value) setMonth("");
                    }}
                    className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {(startDate || endDate || month) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    const now = new Date();
                    setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
                  }}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50"
                >
                  Reset Filter
                </button>
              )}
            </section>

            {/* Summary cards */}
            <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <SummaryCard
                title="Pendapatan Order"
                value={financeBreakdown.totalIncome}
                subtitle={`${financeBreakdown.paidCount} order selesai & lunas`}
                color="text-emerald-700"
              />
              <SummaryCard
                title="Pendapatan Lainnya"
                value={0}
                subtitle="Di luar order"
                color="text-emerald-700"
              />
              <SummaryCard
                title="Komisi Pelaksana"
                value={financeBreakdown.technicianCommission}
                color="text-orange-600"
              />
              <SummaryCard
                title="Pengeluaran"
                value={financeBreakdown.totalExpense}
                color="text-rose-600"
              />
              <SummaryCard
                title="Laba Bersih"
                value={financeBreakdown.netProfit}
                color={financeBreakdown.netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}
              />
            </section>

            {/* Profit and loss */}
            {activeTab === "Laba Rugi" ? (
              <section className="mt-4 max-w-[720px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="text-sm font-bold">Laporan Laba Rugi</h2>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="bg-sky-50 px-4 py-2 text-xs font-semibold uppercase text-blue-700">
                    Pendapatan
                  </div>

                  {financeBreakdown.incomeRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 px-4 py-2 text-xs"
                    >
                      <span className="text-slate-600">{row.label}</span>
                      <span>{formatRupiah(row.value)}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between bg-sky-50/60 px-4 py-2.5 text-xs font-semibold">
                    <span>Total pendapatan</span>
                    <span className="text-emerald-700">
                      {formatRupiah(financeBreakdown.totalIncome)}
                    </span>
                  </div>

                  <div className="bg-sky-50 px-4 py-2 text-xs font-semibold uppercase text-blue-700">
                    Biaya
                  </div>

                  {financeBreakdown.expenseRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 px-4 py-2 text-xs"
                    >
                      <span className="text-slate-600">{row.label}</span>
                      <span>{formatRupiah(row.value)}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold">
                    <span>Total biaya</span>
                    <span className="text-rose-600">
                      − {formatRupiah(financeBreakdown.totalExpense)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold">LABA BERSIH</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Total pendapatan − total biaya
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${financeBreakdown.netProfit >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {formatRupiah(financeBreakdown.netProfit)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="text-xs leading-relaxed text-slate-500">
                    Pendapatan jasa, sparepart, dan produk dihitung dari order
                    yang selesai dan lunas. Biaya meliputi modal sparepart,
                    modal produk, komisi pelaksana, dan pengeluaran operasional.
                  </p>
                </div>
              </section>
            ) : (
              <section className="mt-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold">{activeTab}</h2>
                <p className="mt-2 text-xs text-slate-500">
                  Data {activeTab.toLowerCase()} belum memiliki entri transaksi di periode ini.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
