"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OrderCard from "../component/OrderCard";
import { getOrders, getServices } from "../fetch/get/fetch";

type OrderItem = {
  id: number | string;
  day: string;
  date: string;
  month: string;
  customer: string;
  phone?: string;
  status: string;
  payment_status: string;
  description: string;
  invoice: string;
  time?: string;
  technician: string;
  amount: number;
  category: "Berjalan" | "Selesai" | "Belum Lunas" | "Batal";
  rawDate?: string;
};

const tabs = ["Berjalan", "Selesai", "Belum Lunas", "Batal", "Semua"] as const;

export default function OrderPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Berjalan");
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [technician, setTechnician] = useState("Semua pelaksana");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [resOrders, resServices] = await Promise.all([
        getOrders(),
        getServices(),
      ]);
      const rawData = resOrders?.data || [];
      const serviceList = resServices?.data || [];

      // Create lookup map for service names by id
      const serviceMap = new Map<string | number, string>();
      if (Array.isArray(serviceList)) {
        serviceList.forEach((s: any) => {
          if (s.id && s.name) {
            serviceMap.set(s.id, s.name);
            serviceMap.set(String(s.id), s.name);
          }
        });
      }

      const mapped: OrderItem[] = rawData.map((item: any) => {
        // Date formatting
        const schedule = Array.isArray(item.complaint_schedules) && item.complaint_schedules.length > 0
          ? item.complaint_schedules[0]
          : null;

        let dateObj = new Date();
        if (schedule?.date) {
          dateObj = new Date(`${schedule.date}T${schedule.time || "00:00:00"}`);
        } else if (item.created_at) {
          dateObj = new Date(item.created_at);
        }

        const days = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];
        const months = [
          "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
          "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
        ];

        const day = isNaN(dateObj.getTime()) ? "-" : days[dateObj.getDay()];
        const date = isNaN(dateObj.getTime())
          ? "-"
          : String(dateObj.getDate()).padStart(2, "0");
        const month = isNaN(dateObj.getTime()) ? "-" : months[dateObj.getMonth()];
        const fullDateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split("T")[0]
          : "";

        const time = schedule?.time
          ? schedule.time.substring(0, 5)
          : !isNaN(dateObj.getTime())
          ? `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`
          : undefined;

        // Customer
        const customerName = item.customer?.name || "Customer";
        const customerPhone = item.customer?.phone || "";

        // Status
        const rawStatus = (item.status || "pending").toString().toLowerCase();
        let displayStatus = item.status || "Pending";
        if (rawStatus === "pending") displayStatus = "Terjadwal";
        else if (rawStatus === "in_progress" || rawStatus === "progress" || rawStatus === "dikerjakan") displayStatus = "Dikerjakan";
        else if (rawStatus === "completed" || rawStatus === "selesai") displayStatus = "Selesai";
        else if (rawStatus === "cancelled" || rawStatus === "canceled" || rawStatus === "batal") displayStatus = "Batal";

        // Payment status
        const rawPaymentStatus = (item.payment_status || "unpaid").toString().toLowerCase();
        const displayPaymentStatus =
          rawPaymentStatus === "paid" || rawPaymentStatus === "lunas"
            ? "lunas"
            : "belum lunas";

        // Category mapping for tabs: Berjalan, Selesai, Belum Lunas, Batal
        let category: "Berjalan" | "Selesai" | "Belum Lunas" | "Batal" = "Berjalan";
        if (rawStatus === "cancelled" || rawStatus === "canceled" || rawStatus === "batal") {
          category = "Batal";
        } else if (rawStatus === "completed" || rawStatus === "selesai") {
          category = "Selesai";
        } else if (displayPaymentStatus === "belum lunas" && (rawStatus === "unpaid" || rawStatus === "completed" || rawStatus === "selesai")) {
          category = "Belum Lunas";
        } else {
          category = "Berjalan";
        }

        // Description from services & products (using service name, not service_id)
        const serviceNames: string[] = [];
        if (Array.isArray(item.service_orders)) {
          item.service_orders.forEach((so: any) => {
            const srvId = so.services_id ?? so.service_id;
            const name =
              so.service?.name ||
              so.services?.name ||
              (srvId ? serviceMap.get(srvId) : null);

            if (name) {
              serviceNames.push(name);
            }
          });
        }

        const productNames: string[] = [];
        if (Array.isArray(item.product_orders)) {
          item.product_orders.forEach((po: any) => {
            if (po.name) productNames.push(po.name);
          });
        }

        let description = "";
        if (serviceNames.length > 0) {
          description = serviceNames.join(", ");
        } else if (schedule?.complaint_schedule) {
          description = schedule.complaint_schedule;
        } else {
          description = "Pesanan Layanan AC";
        }

        if (productNames.length > 0) {
          description += ` · Produk: ${productNames.join(", ")}`;
        }

        // Invoice
        const invoice = `INV/${dateObj.getFullYear() || 2026}/${String((dateObj.getMonth() || 0) + 1).padStart(2, "0")}/${String(item.id).padStart(4, "0")}`;

        // Technician
        const technician = item.assigned_user?.name || "belum ditugaskan";

        // Total Amount calculation
        let total = 0;
        if (Array.isArray(item.service_orders)) {
          item.service_orders.forEach((s: any) => {
            total += (Number(s.price) || 0) * (Number(s.amount) || Number(s.amounth) || 1);
          });
        }
        if (Array.isArray(item.sparepart_orders)) {
          item.sparepart_orders.forEach((sp: any) => {
            total += (Number(sp.price) || 0) * (Number(sp.amount) || 1);
          });
        }
        if (Array.isArray(item.other_costs_orders)) {
          item.other_costs_orders.forEach((oc: any) => {
            total += (Number(oc.price) || 0) * (Number(oc.amount) || 1);
          });
        }
        if (Array.isArray(item.product_orders)) {
          item.product_orders.forEach((po: any) => {
            total += (Number(po.price) || 0) * (Number(po.amount) || 1);
          });
        }

        return {
          id: item.id,
          day,
          date,
          month,
          customer: customerName,
          phone: customerPhone,
          status: displayStatus,
          payment_status: displayPaymentStatus,
          description,
          invoice,
          time,
          technician,
          amount: total,
          category,
          rawDate: fullDateStr,
        };
      });

      setOrders(mapped);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const technicianOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.technician) set.add(o.technician);
    });
    return ["Semua pelaksana", ...Array.from(set)];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesTab =
        activeTab === "Semua"
          ? true
          : activeTab === "Belum Lunas"
          ? order.payment_status === "belum lunas" && order.category !== "Batal"
          : order.category === activeTab;

      const matchesSearch =
        `${order.customer} ${order.phone || ""} ${order.invoice} ${order.description} ${order.technician}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesTechnician =
        technician === "Semua pelaksana" || order.technician === technician;

      const matchesDate =
        !selectedDate ||
        order.rawDate === selectedDate ||
        order.date === selectedDate.split("-")[2];

      return matchesTab && matchesSearch && matchesTechnician && matchesDate;
    });
  }, [orders, activeTab, search, selectedDate, technician]);

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-0 pb-3">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Order
          </h1>

          <Link
            href="/order/create"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Order Baru
          </Link>
        </div>

        {/* Status Tabs */}
        <div className="mb-2 flex flex-wrap items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                activeTab === tab
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 bg-white text-slate-600 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {/* Search */}
          <div className="relative w-full sm:w-[240px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="No. order / nama / no. WA"
              className="h-[30px] w-full rounded-md border border-slate-300 bg-white px-2.5 text-[11px] text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Date */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-[30px] w-[130px] rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 shadow-sm outline-none focus:border-blue-500"
          />

          {/* Technician */}
          <select
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            className="h-[30px] w-[140px] rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 shadow-sm outline-none focus:border-blue-500"
          >
            {technicianOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {(search || selectedDate || technician !== "Semua pelaksana") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedDate("");
                setTechnician("Semua pelaksana");
              }}
              className="h-[30px] rounded-md border border-slate-300 bg-white px-2.5 text-[11px] font-medium text-slate-500 shadow-sm transition hover:bg-gray-50"
            >
              Reset
            </button>
          )}
        </div>

        {/* Order List */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-center">
              <span className="text-sm font-medium text-slate-500">
                Memuat data order...
              </span>
            </div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => (
              <OrderCard key={order.id} order={order} isFirst={index === 0} />
            ))
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 text-center">
              <span className="text-sm font-medium text-slate-500">
                Tidak ada order ditemukan
              </span>
              <span className="text-xs text-slate-400">
                Coba ubah pencarian atau filter tab.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
