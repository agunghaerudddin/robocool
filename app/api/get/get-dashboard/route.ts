import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  try {
    // 1. Fetch orders with relations
    const { data: orders, error: ordersError } = await supabase.from("orders").select(`
      id,
      user_id,
      assign_to,
      paid_to,
      payment_status,
      payment_type,
      commission_mode,
      status,
      created_at,

      creator:users!orders_user_id_fkey(name),
      assigned_user:users!orders_assign_to_fkey(name),
      paid_to_user:users!orders_paid_to_fkey(name),

      customer_id,
      customer:customers!orders_customer_id_fkey(name, phone, google_maps, label),

      service_orders(
        *,
        service:services(name)
      ),
      sparepart_orders(*),
      other_costs_orders(*),
      product_orders(*),
      complaint_schedules(*)
    `);

    if (ordersError) {
      console.error("Failed to fetch orders for dashboard:", ordersError);
      return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    // 2. Fetch complaint schedules (for today's schedules / actions)
    const { data: schedules, error: schedulesError } = await supabase
      .from("complaint_schedules")
      .select("*");

    if (schedulesError) {
      console.error("Failed to fetch schedules for dashboard:", schedulesError);
    }

    return Response.json({
      orders: orders || [],
      schedules: schedules || [],
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
