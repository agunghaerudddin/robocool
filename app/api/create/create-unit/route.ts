import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { brand, service_order_id, pk, type, location } = body;

    // Validate required fields
    if (
      typeof brand !== "string" ||
      !brand.trim() ||
      typeof type !== "string" ||
      !type.trim()
    ) {
      return NextResponse.json(
        { error: "Brand and type are required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("units")
      .insert({
        brand: brand.trim(),
        service_order_id: service_order_id ?? null,
        pk: pk ?? null,
        type: type.trim(),
        location: typeof location === "string" ? location.trim() || null : null,
      })
      .select("id, brand, service_order_id, pk, type, location")
      .single();

    if (error) {
      console.error("Failed to create unit:", error);

      return NextResponse.json(
        { error: "Failed to create unit." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Unit created successfully.",
        unit: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create unit API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
