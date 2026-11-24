"use client";

import { safeSubmit } from "@/lib/safe-submit";
import { useActionState } from "react";
import { submitAssignment, type SubmitState } from "./actions";
import { ACCEPT_ATTRIBUTE, MAX_UPLOAD_LABEL } from "@/lib/upload-config";

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

export function SubmitForm({
  tcId,
  assessmentId,
  initial,
}: {
  tcId: number;
  assessmentId: number;
  initial: {
    answer: string | null;
    linkUrl: string | null;
    fileName: string | null;
    alreadySubmitted: boolean;
  };
}) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitAssignment.bind(null, String(tcId), String(assessmentId)),
    null
  );

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Jawaban (opsional)</span>
        <textarea
          name="answer"
          rows={5}
          defaultValue={initial.answer ?? ""}
          placeholder="Tulis jawaban Anda di sini"
          className={inputClass}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold">Link (opsional)</span>
        <input
          name="linkUrl"
          type="url"
          defaultValue={initial.linkUrl ?? ""}
          placeholder="Mis. link Google Drive atau YouTube"
          className={inputClass}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-semibold">File (opsional)</span>
        <input
          name="file"
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
        <span className="mt-1 block text-xs text-black/50">
          {initial.fileName
            ? `File terkumpul: ${initial.fileName}. Pilih file baru untuk menggantinya. `
            : ""}
          PDF, Word, PowerPoint, Excel, gambar, atau ZIP. Maksimal{" "}
          {MAX_UPLOAD_LABEL}.
        </span>
      </label>

      {state && (
        <p
          role="status"
          className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {pending
          ? "Mengirim..."
          : initial.alreadySubmitted
            ? "Perbarui Pengumpulan"
            : "Kumpulkan Tugas"}
      </button>
    </form>
  );
}
