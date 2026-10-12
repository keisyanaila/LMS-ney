import { getNavItem } from "@/lib/admin-nav";
import { Button, Card, PageHeader } from "@/components/admin/ui";

const roles = [
  { name: "Admin", description: "Akses penuh ke seluruh sistem." },
  { name: "Guru", description: "Mengelola kelas, materi, tugas, dan nilai." },
  { name: "Murid", description: "Mengakses materi dan mengerjakan tugas." },
];

const permissions: { feature: string; access: [boolean, boolean, boolean] }[] = [
  { feature: "Kelola akun pengguna", access: [true, false, false] },
  { feature: "Kelola role & izin", access: [true, false, false] },
  { feature: "Kelola data guru & murid", access: [true, false, false] },
  { feature: "Kelola jurusan & kelas", access: [true, false, false] },
  { feature: "Buat materi & tugas", access: [true, true, false] },
  { feature: "Beri nilai", access: [true, true, false] },
  { feature: "Lihat materi", access: [true, true, true] },
  { feature: "Kumpulkan tugas", access: [false, false, true] },
  { feature: "Lihat log aktivitas", access: [true, false, false] },
  { feature: "Backup & pemulihan", access: [true, false, false] },
];

export default function RoleIzinPage() {
  return (
    <>
      <PageHeader
        item={getNavItem("/admin/role")}
        actions={<Button>+ Tambah Role</Button>}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.name}>
            <h2 className="text-lg font-semibold">{role.name}</h2>
            <p className="mt-2 text-sm text-black/50">{role.description}</p>
          </Card>
        ))}
      </div>

      <Card title="Matriks Izin">
        <form>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50">
                  <th className="px-3 py-3">Fitur</th>
                  {roles.map((role) => (
                    <th key={role.name} className="px-3 py-3 text-center">
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.feature} className="border-b border-black/5">
                    <td className="px-3 py-3 font-semibold">{perm.feature}</td>
                    {perm.access.map((allowed, i) => (
                      <td key={roles[i].name} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          defaultChecked={allowed}
                          aria-label={`${perm.feature} – ${roles[i].name}`}
                          className="h-4 w-4 accent-blue-600"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit">Simpan Perubahan</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
