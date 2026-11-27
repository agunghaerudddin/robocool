import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // 1. Fetch order with services, spareparts, other costs, products, assignments, and existing partner commissions
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(`
        id,
        assign_to,
        status,
        service_orders(*),
        sparepart_orders(*),
        other_costs_orders(*),
        product_orders(*),
        order_assignments(*),
        partner_commissions(*)
      `)
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      console.error("Order not found or error:", orderErr);
      return NextResponse.json(
        { error: "Order not found.", details: orderErr?.message },
        { status: 404 }
      );
    }

    // 2. Calculate current total order value
    let totalBill = 0;
    (order.service_orders || []).forEach((s: any) => {
      totalBill += (Number(s.price) || 0) * (Number(s.amount) || 1);
    });
    (order.sparepart_orders || []).forEach((sp: any) => {
      totalBill += (Number(sp.price) || 0) * (Number(sp.amount) || 1);
    });
    (order.other_costs_orders || []).forEach((oc: any) => {
      totalBill += (Number(oc.price) || 0) * (Number(oc.amount) || 1);
    });
    (order.product_orders || []).forEach((po: any) => {
      totalBill += (Number(po.price) || 0) * (Number(po.amount) || 1);
    });

    // 3. Find all assigned user IDs
    const assignedUserIds: string[] = [];
    if (order.assign_to) {
      assignedUserIds.push(String(order.assign_to));
    }
    if (Array.isArray(order.order_assignments)) {
      order.order_assignments.forEach((oa: any) => {
        if (oa.assigned_to && !assignedUserIds.includes(String(oa.assigned_to))) {
          assignedUserIds.push(String(oa.assigned_to));
        }
      });
    }

    if (assignedUserIds.length === 0) {
      return NextResponse.json({
        message: "No assigned technicians for this order.",
        total: totalBill,
      });
    }

    // 4. Fetch user details to filter only Mitra (Role 4)
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select("id, name, role")
      .in("id", assignedUserIds);

    if (userErr || !users) {
      return NextResponse.json(
        { error: "Failed to fetch technician roles." },
        { status: 500 }
      );
    }

    const mitraUsers = users.filter((u: any) => u.role === 4);
    if (mitraUsers.length === 0) {
      return NextResponse.json({
        message: "No mitra role assigned to this order.",
        total: totalBill,
      });
    }

    const existingCommissions = order.partner_commissions || [];
    const results = [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    for (const mitra of mitraUsers) {
      const existing = existingCommissions.find(
        (c: any) => String(c.user_id) === String(mitra.id)
      );

      const rate = existing ? Number(existing.rate_applied || 30) : 30;
      const commissionAmount = Math.round((totalBill * rate) / 100);

      if (existing) {
        // Update existing commission record with new total & new commission amount
        const { data: updated, error: updErr } = await supabase
          .from("partner_commissions")
          .update({
            base_amount: totalBill,
            commission_amount: commissionAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (updErr) {
          console.error("Failed to update commission:", updErr);
        } else {
          results.push(updated);
        }
      } else {
        // Create new commission record for this mitra
        const { data: created, error: crtErr } = await supabase
          .from("partner_commissions")
          .insert({
            user_id: mitra.id,
            order_id: order.id,
            base_amount: totalBill,
            rate_applied: rate,
            commission_amount: commissionAmount,
            status: "unpaid",
            period_start: startOfMonth,
            period_end: endOfMonth,
            earned_at: new Date().toISOString(),
            notes: `Komisi Pelaksana Order ${order.id}`,
          })
          .select()
          .single();

        if (crtErr) {
          console.error("Failed to insert commission:", crtErr);
        } else {
          results.push(created);
        }
      }
    }

    return NextResponse.json({
      message: "Order commissions recalculated successfully.",
      totalBill,
      commissions: results,
    });
  } catch (err: any) {
    console.error("Error recalculating commissions:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
}
