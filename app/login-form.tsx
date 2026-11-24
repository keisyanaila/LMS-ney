"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";
import { safeSubmit } from "@/lib/safe-submit";

// Lima pita warna dari palet Learnova.
const STRIPES = [
  { color: "#8b1d3f", grow: 19 },
  { color: "#6b0e2e", grow: 21 },
  { color: "#4a0e1f", grow: 21 },
  { color: "#450629", grow: 20 },
  { color: "#3e0825", grow: 19 },
];

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-black/35 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      {/* Sisi kiri: pita warna + sapaan */}
      <section
        className="relative flex h-56 shrink-0 items-end overflow-hidden lg:h-auto lg:w-1/2"
      >
        <div className="absolute inset-0 flex" aria-hidden="true">
          {STRIPES.map((stripe, index) => (
            <div
              key={stripe.color}
              className="stripe-rise h-full"
              style={{
                backgroundColor: stripe.color,
                flexGrow: stripe.grow,
                flexBasis: 0,
                animationDelay: `${index * 90}ms`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-8 text-white sm:p-12 lg:p-16">
          <p className="text-lg font-semibold tracking-wide text-blue-100">
            Learnova
          </p>
          <h1 className="mt-3 max-w-md text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Kelas, tugas, dan nilai dalam satu tempat.
          </h1>
        </div>
      </section>

      {/* Sisi kanan: form */}
      <section className="flex flex-1 items-center justify-center bg-blue-50 px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
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
