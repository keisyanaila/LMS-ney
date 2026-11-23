import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import {
  getStudentTeachingClass,
  listStudentMaterials,
} from "@/lib/siswa-data";
import { formatDateTime } from "@/lib/format";

export default async function SiswaMateriPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(id));

  if (!kelas) notFound();

  const items = await listStudentMaterials(kelas.id);

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-black/10 bg-white p-10 text-center text-sm text-black/50">
        Belum ada materi untuk mata pelajaran ini.
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

          {item.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-black/70">
              {item.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
            {item.fileId && (
              <a
                href={`/api/files/${item.fileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-700 hover:underline"
              >
                Unduh {item.fileName ?? "file"}
              </a>
            )}
            {item.linkUrl && (
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-700 hover:underline"
              >
                Buka link &rarr;
              </a>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
