import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { listAllClassOptions, listTeachingClasses } from "@/lib/guru-data";
import { Badge, Card } from "@/components/admin/ui";
import { TeachingClassForm } from "../forms";

export default async function KelasSayaPage() {
  const { teacher } = await requireTeacher();

  const [teaching, classOptions] = await Promise.all([
    listTeachingClasses(teacher.id),
    listAllClassOptions(),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Kelas Saya</h1>
        <p className="mt-1 text-sm text-black/50">
          Pilih kelas dan mata pelajaran yang Anda ampu untuk mengelola materi,
          tugas, penilaian, dan kehadiran.
        </p>
      </div>

      <Card title="Tambah kelas ajar" className="mb-6">
        <TeachingClassForm
          classOptions={classOptions}
          defaultSubject={teacher.subject ?? ""}
        />
      </Card>

      {teaching.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 p-10 text-center text-sm text-black/50">
          Belum ada kelas ajar.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teaching.map((item) => (
            <Link
              key={item.id}
              href={`/guru/kelas/${item.id}`}
              className="rounded-lg border border-black/10 bg-white p-5 transition hover:border-blue-500 hover:shadow-sm"
            >
              <p className="text-lg font-bold">{item.subject}</p>
              <p className="mt-1 text-sm text-black/60">{item.className}</p>
              <div className="mt-4 flex gap-2">
                <Badge>{item.majorCode}</Badge>
                <Badge tone="gray">{item.studentCount} murid</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
