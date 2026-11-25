"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function OfferDetail() {
  const router = useRouter();

  // Data surat
  const [customer] = useState("Agung");
  const [letterNumber] = useState("002/SPH/XI/2026");
  const [letterDate] = useState("2026-11-25");

  const [company] = useState("Robocool");
  const [companyPhone] = useState("0853-9938-8803");
  const [recipient] = useState("u.p. asdasd");
  const [address] = useState("asdasd\ndi tempat");

  const [subject] = useState("Penawaran Harga Jasa Service AC");

  const [opening] = useState(
    "Bersama surat ini kami Robocool bermaksud mengajukan penawaran harga untuk pekerjaan perawatan / perbaikan AC dengan rincian sebagai berikut:",
  );

  const [items] = useState<OfferItem[]>([
    {
      id: 1,
      description: "Cuci AC split",
      quantity: 1,
      unit: "unit",
      price: 200000,
    },
  ]);

  const [includeTax] = useState(true);
  const [validDays] = useState(14);

  const [terms] = useState("asdasd");

  const [signer] = useState("Irfan");
  const [position] = useState("Pimpinan");

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items],
  );

  const tax = includeTax ? Math.round(subtotal * 0.11) : 0;
  const total = subtotal + tax;

  const expiredDate = new Date(
    new Date(`${letterDate}T00:00:00`).getTime() + validDays * 86400000,
  );

  const handleDownload = () => {
    window.print();
  };

  const handleEdit = () => {
    // Sesuaikan dengan route halaman edit surat Anda.
    router.push("/offer/edit");
  };

  const handleDuplicate = () => {
    // Sesuaikan dengan route pembuatan surat baru.
    router.push("/offer/new?duplicate=true");
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus surat penawaran ini?",
    );

    if (!confirmed) return;

    // Hubungkan ke API DELETE surat penawaran.
    console.log("Delete offer:", letterNumber);
  };

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-5 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-[1150px]">
        {/* HEADER */}
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-2 flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
            >
              <span>←</span>
              Kembali
            </button>

            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {customer}
            </h1>

            <p className="mt-1 text-[11px] text-slate-500">
              {letterNumber} · {formatDate(letterDate)}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>↓</span>
              Unduh PDF
            </button>

            <button
              onClick={handleEdit}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ubah
            </button>

            <button
              onClick={handleDuplicate}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Salin jadi baru
            </button>

            <button
              onClick={handleDelete}
              className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </header>

        {/* DOCUMENT PREVIEW */}
        <div className="flex justify-center">
          <article
            id="offer-document"
            className="offer-paper w-full max-w-[794px] min-h-[1123px] rounded-lg border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-[52px] sm:py-[48px]"
          >
            {/* COMPANY HEADER */}
            <div className="border-b-[3px] border-blue-600 pb-3">
              <h2 className="text-xl font-bold tracking-tight text-blue-700">
                {company}
              </h2>

              <p className="mt-1 text-[11px] text-slate-600">
                Telp/WA {companyPhone}
              </p>
            </div>

            {/* LETTER NUMBER & SUBJECT */}
            <div className="mt-4 flex justify-between gap-4 text-[11px]">
              <div className="space-y-1">
                <div className="flex gap-2">
                  <span className="w-[48px]">Nomor</span>
                  <span>:</span>
                  <span>{letterNumber}</span>
                </div>

                <div className="flex gap-2">
                  <span className="w-[48px]">Perihal</span>
                  <span>:</span>
                  <strong>{subject}</strong>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {formatDate(letterDate)}
              </div>
            </div>

            {/* RECIPIENT */}
            <section className="mt-6 text-[11px] leading-[1.8]">
              <p>Kepada Yth.</p>

              <p className="font-semibold text-slate-900">{customer}</p>

              {recipient && <p>{recipient}</p>}

              {address.split("\n").map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </section>

            {/* LETTER BODY */}
            <section className="mt-5 text-[11px] leading-[1.8]">
              <p>Dengan hormat,</p>

              <p className="mt-4 text-justify">{opening}</p>
            </section>

            {/* OFFER TABLE */}
            <div className="mt-4 w-full overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-sky-100 text-slate-800">
                    <th className="border border-slate-300 px-2 py-2 text-center">
                      NO
                    </th>

                    <th className="border border-slate-300 px-2 py-2 text-left">
                      URAIAN
                    </th>

                    <th className="border border-slate-300 px-2 py-2 text-center">
                      JUMLAH
                    </th>

                    <th className="border border-slate-300 px-2 py-2 text-right">
                      HARGA SATUAN
                    </th>

                    <th className="border border-slate-300 px-2 py-2 text-right">
                      TOTAL
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-slate-300 px-2 py-2 text-center">
                        {index + 1}
                      </td>

                      <td className="border border-slate-300 px-2 py-2">
                        {item.description}
                      </td>

                      <td className="border border-slate-300 px-2 py-2 text-center whitespace-nowrap">
                        {item.quantity} {item.unit}
                      </td>

                      <td className="border border-slate-300 px-2 py-2 text-right whitespace-nowrap">
                        {formatRupiah(item.price)}
                      </td>

                      <td className="border border-slate-300 px-2 py-2 text-right whitespace-nowrap">
                        {formatRupiah(item.quantity * item.price)}
                      </td>
                    </tr>
                  ))}

                  {/* SUBTOTAL */}
                  <tr>
                    <td
                      colSpan={4}
                      className="border border-slate-300 px-2 py-2 text-right"
                    >
                      Subtotal
                    </td>

                    <td className="border border-slate-300 px-2 py-2 text-right whitespace-nowrap">
                      {formatRupiah(subtotal)}
                    </td>
                  </tr>

                  {/* TAX */}
                  {includeTax && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-slate-300 px-2 py-2 text-right"
                      >
                        PPN 11%
                      </td>

                      <td className="border border-slate-300 px-2 py-2 text-right whitespace-nowrap">
                        {formatRupiah(tax)}
                      </td>
                    </tr>
                  )}

                  {/* TOTAL */}
                  <tr className="font-bold">
                    <td
                      colSpan={4}
                      className="border border-slate-300 px-2 py-2 text-right"
                    >
                      TOTAL
                    </td>

                    <td className="border border-slate-300 px-2 py-2 text-right whitespace-nowrap">
                      {formatRupiah(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TERMS */}
            <section className="mt-4 text-[11px] leading-[1.8]">
              <p className="font-bold">Syarat & ketentuan:</p>

              <div className="whitespace-pre-line">{terms}</div>

              <p className="mt-2">
                Penawaran ini berlaku {validDays} hari, sampai{" "}
                {expiredDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                .
              </p>

              <p className="mt-2 text-justify">
                Demikian surat penawaran ini kami sampaikan. Atas perhatian dan
                kerja samanya kami ucapkan terima kasih.
              </p>
            </section>

            {/* SIGNATURE */}
            <section className="mt-6 flex justify-end pr-5 text-center text-[11px]">
              <div className="flex min-h-[185px] w-[150px] flex-col items-center">
                <p>Hormat kami,</p>

                <p className="mt-1 font-medium">{company}</p>

                {/* Space for signature / stamp */}
                <div className="flex-1" />

                <div>
                  <p className="font-bold underline">{signer}</p>

                  <p>{position}</p>
                </div>
              </div>
            </section>
          </article>
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          #offer-document,
          #offer-document * {
            visibility: visible;
          }

          #offer-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 15mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }

          #offer-document table {
            width: 100% !important;
          }
        }

        @media screen and (max-width: 640px) {
          .offer-paper {
            padding: 24px 18px !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
