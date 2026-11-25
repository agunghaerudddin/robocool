"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOffers } from "@/app/fetch/get/fetch";

type Offer = {
  id: number | string;
  number: string;
  letter_date: string;
  company: string;
  recipient?: string | null;
  subject: string;
  total: number;
  status?: string;
  customer?: {
    name: string;
    phone: string;
  } | null;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, " ");

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function OffersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffersList();
  }, []);

  const fetchOffersList = async () => {
    try {
      setLoading(true);
      const res = await getOffers();
      if (res?.data && Array.isArray(res.data)) {
        setOffers(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch offers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const q = search.toLowerCase();
    const num = (offer.number || "").toLowerCase();
    const comp = (offer.company || "").toLowerCase();
    const subj = (offer.subject || "").toLowerCase();
    const recip = (offer.recipient || "").toLowerCase();
    const cust = (offer.customer?.name || "").toLowerCase();
    return (
      num.includes(q) ||
      comp.includes(q) ||
      subj.includes(q) ||
      recip.includes(q) ||
      cust.includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-5 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Surat Penawaran
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {offers.length} surat tersimpan di database
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/penawaran/create")}
            className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            + Buat Penawaran
          </button>
        </header>

        {/* Search */}
        <form
          onSubmit={(event) => event.preventDefault()}
          className="mt-4 flex max-w-md items-center gap-2"
        >
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nomor, perusahaan, penerima, perihal..."
            className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-xs outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="submit"
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium transition hover:bg-slate-50"
          >
            Cari
          </button>
        </form>

        {/* Offers Table */}
        <section className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Nomor</th>
                  <th className="px-3 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Kepada</th>
                  <th className="px-3 py-3 font-medium">Perihal</th>
                  <th className="px-3 py-3 text-right font-medium">Total</th>
                  <th className="px-3 py-3 text-center font-medium">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-xs text-slate-400"
                    >
                      Memuat data surat penawaran...
                    </td>
                  </tr>
                ) : filteredOffers.length > 0 ? (
                  filteredOffers.map((offer) => (
                    <tr
                      key={offer.id}
                      onClick={() => router.push(`/penawaran/${offer.id}`)}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-blue-700">
                        {offer.number}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                        {formatDate(offer.letter_date)}
                      </td>

                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-800">
                          {offer.company}
                        </span>
                        {offer.recipient && (
                          <span className="block text-[11px] text-slate-400">
                            u.p. {offer.recipient}
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 text-slate-600">
                        {offer.subject}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-900">
                        {formatRupiah(Number(offer.total) || 0)}
                      </td>

                      <td
                        className="px-3 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => router.push(`/penawaran/${offer.id}`)}
                          className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Detail / Cetak
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-slate-500"
                    >
                      Belum ada surat penawaran. Klik tombol{" "}
                      <span className="font-semibold text-blue-600">
                        + Buat Penawaran
                      </span>{" "}
                      untuk menambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
