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

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_id,
        user_id,
        commission_mode: commission_mode ?? null,
        status: status ?? "pending",
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
