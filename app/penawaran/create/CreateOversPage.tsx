"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type OfferItem = {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  price: number;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, " ");

export default function CreateOversPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [customerSearch, setCustomerSearch] = useState("");
  const [company, setCompany] = useState("PT Maju Jaya");
  const [recipient, setRecipient] = useState("Bapak/Ibu Bagian Umum");
  const [address, setAddress] = useState("");

  const [letterDate, setLetterDate] = useState("2026-11-25");
  const [subject, setSubject] = useState("Penawaran Harga Jasa Service AC");
  const [opening, setOpening] = useState(
    "Dengan hormat,\n\nBersama surat ini kami Robocool bermaksud mengajukan penawaran harga untuk pekerjaan perawatan / perbaikan AC dengan rincian sebagai berikut:",
  );

  const [items, setItems] = useState<OfferItem[]>([
    {
      id: 1,
      description: "Cuci AC split",
      quantity: 1,
      unit: "unit",
      price: 150000,
    },
  ]);

  const [includeTax, setIncludeTax] = useState(false);
  const [validDays, setValidDays] = useState(14);
  const [terms, setTerms] = useState(
    "1. Harga sudah termasuk jasa & transport.\n2. Pembayaran 14 hari setelah pekerjaan selesai.",
  );
  const [signer, setSigner] = useState("Irfan");
  const [position, setPosition] = useState("Pimpinan");

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Math.max(0, item.quantity) * Math.max(0, item.price),
        0,
      ),
    [items],
  );

  const tax = includeTax ? Math.round(subtotal * 0.11) : 0;
  const total = subtotal + tax;

  function updateItem(
    id: number,
    field: keyof Omit<OfferItem, "id">,
    value: string | number,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        description: "",
        quantity: 1,
        unit: "unit",
        price: 0,
      },
    ]);
  }

  function removeItem(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!company.trim()) {
      setError("Nama perusahaan atau penerima wajib diisi.");
      return;
    }

    if (items.length === 0) {
      setError("Tambahkan minimal satu rincian penawaran.");
      return;
    }

    if (items.some((item) => !item.description.trim())) {
      setError("Nama pekerjaan atau barang wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      // UI siap. Hubungkan bagian ini ke API penyimpanan surat
      // penawaran setelah endpoint dan struktur tabel tersedia.
      const offer = {
        company,
        recipient,
        address,
        letterDate,
        subject,
        opening,
        items,
        subtotal,
        includeTax,
        tax,
        total,
        validDays,
        terms,
        signer,
        position,
      };

      console.log("Data surat penawaran:", offer);

      setSuccess(
        "Data valid dan siap disimpan. Hubungkan handleSave ke API surat penawaran.",
      );
    } catch {
      setError("Terjadi kesalahan saat menyimpan surat penawaran.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full min-w-0 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = "mb-1 block text-[11px] font-medium text-slate-700";

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-3 py-4 text-slate-800 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1150px]">
        {/* Header */}
        <header className="mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 text-xs text-slate-500 hover:text-blue-600"
          >
            ← Kembali
          </button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Buat Surat Penawaran
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Nomor surat dibuat otomatis saat disimpan
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
          >
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          {/* Left column */}
          <div className="space-y-4 lg:col-span-8">
            {/* Tujuan Surat */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">1. Tujuan Surat</h2>

              <div className="mb-3">
                <label className={labelClass}>
                  Ambil dari data pelanggan (opsional)
                </label>
                <input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Ketik nama atau no. WA pelanggan..."
                  className={inputClass}
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Pencarian pelanggan perlu dihubungkan ke database.
                </p>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Kepada (nama perusahaan / perorangan)
                  </label>
                  <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="PT Maju Jaya"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>u.p. (opsional)</label>
                  <input
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder="Bapak/Ibu Bagian Umum"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Alamat tujuan</label>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={2}
                  placeholder="Alamat perusahaan atau penerima..."
                  className={inputClass}
                />
              </div>
            </section>

            {/* Isi Surat */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">2. Isi Surat</h2>

              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Tanggal surat</label>
                  <input
                    type="date"
                    value={letterDate}
                    onChange={(event) => setLetterDate(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Perihal</label>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Kalimat pembuka</label>
                <textarea
                  value={opening}
                  onChange={(event) => setOpening(event.target.value)}
                  rows={4}
                  className={inputClass}
                />
              </div>
            </section>

            {/* Rincian Penawaran */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">
                3. Rincian Penawaran
              </h2>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative rounded-lg border border-slate-200 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        {index + 1}
                      </span>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[11px] text-red-500 hover:text-red-700"
                        >
                          Hapus baris
                        </button>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className={labelClass}>
                        Uraian pekerjaan / barang
                      </label>
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateItem(item.id, "description", event.target.value)
                        }
                        placeholder="Contoh: Cuci AC split"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div>
                        <label className={labelClass}>Jumlah</label>
                        <input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "quantity",
                              Math.max(0, Number(event.target.value)),
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Satuan</label>
                        <input
                          value={item.unit}
                          onChange={(event) =>
                            updateItem(item.id, "unit", event.target.value)
                          }
                          placeholder="unit"
                          className={inputClass}
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className={labelClass}>Harga satuan (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(event) =>
                            updateItem(
                              item.id,
                              "price",
                              Math.max(0, Number(event.target.value)),
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-right text-[11px] text-slate-500">
                      Jumlah:{" "}
                      <span className="font-semibold text-slate-800">
                        {formatRupiah(item.quantity * item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
              >
                + Tambah baris
              </button>
            </section>
          </div>

          {/* Right column: summary */}
          <aside className="lg:col-span-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
              <h2 className="mb-3 text-sm font-semibold">Ringkasan</h2>

              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={includeTax}
                    onChange={(event) => setIncludeTax(event.target.checked)}
                    className="accent-blue-600"
                  />
                  Tambah PPN 11%
                </label>

                {includeTax && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">PPN 11%</span>
                    <span>{formatRupiah(tax)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-sm font-bold">
                  <span>Total</span>
                  <span>{formatRupiah(total)}</span>
                </div>
              </div>

              <div className="mt-3">
                <label className={labelClass}>Masa berlaku (hari)</label>
                <input
                  type="number"
                  min="1"
                  value={validDays}
                  onChange={(event) =>
                    setValidDays(Math.max(1, Number(event.target.value)))
                  }
                  className={inputClass}
                />
              </div>

              <div className="mt-3">
                <label className={labelClass}>Syarat & catatan</label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Penanda tangan</label>
                  <input
                    value={signer}
                    onChange={(event) => setSigner(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Jabatan</label>
                  <input
                    value={position}
                    onChange={(event) => setPosition(event.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                Tanda tangan & stempel diambil dari Pengaturan (nanti).
              </p>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Penawaran"}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
