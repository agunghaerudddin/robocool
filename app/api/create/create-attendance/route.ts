import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { APP_TIMEZONE } from "@/lib/config/timezone";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      check_in_latitude,
      check_in_longitude,
      check_in_accuracy,
      status,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // 1. Enforce SERVER TIME in configured timezone
    const serverNow = new Date();
    const serverIso = serverNow.toISOString();
    
    // YYYY-MM-DD computed from server time
    const serverDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(serverNow);

    // 2. Check if an attendance record already exists for this user and server date
    const { data: existing } = await supabase
      .from("attendance")
      .select("id, check_in_at, check_out_at, status")
      .eq("user_id", user_id)
      .eq("attendance_date", serverDate)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          message: "Absensi hari ini sudah tercatat.",
          data: existing,
        },
        { status: 200 }
      );
    }

    // 3. Determine if attendance is late (after 08:15)
    const tzFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIMEZONE,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = tzFormatter.formatToParts(serverNow);
    const hourPart = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minutePart = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const isLate = hourPart > 8 || (hourPart === 8 && minutePart > 15);

    // Candidates of status to satisfy table check constraint:
    // Some schemas enforce lowercase English ("present" / "late"), lowercase Indonesian ("hadir" / "terlambat"),
    // or capitalized words.
    const statusCandidates = status
      ? [status]
      : isLate
        ? ["late", "terlambat", "Terlambat", "Late", "present", "hadir", "Hadir"]
        : ["present", "hadir", "Hadir", "Present", "on_time"];

    let lastError: any = null;
    let savedData: any = null;

    for (const cand of statusCandidates) {
      const insertPayload: Record<string, any> = {
        user_id,
        attendance_date: serverDate,
        check_in_at: serverIso,
        check_in_latitude: check_in_latitude !== undefined ? check_in_latitude : null,
        check_in_longitude: check_in_longitude !== undefined ? check_in_longitude : null,
        check_in_accuracy: check_in_accuracy !== undefined ? check_in_accuracy : null,
        status: cand,
        created_at: serverIso,
        updated_at: serverIso,
      };

      const { data, error } = await supabase
        .from("attendance")
        .insert(insertPayload)
        .select()
        .single();

      if (!error && data) {
        savedData = data;
        lastError = null;
        break;
      } else {
        lastError = error;
        // If the error is NOT a check constraint error, no need to keep trying statuses
        if (error?.code !== "23514") {
          break;
        }
      }
    }

    if (!savedData && lastError) {
      console.error("Failed to record attendance check-in:", lastError);
      return NextResponse.json({ error: lastError.message, details: lastError }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Check-in berhasil dicatat.", data: savedData },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("create-attendance error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
