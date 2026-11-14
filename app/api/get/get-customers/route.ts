import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase.from("customers").select(`
    name,
    phone,
    google_maps,
    label,
    updated_at,
    orders(count)
  `);

  if (error) {
    console.error("Failed to fetch orders:", error);

    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  const customers = data.map((customer) => ({
    ...customer,
    total_orders: customer.orders?.[0]?.count ?? 0,
    orders: undefined,
  }));

  return Response.json(customers);
}
