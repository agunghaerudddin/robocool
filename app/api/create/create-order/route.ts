import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Ambil data dari root JSON
    const { user_id, customer, order } = body;

    // Ambil customer_id dari objek customer
    const customer_id = customer?.customer_id;

    // Ambil properti dari objek order
    const { commission_mode, status, payment_type, payment_status, assign_to } =
      order ?? {};

    // Validasi data wajib
    if (!customer_id || !user_id) {
      return NextResponse.json(
        {
          error: "customer.customer_id and user_id are required.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const orderStatus = status ?? "terjadwal";

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_id,
        user_id,
        commission_mode: commission_mode ?? null,
        status: orderStatus,
        payment_type: payment_type ?? null,
        payment_status: payment_status ?? "unpaid",
        assign_to: assign_to ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create order:", error);

      return NextResponse.json(
        { error: "Failed to create order." },
        { status: 500 },
      );
    }

    // Insert initial record to order_history
    const nowIso = new Date().toISOString();
    const historyPayload: Record<string, any> = {
      order_id: data.id,
      date_start: nowIso,
      status: orderStatus,
      notes: "Order created",
      create_at: nowIso,
      updated_at: nowIso,
    };

    let { error: historyError } = await supabase
      .from("order_history")
      .insert(historyPayload);

    // If failed, try with created_at instead of create_at or minimal schema
    if (historyError) {
      console.warn(
        "First insert to order_history failed:",
        historyError.message,
      );

      const retryPayload: Record<string, any> = {
        order_id: data.id,
        date_start: nowIso,
        status: orderStatus,
        notes: "Order created",
        created_at: nowIso,
        updated_at: nowIso,
      };

      const retryRes = await supabase
        .from("order_history")
        .insert(retryPayload);

      if (retryRes.error) {
        console.warn("Retry with created_at failed:", retryRes.error.message);

        // Try minimal payload without timestamp column names in case DB defaults them
        const minimalRes = await supabase.from("order_history").insert({
          order_id: data.id,
          date_start: nowIso,
          status: orderStatus,
          notes: "Order created",
        });

        if (minimalRes.error) {
          console.error(
            "All order_history insert attempts failed:",
            minimalRes.error,
          );
        } else {
          historyError = null;
        }
      } else {
        historyError = null;
      }
    }

    return NextResponse.json(
      {
        message: "Order created successfully.",
        order: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create order API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
