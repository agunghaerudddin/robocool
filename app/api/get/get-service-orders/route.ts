import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase.from("service_orders").select(`
    order_id,
    services_id,
    amounth,
    price,
    waranty
  `);

  if (error) {
    console.error("Failed to fetch orders:", error);

    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
  return Response.json(data);
}
