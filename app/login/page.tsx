"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-blue-950 text-white">

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">

        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-black shadow-2xl">

          <Link
            href="/"
            className="mb-8 inline-block text-sm font-bold text-blue-600"
          >
            ← Kembali
          </Link>

          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white">
            N
          </div>

          <h1 className="text-3xl font-black">
            Selamat datang
          </h1>

          <p className="mt-2 text-sm text-black/50">
            Masuk untuk melanjutkan pembelajaranmu.
          </p>

          <form className="mt-8 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-bold">
                Email / Username
              </label>

              <input
                type="text"
                placeholder="Masukkan email atau username"
                className="
                  w-full
                  rounded-xl
                  border
                  border-black/10
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Password
              </label>

              <input
                type="password"
                placeholder="Masukkan password"
                className="
                  w-full
                  rounded-xl
                  border
                  border-black/10
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />
            </div>

            <button
              type="submit"
              className="
                w-full
                rounded-xl
                bg-blue-600
                py-4
                font-black
                text-white
                transition
                hover:-translate-y-1
                hover:bg-blue-500
              "
            >
              MASUK →
            </button>

          </form>

        </div>

      </div>

    </main>
  );
}
