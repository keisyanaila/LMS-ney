
"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createClass,
  createMajor,
  type FormState,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

function Message({ state }: { state: FormState }) {
  if (!state) return null;

  return (
    <p className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
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

export function DeleteButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm(`Hapus ${label}?`)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-xs font-semibold text-red-600 hover:underline"
      >
        Hapus
      </button>
    </form>
  );
}

export function MajorForm() {
  const [state, action, pending] = useActionState(createMajor, null);
  const ref = useResetOnSuccess(state);

  return (
    <form ref={ref} action={action} className="mb-4 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="code"
          placeholder="Kode (mis. PPLG)"
          className={`${inputClass} sm:w-32`}
          required
        />

        <input
          name="name"
          placeholder="Nama jurusan"
          className={inputClass}
          required
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Tambah"}
        </button>
      </div>

      <Message state={state} />
    </form>
  );
}

type MajorOption = {
  id: number;
  code: string;
  name: string;
};

type TeacherOption = {
  id: number;
  fullName: string;
};

export function ClassForm({
  majors,
  teachers,
}: {
  majors: MajorOption[];
  teachers: TeacherOption[];
}) {
  const [state, action, pending] = useActionState(createClass, null);
  const ref = useResetOnSuccess(state);

  if (majors.length === 0) {
    return (
      <p className="mb-4 text-sm text-black/50">
        Tambahkan jurusan dulu sebelum membuat kelas.
      </p>
    );
  }

  return (
    <form ref={ref} action={action} className="mb-4 space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="name"
          placeholder="Nama kelas (mis. X PPLG 1)"
          className={inputClass}
          required
        />

        <select
          name="majorId"
          className={inputClass}
          required
          defaultValue=""
        >
          <option value="" disabled>
            Pilih jurusan
          </option>

          {majors.map((major) => (
            <option key={major.id} value={major.id}>
              {major.code} - {major.name}
            </option>
          ))}
        </select>

        <select
          name="homeroomTeacherId"
          className={inputClass}
          defaultValue=""
        >
          <option value="">Belum ada wali kelas</option>

          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.fullName}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Tambah Kelas"}
        </button>
      </div>

      <Message state={state} />
    </form>
  );
}
