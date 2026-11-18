import Link from "next/link";
import { getNavItem } from "@/lib/admin-nav";
import { getDashboardData } from "@/lib/admin-data";
import {
  ACCOUNT_ROLES,
  ROLE_LABELS,
  isAccountRole,
} from "@/lib/account-config";
import { Card, DataTable, ErrorNotice, PageHeader } from "@/components/admin/ui";

export default async function AdminDashboardPage() {
  const result = await getDashboardData();

  const actions = (
    <>
      <Link
        href="/admin/akun?tambah=1"
        className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
      >
        + Tambah akun
      </Link>
      <Link
        href="/admin/ekspor"
        className="rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-black/5"
      >
        Ekspor Data
      </Link>
    </>
  );

  if (!result.ok) {
    return (
      <>
        <PageHeader item={getNavItem("/admin")} actions={actions} />
        <ErrorNotice message={result.error} />
      </>
    );
  }

  const data = result.data;
  const maxStudents = Math.max(1, ...data.studentsPerClass.map((c) => c.total));

  const attention: { text: string; href: string }[] = [];
  if (data.studentsWithoutClass > 0) {
    attention.push({
      text: `${data.studentsWithoutClass} murid belum punya kelas`,
      href: "/admin/akun?role=murid",
    });
  }
  if (data.classesWithoutHomeroom > 0) {
    attention.push({
      text: `${data.classesWithoutHomeroom} kelas belum punya wali kelas`,
      href: "/admin/kelas",
    });
  }
  if (data.inactiveAccounts > 0) {
    attention.push({
      text: `${data.inactiveAccounts} akun nonaktif`,
      href: "/admin/akun",
    });
  }

  return (
    <>
      <PageHeader item={getNavItem("/admin")} actions={actions} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Link
          href="/admin/akun"
          className="rounded-lg border border-black/10 bg-white p-5 transition hover:border-blue-300"
        >
          <div className="text-3xl font-bold">{data.totalAccounts}</div>
          <div className="text-sm text-black/50">Total akun</div>
        </Link>

        {ACCOUNT_ROLES.map((role) => (
          <Link
            key={role}
            href={`/admin/akun?role=${role}`}
            className="rounded-lg border border-black/10 bg-white p-5 transition hover:border-blue-300"
          >
            <div className="text-3xl font-bold">{data.roleCounts[role] ?? 0}</div>
            <div className="text-sm text-black/50">{ROLE_LABELS[role]}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Murid per kelas" className="lg:col-span-2">
          {data.studentsPerClass.length === 0 ? (
            <p className="text-sm text-black/50">
              Belum ada kelas.{" "}
              <Link href="/admin/kelas" className="font-semibold text-blue-700 hover:underline">
                Buat kelas
              </Link>{" "}
              agar murid bisa dimasukkan ke kelas.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.studentsPerClass.map((item) => (
                <li key={item.name} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 truncate font-semibold">{item.name}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-black/5">
                    <div
                      className="h-2.5 rounded-full bg-blue-600"
                      style={{ width: `${(item.total / maxStudents) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right tabular-nums text-black/60">
                    {item.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-black/40">
            {data.majorCount} jurusan, {data.classCount} kelas.
          </p>
        </Card>

        <Card title="Perlu dicek">
          {attention.length === 0 ? (
            <p className="text-sm text-black/50">Tidak ada yang perlu ditindaklanjuti.</p>
          ) : (
            <ul className="space-y-2">
              {attention.map((item) => (
                <li key={item.text}>
                  <Link
                    href={item.href}
                    className="block rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 transition hover:bg-amber-100"
                  >
                    {item.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Akun terbaru">
          <DataTable
            columns={[
              { key: "fullName", label: "Nama" },
              { key: "roleLabel", label: "Jenis" },
              { key: "createdAt", label: "Dibuat" },
            ]}
            rows={data.recentAccounts.map((row) => ({
              ...row,
              roleLabel: isAccountRole(String(row.role))
                ? ROLE_LABELS[row.role as keyof typeof ROLE_LABELS]
                : row.role,
            }))}
            emptyText="Belum ada akun."
          />
        </Card>

        <Card title="Aktivitas terbaru">
          <DataTable
            columns={[
              { key: "createdAt", label: "Waktu" },
              { key: "userName", label: "Pengguna" },
              { key: "action", label: "Aktivitas" },
            ]}
            rows={data.recentLogs}
            emptyText="Belum ada aktivitas tercatat."
          />
        </Card>
      </div>
    </>
  );
}
