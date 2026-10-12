import { getNavItem } from "@/lib/admin-nav";
import { listDocs } from "@/lib/admin-data";
import { Button, Card, DataTable, ErrorNotice, PageHeader } from "@/components/admin/ui";

export default async function ManajemenAkunPage() {
  const users = await listDocs("users");

  return (
    <>
      <PageHeader
        item={getNavItem("/admin/akun")}
        actions={<Button>+ Tambah Akun</Button>}
      />

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Cari nama, email, atau username..."
            className="flex-1 rounded-md border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <select className="rounded-md border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-blue-500">
            <option>Semua Role</option>
            <option>Admin</option>
            <option>Guru</option>
            <option>Murid</option>
          </select>
        </div>

        {users.ok ? (
          <DataTable
            columns={[
              { key: "name", label: "Nama" },
              { key: "username", label: "Username" },
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
              { key: "status", label: "Status" },
            ]}
            rows={users.data}
            emptyText="Belum ada akun. Tambahkan akun pertama."
          />
        ) : (
          <ErrorNotice message={users.error} />
        )}
      </Card>
    </>
  );
}
