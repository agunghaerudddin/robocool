import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, phone, google_maps, label, type } = body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return NextResponse.json(
        { error: "Name and phone are required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        google_maps:
          typeof google_maps === "string" ? google_maps.trim() || null : null,
        label: typeof label === "string" ? label.trim() || null : null,
        type: typeof type === "string" ? type.trim() || null : null,
      })
      .select("id, name, phone, google_maps, label, type")
      .single();

    if (error) {
      console.error("Failed to create customer:", error);

      return NextResponse.json(
        { error: "Failed to create customer." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Customer created successfully.",
        customer: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create customer API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
