import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase.from("orders").select(`
      id,
      user_id,
      assign_to,
      payment_status,
      status,

      creator:users!orders_user_id_fkey(name),
      assigned_user:users!orders_assign_to_fkey(name),

      customer_id,
      customer:customers!orders_customer_id_fkey(name),

      service_orders(*),
      sparepart_orders(*),
      other_costs_orders(*)
    `);
  console.log("ahhay");

  if (error) {
    console.error("Failed to fetch orders:", error);

    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  return Response.json(data);
}
