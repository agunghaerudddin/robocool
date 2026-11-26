"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ChevronDown,
  Filter,
  BriefcaseBusiness,
} from "lucide-react";

type CommissionStatus = "Dibayarkan" | "Menunggu" | "Diproses";

type CommissionItem = {
  id: string;
  invoice: string;
  customer: string;
  service: string;
  date: string;
  orderTotal: number;
  commissionRate: number;
  commissionAmount: number;
  status: CommissionStatus;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const sampleCommissions: CommissionItem[] = [
  {
    id: "1",
    invoice: "INV-00042",
    customer: "Budi Santoso",
    service: "Cuci AC 1 PK",
    date: "2026-11-25",
    orderTotal: 150000,
    commissionRate: 15,
    commissionAmount: 22500,
    status: "Dibayarkan",
  },
  {
    id: "2",
    invoice: "INV-00039",
    customer: "Andi Pratama",
    service: "Perbaikan AC",
    date: "2026-11-24",
    orderTotal: 450000,
    commissionRate: 10,
    commissionAmount: 45000,
    status: "Menunggu",
  },
  {
    id: "3",
    invoice: "INV-00035",
    customer: "Siti Rahma",
    service: "Pasang AC 1 PK",
    date: "2026-11-22",
    orderTotal: 850000,
    commissionRate: 15,
    commissionAmount: 127500,
    status: "Dibayarkan",
  },
  {
    id: "4",
    invoice: "INV-00031",
    customer: "Hasanuddin",
    service: "Tambah Freon",
    date: "2026-11-19",
    orderTotal: 300000,
    commissionRate: 10,
    commissionAmount: 30000,
    status: "Diproses",
  },
  {
    id: "5",
    invoice: "INV-00027",
    customer: "Dewi Anggraini",
    service: "Cuci AC 2 PK",
    date: "2026-11-15",
    orderTotal: 200000,
    commissionRate: 15,
    commissionAmount: 30000,
    status: "Dibayarkan",
  },
  {
    id: "6",
    invoice: "INV-00021",
    customer: "Rudi Hartono",
    service: "Pemeriksaan AC",
    date: "2026-10-28",
    orderTotal: 250000,
    commissionRate: 10,
    commissionAmount: 25000,
    status: "Dibayarkan",
  },
  {
    id: "7",
    invoice: "INV-00018",
    customer: "Nur Aisyah",
    service: "Perbaikan AC",
    date: "2026-10-20",
    orderTotal: 600000,
    commissionRate: 15,
    commissionAmount: 90000,
    status: "Menunggu",
  },
];

const statusStyles: Record<CommissionStatus, string> = {
  Dibayarkan: "bg-emerald-50 text-emerald-700",
  Menunggu: "bg-amber-50 text-amber-700",
  Diproses: "bg-blue-50 text-blue-700",
};

export default function CommissionPage() {
  const [filter, setFilter] = useState("Semua");
  const [period, setPeriod] = useState("Bulan ini");
  const [loading, setLoading] = useState(false);

  // UI-only data. Replace with the logged-in user's API response.
  const commissions = sampleCommissions;

  const visibleCommissions = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return commissions.filter((item) => {
      const date = new Date(`${item.date}T00:00:00`);

      const matchesPeriod =
        period === "Semua" ||
        (period === "Bulan ini" &&
          date.getMonth() === month &&
          date.getFullYear() === year) ||
        (period === "Bulan lalu" &&
          new Date(year, month - 1, 1) <= date &&
          date < new Date(year, month, 1));

      const matchesStatus = filter === "Semua" || item.status === filter;

      return matchesPeriod && matchesStatus;
    });
  }, [commissions, filter, period]);

  const stats = useMemo(() => {
    const total = visibleCommissions.reduce(
      (sum, item) => sum + item.commissionAmount,
      0,
    );

    const paid = visibleCommissions
      .filter((item) => item.status === "Dibayarkan")
      .reduce((sum, item) => sum + item.commissionAmount, 0);

    const pending = visibleCommissions
      .filter((item) => item.status === "Menunggu")
      .reduce((sum, item) => sum + item.commissionAmount, 0);

    const processing = visibleCommissions
      .filter((item) => item.status === "Diproses")
      .reduce((sum, item) => sum + item.commissionAmount, 0);

    return {
      total,
      paid,
      pending,
      processing,
      count: visibleCommissions.length,
    };
  }, [visibleCommissions]);

  const monthlyData = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

      const monthTotal = commissions
        .filter((item) => {
          const d = new Date(`${item.date}T00:00:00`);
          return (
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, item) => sum + item.commissionAmount, 0);

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("id-ID", { month: "short" }),
        total: monthTotal,
      };
    });
  }, [commissions]);

  const maxMonthlyTotal = Math.max(...monthlyData.map((item) => item.total), 1);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 400);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Komisi Saya
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Pantau pendapatan komisi dan riwayat pembayaran kamu.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Segarkan
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Calendar size={14} />
            Periode komisi
          </div>

          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-700 outline-none focus:border-blue-400"
            >
              <option>Bulan ini</option>
              <option>Bulan lalu</option>
              <option>Semua</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                TOTAL KOMISI
              </p>
              <div className="rounded-lg bg-blue-50 p-2">
                <Wallet size={15} className="text-blue-600" />
              </div>
            </div>
            <h2 className="mt-2 text-lg font-bold leading-tight text-slate-900">
              {loading ? "..." : formatRupiah(stats.total)}
            </h2>
            <p className="mt-1 text-[9px] text-slate-500">
              {stats.count} transaksi pada periode ini
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                SUDAH DIBAYARKAN
              </p>
              <div className="rounded-lg bg-emerald-50 p-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
              </div>
            </div>
            <h2 className="mt-2 text-lg font-bold leading-tight text-emerald-700">
              {loading ? "..." : formatRupiah(stats.paid)}
            </h2>
            <p className="mt-1 text-[9px] text-slate-500">
              Komisi yang sudah diterima
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                MENUNGGU PEMBAYARAN
              </p>
              <div className="rounded-lg bg-amber-50 p-2">
                <Clock size={15} className="text-amber-600" />
              </div>
            </div>
            <h2 className="mt-2 text-lg font-bold leading-tight text-amber-600">
              {loading ? "..." : formatRupiah(stats.pending)}
            </h2>
            <p className="mt-1 text-[9px] text-slate-500">Belum dibayarkan</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
                SEDANG DIPROSES
              </p>
              <div className="rounded-lg bg-blue-50 p-2">
                <RefreshCw size={15} className="text-blue-600" />
              </div>
            </div>
            <h2 className="mt-2 text-lg font-bold leading-tight text-blue-600">
              {loading ? "..." : formatRupiah(stats.processing)}
            </h2>
            <p className="mt-1 text-[9px] text-slate-500">
              Dalam proses pencairan
            </p>
          </div>
        </div>

        {/* Chart and Breakdown */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-800">
                  Tren Komisi
                </h3>
                <p className="mt-0.5 text-[9px] text-slate-500">
                  Pendapatan komisi 6 bulan terakhir
                </p>
              </div>
              <TrendingUp size={17} className="text-blue-600" />
            </div>

            <div className="px-3 pb-3 pt-5">
              <div className="flex h-[140px] items-end gap-3">
                {monthlyData.map((item) => {
                  const height =
                    item.total > 0
                      ? Math.max((item.total / maxMonthlyTotal) * 100, 5)
                      : 0;

                  return (
                    <div
                      key={item.key}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    >
                      <div className="flex h-full w-full items-end justify-center">
                        <div
                          title={`${item.label}: ${formatRupiah(item.total)}`}
                          className={`w-full max-w-[70px] rounded-t-md transition-all ${
                            item.total > 0
                              ? "bg-blue-500/80 hover:bg-blue-600"
                              : "bg-slate-100"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-slate-500">{item.label}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[9px] text-slate-400">
                Nilai berdasarkan data komisi contoh.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3 py-3">
              <h3 className="text-xs font-semibold text-slate-800">
                Ringkasan Pembayaran
              </h3>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">
                    Sudah dibayarkan
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700">
                    {formatRupiah(stats.paid)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${
                        stats.total ? (stats.paid / stats.total) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">
                    Menunggu pembayaran
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600">
                    {formatRupiah(stats.pending)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{
                      width: `${
                        stats.total ? (stats.pending / stats.total) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-600">
                    Sedang diproses
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600">
                    {formatRupiah(stats.processing)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${
                        stats.total ? (stats.processing / stats.total) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Commission History */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">
                Riwayat Komisi
              </h3>
              <p className="mt-0.5 text-[9px] text-slate-500">
                Rincian komisi dari order yang ditugaskan kepada kamu.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={13} className="text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-600 outline-none focus:border-blue-400"
              >
                <option>Semua</option>
                <option>Dibayarkan</option>
                <option>Menunggu</option>
                <option>Diproses</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-100">
                  {[
                    "ORDER / PELANGGAN",
                    "TANGGAL",
                    "NILAI ORDER",
                    "KOMISI",
                    "STATUS",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-3 py-2.5 text-[9px] font-semibold tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleCommissions.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="rounded-lg bg-blue-50 p-2">
                          <Receipt size={15} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-slate-800">
                            {item.invoice}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-600">
                            {item.customer}
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {item.service}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-600">
                      {formatDate(item.date)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-600">
                      {formatRupiah(item.orderTotal)}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-[11px] font-semibold text-slate-900">
                        {formatRupiah(item.commissionAmount)}
                      </p>
                      <p className="mt-0.5 text-[9px] text-slate-400">
                        {item.commissionRate}% dari order
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-medium ${statusStyles[item.status]}`}
                      >
                        {item.status === "Dibayarkan" ? (
                          <CheckCircle2 size={11} />
                        ) : item.status === "Menunggu" ? (
                          <Clock size={11} />
                        ) : (
                          <RefreshCw size={11} />
                        )}
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {!loading && visibleCommissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <BriefcaseBusiness className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">
                        Belum ada komisi
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Tidak ada data untuk periode atau status ini.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-3">
            <p className="text-[10px] text-slate-500">
              Menampilkan {visibleCommissions.length} transaksi
            </p>
            <p className="text-[10px] font-medium text-slate-700">
              Total: {formatRupiah(stats.total)}
            </p>
          </div>
        </div>

        {/* Information */}
        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <Wallet size={15} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="text-[10px] font-semibold text-blue-900">
              Informasi komisi
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-blue-800/80">
              Komisi dihitung berdasarkan aturan yang ditetapkan perusahaan.
              Status pembayaran diperbarui setelah proses pembayaran
              dikonfirmasi oleh admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
