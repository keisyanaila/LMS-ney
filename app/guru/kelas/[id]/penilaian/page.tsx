import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getGradeMatrix,
  getOwnedTeachingClass,
  KIND_LABELS,
} from "@/lib/guru-data";
import { formatScore } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteAssessment } from "../../../actions";
import { AssessmentForm } from "../../../forms";

export default async function PenilaianPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const { items, rows } = await getGradeMatrix(kelas.id, kelas.classId);
  const others = items.filter((item) => item.kind !== "tugas");

  return (
    <>
      <Card title="Rekap nilai" className="mb-6">
        {items.length === 0 ? (
          <p className="text-sm text-black/50">
            Belum ada tugas atau penilaian. Buat tugas di tab Tugas, atau
            tambahkan kuis, UTS, UAS, dan praktik di bawah.
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-black/50">Kelas ini belum punya murid.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
                  <th className="sticky left-0 bg-white px-3 py-3 font-bold">
                    Murid
                  </th>
                  {items.map((item) => (
                    <th
                      key={item.id}
                      className="min-w-28 px-3 py-3 font-bold normal-case"
                    >
                      <Link
                        href={`/guru/kelas/${kelas.id}/penilaian/${item.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        {item.title}
                      </Link>
                      <span className="block text-xs font-normal text-black/50">
                        {KIND_LABELS[item.kind]} · maks {item.maxScore}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-bold">Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ student, scores, average }) => (
                  <tr key={student.id} className="border-b border-black/5">
                    <td className="sticky left-0 bg-white px-3 py-2 font-semibold">
                      {student.fullName}
                    </td>
                    {scores.map((score, index) => (
                      <td key={items[index].id} className="px-3 py-2">
                        {formatScore(score)}
                      </td>
                    ))}
                    <td className="px-3 py-2 font-bold">
                      {average === null ? "—" : `${average.toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-black/50">
          Rata-rata dihitung dari persentase nilai terhadap nilai maksimal,
          semua item bobotnya sama. Item yang belum dinilai tidak ikut dihitung.
        </p>
      </Card>

      <Card title="Tambah penilaian lain (kuis, UTS, UAS, praktik)" className="mb-6">
        <AssessmentForm tcId={kelas.id} mode="lainnya" />
      </Card>

      {others.length > 0 && (
        <Card title="Penilaian lain">
          <ul className="divide-y divide-black/5">
            {others.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <span className="font-semibold">{item.title}</span>{" "}
                  <Badge>{KIND_LABELS[item.kind]}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/guru/kelas/${kelas.id}/penilaian/${item.id}`}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Isi nilai
                  </Link>
                  <DeleteButton
                    action={deleteAssessment.bind(
                      null,
                      String(kelas.id),
                      String(item.id)
                    )}
                    label={`"${item.title}"`}
                    warning="Nilai ikut terhapus."
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
