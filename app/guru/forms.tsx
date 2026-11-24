"use client";

import { safeSubmit } from "@/lib/safe-submit";
import { useActionState, useEffect, useRef } from "react";
import { useState } from "react";
import {
  createAnnouncement,
  createAssessment,
  createAttendanceSession,
  createMaterial,
  createTeachingClass,
  saveAttendance,
  saveScores,
  saveWeights,
  updateAssessment,
  updateMaterial,
  type FormState,
} from "./actions";
import { ACCEPT_ATTRIBUTE, MAX_UPLOAD_LABEL } from "@/lib/upload-config";

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

const primaryButton =
  "rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50";

function Message({ state }: { state: FormState }) {
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

function useResetOnSuccess(state: FormState) {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return ref;
}

// ---------- Kelas ajar ----------

export function TeachingClassForm({
  classOptions,
  defaultSubject,
}: {
  classOptions: { id: number; name: string; majorCode: string }[];
  defaultSubject: string;
}) {
  const [state, action, pending] = useActionState(createTeachingClass, null);
  const ref = useResetOnSuccess(state);

  if (classOptions.length === 0) {
    return (
      <p className="text-sm text-black/50">
        Belum ada kelas di sekolah. Minta admin menambahkan kelas terlebih
        dahulu.
      </p>
    );
  }

  return (
    <form ref={ref} onSubmit={safeSubmit(action)} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          name="classId"
          className={inputClass}
          required
          defaultValue=""
        >
          <option value="" disabled>
            Pilih kelas
          </option>
          {classOptions.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} ({cls.majorCode})
            </option>
          ))}
        </select>

        <input
          name="subject"
          placeholder="Mata pelajaran"
          defaultValue={defaultSubject}
          className={inputClass}
          required
        />

        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan..." : "Tambah Kelas Ajar"}
        </button>
      </div>

      <Message state={state} />
    </form>
  );
}

// ---------- Materi ----------

type BoundAction = (prev: FormState, formData: FormData) => Promise<FormState>;

function FileField({ hint }: { hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">Lampiran file (opsional)</span>
      <input
        name="file"
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
      />
      <span className="mt-1 block text-xs text-black/50">
        {hint ?? `PDF, Word, PowerPoint, Excel, gambar, atau ZIP. Maksimal ${MAX_UPLOAD_LABEL}.`}
      </span>
    </label>
  );
}

function MaterialFields({
  initial,
}: {
  initial?: {
    title: string;
    description: string | null;
    linkUrl: string | null;
    fileName: string | null;
  };
}) {
  return (
    <>
      <input
        name="title"
        placeholder="Judul materi"
        defaultValue={initial?.title}
        className={inputClass}
        required
      />
      <textarea
        name="description"
        placeholder="Ringkasan atau penjelasan materi (opsional)"
        rows={4}
        defaultValue={initial?.description ?? ""}
        className={inputClass}
      />
      <input
        name="linkUrl"
        type="url"
        placeholder="Link materi, mis. Google Drive atau YouTube (opsional)"
        defaultValue={initial?.linkUrl ?? ""}
        className={inputClass}
      />
      <FileField
        hint={
          initial?.fileName
            ? `File saat ini: ${initial.fileName}. Pilih file baru untuk menggantinya.`
            : undefined
        }
      />
      {initial?.fileName && (
        <label className="flex items-center gap-2 text-sm text-black/70">
          <input type="checkbox" name="removeFile" />
          Hapus file saat ini
        </label>
      )}
    </>
  );
}

export function MaterialForm({ tcId }: { tcId: number }) {
  const [state, action, pending] = useActionState(
    createMaterial.bind(null, String(tcId)),
    null
  );
  const ref = useResetOnSuccess(state);

  return (
    <form ref={ref} onSubmit={safeSubmit(action)} className="space-y-3">
      <MaterialFields />
      <Message state={state} />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : "Tambah Materi"}
      </button>
    </form>
  );
}

export function MaterialEditForm({
  tcId,
  material,
}: {
  tcId: number;
  material: {
    id: number;
    title: string;
    description: string | null;
    linkUrl: string | null;
    fileName: string | null;
  };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateMaterial.bind(null, String(tcId), String(material.id)) as BoundAction,
    null
  );

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-3">
      <MaterialFields initial={material} />
      <Message state={state} />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}

// ---------- Pengumuman ----------

export function AnnouncementForm({ tcId }: { tcId: number }) {
  const [state, action, pending] = useActionState(
    createAnnouncement.bind(null, String(tcId)),
    null
  );
  const ref = useResetOnSuccess(state);

  return (
    <form ref={ref} onSubmit={safeSubmit(action)} className="space-y-3">
      <input
        name="title"
        placeholder="Judul pengumuman"
        className={inputClass}
        required
      />
      <textarea
        name="body"
        placeholder="Isi pengumuman untuk murid di kelas ini"
        rows={4}
        className={inputClass}
        required
      />
      <Message state={state} />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Mengirim..." : "Kirim Pengumuman"}
      </button>
    </form>
  );
}

// ---------- Tugas / penilaian ----------

type AssessmentMode = "tugas" | "kuis" | "ujian" | "lainnya";

type AssessmentInitial = {
  title: string;
  instructions: string | null;
  dueAt: string;
  maxScore: number;
  opensAt?: string;
  durationMinutes?: number | null;
  showResult?: boolean;
};

const MODE_LABELS: Record<AssessmentMode, { noun: string; due: string }> = {
  tugas: { noun: "tugas", due: "Tenggat (WIB)" },
  kuis: { noun: "kuis", due: "Ditutup pada (WIB)" },
  ujian: { noun: "ujian", due: "Ditutup pada (WIB)" },
  lainnya: { noun: "penilaian praktik", due: "Tanggal (WIB)" },
};

function AssessmentFields({
  mode,
  initial,
}: {
  mode: AssessmentMode;
  initial?: AssessmentInitial;
}) {
  const online = mode === "kuis" || mode === "ujian";

  return (
    <>
      {mode === "ujian" && !initial && (
        <select name="kind" className={inputClass} defaultValue="uts">
          <option value="uts">UTS</option>
          <option value="uas">UAS</option>
        </select>
      )}

      <input
        name="title"
        placeholder={`Judul ${MODE_LABELS[mode].noun}`}
        defaultValue={initial?.title}
        className={inputClass}
        required
      />

      <textarea
        name="instructions"
        placeholder="Petunjuk untuk murid (opsional)"
        rows={3}
        defaultValue={initial?.instructions ?? ""}
        className={inputClass}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {online && (
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Dibuka pada (WIB)</span>
            <input
              name="opensAt"
              type="datetime-local"
              defaultValue={initial?.opensAt}
              className={inputClass}
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-semibold">
            {MODE_LABELS[mode].due}
          </span>
          <input
            name="dueAt"
            type="datetime-local"
            defaultValue={initial?.dueAt}
            className={inputClass}
          />
        </label>

        {online && (
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">
              Durasi pengerjaan (menit)
            </span>
            <input
              name="durationMinutes"
              type="number"
              min={1}
              max={600}
              defaultValue={initial?.durationMinutes ?? ""}
              placeholder="Kosongkan = tanpa batas durasi"
              className={inputClass}
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Nilai maksimal</span>
          <input
            name="maxScore"
            type="number"
            min={1}
            max={1000}
            defaultValue={initial?.maxScore ?? 100}
            className={inputClass}
          />
        </label>
      </div>

      {online && (
        <label className="flex items-start gap-2 text-sm text-black/70">
          <input
            type="checkbox"
            name="showResult"
            defaultChecked={initial?.showResult ?? false}
            className="mt-0.5"
          />
          <span>
            Tampilkan nilai dan pembahasan ke siswa setelah selesai. Biarkan
            kosong jika ingin merilis nilai nanti secara manual.
          </span>
        </label>
      )}
    </>
  );
}

export function AssessmentForm({
  tcId,
  mode,
}: {
  tcId: number;
  mode: AssessmentMode;
}) {
  const [state, action, pending] = useActionState(
    createAssessment.bind(null, String(tcId), mode),
    null
  );
  const ref = useResetOnSuccess(state);

  return (
    <form ref={ref} onSubmit={safeSubmit(action)} className="space-y-3">
      <AssessmentFields mode={mode} />
      <Message state={state} />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : `Buat ${MODE_LABELS[mode].noun}`}
      </button>
    </form>
  );
}

const MODE_BY_KIND: Record<string, AssessmentMode> = {
  tugas: "tugas",
  kuis: "kuis",
  uts: "ujian",
  uas: "ujian",
  praktik: "lainnya",
};

export function AssessmentEditForm({
  tcId,
  assessment,
}: {
  tcId: number;
  assessment: AssessmentInitial & { id: number; kind: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateAssessment.bind(
      null,
      String(tcId),
      String(assessment.id)
    ) as BoundAction,
    null
  );

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-3">
      <AssessmentFields
        mode={MODE_BY_KIND[assessment.kind] ?? "tugas"}
        initial={assessment}
      />
      <Message state={state} />
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}

// ---------- Bobot nilai ----------

const WEIGHT_FIELDS = [
  { kind: "tugas", label: "Tugas" },
  { kind: "kuis", label: "Kuis" },
  { kind: "uts", label: "UTS" },
  { kind: "uas", label: "UAS" },
  { kind: "praktik", label: "Praktik" },
] as const;

export function WeightsForm({
  tcId,
  current,
}: {
  tcId: number;
  current: Partial<Record<string, number>> | null;
}) {
  const [state, action, pending] = useActionState(
    saveWeights.bind(null, String(tcId)),
    null
  );

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      WEIGHT_FIELDS.map((f) => [f.kind, String(current?.[f.kind] ?? "")])
    )
  );

  const total = WEIGHT_FIELDS.reduce(
    (sum, f) => sum + (Number(values[f.kind]) || 0),
    0
  );

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-5">
        {WEIGHT_FIELDS.map((field) => (
          <label key={field.kind} className="block text-sm">
            <span className="mb-1 block font-semibold">{field.label} (%)</span>
            <input
              name={`weight-${field.kind}`}
              type="number"
              min={0}
              max={100}
              value={values[field.kind]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.kind]: e.target.value }))
              }
              placeholder="0"
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <p
        className={`text-sm font-semibold ${
          total === 100 ? "text-green-700" : "text-black/60"
        }`}
      >
        Total: {total} / 100
      </p>

      <Message state={state} />

      <button
        type="submit"
        disabled={pending || total !== 100}
        className={primaryButton}
      >
        {pending ? "Menyimpan..." : "Simpan Bobot"}
      </button>
    </form>
  );
}

export type ScoreRow = {
  studentId: number;
  fullName: string;
  studentNumber: string | null;
  submissionLabel: string;
  answer: string | null;
  linkUrl: string | null;
  fileId: number | null;
  fileName: string | null;
  score: number | null;
  feedback: string | null;
};

export function ScoreForm({
  tcId,
  assessmentId,
  maxScore,
  rows,
}: {
  tcId: number;
  assessmentId: number;
  maxScore: number;
  rows: ScoreRow[];
}) {
  const [state, action, pending] = useActionState(
    saveScores.bind(null, String(tcId), String(assessmentId)),
    null
  );

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-black/10 p-10 text-center text-sm text-black/50">
        Kelas ini belum punya murid.
      </p>
    );
  }

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
              <th className="px-3 py-3 font-bold">Murid</th>
              <th className="px-3 py-3 font-bold">Pengumpulan</th>
              <th className="px-3 py-3 font-bold">Nilai (maks {maxScore})</th>
              <th className="px-3 py-3 font-bold">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.studentId} className="border-b border-black/5">
                <td className="px-3 py-2">
                  <div className="font-semibold">{row.fullName}</div>
                  <div className="text-xs text-black/50">
                    {row.studentNumber ?? "—"}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-black/60">
                  <div>{row.submissionLabel}</div>
                  {row.fileId && (
                    <a
                      href={`/api/files/${row.fileId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all font-semibold text-blue-700 hover:underline"
                    >
                      {row.fileName ?? "Unduh file"}
                    </a>
                  )}
                  {row.linkUrl && (
                    <a
                      href={row.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all font-semibold text-blue-700 hover:underline"
                    >
                      Buka link
                    </a>
                  )}
                  {row.answer && (
                    <details className="mt-1">
                      <summary className="cursor-pointer font-semibold text-blue-700">
                        Lihat jawaban
                      </summary>
                      <p className="mt-1 whitespace-pre-wrap text-black/70">
                        {row.answer}
                      </p>
                    </details>
                  )}
                </td>
                <td className="px-3 py-2">
                  <input
                    name={`score-${row.studentId}`}
                    type="number"
                    step="0.01"
                    min={0}
                    max={maxScore}
                    defaultValue={row.score ?? ""}
                    className={`${inputClass} w-24`}
                    aria-label={`Nilai ${row.fullName}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    name={`feedback-${row.studentId}`}
                    defaultValue={row.feedback ?? ""}
                    placeholder="Opsional"
                    className={inputClass}
                    aria-label={`Catatan untuk ${row.fullName}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Message state={state} />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : "Simpan Nilai"}
      </button>
    </form>
  );
}

// ---------- Kehadiran ----------

export function AttendanceSessionForm({
  tcId,
  today,
}: {
  tcId: number;
  today: string;
}) {
  const [state, action, pending] = useActionState(
    createAttendanceSession.bind(null, String(tcId)),
    null
  );

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          name="meetingDate"
          type="date"
          defaultValue={today}
          className={inputClass}
          required
        />
        <input
          name="topic"
          placeholder="Topik pertemuan (opsional)"
          className={inputClass}
        />
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Membuat..." : "Buat Pertemuan"}
        </button>
      </div>

      <Message state={state} />
    </form>
  );
}

export type AttendanceRow = {
  studentId: number;
  fullName: string;
  studentNumber: string | null;
  status: "hadir" | "izin" | "sakit" | "alpa";
  note: string | null;
};

const STATUS_OPTIONS: { value: AttendanceRow["status"]; label: string }[] = [
  { value: "hadir", label: "Hadir" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "alpa", label: "Alpa" },
];

export function AttendanceForm({
  tcId,
  sessionId,
  rows,
}: {
  tcId: number;
  sessionId: number;
  rows: AttendanceRow[];
}) {
  const [state, action, pending] = useActionState(
    saveAttendance.bind(null, String(tcId), String(sessionId)),
    null
  );

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-black/10 p-10 text-center text-sm text-black/50">
        Kelas ini belum punya murid.
      </p>
    );
  }

  return (
    <form onSubmit={safeSubmit(action)} className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
              <th className="px-3 py-3 font-bold">Murid</th>
              <th className="px-3 py-3 font-bold">Status</th>
              <th className="px-3 py-3 font-bold">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.studentId} className="border-b border-black/5">
                <td className="px-3 py-2">
                  <div className="font-semibold">{row.fullName}</div>
                  <div className="text-xs text-black/50">
                    {row.studentNumber ?? "—"}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-3">
                    {STATUS_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-1.5 text-sm"
                      >
                        <input
                          type="radio"
                          name={`status-${row.studentId}`}
                          value={option.value}
                          defaultChecked={row.status === option.value}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    name={`note-${row.studentId}`}
                    defaultValue={row.note ?? ""}
                    placeholder="Opsional"
                    maxLength={200}
                    className={inputClass}
                    aria-label={`Keterangan ${row.fullName}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Message state={state} />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : "Simpan Kehadiran"}
      </button>
    </form>
  );
}
