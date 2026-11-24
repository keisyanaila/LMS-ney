import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assessments,
  attemptAnswers,
  attempts,
  questions,
  submissions,
} from "@/lib/schema";
import { GRACE_MS, attemptDeadline, pointsToScore } from "@/lib/online";

/**
 * Hitung ulang nilai satu percobaan dan tulis ke tabel submissions (sumber
 * nilai untuk rekap). Nilai baru terisi jika semua soal sudah ternilai;
 * jika masih ada esai menunggu guru, nilai dikosongkan.
 */
export async function syncScore(attemptId: number) {
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, attemptId))
    .limit(1);

  if (!attempt?.submittedAt) return;

  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, attempt.assessmentId))
    .limit(1);

  if (!assessment) return;

  const [questionRows, answerRows] = await Promise.all([
    db
      .select({ id: questions.id, points: questions.points })
      .from(questions)
      .where(eq(questions.assessmentId, assessment.id)),
    db
      .select()
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, attemptId)),
  ]);

  const awardedByQuestion = new Map(
    answerRows.map((a) => [a.questionId, a.awardedPoints])
  );

  let total = 0;
  let earned = 0;
  let pending = false;

  for (const q of questionRows) {
    total += q.points;

    const awarded = awardedByQuestion.get(q.id);

    if (awarded === null || awarded === undefined) pending = true;
    else earned += awarded;
  }

  const score = pending ? null : pointsToScore(earned, total, assessment.maxScore);

  await db
    .insert(submissions)
    .values({
      assessmentId: assessment.id,
      studentId: attempt.studentId,
      submittedAt: attempt.submittedAt,
      score,
      gradedAt: score !== null ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [submissions.assessmentId, submissions.studentId],
      set: {
        submittedAt: sql`excluded.submitted_at`,
        score: sql`excluded.score`,
        gradedAt: sql`excluded.graded_at`,
      },
    });
}

/** Akhiri percobaan: nilai pilihan ganda otomatis, esai menunggu guru. */
export async function finalizeAttempt(attemptId: number, at = new Date()) {
  const [attempt] = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, attemptId))
    .limit(1);

  if (!attempt) return;

  const [questionRows, answerRows] = await Promise.all([
    db
      .select()
      .from(questions)
      .where(eq(questions.assessmentId, attempt.assessmentId))
      .orderBy(asc(questions.position)),
    db
      .select()
      .from(attemptAnswers)
      .where(eq(attemptAnswers.attemptId, attemptId)),
  ]);

  const byQuestion = new Map(answerRows.map((a) => [a.questionId, a]));

  const rows = questionRows.map((q) => {
    const answer = byQuestion.get(q.id);
    let awarded: number | null;

    if (q.type === "pilihan_ganda") {
      awarded =
        answer?.selectedIndex !== null &&
        answer?.selectedIndex !== undefined &&
        answer.selectedIndex === q.correctIndex
          ? q.points
          : 0;
    } else {
      // Esai kosong = 0; esai terisi menunggu penilaian guru.
      awarded = answer?.essayText?.trim() ? (answer.awardedPoints ?? null) : 0;
    }

    return {
      attemptId,
      questionId: q.id,
      selectedIndex: answer?.selectedIndex ?? null,
      essayText: answer?.essayText ?? null,
      awardedPoints: awarded,
    };
  });

  if (rows.length > 0) {
    await db
      .insert(attemptAnswers)
      .values(rows)
      .onConflictDoUpdate({
        target: [attemptAnswers.attemptId, attemptAnswers.questionId],
        set: { awardedPoints: sql`excluded.awarded_points` },
      });
  }

  if (!attempt.submittedAt) {
    await db
      .update(attempts)
      .set({ submittedAt: at })
      .where(and(eq(attempts.id, attemptId), isNull(attempts.submittedAt)));
  }

  await syncScore(attemptId);
}

/** Akhiri otomatis percobaan yang waktunya sudah habis tetapi belum dikirim. */
export async function sweepExpired(assessment: {
  id: number;
  durationMinutes: number | null;
  dueAt: Date | null;
}) {
  const open = await db
    .select()
    .from(attempts)
    .where(
      and(eq(attempts.assessmentId, assessment.id), isNull(attempts.submittedAt))
    );

  for (const attempt of open) {
    const deadline = attemptDeadline(
      attempt.startedAt,
      assessment.durationMinutes,
      assessment.dueAt
    );

    if (deadline && Date.now() > deadline.getTime() + GRACE_MS) {
      await finalizeAttempt(attempt.id, deadline);
    }
  }
}
