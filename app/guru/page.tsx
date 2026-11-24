import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { getTeacherDashboard } from "@/lib/guru-data";
import { formatDateTime } from "@/lib/format";
import { itemPath } from "@/lib/online";
import { Badge, Card } from "@/components/admin/ui";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <p className="text-sm text-black/50">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default async function GuruDashboardPage() {
  const { user, teacher } = await requireTeacher();
  const data = await getTeacherDashboard(teacher.id);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Halo, {user.fullName}</h1>
        <p className="mt-1 text-sm text-black/50">
          Ringkasan kelas ajar, tenggat, dan penilaian Anda.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Kelas ajar" value={data.teaching.length} />
        <Stat label="Total murid" value={data.studentTotal} />
        <Stat label="Menunggu dinilai" value={data.ungraded} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Kelas ajar">
          {data.teaching.length === 0 ? (
            <p className="text-sm text-black/50">
              Belum ada kelas ajar.{" "}
              <Link href="/guru/kelas" className="font-semibold text-blue-700">
                Tambahkan sekarang
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {data.teaching.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/guru/kelas/${item.id}`}
                    className="flex items-center justify-between py-3 hover:text-blue-700"
                  >
                    <span>
                      <span className="block font-semibold">{item.subject}</span>
                      <span className="text-xs text-black/50">
                        {item.className}
                      </span>
                    </span>
                    <Badge tone="gray">{item.studentCount} murid</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Tenggat terdekat">
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-black/50">
              Tidak ada tenggat yang akan datang.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {data.upcoming.map((item) => (
                <li key={item.id}>
                  <Link
                    href={itemPath("guru", item.teachingClassId, item.kind, item.id)}
                    className="block py-3 hover:text-blue-700"
                  >
                    <span className="block font-semibold">{item.title}</span>
                    <span className="text-xs text-black/50">
                      {item.subject} · {item.className} ·{" "}
                      {formatDateTime(item.dueAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
