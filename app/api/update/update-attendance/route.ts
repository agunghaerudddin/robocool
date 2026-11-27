import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { APP_TIMEZONE } from "@/lib/config/timezone";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      user_id,
      check_out_latitude,
      check_out_longitude,
      check_out_accuracy,
      status,
    } = body;

    if (!id && !user_id) {
      return NextResponse.json(
        { error: "id or user_id is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // 1. Enforce SERVER TIME in configured timezone
    const serverNow = new Date();
    const serverIso = serverNow.toISOString();
    const serverDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(serverNow);

    const updateFields: Record<string, any> = {
      check_out_at: serverIso,
      updated_at: serverIso,
    };

    if (check_out_latitude !== undefined) {
      updateFields.check_out_latitude = check_out_latitude;
    }
    if (check_out_longitude !== undefined) {
      updateFields.check_out_longitude = check_out_longitude;
    }
    if (check_out_accuracy !== undefined) {
      updateFields.check_out_accuracy = check_out_accuracy;
    }
    if (status) {
      updateFields.status = status;
    }

    let query = supabase.from("attendance").update(updateFields);

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query
        .eq("user_id", user_id)
        .eq("attendance_date", serverDate);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error("Failed to update check-out attendance:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Check-out berhasil dicatat.",
      data,
    });
  } catch (err: any) {
    console.error("update-attendance error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
