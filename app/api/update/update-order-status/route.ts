import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // 1. Update status on orders table
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update order status:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // 2. Insert into order_history
    const nowIso = new Date().toISOString();
    const historyPayloadVariants = [
      {
        order_id: id,
        date_start: nowIso,
        status: status,
        notes: notes || `Status diubah menjadi ${status}`,
        create_at: nowIso,
        updated_at: nowIso,
      },
      {
        order_id: id,
        date_start: nowIso,
        status: status,
        notes: notes || `Status diubah menjadi ${status}`,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        order_id: id,
        date_start: nowIso,
        status: status,
        notes: notes || `Status diubah menjadi ${status}`,
      },
    ];

    for (const payload of historyPayloadVariants) {
      const { error: histErr } = await supabase
        .from("order_history")
        .insert(payload);
      if (!histErr) {
        break;
      }
    }

    return NextResponse.json({
      message: "Status updated successfully.",
      data: updatedOrder,
    });
  } catch (error: any) {
    console.error("update-order-status error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
