import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { getStudentGrades, getStudentTeachingClass } from "@/lib/siswa-data";
import { KIND_LABELS } from "@/lib/guru-data";
import { formatScore } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";

export default async function SiswaNilaiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(id));

  if (!kelas) notFound();

  const { items, weights, finalScore } = await getStudentGrades(
    student.id,
    kelas.id
  );

  return (
    <>
      <Card className="mb-6">
        <p className="text-sm text-black/50">Nilai akhir sementara</p>
        <p className="mt-1 text-4xl font-bold">
          {finalScore === null ? "—" : finalScore.toFixed(1)}
        </p>
        <p className="mt-2 text-xs text-black/50">
          {weights
            ? `Dihitung dengan bobot: ${Object.entries(weights)
                .map(
                  ([kind, w]) =>
                    `${KIND_LABELS[kind as keyof typeof KIND_LABELS]} ${w}%`
                )
                .join(", ")}.`
            : "Dihitung dari rata-rata persentase semua nilai yang sudah keluar."}{" "}
          Nilai bisa berubah saat nilai baru dari guru masuk.
        </p>
      </Card>

      <Card title="Rincian nilai">
        {items.length === 0 ? (
          <p className="text-sm text-black/50">Belum ada penilaian.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
                  <th className="px-3 py-3 font-bold">Penilaian</th>
                  <th className="px-3 py-3 font-bold">Jenis</th>
                  <th className="px-3 py-3 font-bold">Nilai</th>
                  <th className="px-3 py-3 font-bold">Catatan guru</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const score = item.submission?.score ?? null;

                  return (
                    <tr key={item.id} className="border-b border-black/5">
                      <td className="px-3 py-3 font-semibold">{item.title}</td>
                      <td className="px-3 py-3">
                        <Badge tone="gray">{KIND_LABELS[item.kind]}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        {score === null
                          ? "Belum dinilai"
                          : `${formatScore(score)} / ${item.maxScore}`}
                      </td>
                      <td className="px-3 py-3 text-black/70">
                        {item.submission?.feedback ?? "—"}
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
