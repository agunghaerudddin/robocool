import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const date = searchParams.get("date"); // YYYY-MM-DD
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("attendance")
      .select("*")
      .order("attendance_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (date) {
      query = query.eq("attendance_date", date);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch attendance:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("get-attendance error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
