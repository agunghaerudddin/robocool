import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, amount, price, capital_price, order_id } = body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
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
            "Name, order_id, a positive amount, and valid price and capital_price are required.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("product_orders")
      .insert({
        name: name.trim(),
        amount,
        price,
        capital_price,
        order_id,
      })
      .select("id, name, amount, price, capital_price, order_id")
      .single();

    if (error) {
      console.error("Failed to create product order:", error);

      return NextResponse.json(
        { error: "Failed to create product order." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Product order created successfully.",
        product_order: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create product order API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
