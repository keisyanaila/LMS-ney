"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Modal from "@/components/admin/Modal";
import {
  createClass,
  createMajor,
  updateClass,
  type FormState,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-blue-500";

const primaryButton =
  "rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50";

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

        <button type="submit" disabled={pending} className={primaryButton}>
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

type ClassValues = {
  id: number;
  name: string;
  majorId: number;
  homeroomTeacherId: number | null;
};

/** Isian kelas yang sama untuk form tambah dan form ubah. */
function ClassFields({
  majors,
  teachers,
  values,
}: {
  majors: MajorOption[];
  teachers: TeacherOption[];
  values?: ClassValues;
}) {
  return (
    <>
      <input
        name="name"
        placeholder="Nama kelas (mis. X PPLG 1)"
        defaultValue={values?.name}
        className={inputClass}
        required
      />

      <select
        name="majorId"
        className={inputClass}
        required
        defaultValue={values ? String(values.majorId) : ""}
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
        defaultValue={
          values?.homeroomTeacherId ? String(values.homeroomTeacherId) : ""
        }
      >
        <option value="">Belum ada wali kelas</option>

        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.fullName}
          </option>
        ))}
      </select>
    </>
  );
}

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
        Tambahkan jurusan dulu (di bagian Jurusan di bawah) sebelum membuat
        kelas.
      </p>
    );
  }

  return (
    <form ref={ref} action={action} className="mb-6 space-y-2">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <ClassFields majors={majors} teachers={teachers} />

        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan..." : "Tambah Kelas"}
        </button>
      </div>

      <Message state={state} />
    </form>
  );
}

function EditClassForm({
  cls,
  majors,
  teachers,
  onDone,
}: {
  cls: ClassValues;
  majors: MajorOption[];
  teachers: TeacherOption[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(
    updateClass.bind(null, String(cls.id)),
    null
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3">
        <ClassFields majors={majors} teachers={teachers} values={cls} />
      </div>

      <Message state={state} />

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}

export function EditClassButton({
  cls,
  majors,
  teachers,
  variant = "link",
}: {
  cls: ClassValues;
  majors: MajorOption[];
  teachers: TeacherOption[];
  variant?: "link" | "button";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === "button"
            ? "rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-black/5"
            : "text-xs font-semibold text-blue-700 hover:underline"
        }
      >
        Ubah
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Ubah kelas ${cls.name}`}
      >
        <EditClassForm
          cls={cls}
          majors={majors}
          teachers={teachers}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
