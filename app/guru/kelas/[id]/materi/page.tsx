import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getOwnedTeachingClass, listMaterials } from "@/lib/guru-data";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteMaterial } from "../../../actions";
import { MaterialForm } from "../../../forms";

export default async function MateriPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const items = await listMaterials(kelas.id);

  return (
    <>
      <Card title="Tambah materi" className="mb-6">
        <MaterialForm tcId={kelas.id} />
      </Card>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 p-10 text-center text-sm text-black/50">
          Belum ada materi.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <section
              key={item.id}
              className="rounded-lg border border-black/10 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-xs text-black/50">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <DeleteButton
                  action={deleteMaterial.bind(
                    null,
                    String(kelas.id),
                    String(item.id)
                  )}
                  label={`materi "${item.title}"`}
                />
              </div>

              {item.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-black/70">
                  {item.description}
                </p>
              )}

              {item.linkUrl && (
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block break-all text-sm font-semibold text-blue-700 hover:underline"
                >
                  Buka materi &rarr;
                </a>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
