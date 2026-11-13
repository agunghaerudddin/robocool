"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setStatus(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020907] p-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-emerald-500/20 bg-[#0b1b18] p-8 text-center">
          <h1 className="text-2xl font-bold">You're logged in!</h1>
          <p className="mt-3 text-sm text-slate-400">{user.email}</p>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.refresh();
            }}
            className="mt-6 rounded-full bg-emerald-500 px-6 py-3 font-semibold hover:bg-emerald-400"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020907] px-4 py-12 text-slate-100">
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-[#05130d] via-[#04100c] to-[#0c2a21] p-8 shadow-[0_35px_90px_rgba(2,6,23,0.65)] sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-bold text-white">
              A
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Account access
            </p>

            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to your account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-medium text-slate-200">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                placeholder="Enter your password"
              />
            </label>

            {status && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {status}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-xs text-slate-600">
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    </main>
  );
}
