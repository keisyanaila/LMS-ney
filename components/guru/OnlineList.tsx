import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getOwnedTeachingClass,
  KIND_LABELS,
  listAssessmentsByKinds,
} from "@/lib/guru-data";
import { getOnlineCounts } from "@/lib/quiz-data";
import { SECTION_KINDS, SECTION_LABELS, type Section } from "@/lib/online";
import { formatDateTime } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteAssessment } from "@/app/guru/actions";
import { AssessmentForm } from "@/app/guru/forms";

const HELP: Record<Section, string> = {
  kuis: "Buat kuis, tambahkan soal (pilihan ganda dinilai otomatis, esai dinilai guru), lalu terbitkan agar murid bisa mengerjakannya.",
  ujian:
    "Buat UTS atau UAS online dengan durasi dan jadwal. Soal pilihan ganda dinilai otomatis. Setelah soal siap, terbitkan agar murid bisa mengerjakan.",
};

export default async function OnlineList({
  tcId,
  section,
}: {
  tcId: string;
  section: Section;
}) {
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(tcId));

  if (!kelas) notFound();

  const items = await listAssessmentsByKinds(kelas.id, SECTION_KINDS[section]);
  const counts = await getOnlineCounts(items.map((item) => item.id));
  const base = `/guru/kelas/${kelas.id}/${section}`;

  return (
    <>
      <p className="mb-4 text-sm text-black/60">{HELP[section]}</p>

      <Card title={`Buat ${SECTION_LABELS[section].toLowerCase()} baru`} className="mb-6">
        <AssessmentForm tcId={kelas.id} mode={section} />
      </Card>

      <Card title={`Daftar ${SECTION_LABELS[section].toLowerCase()}`}>
        {items.length === 0 ? (
          <p className="text-sm text-black/50">
            Belum ada {SECTION_LABELS[section].toLowerCase()}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-176 text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
                  <th className="px-3 py-3 font-bold">Judul</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Soal</th>
                  <th className="px-3 py-3 font-bold">Jadwal</th>
                  <th className="px-3 py-3 font-bold">Selesai</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const count = counts.get(item.id);

                  return (
                    <tr key={item.id} className="border-b border-black/5">
                      <td className="px-3 py-3">
                        <Link
                          href={`${base}/${item.id}`}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {item.title}
                        </Link>
                        {section === "ujian" && (
                          <span className="ml-2">
                            <Badge tone="gray">{KIND_LABELS[item.kind]}</Badge>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {item.published ? (
                          <Badge tone="green">Terbit</Badge>
                        ) : (
                          <Badge tone="gray">Draf</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3">{count?.questions ?? 0}</td>
                      <td className="px-3 py-3 text-xs text-black/60">
                        <div>Buka: {formatDateTime(item.opensAt)}</div>
                        <div>Tutup: {formatDateTime(item.dueAt)}</div>
                        {item.durationMinutes && (
                          <div>Durasi: {item.durationMinutes} menit</div>
                        )}
                      </td>
                      <td className="px-3 py-3">{count?.submitted ?? 0}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`${base}/${item.id}/soal`}
                            className="text-xs font-semibold text-blue-700 hover:underline"
                          >
                            Soal
                          </Link>
                          <Link
                            href={`${base}/${item.id}`}
                            className="text-xs font-semibold text-blue-700 hover:underline"
                          >
                            Hasil
                          </Link>
                          <DeleteButton
                            action={deleteAssessment.bind(
                              null,
                              String(kelas.id),
                              String(item.id)
                            )}
                            label={`"${item.title}"`}
                            warning="Semua soal, jawaban, dan nilainya ikut terhapus."
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
