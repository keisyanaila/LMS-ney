import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getOwnedTeachingClass,
  listAssessments,
  listAttendanceSessions,
  listClassStudents,
  listMaterials,
} from "@/lib/guru-data";
import { Card, DataTable } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteTeachingClass } from "../../actions";

export default async function RingkasanKelasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const [studentList, materialList, assessmentList, sessions] =
    await Promise.all([
      listClassStudents(kelas.classId),
      listMaterials(kelas.id),
      listAssessments(kelas.id),
      listAttendanceSessions(kelas.id),
    ]);

  const stats = [
    { label: "Murid", value: studentList.length },
    { label: "Materi", value: materialList.length },
    { label: "Tugas & penilaian", value: assessmentList.length },
    { label: "Pertemuan", value: sessions.length },
  ];

  return (
    <>
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
          Menghapus kelas ajar ikut menghapus seluruh materi, tugas, nilai, dan
          data kehadirannya. Murid dan kelas (rombel) tidak terhapus.
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
