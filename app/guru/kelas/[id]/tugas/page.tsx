import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getOwnedTeachingClass,
  getSubmissionCounts,
  listAssessments,
  listClassStudents,
} from "@/lib/guru-data";
import { formatDateTime } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteAssessment } from "../../../actions";
import { AssessmentForm } from "../../../forms";

export default async function TugasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const [items, studentList] = await Promise.all([
    listAssessments(kelas.id, "tugas"),
    listClassStudents(kelas.classId),
  ]);

  const counts = await getSubmissionCounts(items.map((item) => item.id));
  const now = new Date();

  return (
    <>
      <p className="mb-4 text-sm text-black/60">
        Buat tugas, murid mengumpulkan jawaban (teks, link, atau file) dari
        halaman mereka, lalu Anda memberi nilai di tombol &quot;Nilai&quot;.
      </p>

      <Card title="Buat tugas" className="mb-6">
        <AssessmentForm tcId={kelas.id} mode="tugas" />
      </Card>

      <Card title="Daftar tugas">
        {items.length === 0 ? (
          <p className="text-sm text-black/50">Belum ada tugas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
                  <th className="px-3 py-3 font-bold">Tugas</th>
                  <th className="px-3 py-3 font-bold">Tenggat</th>
                  <th className="px-3 py-3 font-bold">Nilai maks</th>
                  <th className="px-3 py-3 font-bold">Terkumpul</th>
                  <th className="px-3 py-3 font-bold">Dinilai</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const overdue = item.dueAt !== null && item.dueAt < now;

                  return (
                    <tr key={item.id} className="border-b border-black/5">
                      <td className="px-3 py-3 font-semibold">{item.title}</td>
                      <td className="px-3 py-3">
                        {formatDateTime(item.dueAt)}{" "}
                        {overdue && <Badge tone="gray">Lewat</Badge>}
                      </td>
                      <td className="px-3 py-3">{item.maxScore}</td>
                      <td className="px-3 py-3">
                        {counts.get(item.id)?.submitted ?? 0}/{studentList.length}
                      </td>
                      <td className="px-3 py-3">
                        {counts.get(item.id)?.graded ?? 0}/{studentList.length}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-4">
                          <Link
                            href={`/guru/kelas/${kelas.id}/penilaian/${item.id}`}
                            className="text-xs font-semibold text-blue-700 hover:underline"
                          >
                            Nilai
                          </Link>
                          <Link
                            href={`/guru/kelas/${kelas.id}/penilaian/${item.id}/edit`}
                            className="text-xs font-semibold text-blue-700 hover:underline"
                          >
                            Edit
                          </Link>
                          <DeleteButton
                            action={deleteAssessment.bind(
                              null,
                              String(kelas.id),
                              String(item.id)
                            )}
                            label={`tugas "${item.title}"`}
                            warning="Nilai tugas ini ikut terhapus."
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
