"use client";

import { useState, type ReactNode } from "react";
import {
  ROLE_LABELS,
  type AccountField,
  type CreatedAccount,
} from "@/lib/account-config";

export const inputClass =
  "w-full rounded-xl border border-violet-100 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10";

export const primaryButton =
  "rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "rounded-full border border-violet-100 bg-white px-3 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50";

export type ClassOption = { id: number; name: string };

export function FieldInput({
  field,
  classes,
  defaultValue,
}: {
  field: AccountField;
  classes: ClassOption[];
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-bold">
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </span>

      {field.input === "class" ? (
        <select
          name={field.key}
          defaultValue={defaultValue ?? ""}
          required={field.required}
          className={inputClass}
        >
          <option value="">Pilih kelas</option>
          {classes.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={field.key}
          type={field.input === "email" ? "email" : "text"}
          defaultValue={defaultValue}
          required={field.required}
          placeholder={field.example}
          maxLength={field.maxLength}
          className={inputClass}
        />
      )}

      <span className="mt-1 block text-xs text-black/50">{field.note}</span>
    </label>
  );
}

export function Notice({
  ok,
  children,
}: {
  ok: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`rounded-md border p-3 text-sm ${
        ok
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {children}
    </div>
  );
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCredentials(created: CreatedAccount[]) {
  const lines = [
    ["Nama", "Username", "Password", "Jenis akun"].join(","),
    ...created.map((item) =>
      [
        item.fullName,
        item.username,
        item.password,
        ROLE_LABELS[item.role],
      ]
        .map(csvCell)
        .join(",")
    ),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `akun-baru-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CopyButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard bisa diblokir browser; pengguna masih bisa menyalin manual.
        }
      }}
      className="text-xs font-semibold text-blue-700 hover:underline"
    >
      {copied ? "Tersalin" : label}
    </button>
  );
}

/** Menampilkan username dan password acak sekali setelah akun dibuat. */
export function CredentialsPanel({ created }: { created: CreatedAccount[] }) {
  return (
    <div className="space-y-3">
      <Notice ok={false}>
        <b>Simpan password ini sekarang.</b> Password hanya ditampilkan sekali
        dan tidak bisa dilihat lagi. Jika hilang, atur ulang lewat tombol
        Password di daftar akun.
      </Notice>

      <div className="max-h-72 overflow-auto rounded-md border border-black/10">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs text-black/60">
            <tr>
              <th className="px-3 py-2 font-bold">Nama</th>
              <th className="px-3 py-2 font-bold">Username</th>
              <th className="px-3 py-2 font-bold">Password</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {created.map((item) => (
              <tr key={item.username} className="border-t border-black/5">
                <td className="px-3 py-2">{item.fullName}</td>
                <td className="px-3 py-2">{item.username}</td>
                <td className="px-3 py-2 font-mono">{item.password}</td>
                <td className="px-3 py-2 text-right">
                  <CopyButton
                    value={`${item.username} / ${item.password}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => downloadCredentials(created)}
        className={secondaryButton}
      >
        Unduh daftar akun (CSV)
      </button>
    </div>
  );
}
