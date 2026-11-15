type Order = {
  id: number | string;
  day: string;
  date: string;
  month: string;
  customer: string;
  status: string;
  payment_status: string;
  description: string;
  invoice: string;
  time?: string;
  technician: string;
  amount: number;
};

type OrderCardProps = {
  order: Order;
  isFirst?: boolean;
};

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function OrderCard({ order, isFirst = false }: OrderCardProps) {
  return (
    <div
      className={`flex min-h-[63px] items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-slate-50 sm:px-4 ${
        !isFirst ? "border-t border-slate-100" : ""
      }`}
    >
      {/* Date */}
      <div className="flex w-10 shrink-0 flex-col items-center text-center leading-tight">
        <span className="text-[9px] font-medium text-slate-400">
          {order.day}
        </span>
        <span className="text-sm font-bold text-slate-800">{order.date}</span>
        <span className="text-[10px] text-slate-400">{order.month}</span>
      </div>

      {/* Order Information */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-900">
            {order.customer}
          </span>

          <span
            className={`rounded-md px-1.5 py-[2px] text-[9px] font-semibold ${
              order.status.toLowerCase() === "dikerjakan" ||
              order.status.toLowerCase() === "berjalan"
                ? "bg-amber-100 text-amber-700"
                : order.status.toLowerCase() === "selesai"
                ? "bg-emerald-100 text-emerald-700"
                : order.status.toLowerCase() === "batal"
                ? "bg-rose-100 text-rose-700"
                : "bg-sky-100 text-sky-700"
            }`}
          >
            {order.status}
          </span>
          <span
            className={`rounded-md px-1.5 py-[2px] text-[9px] font-semibold ${
              order.payment_status.toLowerCase() === "lunas" ||
              order.payment_status.toLowerCase() === "paid"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {order.payment_status}
          </span>
        </div>

        <p className="truncate text-[11px] leading-4 text-slate-600">
          {order.description}
        </p>

        <div className="flex flex-wrap items-center gap-1 text-[10px] leading-4 text-slate-400">
          <span>{order.invoice}</span>

          {order.time && <span>· {order.time}</span>}

          <span className="text-orange-400">♟</span>
          <span>{order.technician}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 self-start pt-0.5 text-right">
        <span className="whitespace-nowrap text-[11px] font-semibold text-slate-900">
          {formatRupiah(order.amount)}
        </span>
      </div>
    </div>
  );
}
