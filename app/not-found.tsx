import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-blue-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm text-black/60">
          Alamatnya mungkin salah atau halamannya sudah dihapus.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Ke beranda
        </Link>
      </div>
    </main>
  );
}
