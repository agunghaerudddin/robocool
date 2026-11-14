import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { date, time, complaint_schedule, notes, order_id } = body;

    // Validate required fields
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof time !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time) ||
      typeof complaint_schedule !== "string" ||
      !complaint_schedule.trim() ||
      !order_id
    ) {
      return NextResponse.json(
        {
          error:
            "Valid date (YYYY-MM-DD), time (HH:mm), complaint_schedule, and order_id are required.",
        },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("complaint_schedules")
      .insert({
        date,
        time,
        complaint_schedule: complaint_schedule.trim(),
        notes: typeof notes === "string" ? notes.trim() || null : null,
        order_id,
      })
      .select("id, date, time, complaint_schedule, notes, order_id")
      .single();

    if (error) {
      console.error("Failed to create complaint schedule:", error);

      return NextResponse.json(
        { error: "Failed to create complaint schedule." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Complaint schedule created successfully.",
        complaint_schedule: data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create complaint schedule API error:", error);

    return NextResponse.json(
      { error: "Invalid request body or internal server error." },
      { status: 500 },
    );
  }
}
