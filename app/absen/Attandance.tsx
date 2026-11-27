"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  LogIn,
  LogOut,
  RefreshCw,
  MapPinned,
  History,
  ShieldCheck,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { getAttendance, getServerTime } from "@/app/fetch/get/fetch";
import { createAttendance } from "@/app/fetch/add/fetch";
import { updateAttendance } from "@/app/fetch/update/fetch";
import { APP_TIMEZONE, getTimezoneLabel } from "@/lib/config/timezone";

export type AttendanceRecord = {
  id: string;
  user_id: string;
  attendance_date: string;
  check_in_at: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_accuracy: number | null;
  check_out_at: string | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_accuracy: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

// Helper format date: "26 Nov 2026"
const formatHistoryDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Helper format time: "07:55"
const formatTimeOnly = (isoStr: string | null | undefined) => {
  if (!isoStr) return "--:--";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("id-ID", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Map DB status to friendly UI display
const mapDisplayStatus = (rawStatus: string | null | undefined): string => {
  const s = (rawStatus || "").toLowerCase();
  if (s === "present" || s === "hadir" || s === "on_time") return "Hadir";
  if (s === "late" || s === "terlambat") return "Terlambat";
  if (s === "absent" || s === "alfa" || s === "alpha") return "Alpa";
  if (s === "permission" || s === "izin") return "Izin";
  if (s === "sick" || s === "sakit") return "Sakit";
  return rawStatus || "Hadir";
};

export default function AttendancePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Today's attendance state
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  // Recent attendance history list
  const [historyList, setHistoryList] = useState<AttendanceRecord[]>([]);

  // GPS state
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [addressName, setAddressName] = useState<string>("");
  const [locationStatus, setLocationStatus] = useState<string>("Mendeteksi lokasi...");
  const [detectingGps, setDetectingGps] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Server Time Synchronization
  // serverOffsetMs = serverTimestamp - localDeviceTimestamp
  const serverOffsetRef = useRef<number>(0);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [serverSynced, setServerSynced] = useState(false);

  // Fetch true server time and calculate offset against local clock
  const syncServerTime = async () => {
    try {
      const res = await getServerTime();
      if (res?.data) {
        const clientNow = Date.now();
        const serverTimestamp = res.data.timestamp;
        serverOffsetRef.current = serverTimestamp - clientNow;
        setServerSynced(true);
      }
    } catch (err) {
      console.warn("Gagal menyinkronkan waktu server:", err);
    }
  };

  // Live clock that runs on true Server Time (tamper-proof)
  useEffect(() => {
    syncServerTime();

    const timer = setInterval(() => {
      // Current synchronized server time = local time + server offset
      const currentServerNow = new Date(Date.now() + serverOffsetRef.current);

      setCurrentDate(
        currentServerNow.toLocaleDateString("id-ID", {
          timeZone: APP_TIMEZONE,
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
      setCurrentTime(
        currentServerNow.toLocaleTimeString("id-ID", {
          timeZone: APP_TIMEZONE,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    // Re-sync with server every 2 minutes
    const syncInterval = setInterval(syncServerTime, 120000);

    return () => {
      clearInterval(timer);
      clearInterval(syncInterval);
    };
  }, []);

  // Fetch address name using free OpenStreetMap Nominatim reverse geocoding
  const fetchAddressName = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          setAddressName(data.display_name);
        }
      }
    } catch (err) {
      console.warn("Reverse geocode warning:", err);
    }
  };

  // Start real-time GPS watch
  const startGpsWatch = () => {
    if (!navigator.geolocation) {
      setLocationStatus("GPS tidak didukung oleh browser Anda.");
      return;
    }

    setDetectingGps(true);

    // Clear existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setCurrentLocation(loc);
        setLocationStatus("Lokasi realtime terhubung");
        setDetectingGps(false);
        fetchAddressName(loc.latitude, loc.longitude);
      },
      (err) => {
        console.warn("Geolocation watch error:", err.message);
        if (err.code === 1) {
          setLocationStatus("Izin akses lokasi ditolak. Harap izinkan akses lokasi pada browser/HP Anda.");
        } else if (err.code === 2) {
          setLocationStatus("Lokasi tidak tersedia atau sinyal GPS lemah.");
        } else {
          setLocationStatus("Batas waktu deteksi lokasi habis. Silakan coba lagi.");
        }
        setDetectingGps(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  };

  // One-time prompt / refresh GPS
  const requestLocation = (): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null> => {
    setDetectingGps(true);
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationStatus("GPS tidak didukung oleh browser Anda.");
        setDetectingGps(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setCurrentLocation(loc);
          setLocationStatus("Lokasi realtime terhubung");
          setDetectingGps(false);
          fetchAddressName(loc.latitude, loc.longitude);
          resolve(loc);
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          setLocationStatus(
            err.code === 1
              ? "Izin akses lokasi ditolak. Harap izinkan akses lokasi di browser/HP."
              : "Gagal mendeteksi lokasi GPS perangkat."
          );
          setDetectingGps(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  // Fetch attendance data for the current user
  const loadAttendanceData = async (uid: string) => {
    try {
      setFetchingData(true);

      // Compute server date in configured timezone
      const serverNow = new Date(Date.now() + serverOffsetRef.current);
      const serverDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: APP_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(serverNow);

      const res = await getAttendance({ user_id: uid, limit: 10 });
      if (res?.data?.data && Array.isArray(res.data.data)) {
        const records: AttendanceRecord[] = res.data.data;
        setHistoryList(records);

        // Find today's attendance record based on server date
        const today = records.find((r) => r.attendance_date === serverDateStr);
        setTodayRecord(today || null);
      }
    } catch (err) {
      console.error("Gagal memuat data absensi:", err);
    } finally {
      setFetchingData(false);
    }
  };

  // 1. Initial auth check & GPS request
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        setUserId(data.user.id);
        loadAttendanceData(data.user.id);
      } else {
        setFetchingData(false);
      }
    });

    startGpsWatch();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const checkedIn = Boolean(todayRecord?.check_in_at);
  const checkedOut = Boolean(todayRecord?.check_out_at);

  // Check In / Check Out Handler
  const handleAttendance = async () => {
    if (!userId) {
      alert("Harap login terlebih dahulu untuk melakukan absensi.");
      return;
    }

    try {
      setLoading(true);

      // Refresh GPS coordinate right at the moment of attendance
      const loc = (await requestLocation()) || currentLocation;

      if (!checkedIn) {
        // Perform CHECK IN (Server automatically sets time & date from server clock)
        await createAttendance({
          user_id: userId,
          attendance_date: "", // Server will overwrite with Asia/Jakarta server date
          check_in_latitude: loc?.latitude ?? null,
          check_in_longitude: loc?.longitude ?? null,
          check_in_accuracy: loc?.accuracy ?? null,
        });

        await loadAttendanceData(userId);
        alert("Check-in berhasil dicatat menggunakan waktu server!");
      } else if (!checkedOut) {
        // Perform CHECK OUT (Server automatically sets check_out_at from server clock)
        await updateAttendance({
          id: todayRecord?.id,
          user_id: userId,
          check_out_latitude: loc?.latitude ?? null,
          check_out_longitude: loc?.longitude ?? null,
          check_out_accuracy: loc?.accuracy ?? null,
        });

        await loadAttendanceData(userId);
        alert("Check-out berhasil dicatat menggunakan waktu server!");
      }
    } catch (err: any) {
      console.error("Gagal menyimpan absensi:", err);
      alert(err?.response?.data?.error || "Gagal memproses absensi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Absensi
              </h1>
              {serverSynced && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                  <ShieldCheck size={11} />
                  Waktu Server Terverifikasi ({getTimezoneLabel(APP_TIMEZONE)})
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Absensi terproteksi dengan pencatatan waktu otomatis dari server.
            </p>
          </div>

          <button
            onClick={() => {
              syncServerTime();
              if (userId) loadAttendanceData(userId);
              requestLocation();
            }}
            disabled={fetchingData}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={fetchingData ? "animate-spin" : ""} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
              STATUS HARI INI
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {checkedOut
                ? "Selesai"
                : checkedIn
                  ? `Sudah Check In (${mapDisplayStatus(todayRecord?.status)})`
                  : "Belum Absen"}
            </h2>
            <p className="mt-1 text-[9px] text-slate-500">
              Status kehadiran kamu
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
              JAM MASUK
            </p>
            <h2 className="mt-1 text-lg font-bold text-emerald-700">
              {formatTimeOnly(todayRecord?.check_in_at)}
            </h2>
            <p className="mt-1 text-[9px] text-slate-500">
              Waktu check in (Waktu Server)
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-[9px] font-medium uppercase tracking-wide text-slate-500">
              JAM PULANG
            </p>
            <h2 className="mt-1 text-lg font-bold text-blue-600">
              {formatTimeOnly(todayRecord?.check_out_at)}
            </h2>
            <p className="mt-1 text-[9px] text-slate-500">
              Waktu check out (Waktu Server)
            </p>
          </div>
        </div>

        {/* Main Attendance */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          {/* Check In Card */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-xs font-semibold text-slate-800">
                Absensi Hari Ini
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-medium text-blue-700">
                <Calendar size={11} />
                {currentDate || "Hari ini"}
              </span>
            </div>

            <div className="space-y-4 p-4">
              {/* Time */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-5 text-center">
                <Clock className="mx-auto mb-2 h-6 w-6 text-blue-600" />

                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  {currentTime || "--:--:--"}
                </h2>

                <p className="mt-1 text-[10px] text-slate-500">
                  Waktu Server ({getTimezoneLabel(APP_TIMEZONE)}) · Terproteksi dari manipulasi jam perangkat
                </p>
              </div>

              {/* Location */}
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <MapPin size={17} className="text-blue-600" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-slate-800">
                      Lokasi Absensi
                    </h4>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {currentLocation
                        ? `Koordinat: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
                        : "Lokasi GPS dicatat saat melakukan absensi."}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-medium ${
                      currentLocation
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {detectingGps
                      ? "Mencari GPS..."
                      : currentLocation
                        ? "Terdeteksi"
                        : "Belum terdeteksi"}
                  </span>
                </div>

                {/* Map Preview or Coordinates Display */}
                {currentLocation ? (
                  <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <iframe
                      title="Lokasi Absensi"
                      width="100%"
                      height="160"
                      className="border-0"
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}&z=15&output=embed`}
                    />
                  </div>
                ) : (
                  <div className="mt-3 flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                    <MapPinned size={28} className="text-slate-300" />
                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      Pratinjau Peta
                    </p>
                    <p className="mt-1 text-center text-[9px] text-slate-400">
                      {locationStatus}
                    </p>
                    <button
                      type="button"
                      onClick={() => requestLocation()}
                      className="mt-2 rounded bg-slate-200 px-2 py-1 text-[9px] font-medium text-slate-700 hover:bg-slate-300"
                    >
                      Perbarui Lokasi GPS
                    </button>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Akurasi GPS
                  </span>
                  <span className="text-[10px] font-medium text-slate-700">
                    {currentLocation?.accuracy != null
                      ? `± ${currentLocation.accuracy} meter`
                      : "--"}
                  </span>
                </div>
              </div>

              {/* Attendance Button */}
              <button
                onClick={handleAttendance}
                disabled={loading || checkedOut || fetchingData}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
                  checkedIn
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading || fetchingData ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : checkedIn ? (
                  <LogOut size={15} />
                ) : (
                  <LogIn size={15} />
                )}

                {loading
                  ? "Menyimpan ke Database..."
                  : fetchingData
                    ? "Memuat status..."
                    : checkedOut
                      ? "Absensi Hari Ini Selesai"
                      : checkedIn
                        ? "Check Out (Pulang)"
                        : "Check In (Masuk)"}
              </button>

              {checkedOut && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-[11px] text-emerald-700">
                  <CheckCircle2 size={16} />
                  Absensi hari ini telah selesai dicatat di database.
                </div>
              )}

              <p className="text-center text-[9px] text-slate-400">
                Waktu dan tanggal otomatis dicatat oleh server untuk menjamin keabsahan data.
              </p>
            </div>
          </div>

          {/* Attendance Information */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3 py-3">
              <h3 className="text-xs font-semibold text-slate-800">
                Informasi Absensi
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-start gap-3 px-3 py-3">
                <ShieldCheck size={15} className="mt-0.5 text-emerald-600" />
                <div>
                  <p className="text-[11px] font-medium text-slate-800">
                    Waktu Server Resmi
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Waktu check-in dan check-out dicatat murni oleh server ({getTimezoneLabel(APP_TIMEZONE)}), tidak terpengaruh perubahan waktu manual pada HP/laptop.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 px-3 py-3">
                <Clock size={15} className="mt-0.5 text-blue-600" />
                <div>
                  <p className="text-[11px] font-medium text-slate-800">
                    Jam Kerja &amp; Batas Terlambat
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    08:00 – 17:00 (Check in setelah pukul 08:15 WIB otomatis berstatus "Terlambat").
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 px-3 py-3">
                <MapPin size={15} className="mt-0.5 text-emerald-600" />
                <div>
                  <p className="text-[11px] font-medium text-slate-800">
                    Lokasi GPS
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                    Latitude, longitude, dan estimasi radius akurasi disimpan ke database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <History size={14} />
              Riwayat Absensi
            </h3>

            <span className="text-[10px] text-slate-500">
              {historyList.length} catatan tersimpan
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {historyList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {fetchingData
                  ? "Memuat riwayat absensi..."
                  : "Belum ada riwayat absensi di database."}
              </div>
            ) : (
              historyList.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Calendar size={16} className="text-slate-500" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-800">
                        {formatHistoryDate(item.attendance_date)}
                      </h4>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin size={10} />
                        {item.check_in_latitude && item.check_in_longitude ? (
                          <a
                            href={`https://maps.google.com/?q=${item.check_in_latitude},${item.check_in_longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {item.check_in_latitude.toFixed(4)}, {item.check_in_longitude.toFixed(4)}
                          </a>
                        ) : (
                          "Lokasi tidak tercatat"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400">Masuk</p>
                      <p className="text-[11px] font-medium text-slate-700">
                        {formatTimeOnly(item.check_in_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] text-slate-400">Pulang</p>
                      <p className="text-[11px] font-medium text-slate-700">
                        {formatTimeOnly(item.check_out_at)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-medium ${
                        mapDisplayStatus(item.status) === "Hadir"
                          ? "bg-emerald-50 text-emerald-700"
                          : mapDisplayStatus(item.status) === "Terlambat"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {mapDisplayStatus(item.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
