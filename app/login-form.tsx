"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";
import { safeSubmit } from "@/lib/safe-submit";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-black/35 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      {/* Sisi kiri: maskot + sapaan */}
      <section className="relative flex min-h-[280px] shrink-0 items-center overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 lg:min-h-0 lg:w-1/2">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full border-[40px] border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

        <div className="relative z-10 max-w-md p-8 text-white sm:p-12 lg:p-16">
          <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide">
            Belajar lebih cerdas, bersama-sama
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Kelas, tugas, dan nilai dalam satu tempat.
          </h1>
        </div>

        <img
          src="/robolearn-mascot.png"
          alt="Maskot robot RoboLearn"
          className="pointer-events-none absolute -bottom-6 -right-6 h-48 w-auto drop-shadow-2xl sm:h-64 lg:bottom-8 lg:right-6 lg:h-[420px]"
        />
      </section>

      {/* Sisi kanan: form */}
      <section className="flex flex-1 items-center justify-center bg-blue-50 px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <img src="/robolearn-logo.png" alt="RoboLearn" className="mb-6 h-12 w-auto" />
          <h2 className="text-2xl font-bold">Masuk</h2>
          <p className="mt-2 text-sm text-black/60">
            Pakai email atau username dari sekolah.
          </p>

          <form
            onSubmit={safeSubmit(formAction)}
            className="mt-8 space-y-5"
          >
            <div>
              <label htmlFor="identifier" className="mb-2 block text-sm font-semibold">
                Email atau username
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
                placeholder="nama@sekolah.sch.id"
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  {showPassword ? "Sembunyikan" : "Tampilkan"}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className={inputClass}
              />
            </div>

            {state?.message && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-blue-600 px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? "Memeriksa..." : "Masuk"}
            </button>
          </form>

          <p className="mt-8 text-sm text-black/55">
            Lupa password atau belum punya akun? Minta admin sekolah untuk
            membuatkan atau mengatur ulang.
          </p>
        </div>
      </section>
    </main>
  );
}
