import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { order_id, assigned_to, status } = body;

    // Validate required fields
    if (
      !order_id ||
      !assigned_to ||
      typeof status !== "string" ||
      !status.trim()
    ) {
      return NextResponse.json(
        {
          error: "order_id, assigned_to, and status are required.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("order_assignments")
      .insert({
        order_id,
        assigned_to,
        status: status.trim(),
      })
      .select("id, order_id, assigned_to, status")
      .single();

    if (error) {
      console.error("Failed to create order assignment:", error);

      return NextResponse.json(
        { error: "Failed to create order assignment." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Order assignment created successfully.",
        assignment: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create order assignment API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
