"use client";

import { useState } from "react";
import axios from "axios";
import { createUser } from "../fetch/auth/register/fetch";

type UserRole = "owner" | "admin" | "karyawan" | "mitra";

export default function RegisterDemo() {
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
          "Pengguna baru berhasil didaftarkan! Cek email untuk konfirmasi akun.",
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
          "Pendaftaran akun gagal. Silakan coba lagi.";
      }

      setStatus(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-5 text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Pengguna Baru
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tambah Pengguna
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Daftarkan akun baru untuk mengakses sistem.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nama Lengkap
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={100}
                required
                disabled={loading}
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 disabled:opacity-50"
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Role
              </label>

              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 disabled:opacity-50"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="karyawan">Karyawan</option>
                <option value="mitra">Mitra (Teknisi)</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={loading}
                placeholder="email@contoh.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                disabled={loading}
                placeholder="Minimal 8 karakter"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 disabled:opacity-50"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Minimal 8 karakter.
              </p>
            </div>

            {/* Status */}
            {status && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-lg border p-3 text-sm ${
                  isSuccess
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {status}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Mendaftarkan akun..." : "Buat Akun"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Pastikan data pengguna sudah benar sebelum mendaftar.
        </p>
      </div>
    </div>
  );
}
