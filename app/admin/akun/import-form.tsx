"use client";

import { useActionState, useState, useTransition } from "react";
import {
  ACCOUNT_ROLES,
  CREATE_KEYS,
  FIELDS,
  MAX_IMPORT_ROWS,
  ROLE_LABELS,
  type AccountRole,
} from "@/lib/account-config";
import { importAccountsAction } from "./actions";
import {
  CredentialsPanel,
  Notice,
  inputClass,
  primaryButton,
  secondaryButton,
} from "./parts";

export default function ImportForm({
  fixedRole,
  defaultRole = "murid",
}: {
  /** Jika diisi, jenis akun dikunci (dipakai di dialog Tambah Akun). */
  fixedRole?: AccountRole;
  defaultRole?: AccountRole;
}) {
  const [role, setRole] = useState<AccountRole>(fixedRole ?? defaultRole);
  const [file, setFile] = useState<File | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [state, formAction, pending] = useActionState(
    importAccountsAction,
    null
  );
  const [, startTransition] = useTransition();

  function submit(mode: "preview" | "commit") {
    if (!file) return;

    const formData = new FormData();
    formData.set("role", role);
    formData.set("mode", mode);
    formData.set("file", file);

    setShowResult(true);
    startTransition(() => {
      formAction(formData);
    });
  }

  const result = showResult ? state : null;
  const keys = CREATE_KEYS[role];

  return (
    <div className="space-y-5">
      {!fixedRole && (
        <label className="block text-sm">
          <span className="mb-1.5 block font-bold">Impor akun untuk</span>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as AccountRole);
              setShowResult(false);
            }}
            className={inputClass}
          >
            {ACCOUNT_ROLES.map((item) => (
              <option key={item} value={item}>
                {ROLE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="rounded-md border border-blue-100 bg-blue-50/60 p-4 text-sm">
        <p className="font-bold">
          Isi file Excel untuk {ROLE_LABELS[role]}
        </p>
        <p className="mt-1 text-black/60">
          Satu baris untuk satu akun. Judul kolom ada di baris 1, data mulai
          baris 2.
        </p>

        <ul className="mt-3 space-y-1.5">
          {keys.map((key) => {
            const field = FIELDS[key];
            return (
              <li key={key}>
                <code className="rounded bg-white px-1.5 py-0.5 text-xs font-bold">
                  {field.header}
                </code>{" "}
                <span
                  className={
                    field.required ? "font-semibold text-red-700" : "text-black/50"
                  }
                >
                  {field.required ? "wajib" : "opsional"}
                </span>
                <span className="text-black/60"> - {field.note}</span>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-black/60">
          Password tidak perlu diisi. Sistem membuat password acak untuk tiap
          akun dan menampilkannya sekali setelah impor. Maksimal{" "}
          {MAX_IMPORT_ROWS} baris per unggahan.
        </p>

        <a
          href={`/api/admin/template/${role}`}
          className={`${secondaryButton} mt-3 inline-block`}
        >
          Unduh template {ROLE_LABELS[role]} (.xlsx)
        </a>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block font-bold">File Excel (.xlsx, maks. 1 MB)</span>
        <input
          type="file"
          accept=".xlsx"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setShowResult(false);
          }}
          className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-blue-700"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit("preview")}
          disabled={!file || pending}
          className={primaryButton}
        >
          {pending && result?.stage !== "committed" ? "Memeriksa..." : "Periksa file"}
        </button>

        {result?.ok && result.stage === "preview" && result.ready > 0 && (
          <button
            type="button"
            onClick={() => submit("commit")}
            disabled={pending}
            className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-500 disabled:opacity-50"
          >
            {pending ? "Membuat akun..." : `Buat ${result.ready} akun`}
          </button>
        )}
      </div>

      {result && (
        <div className="space-y-3">
          <Notice ok={result.ok}>{result.message}</Notice>

          {result.stage === "preview" && result.previewRows && (
            <div className="overflow-x-auto rounded-md border border-black/10">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-black/60">
                  <tr>
                    <th className="px-3 py-2 font-bold">Baris</th>
                    <th className="px-3 py-2 font-bold">Nama</th>
                    <th className="px-3 py-2 font-bold">Username</th>
                    <th className="px-3 py-2 font-bold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {result.previewRows.map((row) => (
                    <tr key={row.rowNumber} className="border-t border-black/5">
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2">{row.fullName}</td>
                      <td className="px-3 py-2">{row.username}</td>
                      <td className="px-3 py-2 text-black/60">{row.detail || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.ready > result.previewRows.length && (
                <p className="border-t border-black/5 px-3 py-2 text-xs text-black/50">
                  Menampilkan {result.previewRows.length} dari {result.ready} baris yang siap dibuat.
                </p>
              )}
            </div>
          )}

          {result.issues.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-bold text-amber-900">
                {result.issues.length} baris dilewati
              </p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-amber-900">
                {result.issues.slice(0, 50).map((issue) => (
                  <li key={issue.rowNumber}>
                    <b>Baris {issue.rowNumber}:</b> {issue.message}
                  </li>
                ))}
              </ul>
              {result.issues.length > 50 && (
                <p className="mt-2 text-xs">
                  dan {result.issues.length - 50} baris lainnya.
                </p>
              )}
            </div>
          )}

          {result.stage === "committed" && result.created && result.created.length > 0 && (
            <CredentialsPanel created={result.created} />
          )}
        </div>
      )}
    </div>
  );
}
