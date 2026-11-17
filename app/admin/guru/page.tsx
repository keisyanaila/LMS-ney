import Link from "next/link";
import { getNavItem } from "@/lib/admin-nav";
import { listDocs } from "@/lib/admin-data";
import { Card, DataTable, ErrorNotice, PageHeader } from "@/components/admin/ui";

export default async function DataGuruPage() {
  const teachers = await listDocs("teachers", 500);

  return (
    <>
      <PageHeader
        item={getNavItem("/admin/guru")}
        actions={
          <Link
            href="/admin/akun?tambah=guru"
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            + Tambah guru
          </Link>
        }
      />

      <Card>
        {teachers.ok ? (
          <DataTable
            columns={[
              { key: "teacherNumber", label: "NIP / NUPTK" },
              { key: "fullName", label: "Nama" },
              { key: "subject", label: "Mata Pelajaran" },
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
