import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customer_id") || searchParams.get("costumer_id");

    // First attempt: fetch with relations if defined in Supabase
    let query = supabase.from("units").select(`
      id,
      service_order_id,
      brand,
      pk,
      type,
      location,
      costumer_id
    `);

    if (customerId) {
      query = query.eq("costumer_id", customerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch units from DB:", error);
      return Response.json({ error: "Failed to fetch units", details: error.message }, { status: 500 });
    }

    return Response.json(data ?? []);
  } catch (err: any) {
    console.error("GET /api/get/get-others error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
