import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, notes, payment_status, payment_type, paid_to, assign_to } = body;

    if (!id || (!status && !payment_status && !payment_type && paid_to === undefined && assign_to === undefined)) {
      return NextResponse.json(
        { error: "id and at least one field to update are required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const updateFields: Record<string, any> = {};
    if (status) updateFields.status = status;
    if (payment_status) updateFields.payment_status = payment_status;
    if (payment_type) updateFields.payment_type = payment_type;
    if (paid_to !== undefined) updateFields.paid_to = paid_to;
    if (assign_to !== undefined) updateFields.assign_to = assign_to;

    // 1. Update fields on orders table
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateFields)
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

    // 2. Insert into order_history if status is changed or notes provided
    if (status || notes) {
      const historyStatus = status || updatedOrder?.status || "update";
      const defaultNote = status ? `Status diubah menjadi ${status}` : "Pembaruan pesanan";
      const nowIso = new Date().toISOString();
      const historyPayloadVariants = [
        {
          order_id: id,
          date_start: nowIso,
          status: historyStatus,
          notes: notes || defaultNote,
          create_at: nowIso,
          updated_at: nowIso,
        },
        {
          order_id: id,
          date_start: nowIso,
          status: historyStatus,
          notes: notes || defaultNote,
          created_at: nowIso,
          updated_at: nowIso,
        },
        {
          order_id: id,
          date_start: nowIso,
          status: historyStatus,
          notes: notes || defaultNote,
        },
      ];

      for (const payload of historyPayloadVariants) {
        const { error: histErr } = await (supabase
          .from("order_history") as any)
          .insert(payload);
        if (!histErr) {
          break;
        }
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
