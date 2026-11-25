import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("overs")
      .select(`
        *,
        customer:customers!overs_customer_id_fkey(id, name, phone, google_maps, label),
        items:over_items(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch overs:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("get-offers error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
