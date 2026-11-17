import { getNavItem } from "@/lib/admin-nav";
import { Card, PageHeader } from "@/components/admin/ui";
import ImportForm from "../akun/import-form";

// Impor Excel meng-hash ratusan password, beri waktu lebih panjang.
export const maxDuration = 60;

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
        <Card title="Impor Akun dari Excel">
          <ImportForm />
        </Card>

        <Card title="Ekspor Data">
          <p className="mb-4 text-sm text-black/50">
            Unduh data dalam format CSV (bisa dibuka di Excel). Password tidak
            ikut diekspor.
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
