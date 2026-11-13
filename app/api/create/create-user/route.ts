import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ROLE_VALUES = {
  owner: 1,
  admin: 2,
  karyawan: 3,
  mitra: 4,
} as const;

type UserRole = keyof typeof ROLE_VALUES;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const password = typeof body.password === "string" ? body.password : "";

    const role: UserRole | null =
      typeof body.role === "string" && Object.hasOwn(ROLE_VALUES, body.role)
        ? (body.role as UserRole)
        : null;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          message: "Nama, email, password, dan role wajib diisi dengan benar.",
        },
        { status: 400 },
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { message: "Nama maksimal 100 karakter." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!supabaseUrl || !supabaseKey || !siteUrl) {
      console.error("Missing Supabase environment variables.");

      return NextResponse.json(
        { message: "Konfigurasi server belum lengkap." },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL("/welcome", siteUrl).toString(),
        data: {
          name,
          role: ROLE_VALUES[role],
        },
      },
    });

    if (error) {
      console.error("Registration failed:", {
        message: error.message,
        code: error.code,
        status: error.status,
      });

      return NextResponse.json(
        {
          message: error.message,
          code: error.code,
        },
        { status: 400 },
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { message: "Registrasi gagal. Silakan coba lagi." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Registrasi berhasil! Cek emailmu untuk konfirmasi akun.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unexpected registration error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
