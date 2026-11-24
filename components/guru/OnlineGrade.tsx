import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getOwnedAssessment,
  getOwnedTeachingClass,
  listClassStudents,
} from "@/lib/guru-data";
import {
  getAttempt,
  listAttemptAnswers,
  listQuestions,
} from "@/lib/quiz-data";
import { SECTION_KINDS, type Section } from "@/lib/online";
import { formatDateTime, formatScore } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";
import { EssayGradeForm, type EssayRow } from "@/app/guru/online-forms";
import { db } from "@/lib/db";
import { submissions } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export default async function OnlineGrade({
  tcId,
  aid,
  sid,
  section,
}: {
  tcId: string;
  aid: string;
  sid: string;
  section: Section;
}) {
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(tcId));

  if (!kelas) notFound();

  const assessment = await getOwnedAssessment(kelas.id, Number(aid));

  if (!assessment || !SECTION_KINDS[section].includes(assessment.kind as never)) {
    notFound();
  }

  const studentId = Number(sid);
  const student = (await listClassStudents(kelas.classId)).find(
    (s) => s.id === studentId
  );

  if (!student) notFound();

  const attempt = await getAttempt(assessment.id, student.id);

  if (!attempt?.submittedAt) notFound();

  const [questionList, answerList, [submission]] = await Promise.all([
    listQuestions(assessment.id),
    listAttemptAnswers(attempt.id),
    db
      .select({ score: submissions.score })
      .from(submissions)
      .where(
        and(
          eq(submissions.assessmentId, assessment.id),
          eq(submissions.studentId, student.id)
        )
      )
      .limit(1),
  ]);

  const answerByQuestion = new Map(answerList.map((a) => [a.questionId, a]));

  const essayRows: EssayRow[] = [];
  const choiceRows: {
    number: number;
    text: string;
    chosen: string;
    correct: string;
    awarded: number;
    points: number;
  }[] = [];

  questionList.forEach((q, index) => {
    const answer = answerByQuestion.get(q.id);

    if (q.type === "esai") {
      essayRows.push({
        questionId: q.id,
        number: index + 1,
        text: q.text,
        answer: answer?.essayText ?? "",
        maxPoints: q.points,
        awarded: answer?.awardedPoints ?? null,
      });
    } else {
      const options = q.options ?? [];

      choiceRows.push({
        number: index + 1,
        text: q.text,
        chosen:
          answer?.selectedIndex !== null && answer?.selectedIndex !== undefined
            ? `${String.fromCharCode(65 + answer.selectedIndex)}. ${options[answer.selectedIndex] ?? ""}`
            : "(tidak dijawab)",
        correct:
          q.correctIndex !== null
            ? `${String.fromCharCode(65 + q.correctIndex)}. ${options[q.correctIndex] ?? ""}`
            : "-",
        awarded: answer?.awardedPoints ?? 0,
        points: q.points,
      });
    }
  });

  const base = `/guru/kelas/${kelas.id}/${section}/${assessment.id}`;

  return (
    <>
      <Link
        href={base}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Kembali ke hasil siswa
      </Link>

      <Card className="mb-6">
        <h2 className="text-lg font-bold">{student.fullName}</h2>
        <p className="mt-1 text-sm text-black/50">
          {assessment.title} · dikirim {formatDateTime(attempt.submittedAt)}
        </p>
        <p className="mt-3 text-3xl font-bold">
          {submission?.score === null || submission?.score === undefined
            ? "Belum ada nilai"
            : formatScore(submission.score)}
          {submission?.score !== null && submission?.score !== undefined && (
            <span className="text-base font-normal text-black/50">
              {" "}
              / {assessment.maxScore}
            </span>
          )}
        </p>
        {essayRows.some((row) => row.awarded === null) && (
          <p className="mt-1 text-xs text-black/50">
            Nilai akhir muncul setelah semua esai diberi poin.
          </p>
        )}
      </Card>

      {essayRows.length > 0 && (
        <Card title="Koreksi esai" className="mb-6">
          <EssayGradeForm
            tcId={kelas.id}
            assessmentId={assessment.id}
            studentId={student.id}
            rows={essayRows}
          />
        </Card>
      )}

      {choiceRows.length > 0 && (
        <Card title="Pilihan ganda (dinilai otomatis)">
          <ul className="divide-y divide-black/5">
            {choiceRows.map((row) => (
              <li key={row.number} className="py-3 text-sm">
                <p className="font-semibold">
                  Soal {row.number}. {row.text}
                </p>
                <p className="mt-1 text-black/70">
                  Jawaban siswa: {row.chosen}
                </p>
                <p className="text-black/70">Kunci: {row.correct}</p>
                <div className="mt-1">
                  <Badge tone={row.awarded > 0 ? "green" : "red"}>
                    {formatScore(row.awarded)} / {row.points} poin
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
