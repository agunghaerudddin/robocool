import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role")
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch users:", error);

    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return Response.json(data);
}
