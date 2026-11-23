import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import {
  getStudentTeachingClass,
  listStudentAnnouncements,
} from "@/lib/siswa-data";
import { formatDateTime } from "@/lib/format";

export default async function SiswaPengumumanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(id));

  if (!kelas) notFound();

  const items = await listStudentAnnouncements(kelas.id);

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-black/10 bg-white p-10 text-center text-sm text-black/50">
        Belum ada pengumuman dari guru.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <section
          key={item.id}
          className="rounded-lg border border-black/10 bg-white p-5"
        >
          <h3 className="font-bold">{item.title}</h3>
          <p className="text-xs text-black/50">
            {formatDateTime(item.createdAt)}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-black/70">
            {item.body}
          </p>
        </section>
      ))}
    </div>
  );
}
