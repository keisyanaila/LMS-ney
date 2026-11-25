import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { getOwnedAssessment } from "@/lib/guru-data";
import { getStudentTeachingClass } from "@/lib/siswa-data";
import {
  getAttempt,
  listAttemptAnswers,
  listQuestionsForTaking,
} from "@/lib/quiz-data";
import { finalizeAttempt, sweepExpired } from "@/lib/quiz-service";
import {
  GRACE_MS,
  SECTION_KINDS,
  attemptDeadline,
  type Section,
} from "@/lib/online";
import QuizRunner from "@/components/siswa/QuizRunner";
import type { AnswerInput } from "@/app/siswa/online-actions";

export default async function OnlineTake({
  tcId,
  aid,
  section,
}: {
  tcId: string;
  aid: string;
  section: Section;
}) {
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(tcId));

  if (!kelas) notFound();

  const assessment = await getOwnedAssessment(kelas.id, Number(aid));

  if (
    !assessment ||
    !assessment.published ||
    !SECTION_KINDS[section].includes(assessment.kind as never)
  ) {
    notFound();
  }

  const detail = `/siswa/kelas/${kelas.id}/${section}/${assessment.id}`;

  await sweepExpired(assessment);

  const attempt = await getAttempt(assessment.id, student.id);

  // Belum mulai atau sudah dikirim: kembali ke halaman info.
  if (!attempt || attempt.submittedAt) redirect(detail);

  const now = new Date();

  const deadline = attemptDeadline(
    attempt.startedAt,
    assessment.durationMinutes,
    assessment.dueAt
  );

  if (deadline && now.getTime() > deadline.getTime() + GRACE_MS) {
    await finalizeAttempt(attempt.id, deadline);
    redirect(detail);
  }

  const [questionList, saved] = await Promise.all([
    listQuestionsForTaking(assessment.id),
    listAttemptAnswers(attempt.id),
  ]);

  const initial: AnswerInput = {};

  for (const answer of saved) {
    initial[answer.questionId] = {
      selected: answer.selectedIndex,
      essay: answer.essayText ?? "",
    };
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold">{assessment.title}</h1>
        {assessment.instructions && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-black/60">
            {assessment.instructions}
          </p>
        )}
      </div>

      <QuizRunner
        tcId={kelas.id}
        assessmentId={assessment.id}
        questions={questionList}
        shuffle={assessment.shuffleQuestions}
        attemptId={attempt.id}
        initial={initial}
        deadlineIso={deadline ? deadline.toISOString() : null}
        serverNowIso={now.toISOString()}
      />
    </>
  );
}
