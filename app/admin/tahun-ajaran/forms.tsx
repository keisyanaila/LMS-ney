"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Modal from "@/components/admin/Modal";
import {
  createAcademicYear,
  setActiveAcademicYear,
  updateAcademicYear,
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

export function YearForm() {
  const [state, action, pending] = useActionState(createAcademicYear, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="mb-6 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          name="name"
          placeholder="Tahun ajaran (mis. 2026/2027)"
          className={`${inputClass} sm:max-w-xs`}
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            className="h-4 w-4 accent-blue-600"
          />
          Jadikan aktif
        </label>

        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan..." : "Tambah"}
        </button>
      </div>

      <Message state={state} />
    </form>
  );
}

export function SetActiveButton({ id, name }: { id: number; name: string }) {
  return (
    <form
      action={setActiveAcademicYear.bind(null, String(id))}
      onSubmit={(event) => {
        if (!confirm(`Jadikan ${name} sebagai tahun ajaran aktif?`)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-xs font-semibold text-blue-700 hover:underline"
      >
        Jadikan aktif
      </button>
    </form>
  );
}

function EditYearForm({
  id,
  name,
  onDone,
}: {
  id: number;
  name: string;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(
    updateAcademicYear.bind(null, String(id)),
    null
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-3">
      <input
        name="name"
        defaultValue={name}
        placeholder="2026/2027"
        className={inputClass}
        required
      />

      <p className="text-xs text-black/50">
        Murid yang memakai tahun ajaran ini ikut diperbarui.
      </p>

      <Message state={state} />

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}

export function EditYearButton({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-blue-700 hover:underline"
      >
        Ubah
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Ubah tahun ajaran ${name}`}
      >
        <EditYearForm id={id} name={name} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
