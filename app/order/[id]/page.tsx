import { Suspense } from "react";
import OrderDetail from "./OrderDetail";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#f5f7fa]"><p className="text-sm text-slate-400">Memuat…</p></div>}>
      <OrderDetail />
    </Suspense>
  );
}
