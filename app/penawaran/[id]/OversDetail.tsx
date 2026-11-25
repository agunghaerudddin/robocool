"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOffer } from "@/app/fetch/get/fetch";
import { deleteOffer } from "@/app/fetch/update/fetch";

type OfferItem = {
  id: number | string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  amount: number;
};

type OfferDetailData = {
  id: number | string;
  number: string;
  customer_id?: string | null;
  company: string;
  recipient?: string | null;
  address?: string | null;
  letter_date: string;
  subject: string;
  opening?: string | null;
  subtotal: number;
  include_tax: boolean;
  tax: number;
  total: number;
  valid_days: number;
  terms?: string | null;
  signer?: string | null;
  position?: string | null;
  status?: string;
  items?: OfferItem[];
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
    month: "long",
    year: "numeric",
  });
};

export default function OfferDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [offer, setOffer] = useState<OfferDetailData | null>(null);

  useEffect(() => {
    if (id) {
      fetchOfferDetail(id);
    }
  }, [id]);

  const fetchOfferDetail = async (offerId: string) => {
    try {
      setLoading(true);
      const res = await getOffer(offerId);
      if (res?.data?.data) {
        setOffer(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load offer detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const items = offer?.items || [];
  const subtotal = Number(offer?.subtotal) || 0;
  const tax = Number(offer?.tax) || 0;
  const total = Number(offer?.total) || 0;
  const validDays = Number(offer?.valid_days) || 14;

  const expiredDate = useMemo(() => {
    if (!offer?.letter_date) return "-";
    const d = new Date(offer.letter_date);
    if (isNaN(d.getTime())) return "-";
    d.setDate(d.getDate() + validDays);
    return formatDate(d.toISOString());
  }, [offer?.letter_date, validDays]);

  const handleDownload = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!offer?.id) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus surat penawaran ${offer.number}?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteOffer(offer.id);
      alert("Surat penawaran berhasil dihapus.");
      router.push("/penawaran");
    } catch (err) {
      console.error("Delete offer error:", err);
      alert("Gagal menghapus surat penawaran.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] p-6 text-slate-800">
        <div className="mx-auto max-w-4xl text-center text-sm text-slate-500">
          Memuat rincian surat penawaran...
        </div>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] p-6 text-slate-800">
        <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Surat penawaran tidak ditemukan.
          </p>
          <button
            type="button"
            onClick={() => router.push("/penawaran")}
            className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            ← Kembali ke Daftar Penawaran
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Action bar (Hidden on print) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => router.push("/penawaran")}
            className="text-xs text-slate-500 hover:text-blue-600"
          >
            ← Kembali ke Daftar
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
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
              Cetak / PDF
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              {deleting ? "Menghapus..." : "Hapus Surat"}
            </button>
          </div>
        </div>

        {/* Paper Document Preview */}
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 print:border-none print:p-0 print:shadow-none">
          {/* Header Kop Surat */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-blue-700">
                  ROBOCOOL
                </h1>
                <p className="text-xs font-medium text-slate-600">
                  Spesialis Service, Perawatan & Pengadaan AC
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Telp / WhatsApp: 0853-9938-8803
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block rounded bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase text-blue-700">
                  Surat Penawaran
                </span>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  {offer.number}
                </p>
                <p className="text-[11px] text-slate-500">
                  Tanggal: {formatDate(offer.letter_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Recipient info */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-slate-500">Kepada Yth:</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {offer.company}
              </p>
              {offer.recipient && (
                <p className="text-slate-600">u.p. {offer.recipient}</p>
              )}
              {offer.address && (
                <p className="mt-1 whitespace-pre-line text-slate-500">
                  {offer.address}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-500">Perihal:</p>
              <p className="mt-0.5 font-bold text-slate-900">{offer.subject}</p>
              <p className="mt-2 text-[11px] text-slate-500">
                Berlaku s/d:{" "}
                <span className="font-semibold text-slate-700">
                  {expiredDate}
                </span>{" "}
                ({offer.valid_days} hari)
              </p>
            </div>
          </div>

          {/* Opening text */}
          {offer.opening && (
            <div className="mt-6 text-xs leading-relaxed text-slate-700">
              <p className="whitespace-pre-line">{offer.opening}</p>
            </div>
          )}

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
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2.5 text-center text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">
                        {item.description}
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
                        {formatRupiah(
                          Number(item.amount) ||
                            (Number(item.quantity) || 0) * (Number(item.price) || 0)
                        )}
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
                  {formatRupiah(subtotal)}
                </span>
              </div>

              {offer.include_tax && (
                <div className="flex justify-between text-slate-600">
                  <span>PPN 11%</span>
                  <span className="font-medium text-slate-800">
                    {formatRupiah(tax)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-blue-700">
                <span>Total Akhir</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          {offer.terms && (
            <div className="mt-8 rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Syarat & Ketentuan:</p>
              <p className="mt-1 whitespace-pre-line leading-relaxed">
                {offer.terms}
              </p>
            </div>
          )}

          {/* Signature */}
          <div className="mt-10 flex justify-end text-xs">
            <div className="text-center">
              <p className="text-slate-500">Hormat kami,</p>
              <p className="font-bold text-slate-800">Robocool</p>

              <div className="my-12 h-8" />

              <p className="font-bold underline text-slate-900">
                {offer.signer || "Irfan"}
              </p>
              <p className="text-slate-500">{offer.position || "Pimpinan"}</p>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
