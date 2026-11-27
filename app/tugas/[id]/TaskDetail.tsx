"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getOrder, getServices } from "@/app/fetch/get/fetch";
import {
  updateOrderStatus,
  uploadOrderImage,
  updateOrderImage,
  updateOrderCommissions,
} from "@/app/fetch/update/fetch";
import {
  createServiceOrder,
  createSparepartOrder,
  createOtherCostsOrder,
} from "@/app/fetch/add/fetch";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  User,
  Play,
  Check,
  Camera,
  ChevronDown,
  ChevronRight,
  Banknote,
  CreditCard,
  X,
  Plus,
} from "lucide-react";

type AdditionalCategory = "Sparepart" | "Jasa" | "Biaya lain";

type ServiceItem = {
  id: string | number;
  name: string;
  price: number;
  warranty?: number | null;
  estimate?: number | null;
};

type OrderData = {
  id: string;
  user_id?: string;
  assign_to?: string;
  paid_to?: string | null;
  status: string;
  payment_status: string;
  payment_type?: string;
  commission_mode?: string;
  created_at: string;
  image_before?: string | string[] | null;
  image_after?: string | string[] | null;
  creator?: { name: string } | null;
  assigned_user?: { name: string } | null;
  paid_to_user?: { name: string; role?: number } | null;
  customer?: {
    name: string;
    phone: string;
    google_maps?: string;
    label?: string;
  } | null;
  service_orders?: {
    id: string;
    services_id: string;
    amount: number;
    price: number;
    warranty?: number;
    service?: { name: string; warranty?: number; estimate?: string };
  }[];
  sparepart_orders?: {
    id: string;
    information: string;
    amount: number;
    price: number;
    capital_price?: number;
  }[];
  other_costs_orders?: {
    id: string;
    information: string;
    amount: number;
    price: number;
    capital_price?: number;
  }[];
  product_orders?: {
    id: string;
    name: string;
    amount: number;
    price: number;
    capital_price?: number;
  }[];
  complaint_schedules?: {
    id: string;
    date?: string;
    time?: string;
    complaint_schedule?: string;
    notes?: string;
  }[];
  order_history?: {
    id: string;
    date_start?: string;
    status: string;
    notes?: string;
    created_at?: string;
  }[];
};

export default function TaskDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current logged-in user
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null);

  // Status & payment states
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [depositingCash, setDepositingCash] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
        // Fetch user profile from users table
        const { data: profile } = await (supabase as any)
          .from("users")
          .select("name, role")
          .eq("id", data.user.id)
          .single();
        if (profile?.name) {
          setCurrentUserName(profile.name);
        } else {
          setCurrentUserName(data.user.email?.split("@")[0] || "Teknisi");
        }
        if (profile?.role !== undefined) {
          setCurrentUserRole(profile.role);
        }
      }
    });
  }, []);

  // Additional services / spare parts form
  const [showAdditional, setShowAdditional] = useState(false);
  const [additionalCategory, setAdditionalCategory] =
    useState<AdditionalCategory>("Sparepart");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [additionalAmount, setAdditionalAmount] = useState("1");
  const [additionalPrice, setAdditionalPrice] = useState("");
  const [additionalCapitalPrice, setAdditionalCapitalPrice] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  // Photo uploads
  const [uploadingType, setUploadingType] = useState<"before" | "after" | null>(
    null
  );
  const beforeInput = useRef<HTMLInputElement>(null);
  const afterInput = useRef<HTMLInputElement>(null);

  const formatRupiah = (value: number) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

  const fetchOrderDetail = async (orderId: string) => {
    try {
      const res = await getOrder(orderId);
      if (res?.data?.data) {
        setOrder(res.data.data as OrderData);
      } else {
        setError("Pesanan tidak ditemukan.");
      }
    } catch (err) {
      console.error("Gagal mengambil detail tugas:", err);
      setError("Gagal memuat data tugas.");
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([fetchOrderDetail(id), getServices()])
      .then(([_, srvRes]) => {
        if (srvRes?.data && Array.isArray(srvRes.data)) {
          setAvailableServices(srvRes.data);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Image helpers
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
        (err) => {
          console.warn("Geolocation warning:", err.message);
          resolve("GPS tidak aktif/diizinkan");
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
      const location = await getCurrentLocation();
      const timestamp = new Intl.DateTimeFormat("id-ID", {
        dateStyle: "full",
        timeStyle: "medium",
      }).format(new Date());

      const res = await uploadOrderImage(file, type, { location, timestamp });
      const imageUrl = res.data.url;

      await updateOrderImage({
        id,
        type,
        url: imageUrl,
        action: "add",
      });

      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal mengupload foto:", err);
      alert(err?.response?.data?.error || "Gagal mengunggah foto.");
    } finally {
      setUploadingType(null);
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
    } catch (err) {
      console.error("Gagal menghapus foto:", err);
      alert("Gagal menghapus foto.");
    }
  };

  // Status handlers
  const handleStartWork = async () => {
    if (!id || updatingStatus) return;

    // Must have at least 1 "foto sebelum" uploaded before starting
    const currentBeforePhotos: string[] = Array.isArray(order?.image_before)
      ? order.image_before
      : order?.image_before
      ? [order.image_before]
      : [];

    if (currentBeforePhotos.length === 0) {
      alert("Wajib mengunggah minimal 1 Foto Sebelum Pengerjaan sebelum memulai pekerjaan.");
      return;
    }

    try {
      setUpdatingStatus(true);
      await updateOrderStatus({
        id,
        status: "in_progress",
        notes: "Pekerjaan dimulai oleh teknisi",
      });
      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal memulai pekerjaan:", err);
      alert(err?.response?.data?.error || "Gagal memperbarui status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompleteWork = async () => {
    if (!id || updatingStatus) return;

    // Must have at least 1 "foto sesudah" uploaded before completing
    const currentAfterPhotos: string[] = Array.isArray(order?.image_after)
      ? order.image_after
      : order?.image_after
      ? [order.image_after]
      : [];

    if (currentAfterPhotos.length === 0) {
      alert("Wajib mengunggah minimal 1 Foto Sesudah Pengerjaan sebelum menyelesaikan pekerjaan.");
      return;
    }

    try {
      setUpdatingStatus(true);
      await updateOrderStatus({
        id,
        status: "completed",
        notes: notes ? `Pekerjaan selesai: ${notes}` : "Pekerjaan selesai",
      });
      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal menyelesaikan pekerjaan:", err);
      alert(err?.response?.data?.error || "Gagal memperbarui status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Payment handler
  const handlePayment = async (type: "cash" | "transfer") => {
    if (!id || updatingPayment) return;
    try {
      setUpdatingPayment(true);
      await updateOrderStatus({
        id,
        payment_status: "paid",
        payment_type: type,
        // For cash: set paid_to to the current user; for transfer: leave null
        paid_to: type === "cash" ? (currentUserId ?? undefined) : undefined,
        notes: `Pembayaran diterima via ${type === "cash" ? "Tunai" : "Transfer"}${
          notes ? ` (${notes})` : ""
        }${type === "cash" && currentUserName ? ` — dipegang oleh ${currentUserName}` : ""}`,
      });
      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal memperbarui pembayaran:", err);
      alert(err?.response?.data?.error || "Gagal memperbarui pembayaran.");
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Mark cash as deposited to company
  const handleDepositCash = async () => {
    if (!id || depositingCash) return;
    const confirm = window.confirm(
      "Konfirmasi bahwa uang tunai untuk order ini telah disetor ke kas perusahaan?"
    );
    if (!confirm) return;

    try {
      setDepositingCash(true);
      await updateOrderStatus({
        id,
        paid_to: currentUserId ?? undefined,
        notes: `Uang tunai disetorkan ke kas perusahaan oleh admin/owner ${currentUserName || ""}`.trim(),
      });
      alert("Setoran berhasil dikonfirmasi!");
      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal memproses setoran kas:", err);
      alert(err?.response?.data?.error || "Gagal memproses setoran kas.");
    } finally {
      setDepositingCash(false);
    }
  };

  // Add Item to DB
  const handleAddItem = async () => {
    if (!id || savingItem) return;

    const amountNum = Number(additionalAmount) || 1;
    if (amountNum < 1) {
      alert("Jumlah minimal 1.");
      return;
    }

    try {
      setSavingItem(true);

      if (additionalCategory === "Jasa") {
        if (!selectedServiceId) {
          alert("Pilih jenis jasa terlebih dahulu.");
          return;
        }
        const srv = availableServices.find(
          (s) => String(s.id) === String(selectedServiceId)
        );
        const finalPrice =
          additionalPrice.trim() !== ""
            ? Number(additionalPrice)
            : Number(srv?.price || 0);

        await createServiceOrder({
          order_id: id,
          services_id: selectedServiceId,
          amount: amountNum,
          price: finalPrice,
          warranty: srv?.warranty || 0,
        });
      } else if (additionalCategory === "Sparepart") {
        if (!additionalInformation.trim()) {
          alert("Keterangan sparepart harus diisi.");
          return;
        }
        const priceNum = Number(additionalPrice) || 0;
        const capPriceNum = Number(additionalCapitalPrice) || 0;

        await createSparepartOrder({
          order_id: id,
          information: additionalInformation.trim(),
          amount: amountNum,
          price: priceNum,
          capital_price: capPriceNum,
        });
      } else if (additionalCategory === "Biaya lain") {
        if (!additionalInformation.trim()) {
          alert("Keterangan biaya harus diisi.");
          return;
        }
        const priceNum = Number(additionalPrice) || 0;
        const capPriceNum = Number(additionalCapitalPrice) || 0;

        await createOtherCostsOrder({
          order_id: id,
          information: additionalInformation.trim(),
          amount: amountNum,
          price: priceNum,
          capital_price: capPriceNum,
        });
      }

      // Reset form
      setAdditionalInformation("");
      setSelectedServiceId("");
      setAdditionalAmount("1");
      setAdditionalPrice("");
      setAdditionalCapitalPrice("");

      // Recalculate partner commission if any assigned technician is Mitra (role 4)
      try {
        await updateOrderCommissions(id);
      } catch (commErr) {
        console.warn("Gagal memperbarui komisi mitra:", commErr);
      }

      // Refresh
      await fetchOrderDetail(id);
    } catch (err: any) {
      console.error("Gagal menambahkan item:", err);
      alert(err?.response?.data?.error || "Gagal menambahkan item.");
    } finally {
      setSavingItem(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <p className="text-xs text-slate-400">Memuat detail tugas...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f9fc] p-4 text-center">
        <p className="text-xs text-rose-500">{error || "Tugas tidak ditemukan."}</p>
        <button
          onClick={() => router.back()}
          className="mt-3 text-xs text-blue-600 underline"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Format date display
  const schedule =
    Array.isArray(order.complaint_schedules) &&
    order.complaint_schedules.length > 0
      ? order.complaint_schedules[0]
      : null;

  let scheduleDate = "-";
  if (schedule?.date) {
    const d = new Date(`${schedule.date}T${schedule.time || "00:00:00"}`);
    if (!isNaN(d.getTime())) {
      scheduleDate = d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (schedule.time) scheduleDate += ` (${schedule.time.substring(0, 5)})`;
    }
  } else if (order.created_at) {
    const d = new Date(order.created_at);
    if (!isNaN(d.getTime())) {
      scheduleDate = d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  const invoiceNo = `INV/${new Date(order.created_at || Date.now()).getFullYear()}/${String(
    new Date(order.created_at || Date.now()).getMonth() + 1
  ).padStart(2, "0")}/${String(order.id).slice(-4).padStart(4, "0").toUpperCase()}`;

  const rawStatus = (order.status || "pending").toLowerCase();
  let displayStatus = "Terjadwal";
  if (
    rawStatus === "in_progress" ||
    rawStatus === "progress" ||
    rawStatus === "dikerjakan"
  )
    displayStatus = "Sedang dikerjakan";
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

  const isStarted =
    rawStatus === "in_progress" ||
    rawStatus === "progress" ||
    rawStatus === "dikerjakan" ||
    rawStatus === "completed" ||
    rawStatus === "selesai";

  const isCompleted = rawStatus === "completed" || rawStatus === "selesai";

  // Total calculation
  let totalBill = 0;
  (order.service_orders || []).forEach((s) => {
    totalBill += (Number(s.price) || 0) * (Number(s.amount) || 1);
  });
  (order.sparepart_orders || []).forEach((sp) => {
    totalBill += (Number(sp.price) || 0) * (Number(sp.amount) || 1);
  });
  (order.other_costs_orders || []).forEach((oc) => {
    totalBill += (Number(oc.price) || 0) * (Number(oc.amount) || 1);
  });
  (order.product_orders || []).forEach((po) => {
    totalBill += (Number(po.price) || 0) * (Number(po.amount) || 1);
  });

  const isPaid =
    order.payment_status === "paid" || order.payment_status === "lunas";

  // Who holds the cash (paid_to field)
  const isDepositedToCompany =
    order.paid_to_user?.role === 1 || order.paid_to_user?.role === 2;
  const cashHolder = isDepositedToCompany
    ? "Kas Perusahaan / Kantor"
    : order.paid_to_user?.name || (order.paid_to ? currentUserName || "Teknisi" : null);
  const isCashPayment =
    isPaid &&
    (order.payment_type === "cash" || order.payment_type === "tunai");

  // Photos parsing
  const beforePhotos: string[] = Array.isArray(order.image_before)
    ? order.image_before
    : order.image_before
    ? [order.image_before]
    : [];

  const afterPhotos: string[] = Array.isArray(order.image_after)
    ? order.image_after
    : order.image_after
    ? [order.image_after]
    : [];

  const customerName = order.customer?.name || "Customer";
  const customerPhone = order.customer?.phone || "";
  const customerAddress =
    order.customer?.google_maps ||
    order.customer?.label ||
    "Alamat belum diatur";
  const cleanPhone = customerPhone.replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("0")
    ? `62${cleanPhone.slice(1)}`
    : cleanPhone;

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-2 text-slate-800 sm:p-4">
      <div className="mx-auto max-w-5xl space-y-2">
        {/* Header */}
        <header>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3 w-3" /> Kembali
          </button>

          <h1 className="text-sm font-bold">
            {order.assigned_user?.name || "Teknisi belum ditugaskan"}
          </h1>
          <p className="text-[10px] text-slate-500">{scheduleDate}</p>
        </header>

        {/* Customer information */}
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${getStatusBadge(
                displayStatus
              )}`}
            >
              {displayStatus}
            </span>

            <span className="text-[9px] text-slate-500">{invoiceNo}</span>
          </div>

          <p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-slate-600">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" />
            {customerAddress}
          </p>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                customerAddress
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 text-[10px] text-slate-700 hover:bg-slate-50"
            >
              <MapPin className="h-3 w-3 text-sky-600" /> Maps
            </a>

            <a
              href={customerPhone ? `tel:${customerPhone}` : "#"}
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 text-[10px] text-slate-700 hover:bg-slate-50"
            >
              <Phone className="h-3 w-3 text-rose-500" /> Telepon
            </a>

            <a
              href={
                waPhone
                  ? `https://wa.me/${waPhone}?text=Halo%20${encodeURIComponent(
                      customerName
                    )},%20kami%20dari%20Robocool%20terkait%20layanan%20AC.`
                  : "#"
              }
              target="_blank"
              rel="noreferrer"
              className="flex h-8 items-center justify-center gap-1 rounded-md bg-green-500 text-[10px] font-semibold text-white hover:bg-green-600"
            >
              <MessageCircle className="h-3 w-3 text-white" /> WA
            </a>
          </div>

          <p className="mt-2 flex items-center gap-1 text-[9px] text-slate-500">
            <User className="h-3 w-3 text-amber-500" /> {customerName}
            {customerPhone ? ` (${customerPhone})` : ""}
          </p>
        </section>

        {/* Start / Finish work */}
        {!isCompleted && (
          <section className="space-y-1.5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {!isStarted ? (
                <button
                  type="button"
                  disabled={updatingStatus || beforePhotos.length === 0}
                  onClick={handleStartWork}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 text-[10px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <Play className="h-3 w-3 fill-current" /> Mulai Kerja
                </button>
              ) : (
                <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Pekerjaan Dimulai
                </div>
              )}

              {isStarted && (
                <button
                  type="button"
                  disabled={updatingStatus || afterPhotos.length === 0}
                  onClick={handleCompleteWork}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  <Check className="h-3.5 w-3.5" /> Tandai Selesai
                </button>
              )}
            </div>

            {/* Validation helper text */}
            {!isStarted && beforePhotos.length === 0 && (
              <p className="text-[9px] text-amber-600 font-medium">
                * Wajib mengunggah &quot;Foto Sebelum&quot; terlebih dahulu untuk mulai kerja.
              </p>
            )}
            {isStarted && afterPhotos.length === 0 && (
              <p className="text-[9px] text-amber-600 font-medium">
                * Wajib mengunggah &quot;Foto Sesudah&quot; terlebih dahulu untuk menyelesaikan pekerjaan.
              </p>
            )}
          </section>
        )}

        {/* Job details */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-[10px] font-medium">Pekerjaan & Layanan</h2>
          </div>

          <div className="space-y-2 p-3">
            {/* Services list */}
            {(order.service_orders || []).map((so) => (
              <div
                key={so.id}
                className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2"
              >
                <div>
                  <p className="text-[10px] font-semibold">
                    {so.amount > 1 ? `${so.amount}x ` : ""}
                    {so.service?.name || "Layanan AC"}
                  </p>
                  {so.service?.estimate && (
                    <p className="mt-0.5 text-[9px] text-slate-500">
                      Estimasi: {so.service.estimate} menit
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] font-medium">
                  {formatRupiah(Number(so.price) * Number(so.amount || 1))}
                </span>
              </div>
            ))}

            {/* Sparepart list */}
            {(order.sparepart_orders || []).map((sp) => (
              <div
                key={sp.id}
                className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2"
              >
                <div>
                  <p className="text-[10px] font-semibold">
                    {sp.amount > 1 ? `${sp.amount}x ` : ""}
                    {sp.information}
                  </p>
                  <p className="mt-0.5 text-[8px] text-slate-400">Sparepart</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium">
                  {formatRupiah(Number(sp.price) * Number(sp.amount || 1))}
                </span>
              </div>
            ))}

            {/* Other costs list */}
            {(order.other_costs_orders || []).map((oc) => (
              <div
                key={oc.id}
                className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2"
              >
                <div>
                  <p className="text-[10px] font-semibold">
                    {oc.amount > 1 ? `${oc.amount}x ` : ""}
                    {oc.information}
                  </p>
                  <p className="mt-0.5 text-[8px] text-slate-400">Biaya Lain</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium">
                  {formatRupiah(Number(oc.price) * Number(oc.amount || 1))}
                </span>
              </div>
            ))}

            {/* Product list */}
            {(order.product_orders || []).map((po) => (
              <div
                key={po.id}
                className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2"
              >
                <div>
                  <p className="text-[10px] font-semibold">
                    {po.amount > 1 ? `${po.amount}x ` : ""}
                    {po.name}
                  </p>
                  <p className="mt-0.5 text-[8px] text-slate-400">Produk</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium">
                  {formatRupiah(Number(po.price) * Number(po.amount || 1))}
                </span>
              </div>
            ))}

            {/* Before and after photos */}
            <div className="mt-3 grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              <PhotoSection
                label="Foto Sebelum"
                photos={beforePhotos}
                inputRef={beforeInput}
                uploading={uploadingType === "before"}
                onFileSelected={(e) => handleImageUpload(e, "before")}
                onRemove={(url) => handleRemoveImage("before", url)}
              />

              <PhotoSection
                label="Foto Sesudah"
                photos={afterPhotos}
                inputRef={afterInput}
                uploading={uploadingType === "after"}
                onFileSelected={(e) => handleImageUpload(e, "after")}
                onRemove={(url) => handleRemoveImage("after", url)}
              />
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3">
            <span className="text-[10px] font-semibold">Total tagihan</span>
            <span className="text-[11px] font-bold text-slate-900">
              {formatRupiah(totalBill)}
            </span>
          </div>
        </section>

        {/* Additional services / spare parts */}
        {!isCompleted && (
          <section className="rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setShowAdditional((value) => !value)}
            aria-expanded={showAdditional}
            className="flex w-full items-center gap-1.5 px-1 py-1 text-left text-[10px] font-medium text-blue-600 hover:text-blue-700"
          >
            {showAdditional ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Tambah jasa / sparepart
          </button>

          {showAdditional && (
            <div className="space-y-2 border-t border-slate-100 p-2">
              {/* Category tabs */}
              <div className="grid grid-cols-3 gap-1">
                {(["Sparepart", "Jasa", "Biaya lain"] as const).map(
                  (category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setAdditionalCategory(category)}
                      className={`h-[30px] rounded-md border text-[9px] font-medium transition ${
                        additionalCategory === category
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {category}
                    </button>
                  )
                )}
              </div>

              {/* JASA */}
              {additionalCategory === "Jasa" && (
                <>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => {
                      setSelectedServiceId(e.target.value);
                      const srv = availableServices.find(
                        (s) => String(s.id) === e.target.value
                      );
                      if (srv) {
                        setAdditionalPrice(String(srv.price));
                      }
                    }}
                    className="h-[34px] w-full rounded-md border border-slate-300 bg-white px-2 text-[9px] outline-none focus:border-blue-500"
                  >
                    <option value="">Pilih layanan jasa</option>
                    {availableServices.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} — {formatRupiah(Number(srv.price))}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={additionalAmount}
                      onChange={(e) => setAdditionalAmount(e.target.value)}
                      placeholder="Jumlah"
                      className="col-span-1 h-[34px] min-w-0 rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                    />

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={additionalPrice}
                      onChange={(e) => setAdditionalPrice(e.target.value)}
                      placeholder="Harga (default dari master)"
                      className="col-span-2 h-[34px] min-w-0 rounded-md border border-slate-300 px-2 text-[9px] outline-none placeholder:text-slate-400 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* SPAREPART */}
              {additionalCategory === "Sparepart" && (
                <>
                  <input
                    type="text"
                    value={additionalInformation}
                    onChange={(e) => setAdditionalInformation(e.target.value)}
                    placeholder="Keterangan (mis. Kapasitor 35uF, Pipa 1/4)"
                    className="h-[34px] w-full rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                  />

                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      min="1"
                      value={additionalAmount}
                      onChange={(e) => setAdditionalAmount(e.target.value)}
                      placeholder="Jumlah"
                      className="h-[34px] min-w-0 rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                    />

                    <input
                      type="number"
                      min="0"
                      value={additionalPrice}
                      onChange={(e) => setAdditionalPrice(e.target.value)}
                      placeholder="Harga jual"
                      className="col-span-2 h-[34px] min-w-0 rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                    />
                  </div>

                  <input
                    type="number"
                    min="0"
                    value={additionalCapitalPrice}
                    onChange={(e) => setAdditionalCapitalPrice(e.target.value)}
                    placeholder="Harga beli / modal (opsional)"
                    className="h-[34px] w-full rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                  />
                </>
              )}

              {/* BIAYA LAIN */}
              {additionalCategory === "Biaya lain" && (
                <>
                  <input
                    type="text"
                    value={additionalInformation}
                    onChange={(e) => setAdditionalInformation(e.target.value)}
                    placeholder="Keterangan biaya (mis. Parkir, Transport khusus)"
                    className="h-[34px] w-full rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                  />

                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      min="1"
                      value={additionalAmount}
                      onChange={(e) => setAdditionalAmount(e.target.value)}
                      placeholder="Jumlah"
                      className="h-[34px] min-w-0 rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                    />

                    <input
                      type="number"
                      min="0"
                      value={additionalPrice}
                      onChange={(e) => setAdditionalPrice(e.target.value)}
                      placeholder="Harga"
                      className="col-span-2 h-[34px] min-w-0 rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                    />
                  </div>

                  <input
                    type="number"
                    min="0"
                    value={additionalCapitalPrice}
                    onChange={(e) => setAdditionalCapitalPrice(e.target.value)}
                    placeholder="Harga modal (opsional)"
                    className="h-[34px] w-full rounded-md border border-slate-300 px-2 text-[9px] outline-none focus:border-blue-500"
                  />
                </>
              )}

              <button
                type="button"
                disabled={savingItem}
                onClick={handleAddItem}
                className="h-[34px] w-full rounded-md bg-blue-600 text-[9px] font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {savingItem ? "Menyimpan..." : "Tambahkan ke Pesanan"}
              </button>
            </div>
          )}
        </section>
        )}

        {/* Payment */}
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-medium">Pembayaran</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                isPaid
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {isPaid
                ? `Lunas (${order.payment_type || "Terverifikasi"})`
                : "Belum Lunas"}
            </span>
          </div>

          <p className="mt-2 text-[10px] text-slate-600">
            Tagihan:{" "}
            <span className="font-semibold text-slate-800">
              {formatRupiah(totalBill)}
            </span>
          </p>

          {/* If cash payment is already done with cash holder, show card and remove buttons */}
          {isCashPayment ? (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-800">
                      LUNAS: Uang dipegang {cashHolder || currentUserName || "Teknisi"}
                    </p>
                    <p className="text-[9px] text-emerald-600">
                      Pembayaran tunai sebesar {formatRupiah(totalBill)} telah diterima.
                    </p>
                  </div>
                </div>

                {(currentUserRole === 1 || currentUserRole === 2) && !isDepositedToCompany && (
                  <button
                    type="button"
                    disabled={depositingCash}
                    onClick={handleDepositCash}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    {depositingCash ? "Menyimpan..." : "Sudah di Setor"}
                  </button>
                )}
                {isDepositedToCompany && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-800">
                    <Check className="h-3 w-3" /> Sudah disetor ke kantor
                  </span>
                )}
              </div>
            </div>
          ) : isPaid && (order.payment_type === "transfer" || order.payment_type === "bank") ? (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  <Check className="h-3 w-3" />
                </span>
                <p className="text-[11px] font-bold text-blue-800">
                  LUNAS: Transfer Bank
                </p>
              </div>
              <p className="mt-1 text-[9px] text-blue-600">
                Pembayaran via transfer telah terverifikasi.
              </p>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={updatingPayment}
                onClick={() => handlePayment("cash")}
                className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Banknote className="h-3.5 w-3.5 text-emerald-600" /> Terima Tunai
              </button>

              <button
                type="button"
                disabled={updatingPayment}
                onClick={() => handlePayment("transfer")}
                className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <CreditCard className="h-3.5 w-3.5 text-blue-600" /> Sudah Transfer
              </button>
            </div>
          )}

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowNotes((value) => !value)}
              className="text-[10px] text-blue-600 hover:underline"
            >
              {showNotes ? "Tutup catatan / riwayat" : "Lihat catatan & riwayat"}
            </button>
          </div>

          {showNotes && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <label
                htmlFor="payment-notes"
                className="mb-1 block text-[10px] text-slate-600"
              >
                Catatan teknisi / nota
              </label>

              <textarea
                id="payment-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan pengerjaan atau pembayaran..."
                rows={2}
                className="w-full rounded-md border border-slate-300 p-2 text-[10px] outline-none focus:border-blue-500"
              />

              {/* History items */}
              {Array.isArray(order.order_history) &&
                order.order_history.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2">
                    <p className="text-[9px] font-medium text-slate-500">
                      Riwayat Aktivitas:
                    </p>
                    {order.order_history.map((h, i) => (
                      <div
                        key={h.id || i}
                        className="flex items-start justify-between gap-2 text-[9px] text-slate-600"
                      >
                        <div>
                          <span className="font-semibold">{h.status}</span>
                          {h.notes && <span> — {h.notes}</span>}
                        </div>
                        <span className="shrink-0 text-slate-400">
                          {h.created_at || h.date_start
                            ? new Date(
                                h.created_at || h.date_start!
                              ).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("selesai")) return "bg-emerald-100 text-emerald-700";
  if (s.includes("dikerjakan") || s.includes("sedang"))
    return "bg-sky-100 text-sky-700";
  if (s.includes("terjadwal")) return "bg-blue-100 text-blue-700";
  if (s.includes("sparepart")) return "bg-amber-100 text-amber-700";
  if (s.includes("batal")) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function PhotoSection({
  label,
  photos,
  inputRef,
  uploading,
  onFileSelected,
  onRemove,
}: {
  label: string;
  photos: string[];
  inputRef: RefObject<HTMLInputElement | null>;
  uploading: boolean;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (url: string) => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 p-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[9px] font-medium text-slate-600">{label}</span>
        <span
          className={`text-[8px] ${
            photos.length > 0 ? "text-emerald-600" : "text-rose-500"
          }`}
        >
          {uploading
            ? "Mengunggah..."
            : photos.length > 0
            ? `${photos.length} foto`
            : "belum ada"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 text-[9px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        <Camera className="h-3 w-3" />
        {uploading ? "Mengunggah..." : "+ Tambah foto"}
      </button>

      {photos.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {photos.map((url, i) => (
            <div key={i} className="group relative aspect-video overflow-hidden rounded border border-slate-200">
              <Image
                src={url}
                alt={`${label} ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white opacity-90 transition hover:opacity-100"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
