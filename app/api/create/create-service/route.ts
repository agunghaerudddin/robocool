import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, price, warranty, estimate } = body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof price !== "number" ||
      price < 0
    ) {
      return NextResponse.json(
        { error: "Name and a valid price are required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("services")
      .insert({
        name: name.trim(),
        price,
        warranty: warranty ?? null,
        estimate: estimate ?? null,
      })
      .select("id, name, price, warranty, estimate")
      .single();

    if (error) {
      console.error("Failed to create service:", error);

      return NextResponse.json(
        { error: "Failed to create service." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Service created successfully.",
        service: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create service API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
