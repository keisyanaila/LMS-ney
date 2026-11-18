import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getOwnedAssessment,
  getOwnedTeachingClass,
  KIND_LABELS,
  listClassStudents,
  listSubmissions,
} from "@/lib/guru-data";
import { formatDateTime } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";
import { ScoreForm, type ScoreRow } from "../../../../forms";

export default async function BeriNilaiPage({
  params,
}: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id, aid } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const assessment = await getOwnedAssessment(kelas.id, Number(aid));

  if (!assessment) notFound();

  const [studentList, submissionList] = await Promise.all([
    listClassStudents(kelas.classId),
    listSubmissions(assessment.id),
  ]);

  const submissionByStudent = new Map(
    submissionList.map((s) => [s.studentId, s])
  );

  const rows: ScoreRow[] = studentList.map((student) => {
    const submission = submissionByStudent.get(student.id);

    let submissionLabel = "—";

    if (assessment.kind === "tugas") {
      if (submission?.submittedAt) {
        const late =
          assessment.dueAt !== null && submission.submittedAt > assessment.dueAt;

        submissionLabel = `Dikumpulkan ${formatDateTime(submission.submittedAt)}${
          late ? " (terlambat)" : ""
        }`;
      } else {
        submissionLabel = "Belum dikumpulkan";
      }
    }

    return {
      studentId: student.id,
      fullName: student.fullName,
      studentNumber: student.studentNumber,
      submissionLabel,
      score: submission?.score ?? null,
      feedback: submission?.feedback ?? null,
    };
  });

  const backHref =
    assessment.kind === "tugas"
      ? `/guru/kelas/${kelas.id}/tugas`
      : `/guru/kelas/${kelas.id}/penilaian`;

  return (
    <>
      <Link
        href={backHref}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Kembali
      </Link>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">{assessment.title}</h2>
          <Badge>{KIND_LABELS[assessment.kind]}</Badge>
        </div>
        <p className="mt-1 text-sm text-black/50">
          Tenggat: {formatDateTime(assessment.dueAt)} · Nilai maksimal{" "}
          {assessment.maxScore}
        </p>
        {assessment.instructions && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-black/70">
            {assessment.instructions}
          </p>
        )}
      </Card>

      <Card title="Input nilai">
        <p className="mb-4 text-sm text-black/50">
          Kosongkan kolom nilai untuk murid yang belum dinilai.
        </p>
        <ScoreForm
          tcId={kelas.id}
          assessmentId={assessment.id}
          maxScore={assessment.maxScore}
          rows={rows}
        />
      </Card>
    </>
  );
}
