import { getNavItem } from "@/lib/admin-nav";
import { listDocs } from "@/lib/admin-data";
import { Card, DataTable, ErrorNotice, PageHeader } from "@/components/admin/ui";

export default async function LogAktivitasPage() {
  const logs = await listDocs("logs", 100);

  return (
    <>
      <PageHeader item={getNavItem("/admin/log")} />

      <Card>
        {logs.ok ? (
          <DataTable
            columns={[
              { key: "createdAt", label: "Waktu" },
              { key: "userName", label: "Pengguna" },
              { key: "role", label: "Role" },
              { key: "action", label: "Aktivitas" },
            ]}
            rows={logs.data}
            emptyText="Belum ada aktivitas tercatat."
          />
        ) : (
          <ErrorNotice message={logs.error} />
        )}
        <p className="mt-4 text-xs text-black/40">
          Menampilkan 100 aktivitas terbaru.
        </p>
      </Card>
    </>
  );
}
