"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createAssessment,
  createAttendanceSession,
  createMaterial,
  createTeachingClass,
  saveAttendance,
  saveScores,
  type FormState,
} from "./actions";

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
    <form ref={ref} action={action} className="space-y-2">
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

export function MaterialForm({ tcId }: { tcId: number }) {
  const [state, action, pending] = useActionState(
    createMaterial.bind(null, String(tcId)),
    null
  );
  const ref = useResetOnSuccess(state);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input
        name="title"
        placeholder="Judul materi"
        className={inputClass}
        required
      />
      <textarea
        name="description"
        placeholder="Ringkasan atau isi materi (opsional)"
        rows={4}
        className={inputClass}
      />
      <input
        name="linkUrl"
        type="url"
        placeholder="Link materi, mis. Google Drive atau YouTube (opsional)"
        className={inputClass}
      />

      <Message state={state} />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : "Tambah Materi"}
      </button>
    </form>
  );
}

// ---------- Tugas / penilaian ----------

export function AssessmentForm({
  tcId,
  mode,
}: {
  tcId: number;
  mode: "tugas" | "lainnya";
}) {
  const [state, action, pending] = useActionState(
    createAssessment.bind(null, String(tcId), mode),
    null
  );
  const ref = useResetOnSuccess(state);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {mode === "lainnya" && (
          <select name="kind" className={inputClass} defaultValue="kuis">
            <option value="kuis">Kuis</option>
            <option value="uts">UTS</option>
            <option value="uas">UAS</option>
            <option value="praktik">Praktik</option>
          </select>
        )}

        <input
          name="title"
          placeholder={mode === "tugas" ? "Judul tugas" : "Judul penilaian"}
          className={`${inputClass} ${mode === "tugas" ? "sm:col-span-2" : ""}`}
          required
        />
      </div>

      <textarea
        name="instructions"
        placeholder="Instruksi (opsional)"
        rows={3}
        className={inputClass}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold">
            Tenggat / tanggal (WIB)
          </span>
          <input name="dueAt" type="datetime-local" className={inputClass} />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-semibold">Nilai maksimal</span>
          <input
            name="maxScore"
            type="number"
            min={1}
            max={1000}
            defaultValue={100}
            className={inputClass}
          />
        </label>
      </div>

      <Message state={state} />

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : mode === "tugas" ? "Buat Tugas" : "Buat Penilaian"}
      </button>
    </form>
  );
}

export type ScoreRow = {
  studentId: number;
  fullName: string;
  studentNumber: string | null;
  submissionLabel: string;
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
    <form action={action} className="space-y-4">
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
                  {row.submissionLabel}
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
    <form action={action} className="space-y-2">
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
    <form action={action} className="space-y-4">
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
