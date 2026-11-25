"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Offer = {
  id: number;
  number: string;
  date: string;
  recipient: string;
  subject: string;
  total: number;
};

const initialOffers: Offer[] = [
  {
    id: 1,
    number: "001/SPH/XI/2026",
    date: "25 Nov 2026",
    recipient: "Agung",
    subject: "Penawaran Harga Jasa Service AC",
    total: 166500,
  },
];

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, " ");

export default function OffersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [offers] = useState<Offer[]>(initialOffers);

  const filteredOffers = offers.filter((offer) =>
    [offer.number, offer.date, offer.recipient, offer.subject].some((value) =>
      value.toLowerCase().includes(search.toLowerCase()),
    ),
  );

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
              {offers.length} surat tersimpan
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/offers/create")}
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
            placeholder="Cari nomor, tujuan, atau perihal..."
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
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((offer) => (
                    <tr key={offer.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-blue-700">
                        {offer.number}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                        {offer.date}
                      </td>

                      <td className="px-3 py-3">{offer.recipient}</td>

                      <td className="px-3 py-3 text-slate-600">
                        {offer.subject}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium">
                        {formatRupiah(offer.total)}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            window.alert(
                              `Fitur PDF untuk ${offer.number} belum dihubungkan.`,
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M8 13h8" />
                            <path d="M8 17h5" />
                          </svg>
                          PDF
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
                      Tidak ada surat penawaran yang ditemukan.
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
