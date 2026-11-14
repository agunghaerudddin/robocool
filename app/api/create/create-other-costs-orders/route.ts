import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { information, amount, price, capital_price, order_id } = body;

    // Validate required fields
    if (
      typeof information !== "string" ||
      !information.trim() ||
      !order_id ||
      typeof amount !== "number" ||
      amount <= 0 ||
      typeof price !== "number" ||
      price < 0 ||
      typeof capital_price !== "number" ||
      capital_price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Information, order_id, a positive amount, and valid price and capital_price are required.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("other_costs_orders")
      .insert({
        information: information.trim(),
        amount,
        price,
        capital_price,
        order_id,
      })
      .select("id, information, amount, price, capital_price, order_id")
      .single();

    if (error) {
      console.error("Failed to create spare part order:", error);

      return NextResponse.json(
        { error: "Failed to create spare part order." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Spare part order created successfully.",
        sparepart_order: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create spare part order API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
