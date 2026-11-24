import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getOwnedAssessment,
  getOwnedTeachingClass,
  KIND_LABELS,
} from "@/lib/guru-data";
import { getAttemptsOverview, listQuestions } from "@/lib/quiz-data";
import { sweepExpired } from "@/lib/quiz-service";
import { SECTION_KINDS, SECTION_LABELS, type Section } from "@/lib/online";
import { formatDateTime, formatScore } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";
import ConfirmButton from "@/components/guru/ConfirmButton";
import OnlineItemNav from "@/components/guru/OnlineItemNav";
import {
  resetAttempt,
  setPublished,
  setShowResult,
} from "@/app/guru/online-actions";

const STATUS = {
  belum: { label: "Belum mulai", tone: "gray" },
  mengerjakan: { label: "Mengerjakan", tone: "blue" },
  koreksi: { label: "Perlu koreksi", tone: "red" },
  selesai: { label: "Selesai", tone: "green" },
} as const;

const toggleButton =
  "rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-semibold hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

export default async function OnlineResults({
  tcId,
  aid,
  section,
}: {
  tcId: string;
  aid: string;
  section: Section;
}) {
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(tcId));

  if (!kelas) notFound();

  const assessment = await getOwnedAssessment(kelas.id, Number(aid));

  if (!assessment || !SECTION_KINDS[section].includes(assessment.kind as never)) {
    notFound();
  }

  await sweepExpired(assessment);

  const [overview, questionList] = await Promise.all([
    getAttemptsOverview(assessment.id, kelas.classId),
    listQuestions(assessment.id),
  ]);

  const base = `/guru/kelas/${kelas.id}/${section}/${assessment.id}`;
  const totalPoints = questionList.reduce((sum, q) => sum + q.points, 0);
  const finished = overview.filter(
    (row) => row.status === "selesai" || row.status === "koreksi"
  ).length;

  return (
    <>
      <Link
        href={`/guru/kelas/${kelas.id}/${section}`}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Semua {SECTION_LABELS[section].toLowerCase()}
      </Link>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">{assessment.title}</h2>
          <Badge tone="gray">{KIND_LABELS[assessment.kind]}</Badge>
          {assessment.published ? (
            <Badge tone="green">Terbit</Badge>
          ) : (
            <Badge tone="gray">Draf</Badge>
          )}
          {assessment.showResult ? (
            <Badge>Nilai dirilis</Badge>
          ) : (
            <Badge tone="gray">Nilai disembunyikan</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-black/50">
          {questionList.length} soal · {totalPoints} poin · nilai maksimal{" "}
          {assessment.maxScore}
          {assessment.durationMinutes
            ? ` · durasi ${assessment.durationMinutes} menit`
            : ""}
        </p>
        <p className="mt-1 text-xs text-black/50">
          Dibuka: {formatDateTime(assessment.opensAt)} · Ditutup:{" "}
          {formatDateTime(assessment.dueAt)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <form
            action={setPublished.bind(
              null,
              String(kelas.id),
              String(assessment.id),
              assessment.published ? "false" : "true"
            )}
          >
            <button
              type="submit"
              className={toggleButton}
              disabled={!assessment.published && questionList.length === 0}
              title={
                !assessment.published && questionList.length === 0
                  ? "Tambahkan soal dulu"
                  : undefined
              }
            >
              {assessment.published ? "Tarik jadi draf" : "Terbitkan ke siswa"}
            </button>
          </form>

          <form
            action={setShowResult.bind(
              null,
              String(kelas.id),
              String(assessment.id),
              assessment.showResult ? "false" : "true"
            )}
          >
            <button type="submit" className={toggleButton}>
              {assessment.showResult ? "Sembunyikan nilai" : "Rilis nilai ke siswa"}
            </button>
          </form>
        </div>
      </Card>

      <OnlineItemNav base={base} active="hasil" />

      <Card title={`Hasil siswa (${finished}/${overview.length} selesai)`}>
        {overview.length === 0 ? (
          <p className="text-sm text-black/50">Kelas ini belum punya murid.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
                  <th className="px-3 py-3 font-bold">Murid</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Mulai</th>
                  <th className="px-3 py-3 font-bold">Nilai</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {overview.map(({ student, attempt, score, status }) => (
                  <tr key={student.id} className="border-b border-black/5">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{student.fullName}</div>
                      <div className="text-xs text-black/50">
                        {student.studentNumber ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={STATUS[status].tone}>
                        {STATUS[status].label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-black/60">
                      {formatDateTime(attempt?.startedAt)}
                    </td>
                    <td className="px-3 py-2 font-semibold">
                      {score === null
                        ? "—"
                        : `${formatScore(score)} / ${assessment.maxScore}`}
                    </td>
                    <td className="px-3 py-2">
                      {attempt && (
                        <div className="flex items-center justify-end gap-4">
                          {attempt.submittedAt && (
                            <Link
                              href={`${base}/koreksi/${student.id}`}
                              className="text-xs font-semibold text-blue-700 hover:underline"
                            >
                              {status === "koreksi" ? "Koreksi" : "Lihat"}
                            </Link>
                          )}
                          <ConfirmButton
                            action={resetAttempt.bind(
                              null,
                              String(kelas.id),
                              String(assessment.id),
                              String(student.id)
                            )}
                            confirmText={`Reset pengerjaan ${student.fullName}? Jawaban dan nilainya dihapus dan siswa bisa mengulang dari awal.`}
                            tone="danger"
                          >
                            Reset
                          </ConfirmButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-black/50">
          Setiap siswa hanya punya satu kesempatan. Gunakan Reset jika siswa
          perlu mengulang, misalnya karena gangguan teknis.
        </p>
      </Card>
    </>
  );
}
