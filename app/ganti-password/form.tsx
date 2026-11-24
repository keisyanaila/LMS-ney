"use client";

import { safeSubmit } from "@/lib/safe-submit";
import { useActionState } from "react";
import { changePassword } from "@/app/actions/password";

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-blue-500";

export default function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState(changePassword, null);

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-4">
      {!forced && (
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Password saat ini</span>
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Password baru</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-black/50">
          Minimal 8 karakter. Bebas, pilih yang mudah Anda ingat tapi sulit
          ditebak orang lain.
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Ulangi password baru</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          className={inputClass}
        />
      </label>

      {state?.message && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Password Baru"}
      </button>
    </form>
  );
}
