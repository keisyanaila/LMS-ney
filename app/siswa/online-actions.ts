"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { attemptAnswers, attempts } from "@/lib/schema";
import { requireStudent } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getOwnedAssessment } from "@/lib/guru-data";
import { getStudentTeachingClass } from "@/lib/siswa-data";
import { getAttempt, listQuestionsForTaking } from "@/lib/quiz-data";
import { finalizeAttempt } from "@/lib/quiz-service";
import {
  GRACE_MS,
  attemptDeadline,
  isOnlineKind,
  sectionOfKind,
  windowState,
} from "@/lib/online";

export type AnswerInput = Record<
  number,
  { selected: number | null; essay: string }
>;

export type DraftResult = { ok: boolean };

const MAX_ESSAY = 10_000;

/** Siswa + kelas ajarnya + kuis/ujian yang sudah terbit. */
async function authorize(tcId: string, assessmentId: string) {
  const { user, student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(tcId));
  const assessment = kelas
    ? await getOwnedAssessment(kelas.id, Number(assessmentId))
    : null;

  const ok =
    kelas && assessment && assessment.published && isOnlineKind(assessment.kind);

  return {
    user,
    student,
    kelas: ok ? kelas : null,
    assessment: ok ? assessment : null,
  };
}

function detailPath(tcId: number, kind: string, assessmentId: number) {
  return `/siswa/kelas/${tcId}/${sectionOfKind(kind)}/${assessmentId}`;
}

/** Simpan jawaban sementara (draf) ke database. */
async function persistAnswers(
  attemptId: number,
  assessmentId: number,
  answers: AnswerInput
) {
  const questionList = await listQuestionsForTaking(assessmentId);

  const rows: (typeof attemptAnswers.$inferInsert)[] = [];

  for (const q of questionList) {
    const input = answers?.[q.id];

    if (!input) continue;

    if (q.type === "pilihan_ganda") {
      const selected = input.selected;
      const valid =
        selected !== null &&
        Number.isInteger(selected) &&
        selected >= 0 &&
        selected < (q.options?.length ?? 0);

      rows.push({
        attemptId,
        questionId: q.id,
        selectedIndex: valid ? selected : null,
        essayText: null,
      });
    } else {
      rows.push({
        attemptId,
        questionId: q.id,
        selectedIndex: null,
        essayText: String(input.essay ?? "").slice(0, MAX_ESSAY) || null,
      });
    }
  }

  if (rows.length === 0) return;

  await db
    .insert(attemptAnswers)
    .values(rows)
    .onConflictDoUpdate({
      target: [attemptAnswers.attemptId, attemptAnswers.questionId],
      set: {
        selectedIndex: sql`excluded.selected_index`,
        essayText: sql`excluded.essay_text`,
      },
    });
}

export async function startAttempt(
  tcId: string,
  assessmentId: string
): Promise<void> {
  const { user, student, kelas, assessment } = await authorize(
    tcId,
    assessmentId
  );

  if (!kelas || !assessment) return;

  const detail = detailPath(kelas.id, assessment.kind, assessment.id);
  const existing = await getAttempt(assessment.id, student.id);

  if (!existing) {
    const questionList = await listQuestionsForTaking(assessment.id);

    if (
      questionList.length === 0 ||
      windowState(assessment, new Date()) !== "dibuka"
    ) {
      redirect(detail);
    }

    try {
      await db
        .insert(attempts)
        .values({ assessmentId: assessment.id, studentId: student.id })
        .onConflictDoNothing();

      await logActivity(
        `Memulai ${assessment.kind} "${assessment.title}" (${kelas.subject})`,
        { userId: user.id, userName: user.fullName, role: "murid" }
      );
    } catch (error) {
      console.error("Start attempt error:", error);
      redirect(detail);
    }
  }

  revalidatePath("/guru", "layout");

  redirect(`${detail}/kerjakan`);
}

export async function saveDraft(
  tcId: string,
  assessmentId: string,
  answers: AnswerInput
): Promise<DraftResult> {
  const { student, kelas, assessment } = await authorize(tcId, assessmentId);

  if (!kelas || !assessment) return { ok: false };

  const attempt = await getAttempt(assessment.id, student.id);

  if (!attempt || attempt.submittedAt) return { ok: false };

  const deadline = attemptDeadline(
    attempt.startedAt,
    assessment.durationMinutes,
    assessment.dueAt
  );

  if (deadline && Date.now() > deadline.getTime() + GRACE_MS) {
    return { ok: false };
  }

  try {
    await persistAnswers(attempt.id, assessment.id, answers);
    return { ok: true };
  } catch (error) {
    console.error("Save draft error:", error);
    return { ok: false };
  }
}

export async function submitAttempt(
  tcId: string,
  assessmentId: string,
  answers: AnswerInput
): Promise<void> {
  const { user, student, kelas, assessment } = await authorize(
    tcId,
    assessmentId
  );

  if (!kelas || !assessment) return;

  const detail = detailPath(kelas.id, assessment.kind, assessment.id);
  const attempt = await getAttempt(assessment.id, student.id);

  if (!attempt || attempt.submittedAt) redirect(detail);

  const deadline = attemptDeadline(
    attempt.startedAt,
    assessment.durationMinutes,
    assessment.dueAt
  );

  const expired = deadline !== null && Date.now() > deadline.getTime() + GRACE_MS;

  try {
    // Lewat batas waktu: hanya jawaban yang sempat tersimpan yang dihitung.
    if (!expired) await persistAnswers(attempt.id, assessment.id, answers);

    await finalizeAttempt(attempt.id, expired && deadline ? deadline : new Date());

    await logActivity(
      `Mengirim ${assessment.kind} "${assessment.title}" (${kelas.subject})`,
      { userId: user.id, userName: user.fullName, role: "murid" }
    );

    revalidatePath("/siswa", "layout");
    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
  } catch (error) {
    console.error("Submit attempt error:", error);
    throw error;
  }

  redirect(detail);
}
