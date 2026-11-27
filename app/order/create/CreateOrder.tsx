"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Section from "@/app/component/Section";
import Field from "@/app/component/Field";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import {
  getCustomers,
  getServices,
  getUnits,
  getUsers,
} from "@/app/fetch/get/fetch";
import {
  createCustomer,
  createOrder,
  createServiceOrder,
  createUnit,
  createSparepartOrder,
  createOtherCostsOrder,
  createProductOrder,
  createComplaintSchedule,
  createAssignment,
  createCommission,
} from "@/app/fetch/add/fetch";

export type CustomerOption = {
  id: string;
  name: string;
  phone: string;
  google_maps?: string | null;
  label?: string | null;
  type?: string | null;
};

export type ServiceOption = {
  id: string;
  name: string;
  price: number;
  warranty?: string | null;
  estimate?: string | null;
};

export type TechnicianOption = {
  id: string;
  name: string;
  email?: string;
  role?: number;
};

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
  costumer_id?: string | null;
};

const inputClass =
  "w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

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

export default function CreateOrderPage() {
  const [userId, setUserId] = useState<string | null>(null);

  // Data lists from API
  const [customerList, setCustomerList] = useState<CustomerOption[]>([]);
  const [serviceList, setServiceList] = useState<ServiceOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);

  // Customer State
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [googleMaps, setGoogleMaps] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [customerCategory, setCustomerCategory] = useState<
    "Perorangan" | "Perusahaan"
  >("Perorangan");
  const [addressLabel, setAddressLabel] = useState("Rumah");

  // Units
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [newUnitId, setNewUnitId] = useState<number | null>(null);

  // Order Settings (Defaults)
  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState<string>("unpaid");
  const [cashHolderId, setCashHolderId] = useState<string>("");

  // Services, Spareparts, Other Costs, Products
  const [services, setServices] = useState<ServiceItem[]>([
    {
      service_id: "",
      unitId: "",
      brand: "",
      pk: "",
      unit_type: "Split Wall",
      location: "",
      amount: 1,
      price: 0,
      warranty: "",
    },
  ]);
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([]);
  const [otherCost, setOtherCost] = useState<OtherCostItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Schedule & Notes
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [complaint, setComplaint] = useState("");
  const [notes, setNotes] = useState("");

  // Assign Technician
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  // Mitra Commission Percentages (technicianId -> percentage, default 30)
  const [mitraCommissions, setMitraCommissions] = useState<Record<string, number>>({});

  // UI state
  const [submitting, setSubmitting] = useState(false);

  // Totals
  const serviceTotal = services.reduce(
    (sum, item) => sum + item.amount * item.price,
    0,
  );

  const sparepartTotal = spareparts.reduce(
    (sum, item) => sum + item.amount * item.price,
    0,
  );

  const otherCostTotal = otherCost.reduce(
    (sum, item) => sum + item.amount * item.price,
    0,
  );

  const productTotal = products.reduce(
    (sum, item) => sum + item.amount * item.price,
    0,
  );

  const subtotal =
    serviceTotal + sparepartTotal + otherCostTotal + productTotal;
  const total = Math.max(0, subtotal - Number(discount || 0));

  // Helper updaters
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

  // Auth fetch
  useEffect(() => {
    const getLoggedInUser = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        console.error("User not logged in:", error);
        return;
      }

      setUserId(data.user.id);
    };

    getLoggedInUser();
  }, []);

  // Fetch initial general data
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchAllData = async () => {
      try {
        const [customersRes, servicesRes, unitsRes, usersRes] =
          await Promise.allSettled([
            getCustomers(),
            getServices(),
            getUnits(),
            getUsers(),
          ]);

        if (customersRes.status === "fulfilled" && customersRes.value?.data) {
          setCustomerList(customersRes.value.data);
        }

        if (servicesRes.status === "fulfilled" && servicesRes.value?.data) {
          setServiceList(servicesRes.value.data);
        }

        if (unitsRes.status === "fulfilled" && unitsRes.value?.data) {
          const rawUnits = unitsRes.value.data;
          setUnits(
            rawUnits.map((u: any, idx: number) => ({
              id: u.id || `unit-${idx + 1}`,
              brand: u.brand || "",
              pk: u.pk ? String(u.pk) : "",
              unit_type: u.type || "Split Wall",
              location: u.location || "",
              costumer_id:
                u.costumer_id || u.service_orders?.orders?.customer_id || null,
            })),
          );
        }

        if (usersRes.status === "fulfilled" && usersRes.value?.data) {
          setTechnicians(usersRes.value.data);
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    };

    fetchAllData();
  }, []);

  // Re-fetch customer-specific units when customer is selected
  useEffect(() => {
    if (!customerId) return;

    const fetchCustomerUnits = async () => {
      try {
        const res = await getUnits(customerId);
        if (res?.data && Array.isArray(res.data)) {
          const fetched: UnitItem[] = res.data.map((u: any, idx: number) => ({
            id: u.id || `unit-${idx + 1}`,
            brand: u.brand || "",
            pk: u.pk ? String(u.pk) : "",
            unit_type: u.type || "Split Wall",
            location: u.location || "",
            costumer_id: customerId,
          }));

          // Merge without duplicates
          setUnits((prev) => {
            const existingIds = new Set(fetched.map((u) => u.id));
            const remaining = prev.filter((u) => !existingIds.has(u.id));
            return [...fetched, ...remaining];
          });
        }
      } catch (err) {
        console.error("Failed to load customer units:", err);
      }
    };

    fetchCustomerUnits();
  }, [customerId]);

  // Filtered customer suggestions
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const query = customerSearch.toLowerCase();
    return customerList.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)),
    );
  }, [customerSearch, customerList]);

  // Filter units for dropdown: customer-specific units first, then others
  const availableUnitsForCustomer = useMemo(() => {
    if (!customerId) return units;
    const customerSpecific = units.filter((u) => u.costumer_id === customerId);
    if (customerSpecific.length > 0) return customerSpecific;
    return units;
  }, [customerId, units]);

  // Handle customer selection
  const selectCustomer = (cust: CustomerOption) => {
    setCustomerId(cust.id);
    setCustomerName(cust.name);
    setPhone(cust.phone || "");
    setGoogleMaps(cust.google_maps || "");
    setAddress(cust.label || "");
    setCustomerSearch(cust.name);
  };

  // Submit flow
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!userId) {
      alert("Sesi login tidak ditemukan. Silakan login terlebih dahulu.");
      return;
    }

    if (!customerId && (!customerName.trim() || !phone.trim())) {
      alert("Isi nama dan nomor telepon pelanggan terlebih dahulu.");
      return;
    }

    setSubmitting(true);

    try {
      let finalCustomerId = customerId;

      // 1. Create Customer if new
      if (!finalCustomerId) {
        const customerRes = await createCustomer({
          name: customerName.trim(),
          phone: phone.trim(),
          google_maps: googleMaps.trim() || null,
          label: address.trim() || addressLabel.trim() || null,
          type: customerCategory,
        });

        if (!customerRes?.data?.customer?.id) {
          throw new Error("Gagal membuat pelanggan baru.");
        }
        finalCustomerId = customerRes.data.customer.id;
      }

      // 2. Create Order
      const primaryAssignee =
        selectedTechnicians.length > 0 ? selectedTechnicians[0] : null;

      const isCash = paymentType === "cash";
      const finalPaidTo = isCash ? (cashHolderId || primaryAssignee || userId) : null;
      const finalPaymentStatus = isCash ? "paid" : "unpaid";
      const finalPaymentType = isCash ? "cash" : (paymentType === "transfer" ? "transfer" : null);

      const orderRes = await createOrder({
        user_id: userId,
        customer: { customer_id: finalCustomerId },
        order: {
          commission_mode: "percentage",
          status: "pending",
          payment_type: finalPaymentType,
          payment_status: finalPaymentStatus,
          assign_to: primaryAssignee,
          paid_to: finalPaidTo,
        },
      });

      const createdOrder = orderRes?.data?.order;
      if (!createdOrder?.id) {
        throw new Error(
          orderRes?.data?.error || "Gagal membuat pesanan (Order).",
        );
      }

      const orderId = createdOrder.id;

      // 3. Create Service Orders and associated Units
      for (const srv of services) {
        if (!srv.service_id) continue;

        const srvRes = await createServiceOrder({
          order_id: orderId,
          services_id: srv.service_id,
          amount: Number(srv.amount) || 1,
          price: Number(srv.price) || 0,
          warranty: srv.warranty || null,
        });

        const createdServiceOrderId = srvRes?.data?.service_order?.id;

        // If unit info is filled or a new unit is being added, save to units table
        if (srv.brand || srv.unit_type || srv.location || srv.pk) {
          const isExisting =
            srv.unitId &&
            !srv.unitId.startsWith("temp-") &&
            units.some((u) => u.id === srv.unitId && u.costumer_id);

          // If it's a new or modified unit, save it to the database with customer_id & service_order_id
          if (
            !isExisting ||
            srv.unitId.startsWith("temp-") ||
            newUnitId !== null
          ) {
            await createUnit({
              brand: srv.brand || "AC",
              type: srv.unit_type || "Split Wall",
              pk: srv.pk ? Number(srv.pk) || srv.pk : null,
              location: srv.location || null,
              service_order_id: createdServiceOrderId || null,
              costumer_id: finalCustomerId,
              customer_id: finalCustomerId,
            });
          }
        }
      }

      // 4. Create Sparepart Orders
      for (const sp of spareparts) {
        if (!sp.information.trim()) continue;
        await createSparepartOrder({
          order_id: orderId,
          information: sp.information,
          amount: Number(sp.amount) || 1,
          price: Number(sp.price) || 0,
          capital_price: Number(sp.capital_price) || 0,
        });
      }

      // 5. Create Other Cost Orders
      for (const oc of otherCost) {
        if (!oc.information.trim()) continue;
        await createOtherCostsOrder({
          order_id: orderId,
          information: oc.information,
          amount: Number(oc.amount) || 1,
          price: Number(oc.price) || 0,
          capital_price: Number(oc.capital_price) || 0,
        });
      }

      // 6. Create Product Orders
      for (const pr of products) {
        if (!pr.name.trim()) continue;
        await createProductOrder({
          order_id: orderId,
          name: pr.name,
          amount: Number(pr.amount) || 1,
          price: Number(pr.price) || 0,
          capital_price: Number(pr.capital_price) || 0,
        });
      }

      // 7. Create Complaint Schedule if provided
      if (scheduleDate && scheduleTime && complaint.trim()) {
        await createComplaintSchedule({
          order_id: orderId,
          date: scheduleDate,
          time: scheduleTime,
          complaint_schedule: complaint,
          notes: notes || null,
        });
      }

      // 8. Create Assignments for all selected technicians
      for (const techId of selectedTechnicians) {
        await createAssignment({
          order_id: orderId,
          assigned_to: techId,
          status: "assigned",
        });

        // 9. Assign commission if the technician is a Mitra (Role 4)
        const techObj = technicians.find((t) => t.id === techId);
        if (techObj && techObj.role === 4) {
          const rate = mitraCommissions[techId] !== undefined ? mitraCommissions[techId] : 30;
          const calculatedCommission = Math.round((total * rate) / 100);

          await createCommission({
            user_id: techId,
            order_id: orderId,
            base_amount: total,
            rate_applied: rate,
            commission_amount: calculatedCommission,
            status: "unpaid",
            notes: `Komisi Pelaksana Order ${createdOrder.id}`,
          });
        }
      }

      alert("Order berhasil dibuat!");
      window.location.href = "/order";
    } catch (error: any) {
      console.error("Gagal membuat pesanan:", error);
      alert(
        error?.response?.data?.error ||
          error?.message ||
          "Terjadi kesalahan saat membuat pesanan.",
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
            {/* 1. PELANGGAN */}
            <Section number="1" title="Pelanggan">
              {!showNewCustomer ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Field label="Cari Pelanggan Terdaftar">
                      <input
                        className={inputClass + " w-full"}
                        placeholder="Ketik nama atau no. WA pelanggan..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          if (customerId) setCustomerId("");
                        }}
                      />
                    </Field>

                    {customerSearch &&
                      filteredCustomers.length > 0 &&
                      !customerId && (
                        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                          {filteredCustomers.map((cust) => (
                            <div
                              key={cust.id}
                              className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs hover:bg-blue-50"
                              onClick={() => selectCustomer(cust)}
                            >
                              <span className="font-semibold text-slate-800">
                                {cust.name}
                              </span>
                              <span className="text-slate-500">
                                {cust.phone}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  {customerId && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-slate-700">
                      <p className="font-semibold text-blue-900">
                        Pelanggan Terpilih: {customerName} ({phone})
                      </p>
                      {address && (
                        <p className="mt-1 text-slate-600">Alamat: {address}</p>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCustomer(true);
                      setCustomerId("");
                      setCustomerName("");
                      setPhone("");
                      setAddress("");
                      setGoogleMaps("");
                      setCustomerSearch("");
                    }}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    + Pelanggan baru
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nama pelanggan">
                      <input
                        className={inputClass}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nama pelanggan"
                        required
                      />
                    </Field>

                    <Field label="No. WhatsApp">
                      <input
                        className={inputClass}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0812..."
                        required
                      />
                    </Field>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {["Perorangan", "Perusahaan"].map((type) => (
                      <label
                        key={type}
                        className="flex cursor-pointer items-center gap-1.5"
                      >
                        <input
                          type="radio"
                          name="customerCategory"
                          value={type}
                          checked={customerCategory === type}
                          onChange={(e) =>
                            setCustomerCategory(
                              e.target.value as "Perorangan" | "Perusahaan",
                            )
                          }
                          className="accent-blue-600"
                        />
                        {type}
                      </label>
                    ))}

                    <button
                      type="button"
                      className="ml-auto text-xs text-slate-500 hover:text-slate-800"
                      onClick={() => {
                        setShowNewCustomer(false);
                        setCustomerId("");
                        setCustomerName("");
                        setPhone("");
                        setAddress("");
                        setGoogleMaps("");
                      }}
                    >
                      Batal
                    </button>
                  </div>

                  <Field label="Alamat kunjungan">
                    <div className="space-y-2 rounded-lg bg-slate-50 p-2">
                      <div className="grid gap-2 sm:grid-cols-[165px_1fr]">
                        <input
                          className={inputClass}
                          value={addressLabel}
                          onChange={(e) => setAddressLabel(e.target.value)}
                          placeholder="Rumah"
                        />

                        <input
                          className={inputClass}
                          type="url"
                          value={googleMaps}
                          onChange={(e) => setGoogleMaps(e.target.value)}
                          placeholder="Link Google Maps (opsional)"
                        />
                      </div>

                      <textarea
                        className={inputClass + " min-h-[76px] resize-y"}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Alamat lengkap"
                      />
                    </div>
                  </Field>
                </div>
              )}
            </Section>

            {/* 2. JASA */}
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
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Jasa {index + 1}
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

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.4fr)_minmax(0,1.5fr)]">
                        <Field label="Unit AC Pelanggan">
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
                            {availableUnitsForCustomer.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.brand || "Tanpa merek"}{" "}
                                {unit.pk ? `${unit.pk} PK` : ""} —{" "}
                                {unit.location || unit.unit_type || "Lokasi"}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <div className="flex items-end">
                          <button
                            type="button"
                            className="w-full whitespace-nowrap rounded-md border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50 sm:w-auto"
                            onClick={() => {
                              const id = `temp-unit-${Date.now()}`;
                              setUnits((current) => [
                                ...current,
                                {
                                  id,
                                  brand: "",
                                  pk: "1",
                                  unit_type: "Split Wall",
                                  location: "",
                                  costumer_id: customerId || null,
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

                        <Field label="Layanan (Dari Database)">
                          <select
                            className={inputClass}
                            value={item.service_id}
                            onChange={(e) => {
                              const srvId = e.target.value;
                              const foundSrv = serviceList.find(
                                (s) => String(s.id) === srvId,
                              );
                              setServices((current) =>
                                current.map((service, i) =>
                                  i === index
                                    ? {
                                        ...service,
                                        service_id: srvId,
                                        price: foundSrv
                                          ? foundSrv.price
                                          : service.price,
                                        warranty:
                                          foundSrv?.warranty ||
                                          service.warranty,
                                      }
                                    : service,
                                ),
                              );
                            }}
                          >
                            <option value="">— Pilih layanan —</option>
                            {serviceList.map((srv) => (
                              <option key={srv.id} value={srv.id}>
                                {srv.name} ({money(srv.price)})
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      {/* Unit editor */}
                      {item.unitId && isCreatingUnit && (
                        <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/70 p-3">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold text-blue-800">
                              Detail Unit AC Baru (Tersimpan ke Pelanggan)
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
                                value={selectedUnit?.brand ?? item.brand}
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

                        <Field label="Garansi">
                          <input
                            className={inputClass}
                            value={item.warranty}
                            placeholder="30 hari"
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

              {/* Spareparts */}
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
                        },
                      ])
                    }
                  >
                    + Tambah sparepart
                  </button>
                </div>
              </div>

              {/* Other Costs */}
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

            {/* 3. PRODUK */}
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
                        className="text-xs text-rose-600 hover:underline"
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

            {/* 4. JADWAL & KELUHAN */}
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
            {/* 5. PELAKSANA */}
            <Section number="5" title="Pelaksana">
              <div className="space-y-2">
                {technicians.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Tidak ada data teknisi
                  </p>
                ) : (
                  technicians.map((tech) => {
                    const isChecked = selectedTechnicians.includes(tech.id);
                    const isMitra = tech.role === 4;
                    const commissionRate =
                      mitraCommissions[tech.id] !== undefined
                        ? mitraCommissions[tech.id]
                        : 30;

                    return (
                      <div
                        key={tech.id}
                        className="rounded-lg border border-slate-200 bg-white p-2.5 transition"
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTechnicians((prev) => [
                                    ...prev,
                                    tech.id,
                                  ]);
                                  // initialize default 30% if mitra
                                  if (isMitra && mitraCommissions[tech.id] === undefined) {
                                    setMitraCommissions((prev) => ({
                                      ...prev,
                                      [tech.id]: 30,
                                    }));
                                  }
                                } else {
                                  setSelectedTechnicians((prev) =>
                                    prev.filter((id) => id !== tech.id),
                                  );
                                }
                              }}
                              className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600"
                            />
                            <span className="font-medium">{tech.name}</span>
                          </label>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              isMitra
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "text-slate-500"
                            }`}
                          >
                            {tech.role === 1
                              ? "Owner"
                              : tech.role === 2
                                ? "Admin"
                                : tech.role === 3
                                  ? "Karyawan"
                                  : tech.role === 4
                                    ? "Mitra"
                                    : "Staff"}
                          </span>
                        </div>

                        {/* If checked AND has role Mitra (4), show editable commission field */}
                        {isChecked && isMitra && (
                          <div className="mt-2.5 rounded border border-amber-100 bg-amber-50/50 p-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[11px] font-medium text-amber-900">
                                Komisi Mitra:
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={commissionRate}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value));
                                    setMitraCommissions((prev) => ({
                                      ...prev,
                                      [tech.id]: val,
                                    }));
                                  }}
                                  className="w-16 rounded border border-amber-300 bg-white px-2 py-1 text-right text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-xs font-semibold text-amber-800">
                                  %
                                </span>
                              </div>
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-amber-800">
                              <span>Estimasi komisi:</span>
                              <span className="font-semibold text-slate-800">
                                {money(Math.round((total * commissionRate) / 100))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Section>

            {/* RINGKASAN */}
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
                {otherCostTotal > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Biaya Lain</span>
                    <span className="font-medium">{money(otherCostTotal)}</span>
                  </div>
                )}
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

              {/* PEMBAYARAN */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Field label="Metode Pembayaran">
                  <select
                    className={inputClass}
                    value={paymentType}
                    onChange={(e) => {
                      setPaymentType(e.target.value);
                      if (e.target.value === "cash" && !cashHolderId) {
                        setCashHolderId(selectedTechnicians[0] || userId || "");
                      }
                    }}
                  >
                    <option value="unpaid">Belum Dibayar (Tagihan)</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="transfer">Transfer Bank</option>
                  </select>
                </Field>

                {paymentType === "cash" && (
                  <div className="mt-2.5 rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5">
                    <Field label="Uang Dipegang Oleh">
                      <select
                        className={`${inputClass} border-emerald-200 bg-white`}
                        value={cashHolderId || selectedTechnicians[0] || userId || ""}
                        onChange={(e) => setCashHolderId(e.target.value)}
                      >
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (
                            {t.role === 1
                              ? "Owner"
                              : t.role === 2
                                ? "Admin"
                                : t.role === 3
                                  ? "Karyawan"
                                  : t.role === 4
                                    ? "Mitra"
                                    : "Staff"}
                            )
                          </option>
                        ))}
                      </select>
                    </Field>
                    <p className="mt-1 text-[10px] text-emerald-800">
                      Uang tunai akan tercatat dipegang oleh user ini sampai disetor ke kas kantor.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Menyimpan data..." : "Simpan Order"}
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
