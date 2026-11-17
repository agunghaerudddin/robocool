"use client";

import { useRef, useState } from "react";
import type { RefObject } from "react";
import { useRouter } from "next/navigation";

type AdditionalCategory = "Sparepart" | "Jasa" | "Biaya lain";

type AdditionalItem = {
  id: number;
  category: AdditionalCategory;
  information: string;
  amount: string;
  price: string;
  capitalPrice: string;
};

export default function TaskDetail() {
  const router = useRouter();

  const [status, setStatus] = useState("Terjadwal");
  const [started, setStarted] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState<
    "unpaid" | "cash" | "transfer"
  >("unpaid");

  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const [showAdditional, setShowAdditional] = useState(false);

  // Additional services / spare parts form
  const [additionalItems, setAdditionalItems] = useState<AdditionalItem[]>([]);
  const [additionalCategory, setAdditionalCategory] =
    useState<AdditionalCategory>("Sparepart");

  const [additionalInformation, setAdditionalInformation] = useState("");
  const [additionalAmount, setAdditionalAmount] = useState("1");
  const [additionalPrice, setAdditionalPrice] = useState("");
  const [additionalCapitalPrice, setAdditionalCapitalPrice] = useState("");

  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);

  const beforeInput = useRef<HTMLInputElement>(null);
  const afterInput = useRef<HTMLInputElement>(null);

  const basePrice = 400000;

  const additionalTotal = additionalItems.reduce((sum, item) => {
    const price = Math.max(0, Number(item.price) || 0);
    const amount = Math.max(0, Number(item.amount) || 0);

    return sum + price * amount;
  }, 0);

  const total = basePrice + additionalTotal;

  const formatRupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

  const addItem = () => {
    if (!additionalInformation.trim()) {
      alert("Keterangan harus diisi.");
      return;
    }

    if (
      additionalPrice.trim() === "" ||
      !Number.isFinite(Number(additionalPrice)) ||
      Number(additionalPrice) < 0
    ) {
      alert("Masukkan harga jual yang valid.");
      return;
    }

    if (
      additionalAmount.trim() === "" ||
      !Number.isFinite(Number(additionalAmount)) ||
      Number(additionalAmount) < 1
    ) {
      alert("Jumlah minimal 1.");
      return;
    }

    if (
      additionalCapitalPrice.trim() !== "" &&
      (!Number.isFinite(Number(additionalCapitalPrice)) ||
        Number(additionalCapitalPrice) < 0)
    ) {
      alert("Harga beli/modal tidak valid.");
      return;
    }

    const newItem: AdditionalItem = {
      id: Date.now(),
      category: additionalCategory,
      information: additionalInformation.trim(),
      amount: additionalAmount,
      price: additionalPrice,
      capitalPrice: additionalCapitalPrice,
    };

    setAdditionalItems((items) => [...items, newItem]);

    // Reset the form after adding the item
    setAdditionalInformation("");
    setAdditionalAmount("1");
    setAdditionalPrice("");
    setAdditionalCapitalPrice("");
  };

  const removeItem = (id: number) => {
    setAdditionalItems((items) => items.filter((item) => item.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-2 text-slate-800 sm:p-4">
      <div className="mx-auto max-w-5xl space-y-2">
        {/* Header */}
        <header>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-2 block text-[10px] text-slate-500 hover:text-blue-600"
          >
            ← Kembali
          </button>

          <h1 className="text-sm font-bold">guntek</h1>
          <p className="text-[10px] text-slate-500">Senin, 09 Nov 2026</p>
        </header>

        {/* Customer information */}
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-medium text-sky-700">
              {status}
            </span>

            <span className="text-[9px] text-slate-500">INV/2026/11/0009</span>
          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
            <span className="mr-1 text-rose-500">♦</span>
            Jl. Aroepala No.60, Gn. Sari, Kec. Rappocini, Kota Makassar,
            Sulawesi Selatan 90233
          </p>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Jl.+Aroepala+No.60+Makassar"
              target="_blank"
              rel="noreferrer"
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 text-[10px] text-slate-700 hover:bg-slate-50"
            >
              <span className="text-sky-600">▦</span> Maps
            </a>

            <a
              href="tel:"
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-slate-300 text-[10px] text-slate-700 hover:bg-slate-50"
            >
              <span className="text-rose-500">♧</span> Telepon
            </a>

            <a
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
              className="flex h-8 items-center justify-center gap-1 rounded-md bg-green-500 text-[10px] font-semibold text-white hover:bg-green-600"
            >
              WA
            </a>
          </div>

          <p className="mt-2 text-[9px] text-slate-500">
            <span className="text-amber-500">♟</span> Irfan
          </p>
        </section>

        {/* Start work */}
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            disabled={started}
            onClick={() => {
              setStarted(true);
              setStatus("Sedang dikerjakan");
            }}
            className="flex h-9 w-full items-center justify-center gap-1 rounded-md bg-blue-600 text-[10px] font-semibold text-white transition hover:bg-blue-700 disabled:bg-emerald-600"
          >
            {started ? "✓ Pekerjaan Dimulai" : "▶ Mulai Kerja"}
          </button>
        </section>

        {/* Job details */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-[10px] font-medium">Pekerjaan</h2>
          </div>

          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold">Bongkar Pasang AC</p>

                <p className="mt-0.5 text-[9px] text-slate-500">
                  <span className="text-sky-500">♧</span> Daikin 2 PK — sdsdf
                </p>
              </div>

              <span className="shrink-0 text-[10px] font-medium">
                {formatRupiah(basePrice)}
              </span>
            </div>

            {/* Before and after photos */}
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <PhotoUpload
                label="Sebelum"
                file={beforePhoto}
                inputRef={beforeInput}
                onChange={setBeforePhoto}
              />

              <PhotoUpload
                label="Sesudah"
                file={afterPhoto}
                inputRef={afterInput}
                onChange={setAfterPhoto}
              />
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3">
            <span className="text-[10px] font-semibold">Total tagihan</span>

            <span className="text-[10px] font-bold">{formatRupiah(total)}</span>
          </div>
        </section>

        {/* Additional services / spare parts */}
        <section className="rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setShowAdditional((value) => !value)}
            aria-expanded={showAdditional}
            className="flex w-full items-center gap-1 px-1 py-1 text-left text-[10px] text-blue-600"
          >
            <span>{showAdditional ? "▼" : "▶"}</span>
            Tambah jasa / sparepart
          </button>

          {showAdditional && (
            <div className="space-y-1.5 p-1">
              {/* Category tabs */}
              <div className="grid grid-cols-3 gap-1">
                {(["Sparepart", "Jasa", "Biaya lain"] as const).map(
                  (category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setAdditionalCategory(category)}
                      className={`h-[30px] rounded-md border text-[9px] transition ${
                        additionalCategory === category
                          ? "border-blue-400 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {category}
                    </button>
                  ),
                )}
              </div>

              {/* JASA */}
              {additionalCategory === "Jasa" && (
                <>
                  <select
                    value={additionalInformation}
                    onChange={(e) => setAdditionalInformation(e.target.value)}
                    className="h-[34px] w-full rounded-md border border-slate-300 bg-white px-2 text-[9px] outline-none focus:border-blue-500"
                  >
                    <option value="">Pilih jasa</option>
                    <option value="Bongkar Pasang AC — Rp 400.000">
                      Bongkar Pasang AC — Rp 400.000
                    </option>
                    <option value="Cuci AC — Rp 75.000">
                      Cuci AC — Rp 75.000
                    </option>
                    <option value="Isi Freon AC — Rp 150.000">
                      Isi Freon AC — Rp 150.000
                    </option>
                  </select>

                  <select
                    value={additionalCapitalPrice}
                    onChange={(e) => setAdditionalCapitalPrice(e.target.value)}
                    className="h-[30px] w-full rounded-md border border-slate-300 bg-white px-2 text-[9px] outline-none focus:border-blue-500"
                  >
                    <option value="">— Unit —</option>
                    <option value="0">Unit</option>
                    <option value="1">PK</option>
                    <option value="2">Set</option>
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
                      placeholder="Harga (kosong = harga master)"
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
                    placeholder="Keterangan (mis. Kapasitor 35uF)"
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
                    placeholder="Keterangan biaya"
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
                onClick={addItem}
                className="h-[34px] w-full rounded-md bg-blue-600 text-[9px] font-medium text-white transition hover:bg-blue-700"
              >
                Tambahkan
              </button>

              {/* Added items */}
              {additionalItems.length > 0 && (
                <div className="space-y-1 pt-1">
                  {additionalItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-slate-200 p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-medium">
                          {item.information}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {item.category} · {item.amount} ×{" "}
                          {formatRupiah(Number(item.price))}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 text-[9px] text-red-500 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Payment */}
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="text-[10px] font-medium">Pembayaran</h2>

          <p className="mt-2 text-[10px] text-slate-600">
            Tagihan:{" "}
            <span className="font-semibold text-slate-800">
              {formatRupiah(total)}
            </span>
          </p>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentStatus("cash")}
              className={`flex h-9 items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition ${
                paymentStatus === "cash"
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              ♧ Terima Tunai
            </button>

            <button
              type="button"
              onClick={() => setPaymentStatus("transfer")}
              className={`flex h-9 items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition ${
                paymentStatus === "transfer"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              ▤ Sudah Transfer
            </button>
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setShowNotes((value) => !value)}
              className="text-[10px] text-blue-600 hover:underline"
            >
              {showNotes ? "Tutup nota" : "Lihat nota"}
            </button>
          </div>

          {showNotes && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <label
                htmlFor="payment-notes"
                className="mb-1 block text-[10px] text-slate-600"
              >
                Catatan pembayaran
              </label>

              <textarea
                id="payment-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan..."
                rows={3}
                className="w-full rounded-md border border-slate-300 p-2 text-[10px] outline-none focus:border-blue-500"
              />

              <p className="mt-2 text-[10px] text-slate-500">
                Metode:{" "}
                {paymentStatus === "cash"
                  ? "Tunai"
                  : paymentStatus === "transfer"
                    ? "Transfer"
                    : "Belum dipilih"}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PhotoUpload({
  label,
  file,
  inputRef,
  onChange,
}: {
  label: string;
  file: File | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 p-1.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[9px] text-slate-600">{label}</span>

        <span
          className={`text-[8px] ${
            file ? "text-emerald-600" : "text-rose-500"
          }`}
        >
          {file ? "foto dipilih" : "belum ada"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-8 w-full items-center justify-center gap-1 rounded-md border border-slate-300 text-[9px] text-slate-600 hover:bg-slate-50"
      >
        ▣ {file ? "Ganti foto" : "Tambah foto"}
      </button>

      {file && (
        <p className="mt-1 truncate text-[9px] text-slate-500">{file.name}</p>
      )}
    </div>
  );
}
