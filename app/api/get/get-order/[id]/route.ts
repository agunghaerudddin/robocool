import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseAdmin();
    const { id } = await params;

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        assign_to,
        payment_status,
        payment_type,
        commission_mode,
        status,
        created_at,
        image_before,
        image_after,
        creator:users!orders_user_id_fkey(name),
        assigned_user:users!orders_assign_to_fkey(name),
        customer:customers!orders_customer_id_fkey(name, phone, google_maps, label),
        service_orders(*, service:services(name, warranty, estimate)),
        sparepart_orders(*),
        other_costs_orders(*),
        product_orders(*),
        complaint_schedules(*),
        order_history(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("get-order error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("get-order unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
