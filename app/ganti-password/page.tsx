import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { HOME_BY_ROLE } from "@/lib/roles";
import { logout } from "@/app/actions/auth";
import ChangePasswordForm from "./form";

export const metadata: Metadata = {
  title: "Ganti Password | RoboLearn",
};

export default async function GantiPasswordPage() {
  const user = await requireUser();
  const forced = user.mustChangePassword;
  const home = HOME_BY_ROLE[user.role] ?? "/";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">
          {forced ? "Buat password baru" : "Ganti password"}
        </h1>
        <p className="mt-2 mb-6 text-sm text-black/60">
          {forced
            ? `Halo, ${user.fullName}. Password Anda masih sementara dari sekolah. Buat password sendiri sebelum melanjutkan.`
            : "Masukkan password saat ini, lalu pilih password baru."}
        </p>

        <ChangePasswordForm forced={forced} />

        <div className="mt-6 flex items-center justify-between text-sm">
          {forced ? (
            <form action={logout}>
              <button type="submit" className="text-black/50 hover:text-black">
                Keluar
              </button>
            </form>
          ) : (
            <Link href={home} className="text-black/50 hover:text-black">
              &larr; Kembali
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
