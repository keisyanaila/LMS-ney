"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-blue-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Halaman ini gagal dimuat</h1>
        <p className="mt-3 text-sm text-black/60">
          Biasanya karena koneksi ke database terputus sebentar. Coba muat
          ulang. Kalau tetap gagal, hubungi admin sekolah.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Coba lagi
          </button>
          <Link
            href="/"
            className="rounded-lg border border-black/15 bg-white px-5 py-2.5 text-sm font-bold transition hover:bg-blue-100"
          >
            Ke beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
