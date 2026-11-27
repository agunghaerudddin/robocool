// Centralized Timezone Configuration for Robocool
// Options for Indonesia:
// - "Asia/Jakarta"  -> WIB (Western Indonesia Time, UTC+7) e.g. Java, Sumatra, West Kalimantan
// - "Asia/Makassar" -> WITA (Central Indonesia Time, UTC+8) e.g. Bali, Sulawesi, NTT, NTB, South/East Kalimantan
// - "Asia/Jayapura" -> WIT (Eastern Indonesia Time, UTC+9) e.g. Maluku, Papua

export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Makassar";

export const getTimezoneLabel = (tz: string = APP_TIMEZONE): string => {
  if (tz === "Asia/Makassar") return "WITA (UTC+8)";
  if (tz === "Asia/Jakarta") return "WIB (UTC+7)";
  if (tz === "Asia/Jayapura") return "WIT (UTC+9)";
  return tz;
};
