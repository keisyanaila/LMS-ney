"use client";

import { useActionState, useState } from "react";
import {
  ACCOUNT_ROLES,
  CREATE_KEYS,
  FIELDS,
  ROLE_HINTS,
  ROLE_LABELS,
  currentAcademicYear,
  type AccountRole,
} from "@/lib/account-config";
import { createAccountAction } from "./actions";
import ImportForm from "./import-form";
import {
  CredentialsPanel,
  FieldInput,
  Notice,
  primaryButton,
  secondaryButton,
  type ClassOption,
} from "./parts";

function ManualForm({
  role,
  classes,
  onAgain,
}: {
  role: AccountRole;
  classes: ClassOption[];
  onAgain: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createAccountAction,
    null
  );

  if (state?.ok && state.created) {
    return (
      <div className="space-y-4">
        <Notice ok>{state.message}</Notice>
        <CredentialsPanel created={state.created} />
        <button type="button" onClick={onAgain} className={secondaryButton}>
          Tambah akun {ROLE_LABELS[role]} lagi
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value={role} />

      <div className="grid gap-4 sm:grid-cols-2">
        {CREATE_KEYS[role].map((key) => (
          <FieldInput
            key={key}
            field={FIELDS[key]}
            classes={classes}
            defaultValue={
              key === "academicYear" ? currentAcademicYear() : undefined
            }
          />
        ))}
      </div>

      <p className="text-xs text-black/50">
        Password dibuat acak oleh sistem dan ditampilkan sekali setelah akun
        disimpan.
      </p>

      {state && !state.ok && <Notice ok={false}>{state.message}</Notice>}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Menyimpan..." : "Simpan akun"}
      </button>
    </form>
  );
}

export default function AddAccountFlow({
  classes,
  initialRole,
}: {
  classes: ClassOption[];
  initialRole: AccountRole | null;
}) {
  const [role, setRole] = useState<AccountRole | null>(initialRole);
  const [method, setMethod] = useState<"manual" | "excel">("manual");
  const [formKey, setFormKey] = useState(0);

  if (!role) {
    return (
      <div>
        <p className="mb-4 text-sm text-black/60">
          Akun ini untuk siapa? Pilih jenis akun, lalu isi data satu per satu
          atau impor dari Excel.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCOUNT_ROLES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className="rounded-lg border border-black/10 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <span className="block font-bold">{ROLE_LABELS[item]}</span>
              <span className="mt-1 block text-xs text-black/50">
                {ROLE_HINTS[item]}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          Jenis akun: <b>{ROLE_LABELS[role]}</b>
        </p>
        <button
          type="button"
          onClick={() => {
            setRole(null);
            setMethod("manual");
          }}
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          Ganti jenis akun
        </button>
      </div>

      <div className="flex gap-1 rounded-md bg-black/5 p-1 text-sm" role="tablist">
        {(
          [
            ["manual", "Isi manual"],
            ["excel", "Impor dari Excel"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={method === value}
            onClick={() => setMethod(value)}
            className={`flex-1 rounded px-3 py-2 font-semibold transition ${
              method === value ? "bg-white shadow-sm" : "text-black/60 hover:text-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {method === "manual" ? (
        <ManualForm
          key={`${role}-${formKey}`}
          role={role}
          classes={classes}
          onAgain={() => setFormKey((value) => value + 1)}
        />
      ) : (
        <ImportForm key={role} fixedRole={role} />
      )}
    </div>
  );
}
