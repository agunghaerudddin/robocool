"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getOrder } from "@/app/fetch/get/fetch";
import {
  updateOrderStatus,
  uploadOrderImage,
  updateOrderImage,
} from "@/app/fetch/update/fetch";

// ── helpers ──────────────────────────────────────────────────────────────────

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSimpleDate = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatHistoryDate = (iso: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Map DB status to display label */
const mapStatus = (s: string): string => {
  switch ((s ?? "").toLowerCase()) {
    case "pending":
      return "Terjadwal";
    case "in_progress":
    case "progress":
    case "dikerjakan":
      return "Dikerjakan";
    case "menunggu sparepart":
    case "waiting_sparepart":
      return "Menunggu Sparepart";
    case "completed":
    case "selesai":
      return "Selesai";
    case "cancelled":
    case "canceled":
    case "batal":
      return "Batal";
    default:
      return s ?? "-";
  }
};

/** Map DB status to badge colours */
const statusColor = (s: string) => {
  const display = mapStatus(s).toLowerCase();
  if (display === "selesai")
    return "bg-emerald-100 text-emerald-700";
  if (display === "dikerjakan")
    return "bg-blue-100 text-blue-700";
  if (display === "menunggu sparepart")
    return "bg-amber-100 text-amber-700";
  if (display === "batal")
    return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
};

const mapPaymentStatus = (s: string) => {
  switch ((s ?? "").toLowerCase()) {
    case "paid":
    case "lunas":
      return "Lunas";
    case "unpaid":
    case "belum lunas":
      return "Belum Lunas";
    default:
      return s ?? "-";
  }
};

const paymentColor = (s: string) =>
  mapPaymentStatus(s) === "Lunas"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-rose-100 text-rose-700";

/** Build an INV number from the order id + created_at */
const buildInvoice = (id: string, createdAt: string) => {
  if (!createdAt) return id;
  const d = new Date(createdAt);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const seq = id.slice(-4).toUpperCase();
  return `INV/${yr}/${mo}/${seq}`;
};

// ── types ─────────────────────────────────────────────────────────────────────

interface ServiceOrder {
  id: string;
  services_id: string;
  amount: number;
  price: number;
  warranty?: number;
  service?: { name: string; warranty?: number; estimate?: string };
}

interface SparepartOrder {
  id: string;
  information: string;
  amount: number;
  price: number;
  capital_price?: number;
}

interface OtherCostOrder {
  id: string;
  information: string;
  amount: number;
  price: number;
}

interface ProductOrder {
  id: string;
  name: string;
  amount: number;
  price: number;
}

interface HistoryItem {
  id?: string;
  order_id: string;
  date_start?: string;
  status: string;
  notes?: string;
  create_at?: string;
  created_at?: string;
  updated_at?: string;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<"before" | "after" | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Modal states
  const [showNotaModal, setShowNotaModal] = useState(false);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Helper to obtain current device geolocation
  const getCurrentLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve("GPS tidak didukung oleh browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          resolve(`Lat: ${lat}, Lng: ${lng}`);
        },
        (error) => {
          console.warn("Geolocation warning:", error.message);
          resolve("GPS tidak diizinkan / dinonaktifkan");
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 10000 }
      );
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setUploadingType(type);

      // Get GPS location & current timestamp
      const location = await getCurrentLocation();
      const timestamp = new Intl.DateTimeFormat("id-ID", {
        dateStyle: "full",
        timeStyle: "medium",
      }).format(new Date());

      // 1. Upload to Cloudinary with watermark via backend API
      const res = await uploadOrderImage(file, type, { location, timestamp });
      const imageUrl = res.data.url;

      // 2. Save URL into orders table (image_before or image_after)
      await updateOrderImage({
        id,
        type,
        url: imageUrl,
        action: "add",
      });

      // 3. Refresh order detail
      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal mengupload gambar:", err);
      alert(err?.response?.data?.error || "Gagal mengunggah foto.");
    } finally {
      setUploadingType(null);
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = "";
    }
  };

  const handleRemoveImage = async (type: "before" | "after", url: string) => {
    if (!id) return;
    if (!confirm("Hapus foto ini?")) return;

    try {
      await updateOrderImage({
        id,
        type,
        url,
        action: "remove",
      });
      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal menghapus gambar:", err);
      alert("Gagal menghapus foto.");
    }
  };

  const fetchOrderDetail = (orderId: string) => {
    return getOrder(orderId)
      .then((res) => {
        if (res?.data?.data) {
          setOrder(res.data.data as OrderData);
        } else {
          setError("Order tidak ditemukan.");
        }
      })
      .catch(() => setError("Gagal memuat data order."));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchOrderDetail(id).finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async (displayStatusOption: string) => {
    if (!id || updatingStatus) return;

    // Map UI label to database status string
    const statusMap: Record<string, string> = {
      "Terjadwal": "pending",
      "Dikerjakan": "in_progress",
      "Menunggu Sparepart": "menunggu sparepart",
      "Selesai": "completed",
      "Batal": "cancelled",
    };

    const targetDbStatus = statusMap[displayStatusOption] || displayStatusOption.toLowerCase();

    // If already current status, don't update
    if (mapStatus(order?.status ?? "") === displayStatusOption) return;

    try {
      setUpdatingStatus(true);
      await updateOrderStatus({
        id,
        status: targetDbStatus,
        notes: `Status diubah ke ${displayStatusOption}`,
      });
      // Refresh order data and history
      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal mengupdate status:", err);
      alert(err?.response?.data?.error || "Gagal mengubah status pesanan.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Print / Download PDF
  const handlePrintNota = () => {
    window.print();
  };

  // ── loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa]">
        <p className="text-sm text-slate-400">Memuat data order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fa]">
        <p className="text-sm text-rose-500">{error ?? "Order tidak ditemukan."}</p>
      </div>
    );
  }

  // ── computed display values ────────────────────────────────────────────────

  const invoice = buildInvoice(order.id, order.created_at);
  const displayStatus = mapStatus(order.status);
  const displayPayment = mapPaymentStatus(order.payment_status);
  const orderDate = formatDate(order.created_at);
  const customerName = order.customer?.name ?? "—";
  const customerPhone = order.customer?.phone ?? "";
  const customerAddress =
    order.customer?.google_maps || order.customer?.label || "—";
  const technicianName = order.assigned_user?.name ?? "Belum ditugaskan.";
  const commissionMode = order.commission_mode ?? "—";

  // totals
  const serviceTotal = (order.service_orders ?? []).reduce(
    (s, x) => s + (x.price ?? 0) * (x.amount ?? 1),
    0
  );
  const sparepartTotal = (order.sparepart_orders ?? []).reduce(
    (s, x) => s + (x.price ?? 0) * (x.amount ?? 1),
    0
  );
  const otherTotal = (order.other_costs_orders ?? []).reduce(
    (s, x) => s + (x.price ?? 0) * (x.amount ?? 1),
    0
  );
  const productTotal = (order.product_orders ?? []).reduce(
    (s, x) => s + (x.price ?? 0) * (x.amount ?? 1),
    0
  );
  const grandTotal = serviceTotal + sparepartTotal + otherTotal + productTotal;

  const statusOptions = ["Terjadwal", "Dikerjakan", "Menunggu Sparepart", "Selesai"];

  // history sorted newest first
  const history = [...(order.order_history ?? [])].sort((a, b) => {
    const ta = new Date(a.created_at ?? a.create_at ?? a.date_start ?? 0).getTime();
    const tb = new Date(b.created_at ?? b.create_at ?? b.date_start ?? 0).getTime();
    return tb - ta;
  });

  // Consolidated items for Nota
  const allNotaItems = [
    ...(order.service_orders ?? []).map((s) => ({
      description: s.service?.name || "Layanan Service",
      quantity: s.amount || 1,
      unit: "Unit",
      price: s.price || 0,
      amount: (s.price || 0) * (s.amount || 1),
      warranty: s.service?.warranty,
    })),
    ...(order.sparepart_orders ?? []).map((sp) => ({
      description: sp.information || "Sparepart",
      quantity: sp.amount || 1,
      unit: "Pcs",
      price: sp.price || 0,
      amount: (sp.price || 0) * (sp.amount || 1),
      warranty: undefined,
    })),
    ...(order.other_costs_orders ?? []).map((oc) => ({
      description: oc.information || "Biaya Lainnya",
      quantity: oc.amount || 1,
      unit: "Pcs",
      price: oc.price || 0,
      amount: (oc.price || 0) * (oc.amount || 1),
      warranty: undefined,
    })),
    ...(order.product_orders ?? []).map((p) => ({
      description: p.name || "Produk",
      quantity: p.amount || 1,
      unit: "Pcs",
      price: p.price || 0,
      amount: (p.price || 0) * (p.amount || 1),
      warranty: undefined,
    })),
  ];

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-3 sm:p-5">
      <div className="mx-auto max-w-6xl">

        {/* ── Header ── */}
        <div className="mb-4 flex items-start justify-between gap-3 print:hidden">
          <div>
            <Link
              href="/order"
              className="mb-1 flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600"
            >
              <span>←</span> Kembali
            </Link>

            <h1 className="text-lg font-bold leading-tight text-slate-900">
              {invoice}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${statusColor(order.status)}`}
              >
                {displayStatus}
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${paymentColor(order.payment_status)}`}
              >
                {displayPayment}
              </span>
              <span className="text-[10px] text-slate-400">{orderDate}</span>
            </div>
          </div>

          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setShowNotaModal(true)}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 cursor-pointer shadow-xs"
            >
              <span>▤</span> Nota
            </button>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[2fr_0.95fr] print:hidden">

          {/* ── Left Column ── */}
          <div className="space-y-3">

            {/* Customer Information */}
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="text-xs font-semibold text-slate-900">{customerName}</h2>
              <p className="mt-0.5 text-[10px] text-slate-500">{customerPhone}</p>

              <div className="mt-1.5 flex items-start gap-1 text-[10px] leading-relaxed text-slate-500">
                <span className="shrink-0 text-rose-500">♟</span>
                <span>{customerAddress}</span>
              </div>

              {order.customer?.google_maps && (
                <a
                  href={order.customer.google_maps}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-[10px] font-medium text-blue-600 hover:underline"
                >
                  Buka Maps ↗
                </a>
              )}

              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowNotaModal(true)}
                  className="rounded-md bg-blue-600 px-2.5 py-1 text-[9px] font-semibold text-white hover:bg-blue-700 transition"
                >
                  Lihat Nota
                </button>
                <a
                  href={`https://wa.me/${customerPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-emerald-500 px-2.5 py-1 text-[9px] font-semibold text-white hover:bg-emerald-600 transition"
                >
                  WA Nota
                </a>
                <a
                  href={`https://wa.me/${customerPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-emerald-500 px-2.5 py-1 text-[9px] font-semibold text-white hover:bg-emerald-600 transition"
                >
                  WA Review
                </a>
              </div>
            </section>

            {/* Work Details */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <h2 className="text-xs font-semibold text-slate-800">Rincian Pekerjaan</h2>
              </div>

              <div className="p-3 space-y-2">

                {/* Services */}
                {(order.service_orders ?? []).map((so) => (
                  <div key={so.id} className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[11px] font-semibold text-slate-800">
                        {so.service?.name ?? so.services_id}
                      </h3>
                      {so.service?.warranty != null && (
                        <p className="text-[9px] text-slate-400">
                          Garansi {so.service.warranty} hari
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400">
                        {so.amount} × {formatRupiah(so.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-900">
                      {formatRupiah((so.price ?? 0) * (so.amount ?? 1))}
                    </span>
                  </div>
                ))}

                {/* Spareparts */}
                {(order.sparepart_orders ?? []).map((sp) => (
                  <div key={sp.id} className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[11px] font-semibold text-slate-800">
                        {sp.information}
                      </h3>
                      <p className="text-[9px] text-slate-400">
                        {sp.amount} × {formatRupiah(sp.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-900">
                      {formatRupiah((sp.price ?? 0) * (sp.amount ?? 1))}
                    </span>
                  </div>
                ))}

                {/* Other costs */}
                {(order.other_costs_orders ?? []).map((oc) => (
                  <div key={oc.id} className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[11px] font-semibold text-slate-800">
                        {oc.information}
                      </h3>
                      <p className="text-[9px] text-slate-400">
                        {oc.amount} × {formatRupiah(oc.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-900">
                      {formatRupiah((oc.price ?? 0) * (oc.amount ?? 1))}
                    </span>
                  </div>
                ))}

                {/* Products */}
                {(order.product_orders ?? []).map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[11px] font-semibold text-slate-800">
                        {p.name}
                      </h3>
                      <p className="text-[9px] text-slate-400">
                        {p.amount} × {formatRupiah(p.price)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-slate-900">
                      {formatRupiah((p.price ?? 0) * (p.amount ?? 1))}
                    </span>
                  </div>
                ))}

                {/* Empty state */}
                {(order.service_orders ?? []).length === 0 &&
                  (order.sparepart_orders ?? []).length === 0 &&
                  (order.other_costs_orders ?? []).length === 0 &&
                  (order.product_orders ?? []).length === 0 && (
                    <p className="text-[10px] text-slate-400">Belum ada rincian pekerjaan.</p>
                  )}

                {/* Before & After Photos */}
                <input
                  type="file"
                  ref={beforeInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, "before")}
                />
                <input
                  type="file"
                  ref={afterInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, "after")}
                />

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                  {[
                    {
                      label: "Sebelum Pengerjaan",
                      type: "before" as const,
                      rawImages: order.image_before,
                      inputRef: beforeInputRef,
                    },
                    {
                      label: "Setelah Pengerjaan",
                      type: "after" as const,
                      rawImages: order.image_after,
                      inputRef: afterInputRef,
                    },
                  ].map(({ label, type, rawImages, inputRef }) => {
                    const isUploading = uploadingType === type;
                    const images = Array.isArray(rawImages)
                      ? rawImages
                      : typeof rawImages === "string" && rawImages
                      ? [rawImages]
                      : [];

                    return (
                      <div
                        key={type}
                        className="flex flex-col justify-between rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-2.5"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-700">
                            {label}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {images.length} Foto
                          </span>
                        </div>

                        {images.length > 0 && (
                          <div className="mb-2 grid grid-cols-3 gap-1.5">
                            {images.map((imgUrl, i) => (
                              <div
                                key={i}
                                className="group relative aspect-square overflow-hidden rounded border border-slate-200 bg-white"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${label} ${i + 1}`}
                                  className="h-full w-full object-cover cursor-pointer transition hover:scale-105"
                                  onClick={() => setPreviewImage(imgUrl)}
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage(type, imgUrl);
                                  }}
                                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[9px] text-white opacity-0 group-hover:opacity-100 transition hover:bg-rose-600"
                                  title="Hapus foto"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => inputRef.current?.click()}
                          className="flex h-7 w-full items-center justify-center gap-1.5 rounded border border-blue-200 bg-blue-50/70 text-[9px] font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 cursor-pointer shadow-xs transition"
                        >
                          {isUploading ? (
                            <span>Memproses &amp; Mengunggah...</span>
                          ) : (
                            <>
                              <span>📷</span> Ambil Foto Langsung {label}
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subtotal / Total */}
              <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(grandTotal)}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </section>

            {/* Order History */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <h2 className="text-xs font-semibold text-slate-800">Riwayat</h2>
              </div>

              <div className="space-y-1.5 px-3 py-2.5">
                {history.length === 0 && (
                  <p className="text-[10px] text-slate-400">Belum ada riwayat.</p>
                )}
                {history.map((item, index) => {
                  const ts = item.created_at ?? item.create_at ?? item.date_start ?? "";
                  return (
                    <div
                      key={item.id ?? index}
                      className="flex flex-wrap gap-x-1 text-[10px] leading-relaxed"
                    >
                      <span className="text-slate-400">{formatHistoryDate(ts)}</span>
                      <span className="text-slate-500">
                        {mapStatus(item.status)}
                        {item.notes ? ` · ${item.notes}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-3">

            {/* Update Status */}
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold text-slate-800">Ubah Status</h2>

              <div className="grid grid-cols-2 gap-1.5">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(status)}
                    className={`rounded-md border px-1.5 py-1 text-[9px] font-medium transition ${
                      displayStatus === status
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    } ${updatingStatus ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={updatingStatus || displayStatus === "Batal"}
                onClick={() => {
                  if (confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
                    handleUpdateStatus("Batal");
                  }
                }}
                className={`mt-2 text-[10px] font-medium text-rose-500 hover:text-rose-700 ${
                  updatingStatus || displayStatus === "Batal"
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <span className="mr-1">▶</span>
                {displayStatus === "Batal" ? "Order sudah dibatalkan" : "Batalkan order..."}
              </button>
            </section>

            {/* Payment */}
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold text-slate-800">Pembayaran</h2>

              <div
                className={`rounded-md p-2 ${
                  displayPayment === "Lunas" ? "bg-emerald-50" : "bg-rose-50"
                }`}
              >
                <p
                  className={`text-[10px] font-semibold ${
                    displayPayment === "Lunas" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {displayPayment.toUpperCase()}
                  {order.payment_type ? ` · ${order.payment_type}` : ""}
                </p>
                <p
                  className={`mt-0.5 text-[9px] ${
                    displayPayment === "Lunas" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {formatDateTime(order.created_at)}
                </p>
                {order.paid_to_user?.name && (
                  <p className="mt-1 text-[9px] text-slate-600">
                    Diterima oleh: <span className="font-semibold">{order.paid_to_user.name}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  const newPayment = displayPayment === "Lunas" ? "unpaid" : "paid";
                  try {
                    await updateOrderStatus({
                      id,
                      payment_status: newPayment,
                      notes: `Status pembayaran diubah ke ${newPayment === "paid" ? "Lunas" : "Belum Lunas"}`,
                    });
                    await fetchOrderDetail(id);
                  } catch (err) {
                    console.error("Gagal toggle status pembayaran", err);
                  }
                }}
                className="mt-2 text-[9px] text-blue-600 hover:underline cursor-pointer"
              >
                {displayPayment === "Lunas"
                  ? "Batalkan status lunas (Ubah ke Belum Lunas)"
                  : "Tandai langsung sebagai Lunas"}
              </button>
            </section>

            {/* Technician & Commission */}
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <h2 className="mb-2 text-xs font-semibold text-slate-800">
                Pelaksana &amp; Komisi
              </h2>
              <p className="text-[10px] text-slate-700 font-medium">{technicianName}</p>
              <p className="mt-1 text-[9px] text-slate-400">Mode: {commissionMode}</p>
            </section>
          </div>
        </div>
      </div>

      {/* ── NOTA MODAL / PRINTABLE DOCUMENT (Styled like OversDetail.tsx) ── */}
      {showNotaModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 sm:p-6 print:static print:p-0 print:bg-white">
          <div className="mx-auto max-w-4xl print:max-w-none">
            {/* Modal top bar (Hidden on print) */}
            <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
              <button
                type="button"
                onClick={() => setShowNotaModal(false)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 cursor-pointer"
              >
                ← Tutup Nota
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintNota}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Cetak / Download PDF
                </button>
              </div>
            </div>

            {/* Paper Document Preview */}
            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10 print:border-none print:p-0 print:shadow-none">
              {/* Header Kop Surat */}
              <div className="border-b-2 border-slate-900 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-blue-700">
                      ROBOCOOL
                    </h1>
                    <p className="text-xs font-medium text-slate-600">
                      Spesialis Service, Perawatan &amp; Pengadaan AC
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Telp / WhatsApp: 0853-9938-8803
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block rounded bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase text-blue-700">
                      Nota Order Service
                    </span>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {invoice}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Tanggal: {formatSimpleDate(order.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recipient / Customer info */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-slate-500">Pelanggan:</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {customerName}
                  </p>
                  {customerPhone && (
                    <p className="text-slate-600">Telp: {customerPhone}</p>
                  )}
                  {customerAddress && customerAddress !== "—" && (
                    <p className="mt-1 whitespace-pre-line text-slate-500">
                      Alamat: {customerAddress}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-500">Status Pembayaran:</p>
                  <p
                    className={`mt-0.5 inline-block font-bold ${
                      displayPayment === "Lunas"
                        ? "text-emerald-700"
                        : "text-rose-600"
                    }`}
                  >
                    {displayPayment.toUpperCase()}
                  </p>
                  {order.payment_type && (
                    <p className="text-slate-600">Metode: {order.payment_type}</p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">
                    Teknisi: <span className="font-semibold text-slate-700">{technicianName}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700">
                    <tr>
                      <th className="w-10 px-3 py-2.5 text-center">No</th>
                      <th className="px-3 py-2.5">Uraian Pekerjaan / Barang</th>
                      <th className="w-20 px-3 py-2.5 text-center">Jumlah</th>
                      <th className="w-24 px-3 py-2.5 text-center">Satuan</th>
                      <th className="px-3 py-2.5 text-right">Harga Satuan</th>
                      <th className="px-3 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allNotaItems.length > 0 ? (
                      allNotaItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2.5 text-center text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-800">
                            {item.description}
                            {item.warranty != null && (
                              <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                                (Garansi {item.warranty} hari)
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-500">
                            {item.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600">
                            {formatRupiah(Number(item.price) || 0)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                            {formatRupiah(Number(item.amount) || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-3 py-4 text-center text-slate-400"
                        >
                          Tidak ada rincian item.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-800">
                      {formatRupiah(grandTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-blue-700">
                    <span>Total Pembayaran</span>
                    <span>{formatRupiah(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="mt-12 grid grid-cols-2 text-xs">
                <div className="text-center">
                  <p className="text-slate-500">Tanda Terima Pelanggan,</p>
                  <div className="my-12 h-8" />
                  <p className="font-bold underline text-slate-900">
                    {customerName}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-slate-500">Hormat kami,</p>
                  <p className="font-bold text-slate-800">Robocool</p>
                  <div className="my-12 h-8" />
                  <p className="font-bold underline text-slate-900">
                    {technicianName !== "Belum ditugaskan." ? technicianName : "Petugas Robocool"}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-black">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
