import { getNavItem } from "@/lib/admin-nav";
import { Button, Card, PageHeader } from "@/components/admin/ui";

const exportTargets = [
  { key: "users", label: "Akun Pengguna" },
  { key: "teachers", label: "Data Guru" },
  { key: "students", label: "Data Murid" },
  { key: "majors", label: "Data Jurusan" },
  { key: "classes", label: "Data Kelas" },
  { key: "logs", label: "Log Aktivitas" },
];

export default function ImporEksporPage() {
  return (
    <>
      <PageHeader item={getNavItem("/admin/impor-ekspor")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Impor Data">
          <form className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Jenis data</span>
              <select
                name="target"
                className="w-full rounded-md border border-black/10 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="teachers">Data Guru</option>
                <option value="students">Data Murid</option>
                <option value="users">Akun Pengguna</option>
              </select>
            </label>

            <label className="block cursor-pointer rounded-lg border-2 border-dashed border-black/10 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
              <span className="mt-2 block text-sm font-bold">
                Pilih file CSV atau Excel
              </span>
              <span className="text-xs text-black/40">
                Format: .csv, .xlsx (maks. 5 MB)
              </span>
              <input type="file" accept=".csv,.xlsx" className="sr-only" />
            </label>

            <Button type="submit">Unggah & Impor</Button>
          </form>
        </Card>

        <Card title="Ekspor Data">
          <p className="mb-4 text-sm text-black/50">
            Unduh data dalam format CSV (bisa dibuka di Excel).
          </p>
          <ul className="divide-y divide-black/5">
            {exportTargets.map((target) => (
              <li
                key={target.key}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm font-semibold">{target.label}</span>
                <a
                  href={`/api/admin/export/${target.key}`}
                  className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold transition hover:bg-black/5"
                >
                  Unduh CSV
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
