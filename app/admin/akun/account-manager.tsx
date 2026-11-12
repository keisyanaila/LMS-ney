
"use client";

import { useMemo, useState } from "react";
import {
  createAccount,
  updateAccount,
  toggleAccountStatus,
  deleteAccount,
  resetAccountPassword,
} from "./actions";

type Account = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: "active" | "inactive";
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  kepala_sekolah: "Kepala Sekolah",
  kurikulum: "Kurikulum",
  guru: "Guru",
  murid: "Murid",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const buttonPrimary =
  "rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800";

const buttonSecondary =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

function AccountFields({
  account,
}: {
  account?: Account;
}) {
  return (
    <>
      {account && (
        <input type="hidden" name="id" value={account.id} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          Nama lengkap
          <input
            name="fullName"
            defaultValue={account?.fullName}
            required
            maxLength={150}
            placeholder="Masukkan nama lengkap"
            className={inputClass}
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          Username
          <input
            name="username"
            defaultValue={account?.username}
            required
            maxLength={50}
            placeholder="Masukkan username"
            className={inputClass}
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          Email
          <input
            name="email"
            type="email"
            defaultValue={account?.email}
            required
            maxLength={150}
            placeholder="nama@email.com"
            className={inputClass}
          />
        </label>

        <label className="space-y-1.5 text-sm font-medium text-slate-700">
          Role
          <select
            name="role"
            defaultValue={account?.role ?? "murid"}
            required
            className={inputClass}
          >
            <option value="admin">Admin</option>
            <option value="kepala_sekolah">Kepala Sekolah</option>
            <option value="kurikulum">Kurikulum</option>
            <option value="guru">Guru</option>
            <option value="murid">Murid</option>
          </select>
        </label>
      </div>
    </>
  );
}

export default function AccountManager({
  accounts,
}: {
  accounts: Account[];
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAccounts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return accounts.filter((account) => {
      const matchesSearch =
        account.fullName.toLowerCase().includes(keyword) ||
        account.username.toLowerCase().includes(keyword) ||
        account.email.toLowerCase().includes(keyword);

      const matchesRole =
        roleFilter === "all" || account.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || account.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, search, roleFilter, statusFilter]);

  const activeCount = accounts.filter(
    (account) => account.status === "active"
  ).length;

  const inactiveCount = accounts.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total akun</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {accounts.length}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
          <p className="text-sm text-emerald-700">Akun aktif</p>
          <p className="mt-2 text-3xl font-bold text-emerald-800">
            {activeCount}
          </p>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-5">
          <p className="text-sm text-amber-700">Akun nonaktif</p>
          <p className="mt-2 text-3xl font-bold text-amber-800">
            {inactiveCount}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Akun
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Kelola seluruh akun pengguna LMS.
            </p>
          </div>

          <a href="#form-tambah-akun" className={buttonPrimary}>
            + Tambah Akun
          </a>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, username, email..."
            className={inputClass}
          />

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">Semua role</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3">Pengguna</th>
                <th className="px-3 py-3">Username</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredAccounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-3 py-4 font-semibold text-slate-800">
                    {account.fullName}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {account.username}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {account.email}
                  </td>
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {roleLabels[account.role] ?? account.role}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        account.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {account.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-2">
                      <details className="relative">
                        <summary className={`${buttonSecondary} cursor-pointer list-none`}>
                          Edit
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-[min(90vw,520px)] rounded-xl border border-slate-200 bg-white p-5 text-left shadow-xl">
                          <h3 className="mb-4 font-bold text-slate-900">
                            Edit Akun
                          </h3>
                          <form action={updateAccount} className="space-y-4">
                            <AccountFields account={account} />
                            <button type="submit" className={buttonPrimary}>
                              Simpan Perubahan
                            </button>
                          </form>
                        </div>
                      </details>

                      <form action={toggleAccountStatus}>
                        <input type="hidden" name="id" value={account.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={account.status === "active" ? "inactive" : "active"}
                        />
                        <button type="submit" className={buttonSecondary}>
                          {account.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>

                      <details className="relative">
                        <summary className={`${buttonSecondary} cursor-pointer list-none`}>
                          Password
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                          <h3 className="mb-3 font-bold text-slate-900">
                            Reset Password
                          </h3>
                          <form action={resetAccountPassword} className="space-y-3">
                            <input type="hidden" name="id" value={account.id} />
                            <input
                              name="password"
                              type="password"
                              minLength={8}
                              required
                              placeholder="Password baru"
                              className={inputClass}
                            />
                            <button type="submit" className={buttonPrimary}>
                              Simpan Password
                            </button>
                          </form>
                        </div>
                      </details>

                      <form
                        action={deleteAccount}
                        onSubmit={(event) => {
                          if (!window.confirm(`Hapus akun ${account.fullName}?`)) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="id" value={account.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Tidak ada akun yang sesuai dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Menampilkan {filteredAccounts.length} dari {accounts.length} akun.
        </p>
      </section>

      <section
        id="form-tambah-akun"
        className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-lg font-bold text-slate-900">
          Tambah Akun Baru
        </h2>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          Isi informasi pengguna untuk membuat akun LMS.
        </p>

        <form action={createAccount} className="space-y-5">
          <AccountFields />

          <label className="block max-w-md space-y-1.5 text-sm font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              minLength={8}
              required
              placeholder="Minimal 8 karakter"
              className={inputClass}
            />
          </label>

          <button type="submit" className={buttonPrimary}>
            Simpan Akun
          </button>
        </form>
      </section>
    </div>
  );
}
