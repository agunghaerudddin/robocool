import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      user_id,
      order_id,
      base_amount,
      rate_applied,
      commission_amount,
      status,
      period_start,
      period_end,
      notes,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .from("partner_commissions")
      .insert({
        user_id,
        order_id: order_id || null,
        base_amount: Number(base_amount || 0),
        rate_applied: Number(rate_applied || 0),
        commission_amount: Number(commission_amount || 0),
        status: status || "unpaid",
        period_start: period_start || startOfMonth,
        period_end: period_end || endOfMonth,
        earned_at: new Date().toISOString(),
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create partner commission:", error);
      return NextResponse.json(
        { error: "Failed to create partner commission.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Partner commission created successfully.",
        commission: data,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating commission:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
}
