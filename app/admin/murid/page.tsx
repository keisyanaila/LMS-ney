import { getNavItem } from "@/lib/admin-nav";
import { listDocs } from "@/lib/admin-data";
import { Button, Card, DataTable, ErrorNotice, PageHeader } from "@/components/admin/ui";

export default async function DataMuridPage() {
  const students = await listDocs("students");

  return (
    <>
      <PageHeader
        item={getNavItem("/admin/murid")}
        actions={<Button>+ Tambah Murid</Button>}
      />

      <Card>
        {students.ok ? (
          <DataTable
            columns={[
              { key: "nis", label: "NIS" },
              { key: "name", label: "Nama" },
              { key: "className", label: "Kelas" },
              { key: "major", label: "Jurusan" },
              { key: "gender", label: "L/P" },
            ]}
            rows={students.data}
            emptyText="Belum ada data murid."
          />
        ) : (
          <ErrorNotice message={students.error} />
        )}
      </Card>
    </>
  );
}
