"use client";

import Link from "next/link";

export default function OrderDetail() {
  const order = {
    invoice: "INV/2026/11/0007",
    date: "Jumat, 06 Nov 2026",
    customer: "guntek",
    phone: "0856-5664-6637",
    address:
      "Kantor — Jl. Aroepala No. 60, Gn. Sari, Kec. Rappocini, Kota Makassar, Sulawesi Selatan 90233",
    status: "Selesai",
    paymentStatus: "Lunas",
    technician: "Belum ditugaskan.",
    work: "Pasang AC Baru",
    product: "Daikin - AC",
    amount: 350000,
    history: [
      { date: "06 Nov 10:26", status: "Selesai", person: "Irfan" },
      {
        date: "06 Nov 10:25",
        status: "Menunggu Sparepart",
        person: "Irfan",
      },
      {
        date: "06 Nov 10:23",
        status: "Dikerjakan",
        person: "Irfan",
      },
      {
        date: "06 Nov 10:24",
        status: "Terjadwal",
        person: "Irfan",
      },
    ],
  };

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  const statusOptions = [
    "Terjadwal",
    "Dikerjakan",
    "Menunggu Sparepart",
    "Selesai",
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-3 sm:p-5">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <Link
              href="/order"
              className="mb-1 flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600"
            >
              <span>←</span> Kembali
            </Link>

            <h1 className="text-lg font-bold leading-tight text-slate-900">
              {order.invoice}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                {order.status}
              </span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                {order.paymentStatus}
              </span>
              <span className="text-[10px] text-slate-400">{order.date}</span>
            </div>
          </div>

          <div className="flex shrink-0 gap-1.5">
            <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50">
              ▤ Nota
            </button>
            <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50">
              ✎ Ubah
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[2fr_0.95fr]">
          {/* Left Column */}
          <div className="space-y-3">
            {/* Customer Information */}
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="text-xs font-semibold text-slate-900">
                {order.customer}
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-500">{order.phone}</p>

              <div className="mt-1.5 flex items-start gap-1 text-[10px] leading-relaxed text-slate-500">
                <span className="shrink-0 text-rose-500">♟</span>
                <span>{order.address}</span>
              </div>

              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-[10px] font-medium text-blue-600 hover:underline"
              >
                Buka Maps ↗
              </a>

              <div className="mt-2 flex gap-1.5">
                <a
                  href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-emerald-500 px-2.5 py-1 text-[9px] font-semibold text-white hover:bg-emerald-600"
                >
                  WA Nota
                </a>
                <a
                  href={`https://wa.me/${order.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-emerald-500 px-2.5 py-1 text-[9px] font-semibold text-white hover:bg-emerald-600"
                >
                  WA Review
                </a>
              </div>
            </section>

            {/* Work Details */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <h2 className="text-xs font-semibold text-slate-800">
                  Rincian Pekerjaan
                </h2>
              </div>

              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      {order.work}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      ❄ {order.product}
                    </p>
                    <p className="text-[9px] text-slate-400">
                      1 × {formatRupiah(order.amount)} - garansi 15 hari (s/d 21
                      Nov 2026)
                    </p>
                  </div>

                  <span className="shrink-0 text-[11px] font-semibold text-slate-900">
                    {formatRupiah(order.amount)}
                  </span>
                </div>

                {/* Before & After Photos */}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["Sebelum", "Sesudah"].map((label) => (
                    <div
                      key={label}
                      className="rounded-md border border-dashed border-slate-300 p-1.5"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[9px] text-slate-600">
                          {label}
                        </span>
                        <span className="text-[9px] text-red-500">
                          belum ada
                        </span>
                      </div>

                      <button
                        type="button"
                        className="flex h-7 w-full items-center justify-center gap-1 rounded border border-slate-200 bg-white text-[9px] font-medium text-slate-500 hover:bg-slate-50"
                      >
                        ▧ Tambah foto
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.amount)}</span>
                </div>

                <div className="mt-1 flex justify-between text-xs font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatRupiah(order.amount)}</span>
                </div>
              </div>
            </section>

            {/* Order History */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <h2 className="text-xs font-semibold text-slate-800">
                  Riwayat
                </h2>
              </div>

              <div className="space-y-1.5 px-3 py-2.5">
                {order.history.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap gap-x-1 text-[10px] leading-relaxed"
                  >
                    <span className="text-slate-400">{item.date}</span>
                    <span className="text-slate-500">
                      {item.status} · {item.person}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {/* Update Status */}
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold text-slate-800">
                Ubah Status
              </h2>

              <div className="grid grid-cols-2 gap-1.5">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`rounded-md border px-1.5 py-1 text-[9px] font-medium transition ${
                      order.status === status
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <button className="mt-2 text-[10px] font-medium text-rose-500 hover:text-rose-700">
                <span className="mr-1">▶</span>
                Batalkan order...
              </button>
            </section>

            {/* Payment */}
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold text-slate-800">
                Pembayaran
              </h2>

              <div className="rounded-md bg-emerald-50 p-2">
                <p className="text-[10px] font-semibold text-emerald-700">
                  LUNAS · Tunai
                </p>
                <p className="mt-0.5 text-[9px] text-emerald-700">
                  06 Nov 2026 10:25
                </p>
                <p className="text-[9px] text-emerald-700">
                  Uang dipegang: agung
                </p>
              </div>

              <p className="mt-2 text-[9px] text-slate-400">
                Batalkan status lunas
              </p>
            </section>

            {/* Technician & Commission */}
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold text-slate-800">
                Pelaksana & Komisi
              </h2>

              <p className="text-[10px] text-slate-500">{order.technician}</p>

              <p className="mt-1 text-[9px] text-slate-400">Mode: Bagi rata</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
