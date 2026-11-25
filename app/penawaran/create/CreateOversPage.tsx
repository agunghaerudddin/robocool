"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCustomers } from "@/app/fetch/get/fetch";
import { createOffer } from "@/app/fetch/add/fetch";

type OfferItem = {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  price: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  google_maps?: string | null;
  label?: string | null;
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
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Customers data & search dropdown
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Form states
  const [company, setCompany] = useState("PT Maju Jaya");
  const [recipient, setRecipient] = useState("Bapak/Ibu Bagian Umum");
  const [address, setAddress] = useState("");

  const [letterDate, setLetterDate] = useState("");
  const [subject, setSubject] = useState("Penawaran Harga Jasa Service AC");
  const [opening, setOpening] = useState(
    "Dengan hormat,\n\nBersama surat ini kami Robocool bermaksud mengajukan penawaran harga untuk pekerjaan perawatan / perbaikan AC dengan rincian sebagai berikut:"
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
    "1. Harga sudah termasuk jasa & transport.\n2. Pembayaran 14 hari setelah pekerjaan selesai."
  );
  const [signer, setSigner] = useState("Irfan");
  const [position, setPosition] = useState("Pimpinan");

  // Initialize date on client to avoid Next.js prerender hydration mismatches
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setLetterDate(today);
  }, []);

  // Fetch customers for search/autocomplete
  useEffect(() => {
    fetchCustomersList();
  }, []);

  const fetchCustomersList = async () => {
    try {
      const res = await getCustomers();
      if (res?.data && Array.isArray(res.data)) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const term = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
    );
  }, [customers, customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCompany(c.name);
    setRecipient(c.label || "Bapak/Ibu");
    if (c.google_maps) {
      setAddress(c.google_maps);
    }
    setCustomerSearch(`${c.name} (${c.phone})`);
    setShowCustomerDropdown(false);
  };

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.price) || 0),
        0
      ),
    [items]
  );

  const tax = includeTax ? Math.round(subtotal * 0.11) : 0;
  const total = subtotal + tax;

  function updateItem(
    id: number,
    field: keyof Omit<OfferItem, "id">,
    value: string | number
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
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
    if (items.length <= 1) {
      alert("Minimal harus ada satu rincian penawaran.");
      return;
    }
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
      setError("Semua nama pekerjaan atau barang wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        customer_id: selectedCustomer?.id || null,
        company: company.trim(),
        recipient: recipient.trim() || null,
        address: address.trim() || null,
        letter_date: letterDate || new Date().toISOString().split("T")[0],
        subject: subject.trim(),
        opening: opening.trim(),
        subtotal,
        include_tax: includeTax,
        tax,
        total,
        valid_days: Number(validDays) || 14,
        terms: terms.trim(),
        signer: signer.trim(),
        position: position.trim(),
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          unit: it.unit.trim() || "unit",
          price: Number(it.price) || 0,
        })),
      };

      const res = await createOffer(payload);

      if (res?.data?.data?.id) {
        setSuccess("Surat penawaran berhasil dibuat dan disimpan!");
        setTimeout(() => {
          router.push(`/penawaran/${res.data.data.id}`);
        }, 800);
      } else {
        router.push("/penawaran");
      }
    } catch (err: any) {
      console.error("Save offer error:", err);
      setError(
        err?.response?.data?.error ||
          "Terjadi kesalahan saat menyimpan surat penawaran."
      );
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
            onClick={() => router.push("/penawaran")}
            className="mb-2 text-xs text-slate-500 hover:text-blue-600"
          >
            ← Kembali ke Daftar Penawaran
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

        {/* Content Layout */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          {/* Main Form (2 cols) */}
          <div className="space-y-4 lg:col-span-2">
            {/* 1. Tujuan Surat */}
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-bold text-slate-900">
                1. Tujuan Surat
              </h2>

              <div className="mt-3 space-y-3">
                {/* Search Customer Autocomplete */}
                <div className="relative">
                  <label className={labelClass}>
                    Ambil dari data pelanggan (opsional)
                  </label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                      if (!e.target.value) setSelectedCustomer(null);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Ketik nama atau no. WA pelanggan..."
                    className={inputClass}
                  />

                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                      {filteredCustomers.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleSelectCustomer(cust)}
                          className="flex w-full flex-col px-3 py-2 text-left text-xs hover:bg-blue-50"
                        >
                          <span className="font-semibold text-slate-800">
                            {cust.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {cust.phone} {cust.label ? `· ${cust.label}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Kepada (nama perusahaan / perorangan) *
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Contoh: PT Maju Jaya atau Bapak Budi"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>u.p. (opsional)</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="Contoh: Bapak/Ibu Bagian Umum"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Alamat tujuan</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat perusahaan atau penerima..."
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* 2. Isi Surat */}
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-bold text-slate-900">2. Isi Surat</h2>

              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Tanggal surat</label>
                    <input
                      type="date"
                      value={letterDate}
                      onChange={(e) => setLetterDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Perihal</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Kalimat pembuka</label>
                  <textarea
                    rows={4}
                    value={opening}
                    onChange={(e) => setOpening(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* 3. Rincian Penawaran */}
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-bold text-slate-900">
                3. Rincian Penawaran
              </h2>

              <div className="mt-3 space-y-4">
                {items.map((item, index) => {
                  const lineTotal =
                    (Number(item.quantity) || 0) * (Number(item.price) || 0);

                  return (
                    <div
                      key={item.id}
                      className="relative rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                          {index + 1}
                        </span>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-rose-500 hover:text-rose-700"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className={labelClass}>
                            Uraian pekerjaan / barang *
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            placeholder="Contoh: Cuci AC Split 1 PK"
                            className={inputClass}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          <div>
                            <label className={labelClass}>Jumlah</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className={inputClass}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Satuan</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) =>
                                updateItem(item.id, "unit", e.target.value)
                              }
                              placeholder="unit"
                              className={inputClass}
                            />
                          </div>

                          <div className="col-span-1 sm:col-span-2">
                            <label className={labelClass}>
                              Harga satuan (Rp)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={item.price}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "price",
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>

                        <div className="text-right text-xs font-semibold text-slate-700">
                          Jumlah: {formatRupiah(lineTotal)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full rounded-md border border-dashed border-slate-300 bg-white py-2.5 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600"
                >
                  + Tambah baris
                </button>
              </div>
            </section>
          </div>

          {/* Sidebar Ringkasan (1 col) */}
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-bold text-slate-900">Ringkasan</h2>

              <div className="mt-3 space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formatRupiah(subtotal)}
                  </span>
                </div>

                <label className="flex cursor-pointer items-center gap-2 py-1 text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeTax}
                    onChange={(e) => setIncludeTax(e.target.checked)}
                    className="h-3.5 w-3.5 accent-blue-600"
                  />
                  <span>Tambah PPN 11%</span>
                </label>

                {includeTax && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>PPN 11%</span>
                    <span className="font-semibold text-slate-900">
                      {formatRupiah(tax)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-blue-700">{formatRupiah(total)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                <div>
                  <label className={labelClass}>Masa berlaku (hari)</label>
                  <input
                    type="number"
                    min="1"
                    value={validDays}
                    onChange={(e) =>
                      setValidDays(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Syarat & catatan</label>
                  <textarea
                    rows={3}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Penanda tangan</label>
                    <input
                      type="text"
                      value={signer}
                      onChange={(e) => setSigner(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Jabatan</label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  Tanda tangan & stempel diambil dari Pengaturan (nanti).
                </p>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-3 w-full rounded-md bg-blue-600 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Penawaran"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
