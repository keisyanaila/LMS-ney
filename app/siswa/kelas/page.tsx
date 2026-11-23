import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { listStudentTeachingClasses } from "@/lib/siswa-data";

export default async function MataPelajaranPage() {
  const { student } = await requireStudent();
  const classes = await listStudentTeachingClasses(student);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Mata Pelajaran</h1>
        <p className="mt-1 text-sm text-black/50">
          Pilih mata pelajaran untuk melihat materi, tugas, nilai, dan
          kehadiranmu.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 bg-white p-10 text-center text-sm text-black/50">
          Belum ada mata pelajaran untuk kelasmu.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/siswa/kelas/${cls.id}`}
              className="rounded-lg border border-black/10 bg-white p-5 transition hover:border-blue-500 hover:shadow-sm"
            >
              <p className="text-lg font-bold">{cls.subject}</p>
              <p className="mt-1 text-sm text-black/60">{cls.teacherName}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
