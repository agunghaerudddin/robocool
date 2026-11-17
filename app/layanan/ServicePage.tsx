"use client";

import { useEffect, useState } from "react";
import { getServices } from "../fetch/get/fetch";
// Adjust to your actual file path

type Service = {
  id: number | string;
  name: string;
  price: number | string;
  warranty: number | string | null;
  estimate: number | string | null;
  updated_at?: string;
};

export default function ServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getServices();

      if (!res || !Array.isArray(res.data)) {
        throw new Error("Invalid services response");
      }

      setServices(res.data);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      setError("Gagal memuat data layanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Format price to Indonesian Rupiah
  const formatPrice = (price: number | string) => {
    return `Rp ${Number(price).toLocaleString("id-ID")}`;
  };

  // Format warranty
  const formatWarranty = (warranty: number | string | null) => {
    if (warranty === null || warranty === "") return "-";

    return `${warranty} hari`;
  };

  // Format estimate
  const formatEstimate = (estimate: number | string | null) => {
    if (estimate === null || estimate === "") return "-";

    return `${estimate} mnt`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Master Layanan
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Harga dasar, estimasi waktu, dan masa garansi per jenis jasa
            </p>
          </div>

          <button className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700">
            <span className="text-sm leading-none">+</span>
            Layanan
          </button>
        </div>

        {/* Service Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Layanan
                  </th>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Harga
                  </th>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Garansi
                  </th>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Estimasi
                  </th>
                  <th className="px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Komisi
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* Loading */}
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-xs text-slate-400"
                    >
                      Memuat data layanan...
                    </td>
                  </tr>
                )}

                {/* Error */}
                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center">
                      <p className="mb-2 text-xs text-rose-500">{error}</p>

                      <button
                        onClick={fetchServices}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Coba lagi
                      </button>
                    </td>
                  </tr>
                )}

                {/* Empty */}
                {!loading && !error && services.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-xs text-slate-400"
                    >
                      Belum ada layanan tersedia.
                    </td>
                  </tr>
                )}

                {/* Dynamic Services */}
                {!loading &&
                  !error &&
                  services.map((service) => (
                    <tr
                      key={service.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-[11px] font-medium text-slate-800">
                        {service.name}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {formatPrice(service.price)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {formatWarranty(service.warranty)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                        {formatEstimate(service.estimate)}
                      </td>

                      <td className="px-3 py-2 text-[11px] text-slate-400">
                        -
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button className="text-[11px] font-medium text-blue-600 transition hover:text-blue-800">
                            Ubah
                          </button>

                          <button className="text-[11px] font-medium text-rose-600 transition hover:text-rose-800">
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
