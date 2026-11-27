import { NextResponse } from "next/server";
import { APP_TIMEZONE } from "@/lib/config/timezone";

export async function GET() {
  const now = new Date();
  
  return NextResponse.json({
    iso: now.toISOString(),
    timestamp: now.getTime(),
    timezone: APP_TIMEZONE,
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now), // "YYYY-MM-DD"
    time: new Intl.DateTimeFormat("id-ID", {
      timeZone: APP_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now),
    formattedDate: new Intl.DateTimeFormat("id-ID", {
      timeZone: APP_TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now),
  });
}
