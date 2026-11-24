import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getOwnedTeachingClass,
  getSubmissionCounts,
  KIND_LABELS,
  listAnnouncements,
  listAssessments,
  listAttendanceSessions,
  listClassStudents,
  listMaterials,
} from "@/lib/guru-data";
import { formatDateTime } from "@/lib/format";
import { itemPath } from "@/lib/online";
import { Card, DataTable } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteTeachingClass } from "../../actions";

const quickLink =
  "rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-500";

export default async function RingkasanKelasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const [studentList, materialList, assessmentList, sessions, announcementList] =
    await Promise.all([
      listClassStudents(kelas.classId),
      listMaterials(kelas.id),
      listAssessments(kelas.id),
      listAttendanceSessions(kelas.id),
      listAnnouncements(kelas.id),
    ]);

  const counts = await getSubmissionCounts(assessmentList.map((a) => a.id));
  const now = new Date();

  const needGrading = assessmentList
    .map((a) => ({ a, waiting: (counts.get(a.id)?.submitted ?? 0) - (counts.get(a.id)?.graded ?? 0) }))
    .filter((x) => x.waiting > 0);

  const upcoming = assessmentList
    .filter((a) => a.dueAt && a.dueAt > now)
    .sort((x, y) => x.dueAt!.getTime() - y.dueAt!.getTime())
    .slice(0, 3);

  const stats = [
    { label: "Murid", value: studentList.length },
    { label: "Materi", value: materialList.length },
    { label: "Tugas & penilaian", value: assessmentList.length },
    { label: "Pertemuan", value: sessions.length },
  ];

  const base = `/guru/kelas/${kelas.id}`;

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`${base}/kehadiran`} className={quickLink}>
          + Absensi pertemuan
        </Link>
        <Link href={`${base}/materi`} className={quickLink}>
          + Materi
        </Link>
        <Link href={`${base}/tugas`} className={quickLink}>
          + Tugas
        </Link>
        <Link href={`${base}/kuis`} className={quickLink}>
          + Kuis
        </Link>
        <Link href={`${base}/ujian`} className={quickLink}>
          + Ujian
        </Link>
        <Link href={`${base}/pengumuman`} className={quickLink}>
          + Pengumuman
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-black/10 bg-white p-5"
          >
            <p className="text-sm text-black/50">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card title="Perlu dinilai">
          {needGrading.length === 0 ? (
            <p className="text-sm text-black/50">
              Tidak ada pengumpulan yang menunggu dinilai.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {needGrading.map(({ a, waiting }) => (
                <li key={a.id}>
                  <Link
                    href={itemPath("guru", kelas.id, a.kind, a.id)}
                    className="block py-2.5 text-sm hover:text-blue-700"
                  >
                    <span className="block font-semibold">{a.title}</span>
                    <span className="text-xs text-black/50">
                      {waiting} murid menunggu dinilai
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Tenggat terdekat">
          {upcoming.length === 0 ? (
            <p className="text-sm text-black/50">
              Tidak ada tenggat yang akan datang.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {upcoming.map((a) => (
                <li key={a.id} className="py-2.5 text-sm">
                  <span className="block font-semibold">{a.title}</span>
                  <span className="text-xs text-black/50">
                    {KIND_LABELS[a.kind]} · {formatDateTime(a.dueAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Pengumuman terbaru">
          {announcementList.length === 0 ? (
            <p className="text-sm text-black/50">Belum ada pengumuman.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {announcementList.slice(0, 3).map((n) => (
                <li key={n.id} className="py-2.5 text-sm">
                  <span className="block font-semibold">{n.title}</span>
                  <span className="text-xs text-black/50">
                    {formatDateTime(n.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Daftar murid" className="mb-6">
        <DataTable
          columns={[
            { key: "studentNumber", label: "NIS" },
            { key: "fullName", label: "Nama" },
          ]}
          rows={studentList}
          emptyText="Belum ada murid di kelas ini. Admin dapat menambahkan murid ke kelas."
        />
      </Card>

      <Card title="Hapus kelas ajar">
        <p className="mb-4 text-sm text-black/60">
          Menghapus kelas ajar ikut menghapus seluruh materi, tugas, nilai,
          pengumuman, kehadiran, dan file unggahan. Murid dan kelas (rombel)
          tidak terhapus.
        </p>
        <DeleteButton
          action={deleteTeachingClass.bind(null, String(kelas.id))}
          label={`kelas ajar ${kelas.subject} ${kelas.className}`}
          warning="Semua materi, nilai, dan kehadiran ikut terhapus."
          variant="button"
        />
      </Card>
    </>
  );
}
