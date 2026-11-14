"use client";

import { useMemo, useState } from "react";

type ServiceItem = {
  service_id: string;
  unitId: string;
  brand: string;
  pk: string;
  unit_type: string;
  location: string;
  amount: number;
  price: number;
  warranty: string;
};

type SparepartItem = {
  information: string;
  amount: number;
  price: number;
  capital_price: number;
};

type OtherCostItem = {
  information: string;
  amount: number;
  price: number;
  capital_price: number;
};

type ProductItem = {
  name: string;
  amount: number;
  price: number;
  capital_price: number;
};

type UnitItem = {
  id: string;
  brand: string;
  pk: string;
  unit_type: string;
  location: string;
};

const inputClass =
  "w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-xs font-medium text-slate-600";

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

const buttonClass =
  "rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cardClass}>
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-xs text-blue-700">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function CreateOrderPage() {
  const [customerId, setCustomerId] = useState("");
  const [customerType, setCustomerType] = useState("Langganan");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [googleMaps, setGoogleMaps] = useState("");
  const [units, setUnits] = useState<UnitItem[]>([
    {
      id: "unit-1",
      brand: "Daikin",
      pk: "1",
      unit_type: "AC Split",
      location: "Ruang tamu",
    },
  ]);

  const [status, setStatus] = useState("pending");
  const [paymentType, setPaymentType] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [commissionMode, setCommissionMode] = useState("percentage");
  const [commission, setCommission] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [newUnitId, setNewUnitId] = useState<number | null>(null);

  const [services, setServices] = useState<ServiceItem[]>([
    {
      service_id: "",
      unitId: "",
      brand: "",
      pk: "",
      unit_type: "AC Split",
      location: "",
      amount: 1,
      price: 0,
      warranty: "",
    },
  ]);

  const [spareparts, setSpareparts] = useState<SparepartItem[]>([]);
  const [otherCost, setOtherCost] = useState<OtherCostItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const serviceTotal = services.reduce(
    (sum, item) => sum + item.amount * item.price,
    0,
  );

  const sparepartTotal = spareparts.reduce(
    (sum, item) => sum + item.amount * item.price,
    0,
  );

  const productTotal = products.reduce(
    (sum, item) => sum + item.amount * item.price,
    0,
  );

  const subtotal = serviceTotal + sparepartTotal + productTotal;

  const total = Math.max(0, subtotal - Number(discount || 0));

  const commissionAmount =
    commissionMode === "percentage"
      ? (total * Number(commission || 0)) / 100
      : Number(commission || 0);

  const updateService = (
    index: number,
    field: keyof ServiceItem,
    value: string | number,
  ) => {
    setServices((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const updateOtherCost = (
    index: number,
    field: keyof OtherCostItem,
    value: string | number,
  ) => {
    setOtherCost((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };
  const updateSparepart = (
    index: number,
    field: keyof SparepartItem,
    value: string | number,
  ) => {
    setSpareparts((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const updateProduct = (
    index: number,
    field: keyof ProductItem,
    value: string | number,
  ) => {
    setProducts((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const orderPreview = useMemo(
    () => ({
      customer: {
        id: customerId || null,
        name: customerName,
        phone,
        type: customerType,
        address,
        google_maps: googleMaps,
      },
      order: {
        status,
        payment_type: paymentType,
        payment_status: paymentStatus,
        commission_mode: commissionMode,
        commission: commissionAmount,
        discount,
        assign_to: assignTo || null,
      },
      services,
      spareparts,
      products,
      complaint_schedule: {
        date: scheduleDate,
        time: scheduleTime,
        complaint_schedule: complaint,
        notes,
      },
    }),
    [
      customerId,
      customerName,
      phone,
      customerType,
      address,
      googleMaps,
      status,
      paymentType,
      paymentStatus,
      commissionMode,
      commissionAmount,
      discount,
      assignTo,
      services,
      spareparts,
      products,
      scheduleDate,
      scheduleTime,
      complaint,
      notes,
    ],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!customerId && (!customerName.trim() || !phone.trim())) {
      alert("Isi nama dan nomor telepon pelanggan terlebih dahulu.");
      return;
    }

    setSubmitting(true);

    try {
      // Preview the complete form payload.
      // Connect this payload to a transactional order-creation API/RPC.
      console.log("Order payload:", orderPreview);

      alert(
        "Form sudah siap. Hubungkan handleSubmit ke API transaksi order untuk menyimpan seluruh data.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="mb-1 text-xs text-slate-500">Order / Buat baru</p>
          <h1 className="text-2xl font-bold tracking-tight">Order Baru</h1>
          <p className="mt-1 text-sm text-slate-500">
            Masukkan informasi pelanggan, jasa, produk, dan jadwal.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
        >
          <div className="space-y-5">
            {/* CUSTOMER */}
            <Section number="1" title="Pelanggan">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama pelanggan *">
                  <input
                    className={inputClass}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nama pelanggan"
                    required={!customerId}
                  />
                </Field>

                <Field label="No. WhatsApp *">
                  <input
                    className={inputClass}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    required={!customerId}
                  />
                </Field>
              </div>

              <div className="my-4 flex flex-wrap items-center gap-5">
                {["Langganan", "Invoice"].map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="customerType"
                      value={type}
                      checked={customerType === type}
                      onChange={(e) => setCustomerType(e.target.value)}
                      className="accent-blue-600"
                    />
                    {type}
                  </label>
                ))}
                <button
                  type="button"
                  className="ml-auto text-xs font-medium text-blue-600 hover:underline"
                  onClick={() => {
                    setCustomerId("");
                    setCustomerName("");
                    setPhone("");
                    setAddress("");
                    setGoogleMaps("");
                  }}
                >
                  Pelanggan baru
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Alamat pelanggan">
                  <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                    <input
                      className={inputClass}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Kecamatan / kota"
                    />
                    <input
                      className={inputClass}
                      value={googleMaps}
                      onChange={(e) => setGoogleMaps(e.target.value)}
                      placeholder="Link Google Maps (opsional)"
                    />
                  </div>
                </Field>
                <Field label="Alamat lengkap">
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, patokan..."
                  />
                </Field>
              </div>
            </Section>

            {/* SERVICES */}

            <Section number="2" title="Jasa">
              <div className="space-y-4">
                {services.map((item, index) => {
                  const selectedUnit = units.find(
                    (unit) => unit.id === item.unitId,
                  );

                  const isCreatingUnit = newUnitId === index;

                  return (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4"
                    >
                      {/* Card header */}
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Jasa
                        </span>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() =>
                              setServices((current) => [
                                ...current,
                                { ...item, unitId: "" },
                              ])
                            }
                          >
                            Duplikat
                          </button>

                          <button
                            type="button"
                            className="text-xs text-rose-600 hover:underline"
                            onClick={() => {
                              setServices((current) =>
                                current.filter((_, i) => i !== index),
                              );

                              setNewUnitId((current) =>
                                current === index
                                  ? null
                                  : current !== null && current > index
                                    ? current - 1
                                    : current,
                              );
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      {/* Main row */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)_minmax(0,1.5fr)]">
                        <Field label="Unit AC pelanggan">
                          <select
                            className={inputClass}
                            value={isCreatingUnit ? "__new__" : item.unitId}
                            onChange={(e) => {
                              const unitId = e.target.value;

                              if (unitId === "__new__") return;

                              const unit = units.find((u) => u.id === unitId);

                              setNewUnitId(null);

                              setServices((current) =>
                                current.map((service, i) =>
                                  i === index
                                    ? {
                                        ...service,
                                        unitId,
                                        brand: unit?.brand ?? "",
                                        pk: unit?.pk ?? "",
                                        unit_type:
                                          unit?.unit_type ?? "Split Wall",
                                        location: unit?.location ?? "",
                                      }
                                    : service,
                                ),
                              );
                            }}
                          >
                            <option value="">— Tanpa unit —</option>

                            {isCreatingUnit && (
                              <option value="__new__">+ Unit baru</option>
                            )}

                            {units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.brand || "Tanpa merek"}{" "}
                                {unit.pk ? `${unit.pk} PK` : ""} —{" "}
                                {unit.location || "Tanpa lokasi"}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <div className="flex items-end">
                          <button
                            type="button"
                            className="w-full whitespace-nowrap rounded-md border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 sm:w-auto"
                            onClick={() => {
                              const id = crypto.randomUUID();

                              setUnits((current) => [
                                ...current,
                                {
                                  id,
                                  brand: "",
                                  pk: "1",
                                  unit_type: "Split Wall",
                                  location: "",
                                },
                              ]);

                              setServices((current) =>
                                current.map((service, i) =>
                                  i === index
                                    ? {
                                        ...service,
                                        unitId: id,
                                        brand: "",
                                        pk: "1",
                                        unit_type: "Split Wall",
                                        location: "",
                                      }
                                    : service,
                                ),
                              );

                              setNewUnitId(index);
                            }}
                          >
                            + Unit
                          </button>
                        </div>

                        <Field label="Merek AC">
                          <input
                            className={inputClass}
                            value={selectedUnit?.brand ?? item.brand}
                            onChange={(e) => {
                              const value = e.target.value;

                              updateService(index, "brand", value);

                              if (item.unitId) {
                                setUnits((current) =>
                                  current.map((unit) =>
                                    unit.id === item.unitId
                                      ? { ...unit, brand: value }
                                      : unit,
                                  ),
                                );
                              }
                            }}
                            placeholder="Daikin, Sharp..."
                          />
                        </Field>

                        <Field label="Layanan">
                          <select
                            className={inputClass}
                            value={item.service_id}
                            onChange={(e) =>
                              updateService(index, "service_id", e.target.value)
                            }
                          >
                            <option value="">— Pilih layanan —</option>
                            <option value="service-1">Cuci AC</option>
                            <option value="service-2">Perbaikan AC</option>
                            <option value="service-3">Tambah Freon</option>
                            <option value="service-4">Pasang AC</option>
                          </select>
                        </Field>
                      </div>

                      {/* New unit editor */}
                      {item.unitId && isCreatingUnit && (
                        <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/70 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold text-blue-800">
                              Unit AC baru — tersimpan ke data pelanggan
                            </p>

                            <button
                              type="button"
                              className="text-xs text-rose-600 hover:underline"
                              onClick={() => {
                                const id = item.unitId;

                                setUnits((current) =>
                                  current.filter((unit) => unit.id !== id),
                                );

                                setServices((current) =>
                                  current.map((service, i) =>
                                    i === index
                                      ? {
                                          ...service,
                                          unitId: "",
                                          brand: "",
                                          pk: "",
                                          unit_type: "Split Wall",
                                          location: "",
                                        }
                                      : service,
                                  ),
                                );

                                setNewUnitId(null);
                              }}
                            >
                              Batal
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field label="Merek">
                              <input
                                className={inputClass}
                                value={selectedUnit?.brand ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  updateService(index, "brand", value);

                                  setUnits((current) =>
                                    current.map((unit) =>
                                      unit.id === item.unitId
                                        ? { ...unit, brand: value }
                                        : unit,
                                    ),
                                  );
                                }}
                                placeholder="Daikin"
                              />
                            </Field>

                            <Field label="PK">
                              <select
                                className={inputClass}
                                value={selectedUnit?.pk ?? item.pk}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  updateService(index, "pk", value);

                                  setUnits((current) =>
                                    current.map((unit) =>
                                      unit.id === item.unitId
                                        ? { ...unit, pk: value }
                                        : unit,
                                    ),
                                  );
                                }}
                              >
                                <option value="">Pilih PK</option>
                                <option value="0.5">0.5 PK</option>
                                <option value="0.75">0.75 PK</option>
                                <option value="1">1 PK</option>
                                <option value="1.5">1.5 PK</option>
                                <option value="2">2 PK</option>
                                <option value="2.5">2.5 PK</option>
                                <option value="3">3 PK</option>
                              </select>
                            </Field>

                            <Field label="Tipe">
                              <select
                                className={inputClass}
                                value={
                                  selectedUnit?.unit_type ?? item.unit_type
                                }
                                onChange={(e) => {
                                  const value = e.target.value;

                                  updateService(index, "unit_type", value);

                                  setUnits((current) =>
                                    current.map((unit) =>
                                      unit.id === item.unitId
                                        ? { ...unit, unit_type: value }
                                        : unit,
                                    ),
                                  );
                                }}
                              >
                                <option value="Split Wall">Split Wall</option>
                                <option value="AC Cassette">AC Cassette</option>
                                <option value="AC Standing">AC Standing</option>
                                <option value="AC Central">AC Central</option>
                                <option value="Lainnya">Lainnya</option>
                              </select>
                            </Field>

                            <Field label="Lokasi / ruangan">
                              <input
                                className={inputClass}
                                value={selectedUnit?.location ?? item.location}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  updateService(index, "location", value);

                                  setUnits((current) =>
                                    current.map((unit) =>
                                      unit.id === item.unitId
                                        ? { ...unit, location: value }
                                        : unit,
                                    ),
                                  );
                                }}
                                placeholder="Kamar utama"
                              />
                            </Field>
                          </div>
                        </div>
                      )}

                      {/* Price row */}
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <Field label="Jumlah">
                          <input
                            className={inputClass}
                            type="number"
                            min="1"
                            value={item.amount}
                            onChange={(e) =>
                              updateService(
                                index,
                                "amount",
                                Math.max(1, Number(e.target.value)),
                              )
                            }
                          />
                        </Field>

                        <Field label="Harga satuan">
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              updateService(
                                index,
                                "price",
                                Math.max(0, Number(e.target.value)),
                              )
                            }
                          />
                        </Field>

                        <Field label="Garansi (hari)">
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            value={item.warranty}
                            onChange={(e) =>
                              updateService(index, "warranty", e.target.value)
                            }
                          />
                        </Field>

                        <div className="flex flex-col items-end justify-center">
                          <span className="text-xs text-slate-500">
                            Subtotal
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {money(item.amount * item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    setServices((current) => [
                      ...current,
                      {
                        service_id: "",
                        brand: "",
                        pk: "",
                        unitId: "",
                        unit_type: "Split Wall",
                        location: "",
                        amount: 1,
                        price: 0,
                        warranty: "",
                      },
                    ])
                  }
                >
                  + Tambah jasa
                </button>
              </div>

              {/* Sparepart */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Sparepart</h3>
                  <span className="text-xs text-slate-500">
                    {spareparts.length} item
                  </span>
                </div>

                <div className="space-y-3">
                  {spareparts.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-amber-200 bg-amber-50/40 p-3"
                    >
                      <div className="mb-3 flex justify-between">
                        <span className="text-xs font-semibold text-amber-800">
                          Sparepart {index + 1}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-rose-600 hover:underline"
                          onClick={() =>
                            setSpareparts((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                        >
                          Hapus
                        </button>
                      </div>

                      <Field label="Nama / informasi sparepart">
                        <input
                          className={inputClass}
                          value={item.information}
                          onChange={(e) =>
                            updateSparepart(
                              index,
                              "information",
                              e.target.value,
                            )
                          }
                          placeholder="Contoh: Pipa tembaga 1/4"
                        />
                      </Field>

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Field label="Jumlah">
                          <input
                            className={inputClass}
                            type="number"
                            min="1"
                            value={item.amount}
                            onChange={(e) =>
                              updateSparepart(
                                index,
                                "amount",
                                Math.max(1, Number(e.target.value)),
                              )
                            }
                          />
                        </Field>

                        <Field label="Harga jual (Rp)">
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              updateSparepart(
                                index,
                                "price",
                                Math.max(0, Number(e.target.value)),
                              )
                            }
                          />
                        </Field>

                        <Field label="Harga modal (Rp)">
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            value={item.capital_price}
                            onChange={(e) =>
                              updateSparepart(
                                index,
                                "capital_price",
                                Math.max(0, Number(e.target.value)),
                              )
                            }
                          />
                        </Field>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() =>
                      setSpareparts((current) => [
                        ...current,
                        {
                          information: "",
                          amount: 1,
                          price: 0,
                          capital_price: 0,
                          warranty: "",
                        },
                      ])
                    }
                  >
                    + Tambah sparepart
                  </button>
                </div>
              </div>

              {/* Biaya lain */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Biaya Lain</h3>
                  <span className="text-xs text-slate-500">
                    {otherCost.length} item
                  </span>
                </div>

                <div className="space-y-3">
                  {otherCost.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-amber-200 bg-amber-50/40 p-3"
                    >
                      <div className="mb-3 flex justify-between">
                        <span className="text-xs font-semibold text-amber-800">
                          Biaya Lain {index + 1}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-rose-600 hover:underline"
                          onClick={() =>
                            setOtherCost((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                        >
                          Hapus
                        </button>
                      </div>

                      <Field label="Nama / informasi biaya">
                        <input
                          className={inputClass}
                          value={item.information}
                          onChange={(e) =>
                            updateOtherCost(
                              index,
                              "information",
                              e.target.value,
                            )
                          }
                          placeholder="Contoh: Biaya transportasi"
                        />
                      </Field>

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <Field label="Jumlah">
                          <input
                            className={inputClass}
                            type="number"
                            min="1"
                            value={item.amount}
                            onChange={(e) =>
                              updateOtherCost(
                                index,
                                "amount",
                                Math.max(1, Number(e.target.value)),
                              )
                            }
                          />
                        </Field>

                        <Field label="Harga jual (Rp)">
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              updateOtherCost(
                                index,
                                "price",
                                Math.max(0, Number(e.target.value)),
                              )
                            }
                          />
                        </Field>

                        <Field label="Harga modal (Rp)">
                          <input
                            className={inputClass}
                            type="number"
                            min="0"
                            value={item.capital_price}
                            onChange={(e) =>
                              updateOtherCost(
                                index,
                                "capital_price",
                                Math.max(0, Number(e.target.value)),
                              )
                            }
                          />
                        </Field>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() =>
                      setOtherCost((current) => [
                        ...current,
                        {
                          information: "",
                          amount: 1,
                          price: 0,
                          capital_price: 0,
                        },
                      ])
                    }
                  >
                    + Tambah Biaya Lain
                  </button>
                </div>
              </div>
            </Section>

            {/* PRODUCTS */}
            <Section number="3" title="Produk">
              <div className="space-y-3">
                {products.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-800">
                        Produk {index + 1}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-rose-600"
                        onClick={() =>
                          setProducts((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        Hapus
                      </button>
                    </div>
                    <Field label="Nama produk">
                      <input
                        className={inputClass}
                        value={item.name}
                        onChange={(e) =>
                          updateProduct(index, "name", e.target.value)
                        }
                        placeholder="Nama produk"
                      />
                    </Field>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <Field label="Jumlah">
                        <input
                          className={inputClass}
                          type="number"
                          min="1"
                          value={item.amount}
                          onChange={(e) =>
                            updateProduct(
                              index,
                              "amount",
                              Math.max(1, Number(e.target.value)),
                            )
                          }
                        />
                      </Field>
                      <Field label="Harga jual (Rp)">
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            updateProduct(
                              index,
                              "price",
                              Math.max(0, Number(e.target.value)),
                            )
                          }
                        />
                      </Field>
                      <Field label="Harga modal (Rp)">
                        <input
                          className={inputClass}
                          type="number"
                          min="0"
                          value={item.capital_price}
                          onChange={(e) =>
                            updateProduct(
                              index,
                              "capital_price",
                              Math.max(0, Number(e.target.value)),
                            )
                          }
                        />
                      </Field>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    setProducts((current) => [
                      ...current,
                      {
                        name: "",
                        amount: 1,
                        price: 0,
                        capital_price: 0,
                      },
                    ])
                  }
                >
                  + Tambah produk
                </button>
              </div>
            </Section>

            {/* COMPLAINT AND SCHEDULE */}
            <Section number="4" title="Jadwal & Keluhan">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal">
                  <input
                    className={inputClass}
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </Field>
                <Field label="Jam">
                  <input
                    className={inputClass}
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </Field>
              </div>
              <div className="mt-4 space-y-4">
                <Field label="Keluhan pelanggan">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Ceritakan keluhan atau kebutuhan pelanggan..."
                  />
                </Field>
                <Field label="Catatan internal">
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan tambahan untuk teknisi atau admin..."
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-5 lg:sticky lg:top-5">
            <Section number="5" title="Pengaturan">
              <div className="space-y-4">
                <Field label="Status order">
                  <select
                    className={inputClass}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="new">Baru</option>
                    <option value="in_progress">Dalam proses</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </Field>
                <Field label="Tipe pembayaran">
                  <select
                    className={inputClass}
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                  >
                    <option value="cash">Tunai</option>
                    <option value="transfer">Transfer</option>
                    <option value="qris">QRIS</option>
                    <option value="debt">Belum dibayar / tempo</option>
                  </select>
                </Field>
                <Field label="Status pembayaran">
                  <select
                    className={inputClass}
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <option value="unpaid">Belum dibayar</option>
                    <option value="partial">Dibayar sebagian</option>
                    <option value="paid">Lunas</option>
                  </select>
                </Field>
                <Field label="Ditugaskan kepada (user ID)">
                  <input
                    className={inputClass}
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    placeholder="ID user / teknisi"
                  />
                </Field>
              </div>
            </Section>

            <section className={cardClass}>
              <h2 className="mb-4 text-sm font-semibold">Ringkasan</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Jasa</span>
                  <span className="font-medium">{money(serviceTotal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Sparepart</span>
                  <span className="font-medium">{money(sparepartTotal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Produk</span>
                  <span className="font-medium">{money(productTotal)}</span>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <Field label="Diskon (Rp)">
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) =>
                        setDiscount(Math.max(0, Number(e.target.value)))
                      }
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-blue-700">
                    {money(total)}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <Field label="Mode komisi">
                  <select
                    className={inputClass}
                    value={commissionMode}
                    onChange={(e) => setCommissionMode(e.target.value)}
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal tetap (Rp)</option>
                  </select>
                </Field>
                <div className="mt-3">
                  <Field
                    label={
                      commissionMode === "percentage"
                        ? "Komisi (%)"
                        : "Komisi (Rp)"
                    }
                  >
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={commission}
                      onChange={(e) =>
                        setCommission(Math.max(0, Number(e.target.value)))
                      }
                    />
                  </Field>
                </div>
                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-slate-500">Nilai komisi</span>
                  <strong>{money(commissionAmount)}</strong>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Memproses..." : "Simpan Order"}
              </button>
              <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
                Pastikan data pelanggan dan item order sudah benar.
              </p>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}
