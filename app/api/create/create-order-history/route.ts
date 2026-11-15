import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, date_start, status, notes } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: "order_id is required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const payloadVariants = [
      {
        order_id,
        date_start: date_start || nowIso,
        status: status || "pending",
        notes: notes || null,
        create_at: nowIso,
        updated_at: nowIso,
      },
      {
        order_id,
        date_start: date_start || nowIso,
        status: status || "pending",
        notes: notes || null,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        order_id,
        date_start: date_start || nowIso,
        status: status || "pending",
        notes: notes || null,
      },
    ];

    let lastError: any = null;
    let createdHistory = null;

    for (const payload of payloadVariants) {
      const { data, error } = await supabase
        .from("order_history")
        .insert(payload)
        .select()
        .single();

      if (!error) {
        createdHistory = data;
        lastError = null;
        break;
      }
      lastError = error;
    }

    if (lastError) {
      console.error("Failed to insert order_history:", lastError);
      return NextResponse.json(
        { error: "Failed to insert order history", details: lastError },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Order history created successfully.",
        order_history: createdHistory,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create order history API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
