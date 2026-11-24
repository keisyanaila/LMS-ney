"use client";

import { safeSubmit } from "@/lib/safe-submit";
import { useActionState, useState } from "react";
import {
  saveEssayGrades,
  saveQuestion,
  type OnlineFormState,
} from "./online-actions";

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

const primaryButton =
  "rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50";

function Message({ state }: { state: OnlineFormState }) {
  if (!state) return null;

  return (
    <p
      role="status"
      className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}
    >
      {state.message}
    </p>
  );
}

const OPTION_SLOTS = 6;

export type QuestionInitial = {
  id: number;
  type: "pilihan_ganda" | "esai";
  text: string;
  options: string[] | null;
  correctIndex: number | null;
  points: number;
};

export function QuestionForm({
  tcId,
  assessmentId,
  question,
}: {
  tcId: number;
  assessmentId: number;
  question?: QuestionInitial;
}) {
  const [formKey, setFormKey] = useState(0);
  const [type, setType] = useState(question?.type ?? "pilihan_ganda");

  const [state, action, pending] = useActionState(
    async (prev: OnlineFormState, formData: FormData) => {
      const result = await saveQuestion(
        String(tcId),
        String(assessmentId),
        String(question?.id ?? 0),
        prev,
        formData
      );

      // Soal baru berhasil disimpan: kosongkan form untuk soal berikutnya.
      if (result?.ok && !question) setFormKey((key) => key + 1);

      return result;
    },
    null
  );

  return (
    <form
      key={formKey}
      onSubmit={safeSubmit(action)}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-semibold">Jenis soal</span>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className={inputClass}
          >
            <option value="pilihan_ganda">Pilihan ganda (dinilai otomatis)</option>
            <option value="esai">Esai (dinilai guru)</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Poin</span>
          <input
            name="points"
            type="number"
            min={1}
            max={100}
            defaultValue={question?.points ?? 1}
            className={inputClass}
          />
        </label>
      </div>

      <textarea
        name="text"
        rows={3}
        required
        defaultValue={question?.text}
        placeholder="Tulis pertanyaan di sini"
        className={inputClass}
      />

      {type === "pilihan_ganda" && (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-semibold">
            Pilihan jawaban (isi minimal 2, pilih satu yang benar)
          </legend>
          {Array.from({ length: OPTION_SLOTS }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                value={i}
                defaultChecked={question ? i === question.correctIndex : i === 0}
                aria-label={`Jawaban benar adalah pilihan ${i + 1}`}
              />
              <input
                name={`option-${i}`}
                defaultValue={question?.options?.[i] ?? ""}
                placeholder={`Pilihan ${String.fromCharCode(65 + i)}${i >= 2 ? " (opsional)" : ""}`}
                className={inputClass}
              />
            </div>
          ))}
        </fieldset>
      )}

      <Message state={state} />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending
          ? "Menyimpan..."
          : question
            ? "Simpan Perubahan"
            : "Tambah Soal"}
      </button>
    </form>
  );
}

export type EssayRow = {
  questionId: number;
  number: number;
  text: string;
  answer: string;
  maxPoints: number;
  awarded: number | null;
};

export function EssayGradeForm({
  tcId,
  assessmentId,
  studentId,
  rows,
}: {
  tcId: number;
  assessmentId: number;
  studentId: number;
  rows: EssayRow[];
}) {
  const [state, action, pending] = useActionState(
    saveEssayGrades.bind(
      null,
      String(tcId),
      String(assessmentId),
      String(studentId)
    ),
    null
  );

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-5">
      {rows.map((row) => (
        <div
          key={row.questionId}
          className="rounded-md border border-black/10 p-4"
        >
          <p className="text-sm font-semibold">
            Soal {row.number}. {row.text}
          </p>
          <p className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-black/70">
            {row.answer || "(tidak dijawab)"}
          </p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <span className="font-semibold">Poin (maks {row.maxPoints})</span>
            <input
              name={`points-${row.questionId}`}
              type="number"
              step="0.01"
              min={0}
              max={row.maxPoints}
              defaultValue={row.awarded ?? ""}
              className={`${inputClass} w-24`}
            />
          </label>
        </div>
      ))}

      <Message state={state} />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : "Simpan Penilaian Esai"}
      </button>
    </form>
  );
}
