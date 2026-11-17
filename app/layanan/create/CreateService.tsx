"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { createService } from "@/app/fetch/add/fetch";

export default function CreateService() {
  const router = useRouter();

  const [name, setName] = useState("Cuci AC 1 PK");
  const [price, setPrice] = useState("0");
  const [warranty, setWarranty] = useState("7");
  const [estimation, setEstimation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      await createService({
        name: name.trim(),
        price: Number(price),
        warranty: warranty === "" ? null : Number(warranty),
        estimate: estimation === "" ? null : Number(estimation),
      });

      alert("Layanan berhasil disimpan");
      router.back();
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan layanan";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-[34px] w-full rounded-md border border-slate-300 bg-white px-2.5 text-[11px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-100";

  const labelClass = "mb-1 block text-[10px] text-slate-600";

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-1 text-[10px] text-slate-500 hover:text-blue-600"
        >
          ← Kembali
        </button>

        <h1 className="mb-3 text-sm font-bold text-slate-900">Layanan Baru</h1>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="mb-3">
            <label htmlFor="service-name" className={labelClass}>
              Nama layanan
            </label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama layanan"
              className={inputClass}
              required
            />
          </div>

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="service-price" className={labelClass}>
                Harga (Rp)
              </label>
              <input
                id="service-price"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="service-warranty" className={labelClass}>
                Garansi (hari)
              </label>
              <input
                id="service-warranty"
                type="number"
                min="0"
                step="1"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="service-estimation" className={labelClass}>
                Estimasi (menit)
              </label>
              <input
                id="service-estimation"
                type="number"
                min="1"
                step="1"
                value={estimation}
                onChange={(e) => setEstimation(e.target.value)}
                placeholder="Contoh: 60"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
