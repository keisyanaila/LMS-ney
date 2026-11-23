import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/siswa-data";
import { formatDateTime } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";

export default async function SiswaBerandaPage() {
  const { user, student } = await requireStudent();
  const data = await getStudentDashboard(student);
  const now = new Date();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Halo, {user.fullName}</h1>
        <p className="mt-1 text-sm text-black/50">
          Lihat tugas yang perlu dikerjakan, pengumuman terbaru, dan mata
          pelajaranmu.
        </p>
      </div>

      {!student.classId ? (
        <div className="rounded-md border border-dashed border-black/10 bg-white p-10 text-center text-sm text-black/50">
          Kamu belum terdaftar di kelas mana pun. Hubungi admin sekolah.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={`Tugas yang belum dikumpulkan (${data.todo.length})`}>
            {data.todo.length === 0 ? (
              <p className="text-sm text-black/50">
                Hebat, semua tugas sudah dikumpulkan.
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {data.todo.map((task) => {
                  const late = task.dueAt !== null && task.dueAt < now;

                  return (
                    <li key={task.id}>
                      <Link
                        href={`/siswa/kelas/${task.teachingClassId}/tugas/${task.id}`}
                        className="flex items-start justify-between gap-3 py-3 hover:text-blue-700"
                      >
                        <span>
                          <span className="block font-semibold">
                            {task.title}
                          </span>
                          <span className="text-xs text-black/50">
                            {task.subject} · {formatDateTime(task.dueAt)}
                          </span>
                        </span>
                        {late && <Badge tone="red">Lewat tenggat</Badge>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Pengumuman terbaru">
            {data.recentAnnouncements.length === 0 ? (
              <p className="text-sm text-black/50">Belum ada pengumuman.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {data.recentAnnouncements.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/siswa/kelas/${item.teachingClassId}`}
                      className="block py-3 hover:text-blue-700"
                    >
                      <span className="block font-semibold">{item.title}</span>
                      <span className="text-xs text-black/50">
                        {item.subject} · {formatDateTime(item.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Mata pelajaran" className="lg:col-span-2">
            {data.classes.length === 0 ? (
              <p className="text-sm text-black/50">
                Belum ada mata pelajaran untuk kelasmu.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.classes.map((cls) => (
                  <Link
                    key={cls.id}
                    href={`/siswa/kelas/${cls.id}`}
                    className="rounded-lg border border-black/10 p-4 transition hover:border-blue-500"
                  >
                    <p className="font-bold">{cls.subject}</p>
                    <p className="mt-1 text-xs text-black/50">
                      {cls.teacherName}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
