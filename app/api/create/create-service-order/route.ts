import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { order_id, services_id, amount, price, warranty } = body;

    // Validate required fields
    if (
      !order_id ||
      !services_id ||
      typeof amount !== "number" ||
      amount <= 0 ||
      typeof price !== "number" ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "order_id, services_id, a positive amounth, and a valid price are required.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("service_orders")
      .insert({
        order_id,
        services_id,
        amount,
        price,
        warranty: warranty ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create service order:", error);

      return NextResponse.json(
        { error: "Failed to create service order." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Service order created successfully.",
        service_order: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create service order API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
