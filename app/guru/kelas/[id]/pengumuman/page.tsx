import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getOwnedTeachingClass, listAnnouncements } from "@/lib/guru-data";
import { formatDateTime } from "@/lib/format";
import { Card } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteAnnouncement } from "../../../actions";
import { AnnouncementForm } from "../../../forms";

export default async function PengumumanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const items = await listAnnouncements(kelas.id);

  return (
    <>
      <p className="mb-4 text-sm text-black/60">
        Pengumuman langsung tampil di halaman kelas murid, mis. perubahan
        jadwal, pengingat ujian, atau info penting lainnya.
      </p>

      <Card title="Buat pengumuman" className="mb-6">
        <AnnouncementForm tcId={kelas.id} />
      </Card>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 p-10 text-center text-sm text-black/50">
          Belum ada pengumuman.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <section
              key={item.id}
              className="rounded-lg border border-black/10 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-xs text-black/50">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
                <DeleteButton
                  action={deleteAnnouncement.bind(
                    null,
                    String(kelas.id),
                    String(item.id)
                  )}
                  label={`pengumuman "${item.title}"`}
                />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-black/70">
                {item.body}
              </p>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
