import Link from "next/link";
import { adminNav, getNavItem } from "@/lib/admin-nav";
import { countDocs, listDocs } from "@/lib/admin-data";
import { Card, DataTable, ErrorNotice, PageHeader } from "@/components/admin/ui";

const stats = [
  { key: "users", label: "Total Akun" },
  { key: "teachers", label: "Guru" },
  { key: "students", label: "Murid" },
  { key: "classes", label: "Kelas" },
] as const;

export default async function AdminDashboardPage() {
  const [counts, logs] = await Promise.all([
    countDocs(stats.map((s) => s.key)),
    listDocs("logs", 5),
  ]);

  return (
    <>
      <PageHeader item={getNavItem("/admin")} />

      {!counts.ok && (
        <div className="mb-6">
          <ErrorNotice message={counts.error} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="rounded-lg border border-black/10 bg-white p-5"
          >
            <div className="text-3xl font-bold">
              {counts.ok ? counts.data[stat.key] : "—"}
            </div>
            <div className="text-sm text-black/50">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Aktivitas Terbaru" className="lg:col-span-2">
          {logs.ok ? (
            <DataTable
              columns={[
                { key: "createdAt", label: "Waktu" },
                { key: "user", label: "Pengguna" },
                { key: "action", label: "Aktivitas" },
              ]}
              rows={logs.data}
              emptyText="Belum ada aktivitas tercatat."
            />
          ) : (
            <ErrorNotice message={logs.error} />
          )}
        </Card>

        <Card title="Akses Cepat">
          <div className="grid grid-cols-2 gap-2">
            {adminNav.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-black/10 px-3 py-2 text-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
