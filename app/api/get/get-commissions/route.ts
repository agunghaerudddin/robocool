import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");
    const periodStart = searchParams.get("period_start");
    const periodEnd = searchParams.get("period_end");

    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("partner_commissions")
      .select(`
        id,
        user_id,
        order_id,
        base_amount,
        rate_applied,
        commission_amount,
        period_start,
        period_end,
        earned_at,
        status,
        paid_at,
        notes,
        user:users!partner_commissions_user_id_fkey(id, name, email),
        order:orders!partner_commissions_order_id_fkey(
          id,
          customer_id,
          customer:customers!orders_customer_id_fkey(name),
          service_orders(
            id,
            service:services(name)
          )
        )
      `)
      .order("earned_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (status && status !== "Semua") {
      query = query.eq("status", status);
    }
    if (periodStart) {
      query = query.gte("earned_at", periodStart);
    }
    if (periodEnd) {
      query = query.lte("earned_at", periodEnd);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch commissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch commissions", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ commissions: data || [] });
  } catch (err: any) {
    console.error("Server error fetching commissions:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
}
