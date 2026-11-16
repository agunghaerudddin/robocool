import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { id, type, url, action } = await req.json();

    if (!id || !type || !url) {
      return NextResponse.json(
        { error: "id, type ('before' | 'after'), and url are required" },
        { status: 400 }
      );
    }

    const column = type === "after" ? "image_after" : "image_before";
    const supabase = createSupabaseAdmin();

    // Fetch existing field to see whether it is an array or string
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select(column)
      .eq("id", id)
      .single();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const currentValue = (order as any)?.[column];
    let updateValue: any;

    if (Array.isArray(currentValue)) {
      if (action === "remove") {
        updateValue = currentValue.filter((item: string) => item !== url);
      } else {
        updateValue = [...currentValue, url];
      }
    } else {
      // Single string column
      updateValue = action === "remove" ? null : url;
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update({ [column]: updateValue })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, [column]: updateValue });
  } catch (err: any) {
    console.error("update-order-image error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update order image" },
      { status: 500 }
    );
  }
}
