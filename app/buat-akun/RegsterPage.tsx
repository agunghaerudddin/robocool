"use client";

import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import axios from "axios";
import { createUser } from "../fetch/auth/register/fetch";

type RegisterProps = {
  user: User | null;
};

type UserRole = "owner" | "admin" | "karyawan" | "mitra";

export default function RegisterDemo({ user }: RegisterProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("mitra");
  const [status, setStatus] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSuccess(false);
    setLoading(true);

    try {
      const result = await createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        id: "",
        createdAt: "",
        updatedAt: "",
      });

      setIsSuccess(true);
      setStatus(
        result.message ||
          "Registrasi berhasil! Cek emailmu untuk konfirmasi akun.",
      );

      setName("");
      setEmail("");
      setPassword("");
      setRole("mitra");
    } catch (error: unknown) {
      let message = "Terjadi kesalahan. Silakan coba lagi.";

      if (axios.isAxiosError<{ message?: string }>(error)) {
        message =
          error.response?.data?.message ||
          "Registrasi gagal. Silakan coba lagi.";
      }

      setStatus(message);
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="rounded-[32px] border border-emerald-500/30 bg-[#05130d] p-8 text-center text-white shadow-xl">
        <h2 className="text-xl font-semibold">Kamu sudah terdaftar</h2>
        <p className="mt-3 text-sm text-slate-400">
          Login dengan akunmu: {user.email}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-[#05130d] via-[#04100c] to-[#0c2a21] p-8 text-slate-100 shadow-[0_35px_90px_rgba(2,6,23,0.65)]"
    >
      <div
        className="pointer-events-none absolute -left-4 -top-4 h-20 w-28 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.25),_transparent)] blur-lg"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-10 right-2 h-28 w-40 rounded-full bg-[linear-gradient(140deg,_rgba(45,212,191,0.32),_rgba(59,130,246,0.12))] blur-xl"
        aria-hidden="true"
      />

      <div className="relative">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            Create your account
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
            Create an account
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Daftar sekarang untuk mulai menggunakan aplikasi.
          </p>
        </div>

        <div className="space-y-5">
          <label className="block text-sm font-medium text-slate-200">
            Nama lengkap
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={100}
              required
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-4 py-3 text-base text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50"
              placeholder="Nama lengkapmu"
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              required
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-4 py-3 text-base text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50"
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="karyawan">Karyawan</option>
              <option value="mitra">Mitra</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-4 py-3 text-base text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50"
              placeholder="you@email.com"
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-4 py-3 text-base text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 disabled:opacity-50"
              placeholder="Minimal 8 karakter"
            />
            <span className="mt-2 block text-xs text-slate-500">
              Gunakan minimal 8 karakter.
            </span>
          </label>
        </div>

        {status && (
          <p
            role="status"
            aria-live="polite"
            className={`mt-5 rounded-xl border p-3 text-sm ${
              isSuccess
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {status}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Mendaftarkan akun..." : "Create account"}
        </button>

        <p className="mt-6 text-center text-sm text-slate-400">
          Sudah punya akun?{" "}
          <a
            href="/login"
            className="font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            Login
          </a>
        </p>
      </div>
    </form>
  );
}
