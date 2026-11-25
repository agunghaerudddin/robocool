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
      .from("overs")
      .select(`
        *,
        customer:customers!overs_customer_id_fkey(id, name, phone, google_maps, label),
        items:over_items(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("get-offer error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("get-offer unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseAdmin();
    const { id } = await params;

    const { error } = await supabase
      .from("overs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("delete-offer error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Penawaran berhasil dihapus" });
  } catch (err: any) {
    console.error("delete-offer unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}
