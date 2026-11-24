"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Modal from "@/components/admin/Modal";
import {
  ACCOUNT_ROLES,
  EDIT_KEYS,
  FIELDS,
  ROLE_LABELS,
  isAccountRole,
  type AccountRole,
  type SimpleResult,
} from "@/lib/account-config";
import {
  deleteAccount,
  resetAccountPassword,
  toggleAccountStatus,
  updateAccount,
} from "./actions";
import AddAccountFlow from "./add-account";
import {
  CopyButton,
  FieldInput,
  Notice,
  inputClass,
  primaryButton,
  secondaryButton,
  type ClassOption,
} from "./parts";

export type Account = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  studentNumber: string | null;
  className: string | null;
  academicYear: string | null;
  teacherNumber: string | null;
  subject: string | null;
  phone: string | null;
};

function detailOf(account: Account) {
  if (account.role === "murid") {
    return [
      account.studentNumber && `NIS ${account.studentNumber}`,
      account.className,
      account.academicYear,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (account.role === "guru") {
    return [account.subject, account.teacherNumber && `NIP ${account.teacherNumber}`]
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

function valueOf(account: Account, key: keyof typeof FIELDS): string {
  switch (key) {
    case "fullName":
      return account.fullName;
    case "username":
      return account.username;
    case "email":
      return account.email;
    case "studentNumber":
      return account.studentNumber ?? "";
    case "className":
      return account.className ?? "";
    case "academicYear":
      return account.academicYear ?? "";
    case "teacherNumber":
      return account.teacherNumber ?? "";
    case "subject":
      return account.subject ?? "";
    case "phone":
      return account.phone ?? "";
  }
}

function EditDialogBody({
  account,
  classes,
  onSaved,
}: {
  account: Account;
  classes: ClassOption[];
  onSaved: (message: string) => void;
}) {
  const [state, formAction, pending] = useActionState(updateAccount, null);
  const role = account.role as AccountRole;

  useEffect(() => {
    if (state?.ok) onSaved(state.message);
  }, [state, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={account.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        {EDIT_KEYS[role].map((key) => (
          <FieldInput
            key={key}
            field={FIELDS[key]}
            classes={classes}
            defaultValue={valueOf(account, key)}
          />
        ))}
      </div>

      {state && !state.ok && <Notice ok={false}>{state.message}</Notice>}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Menyimpan..." : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}

export default function AccountManager({
  accounts,
  classes,
  initialFilter,
  initialAdd,
}: {
  accounts: Account[];
  classes: ClassOption[];
  /** Filter jenis akun awal, mis. dari kartu dashboard. */
  initialFilter: string | null;
  /** "" = buka dialog tambah akun tanpa jenis; "murid" dst = langsung ke jenis itu. */
  initialAdd: string | null;
}) {
  const [roleTab, setRoleTab] = useState<string>(
    initialFilter && isAccountRole(initialFilter) ? initialFilter : "all"
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [addOpen, setAddOpen] = useState(initialAdd !== null);
  const [addRole, setAddRole] = useState<AccountRole | null>(
    initialAdd && isAccountRole(initialAdd) ? initialAdd : null
  );
  const [addKey, setAddKey] = useState(0);

  const [editing, setEditing] = useState<Account | null>(null);
  const [resetResult, setResetResult] = useState<SimpleResult | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const [notice, setNotice] = useState<SimpleResult | null>(null);
  const [busy, startTransition] = useTransition();

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: accounts.length };
    for (const role of ACCOUNT_ROLES) {
      result[role] = accounts.filter((a) => a.role === role).length;
    }
    return result;
  }, [accounts]);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return accounts.filter((account) => {
      if (roleTab !== "all" && account.role !== roleTab) return false;
      if (statusFilter !== "all" && account.status !== statusFilter) return false;
      if (!keyword) return true;

      return [
        account.fullName,
        account.username,
        account.email,
        account.studentNumber,
        account.teacherNumber,
        account.className,
      ].some((value) => value?.toLowerCase().includes(keyword));
    });
  }, [accounts, roleTab, search, statusFilter]);

  const inactiveCount = accounts.filter((a) => a.status === "inactive").length;

  function openAdd(role: AccountRole | null) {
    setAddRole(role);
    setAddKey((value) => value + 1);
    setAddOpen(true);
  }

  function run(
    action: (formData: FormData) => Promise<SimpleResult>,
    fields: Record<string, string>,
    onDone?: (result: SimpleResult) => void
  ) {
    const formData = new FormData();
    for (const [name, value] of Object.entries(fields)) formData.set(name, value);

    startTransition(async () => {
      const result = await action(formData);
      if (onDone) onDone(result);
      else setNotice(result);
    });
  }

  return (
    <div className="space-y-5">
      {notice && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Notice ok={notice.ok}>{notice.message}</Notice>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-sm text-black/50 hover:text-black"
          >
            Tutup
          </button>
        </div>
      )}

      <section className="admin-panel rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Daftar akun</h2>
            <p className="mt-0.5 text-sm text-black/50">
              {accounts.length} akun, {inactiveCount} nonaktif.
            </p>
          </div>
          <button type="button" onClick={() => openAdd(null)} className={primaryButton}>
            + Tambah akun
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="tablist">
          {[["all", "Semua"], ...ACCOUNT_ROLES.map((r) => [r, ROLE_LABELS[r]])].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={roleTab === value}
                onClick={() => setRoleTab(value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  roleTab === value
                    ? "border-violet-300 bg-violet-100 font-bold text-violet-800 shadow-sm"
                    : "border-violet-100 bg-white text-slate-600 hover:bg-violet-50"
                }`}
              >
                {label} <span className="text-xs text-black/40">{counts[value]}</span>
              </button>
            )
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, username, email, NIS, NIP, kelas"
            aria-label="Cari akun"
            className={inputClass}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter status"
            className={inputClass}
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-violet-100 bg-violet-50/80 text-xs text-violet-900">
                <th className="px-3 py-4 font-bold">Nama</th>
                <th className="px-3 py-4 font-bold">Username</th>
                <th className="px-3 py-4 font-bold">Jenis</th>
                <th className="px-3 py-4 font-bold">Data</th>
                <th className="px-3 py-4 font-bold">Status</th>
                <th className="px-3 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => (
                <tr key={account.id} className="border-b border-violet-100/80 transition hover:bg-violet-50/50">
                  <td className="px-3 py-3.5">
                    <div className="font-semibold">{account.fullName}</div>
                    <div className="text-xs text-black/50">{account.email}</div>
                  </td>
                  <td className="px-3 py-3.5">{account.username}</td>
                  <td className="px-3 py-3.5">
                    <span className="inline-block rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                      {isAccountRole(account.role) ? ROLE_LABELS[account.role] : account.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-black/60">{detailOf(account) || "-"}</td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                        account.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-black/5 text-black/60"
                      }`}
                    >
                      {account.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => setEditing(account)} className={secondaryButton}>
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Buat password baru untuk ${account.fullName}? Password lama tidak berlaku lagi.`
                            )
                          ) {
                            return;
                          }
                          run(resetAccountPassword, { id: String(account.id) }, (result) => {
                            setResetResult(result);
                            setResetOpen(true);
                          });
                        }}
                        className={secondaryButton}
                      >
                        Password
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(toggleAccountStatus, {
                            id: String(account.id),
                            status: account.status === "active" ? "inactive" : "active",
                          })
                        }
                        className={secondaryButton}
                      >
                        {account.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Hapus akun ${account.fullName}? Tindakan ini tidak bisa dibatalkan.`)) {
                            run(deleteAccount, { id: String(account.id) });
                          }
                        }}
                        className="rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-black/50">
                    {accounts.length === 0
                      ? "Belum ada akun. Klik Tambah akun untuk membuat yang pertama."
                      : "Tidak ada akun yang sesuai dengan filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-black/40">
          Menampilkan {filtered.length} dari {accounts.length} akun.
        </p>
      </section>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah akun" wide>
        <AddAccountFlow key={addKey} classes={classes} initialRole={addRole} />
      </Modal>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit akun ${ROLE_LABELS[editing.role as AccountRole] ?? ""}` : "Edit akun"}
      >
        {editing && (
          <EditDialogBody
            account={editing}
            classes={classes}
            onSaved={(message) => {
              setEditing(null);
              setNotice({ ok: true, message });
            }}
          />
        )}
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Password baru">
        {resetResult && (
          <div className="space-y-4">
            <Notice ok={resetResult.ok}>{resetResult.message}</Notice>
            {resetResult.ok && resetResult.password && (
              <>
                <div className="flex items-center justify-between gap-3 rounded-md border border-black/10 bg-slate-50 p-4">
                  <code className="text-lg font-bold tracking-wide">{resetResult.password}</code>
                  <CopyButton value={resetResult.password} />
                </div>
                <p className="text-sm text-black/60">
                  Password ini hanya ditampilkan sekali. Berikan ke pemilik
                  akun, lalu sarankan menggantinya setelah login.
                </p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
