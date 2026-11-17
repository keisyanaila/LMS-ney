import Link from "next/link";
import { getNavItem } from "@/lib/admin-nav";
import { listDocs } from "@/lib/admin-data";
import { Card, DataTable, ErrorNotice, PageHeader } from "@/components/admin/ui";

export default async function DataMuridPage() {
  const students = await listDocs("students", 1000);

  return (
    <>
      <PageHeader
        item={getNavItem("/admin/murid")}
        actions={
          <Link
            href="/admin/akun?tambah=murid"
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            + Tambah murid
          </Link>
        }
      />

      <Card>
        {students.ok ? (
          <DataTable
            columns={[
              { key: "studentNumber", label: "NIS" },
              { key: "fullName", label: "Nama" },
              { key: "className", label: "Kelas" },
              { key: "major", label: "Jurusan" },
              { key: "academicYear", label: "Tahun Ajaran" },
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
