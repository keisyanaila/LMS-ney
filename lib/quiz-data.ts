import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  attemptAnswers,
  attempts,
  questions,
  students,
  submissions,
  users,
} from "@/lib/schema";
import { listClassStudents } from "@/lib/guru-data";

/** Soal lengkap dengan kunci jawaban (hanya untuk guru atau pembahasan). */
export async function listQuestions(assessmentId: number) {
  return db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, assessmentId))
    .orderBy(asc(questions.position));
}

/** Soal untuk siswa yang sedang mengerjakan: tanpa kunci jawaban. */
export async function listQuestionsForTaking(assessmentId: number) {
  return db
    .select({
      id: questions.id,
      position: questions.position,
      type: questions.type,
      text: questions.text,
      options: questions.options,
      points: questions.points,
    })
    .from(questions)
    .where(eq(questions.assessmentId, assessmentId))
    .orderBy(asc(questions.position));
}

export async function getAttempt(assessmentId: number, studentId: number) {
  const [row] = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.assessmentId, assessmentId),
        eq(attempts.studentId, studentId)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function listAttemptAnswers(attemptId: number) {
  return db
    .select()
    .from(attemptAnswers)
    .where(eq(attemptAnswers.attemptId, attemptId));
}

export async function countAttempts(assessmentId: number) {
  const rows = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(eq(attempts.assessmentId, assessmentId));

  return rows.length;
}

/** Status pengerjaan semua murid di kelas untuk satu kuis/ujian (sisi guru). */
export async function getAttemptsOverview(assessmentId: number, classId: number) {
  const [studentRows, attemptRows, scoreRows] = await Promise.all([
    listClassStudents(classId),
    db.select().from(attempts).where(eq(attempts.assessmentId, assessmentId)),
    db
      .select({
        studentId: submissions.studentId,
        score: submissions.score,
      })
      .from(submissions)
      .where(eq(submissions.assessmentId, assessmentId)),
  ]);

  const attemptByStudent = new Map(attemptRows.map((a) => [a.studentId, a]));
  const scoreByStudent = new Map(scoreRows.map((s) => [s.studentId, s.score]));

  return studentRows.map((student) => {
    const attempt = attemptByStudent.get(student.id) ?? null;
    const score = scoreByStudent.get(student.id) ?? null;

    const status = !attempt
      ? ("belum" as const)
      : !attempt.submittedAt
        ? ("mengerjakan" as const)
        : score === null
          ? ("koreksi" as const)
          : ("selesai" as const);

    return { student, attempt, score, status };
  });
}

/** Nama murid untuk halaman koreksi. */
export async function getStudentName(studentId: number) {
  const [row] = await db
    .select({ fullName: users.fullName, studentNumber: students.studentNumber })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.id, studentId))
    .limit(1);

  return row ?? null;
}

/** Jumlah soal dan jumlah murid yang sudah mengirim, per kuis/ujian. */
export async function getOnlineCounts(assessmentIds: number[]) {
  const result = new Map<number, { questions: number; submitted: number }>();

  if (assessmentIds.length === 0) return result;

  const [questionRows, attemptRows] = await Promise.all([
    db
      .select({ assessmentId: questions.assessmentId })
      .from(questions)
      .where(inArray(questions.assessmentId, assessmentIds)),
    db
      .select({
        assessmentId: attempts.assessmentId,
        submittedAt: attempts.submittedAt,
      })
      .from(attempts)
      .where(inArray(attempts.assessmentId, assessmentIds)),
  ]);

  for (const id of assessmentIds) {
    result.set(id, { questions: 0, submitted: 0 });
  }

  for (const row of questionRows) {
    result.get(row.assessmentId)!.questions += 1;
  }

  for (const row of attemptRows) {
    if (row.submittedAt) result.get(row.assessmentId)!.submitted += 1;
  }

  return result;
}
