import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { computeFinalScore } from "@/lib/grading";
import {
  attemptDeadline,
  GRACE_MS,
  isOnlineKind,
  windowState,
  type Section,
  SECTION_KINDS,
} from "@/lib/online";
import {
  getWeights,
  type AttendanceStatus,
} from "@/lib/guru-data";
import {
  announcements,
  assessments,
  attendanceRecords,
  attempts,
  attendanceSessions,
  materials,
  submissions,
  teachers,
  teachingClasses,
  users,
} from "@/lib/schema";

type StudentRef = { id: number; classId: number | null };

const teachingClassColumns = {
  id: teachingClasses.id,
  subject: teachingClasses.subject,
  teacherName: users.fullName,
};

/** Kelas ajar (mapel) yang diikuti siswa lewat kelas/rombelnya. */
export async function listStudentTeachingClasses(student: StudentRef) {
  if (!student.classId) return [];

  return db
    .select(teachingClassColumns)
    .from(teachingClasses)
    .innerJoin(teachers, eq(teachingClasses.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(eq(teachingClasses.classId, student.classId))
    .orderBy(asc(teachingClasses.subject));
}

/** Satu kelas ajar, hanya jika siswa memang terdaftar di kelas tersebut. */
export async function getStudentTeachingClass(
  student: StudentRef,
  tcId: number
) {
  if (!student.classId || !Number.isInteger(tcId) || tcId <= 0) return null;

  const [row] = await db
    .select(teachingClassColumns)
    .from(teachingClasses)
    .innerJoin(teachers, eq(teachingClasses.teacherId, teachers.id))
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(
      and(
        eq(teachingClasses.id, tcId),
        eq(teachingClasses.classId, student.classId)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function listStudentMaterials(tcId: number) {
  return db
    .select()
    .from(materials)
    .where(eq(materials.teachingClassId, tcId))
    .orderBy(desc(materials.createdAt));
}

export async function listStudentAnnouncements(tcId: number) {
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.teachingClassId, tcId))
    .orderBy(desc(announcements.createdAt));
}

/** Semua item penilaian kelas ajar beserta pengumpulan/nilai milik siswa ini. */
export async function listStudentAssessments(studentId: number, tcId: number) {
  const items = await db
    .select()
    .from(assessments)
    .where(
      and(eq(assessments.teachingClassId, tcId), eq(assessments.published, true))
    )
    .orderBy(desc(assessments.createdAt));

  if (items.length === 0) return [];

  const mine = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.studentId, studentId),
        inArray(
          submissions.assessmentId,
          items.map((item) => item.id)
        )
      )
    );

  const byAssessment = new Map(mine.map((s) => [s.assessmentId, s]));

  return items.map((item) => ({
    ...item,
    submission: byAssessment.get(item.id) ?? null,
  }));
}

export type StudentAssessment = Awaited<
  ReturnType<typeof listStudentAssessments>
>[number];

export function submissionStatus(item: StudentAssessment) {
  const sub = item.submission;

  if (sub?.score !== null && sub?.score !== undefined) return "dinilai" as const;
  if (sub?.submittedAt) return "terkumpul" as const;
  if (item.dueAt && item.dueAt < new Date()) return "terlambat" as const;

  return "belum" as const;
}

/** Nilai dan nilai akhir siswa di satu kelas ajar. */
export async function getStudentGrades(studentId: number, tcId: number) {
  const [items, weights] = await Promise.all([
    listStudentAssessments(studentId, tcId),
    getWeights(tcId),
  ]);

  // Nilai kuis/ujian online disembunyikan sampai guru merilisnya.
  const withVisibility = items.map((item) => {
    const hidden = isOnlineKind(item.kind) && !item.showResult;

    return {
      ...item,
      hidden,
      visibleScore: hidden ? null : (item.submission?.score ?? null),
    };
  });

  const scoreOf = (id: number) =>
    withVisibility.find((item) => item.id === id)?.visibleScore ?? null;

  return {
    items: [...withVisibility].reverse(),
    weights,
    finalScore: computeFinalScore(items, scoreOf, weights),
  };
}

export type OnlineState =
  | "belum_dibuka"
  | "dibuka"
  | "mengerjakan"
  | "selesai"
  | "ditutup";

/** Daftar kuis atau ujian untuk siswa di satu kelas ajar. */
export async function listStudentOnline(
  studentId: number,
  tcId: number,
  section: Section
) {
  return listStudentOnlineMany(studentId, [tcId], section);
}

/** Kuis atau ujian dari beberapa kelas ajar sekaligus (untuk halaman gabungan). */
export async function listStudentOnlineMany(
  studentId: number,
  tcIds: number[],
  section: Section
) {
  if (tcIds.length === 0) return [];

  const rows = await db
    .select()
    .from(assessments)
    .where(
      and(
        inArray(assessments.teachingClassId, tcIds),
        eq(assessments.published, true),
        inArray(assessments.kind, SECTION_KINDS[section])
      )
    )
    .orderBy(desc(assessments.createdAt));

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);

  const [attemptRows, scoreRows] = await Promise.all([
    db
      .select()
      .from(attempts)
      .where(
        and(eq(attempts.studentId, studentId), inArray(attempts.assessmentId, ids))
      ),
    db
      .select({
        assessmentId: submissions.assessmentId,
        score: submissions.score,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.studentId, studentId),
          inArray(submissions.assessmentId, ids)
        )
      ),
  ]);

  const attemptById = new Map(attemptRows.map((a) => [a.assessmentId, a]));
  const scoreById = new Map(scoreRows.map((s) => [s.assessmentId, s.score]));
  const now = new Date();

  return rows.map((item) => {
    const attempt = attemptById.get(item.id) ?? null;

    let state: OnlineState;

    if (attempt?.submittedAt) {
      state = "selesai";
    } else if (attempt) {
      const deadline = attemptDeadline(
        attempt.startedAt,
        item.durationMinutes,
        item.dueAt
      );

      state =
        deadline && now.getTime() > deadline.getTime() + GRACE_MS
          ? "selesai"
          : "mengerjakan";
    } else {
      state = windowState(item, now);
    }

    return {
      ...item,
      attempt,
      state,
      score: item.showResult ? (scoreById.get(item.id) ?? null) : null,
    };
  });
}

/** Riwayat kehadiran milik siswa di satu kelas ajar. */
export async function getStudentAttendance(studentId: number, tcId: number) {
  const sessions = await db
    .select()
    .from(attendanceSessions)
    .where(eq(attendanceSessions.teachingClassId, tcId))
    .orderBy(desc(attendanceSessions.meetingDate));

  const records =
    sessions.length === 0
      ? []
      : await db
          .select()
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.studentId, studentId),
              inArray(
                attendanceRecords.sessionId,
                sessions.map((s) => s.id)
              )
            )
          );

  const byDay = new Map(records.map((r) => [r.sessionId, r]));

  const rows = sessions.map((session) => ({
    session,
    status: (byDay.get(session.id)?.status ?? null) as AttendanceStatus | null,
    note: byDay.get(session.id)?.note ?? null,
  }));

  const tally: Record<AttendanceStatus, number> = {
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpa: 0,
  };

  for (const row of rows) {
    if (row.status) tally[row.status] += 1;
  }

  return {
    rows,
    tally,
    percent: sessions.length > 0 ? (tally.hadir / sessions.length) * 100 : null,
  };
}

/** Ringkasan untuk dashboard siswa di semua mapel. */
export async function getStudentDashboard(student: StudentRef) {
  const classes = await listStudentTeachingClasses(student);
  const ids = classes.map((c) => c.id);

  if (ids.length === 0) {
    return { classes, todo: [], recentAnnouncements: [] };
  }

  const nameById = new Map(classes.map((c) => [c.id, c.subject]));

  const [openTasks, recent] = await Promise.all([
    db
      .select()
      .from(assessments)
      .where(
        and(
          inArray(assessments.teachingClassId, ids),
          eq(assessments.published, true),
          inArray(assessments.kind, ["tugas", "kuis", "uts", "uas"])
        )
      )
      .orderBy(asc(assessments.dueAt)),
    db
      .select()
      .from(announcements)
      .where(inArray(announcements.teachingClassId, ids))
      .orderBy(desc(announcements.createdAt))
      .limit(5),
  ]);

  const mine =
    openTasks.length === 0
      ? []
      : await db
          .select({
            assessmentId: submissions.assessmentId,
            submittedAt: submissions.submittedAt,
          })
          .from(submissions)
          .where(
            and(
              eq(submissions.studentId, student.id),
              inArray(
                submissions.assessmentId,
                openTasks.map((t) => t.id)
              )
            )
          );

  const done = new Set(
    mine.filter((s) => s.submittedAt).map((s) => s.assessmentId)
  );

  const todo = openTasks
    .filter((t) => !done.has(t.id))
    .map((t) => ({ ...t, subject: nameById.get(t.teachingClassId) ?? "" }));

  return {
    classes,
    todo,
    recentAnnouncements: recent.map((n) => ({
      ...n,
      subject: nameById.get(n.teachingClassId) ?? "",
    })),
  };
}

