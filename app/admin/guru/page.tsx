import { getNavItem } from "@/lib/admin-nav";
import { listDocs } from "@/lib/admin-data";
import { Button, Card, DataTable, ErrorNotice, PageHeader } from "@/components/admin/ui";

export default async function DataGuruPage() {
  const teachers = await listDocs("teachers");

  return (
    <>
      <PageHeader
        item={getNavItem("/admin/guru")}
        actions={<Button>+ Tambah Guru</Button>}
      />

      <Card>
        {teachers.ok ? (
          <DataTable
            columns={[
              { key: "nip", label: "NIP" },
              { key: "name", label: "Nama" },
              { key: "subjects", label: "Mata Pelajaran" },
              { key: "phone", label: "No. HP" },
              { key: "email", label: "Email" },
            ]}
            rows={teachers.data}
            emptyText="Belum ada data guru."
          />
        ) : (
          <ErrorNotice message={teachers.error} />
        )}
      </Card>
    </>
  );
}
