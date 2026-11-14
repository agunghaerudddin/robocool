import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase.from("services").select(`
    name,
    price,
    warranty,
    estimate,
    updated_at
  `);

  if (error) {
    console.error("Failed to fetch orders:", error);

    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
  return Response.json(data);
}
