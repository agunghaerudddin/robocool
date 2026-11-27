"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Wrench, Lock, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";

type LoginProps = {
  user: User | null;
};

export default function LoginDemo({ user }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      let targetUrl = "/dashboard";
      if (data?.user) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const role = dbUser?.role;
        if (role === 4) {
          targetUrl = "/tugas";
        }
      }

      router.replace(targetUrl);
      router.refresh();
    } catch (err) {
      setStatus(
        err instanceof Error
          ? err.message
          : "Gagal masuk. Periksa kembali email dan kata sandi Anda.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#f7f9fc] p-4 text-slate-800">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wrench className="h-6 w-6 text-[#5555e7]" />
          </div>
          <h1 className="text-base font-bold text-slate-900">Anda sudah masuk</h1>
          <p className="mt-1 text-xs text-slate-500">{user.email}</p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => {
                router.replace("/dashboard");
              }}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#5555e7] text-xs font-semibold text-white shadow-sm transition hover:bg-[#4646cb]"
            >
              Ke Halaman Utama <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.refresh();
              }}
              className="flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Keluar Akun
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f7f9fc] px-4 py-12 text-slate-800">
      <div className="w-full max-w-[380px]">
        {/* Brand Logo & Title */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
            <Wrench className="h-5 w-5 text-[#5555e7]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#5555e7]">
            Robocool
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Sistem Manajemen Layanan & Operasional AC
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-900">Selamat Datang</h2>
            <p className="text-[11px] text-slate-500">
              Masuk dengan akun yang terdaftar untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-[11px] font-medium text-slate-700"
              >
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  placeholder="nama@email.com"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#5555e7] focus:bg-white focus:ring-1 focus:ring-[#5555e7]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-[11px] font-medium text-slate-700"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan kata sandi"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#5555e7] focus:bg-white focus:ring-1 focus:ring-[#5555e7]"
                />
              </div>
            </div>

            {status && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[11px] leading-relaxed text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span>{status}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#5555e7] text-xs font-semibold text-white shadow-sm transition hover:bg-[#4646cb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[10px] text-slate-400">
          &copy; {new Date().getFullYear()} Robocool. Hak Cipta Dilindungi.
        </p>
      </div>
    </main>
  );
}
