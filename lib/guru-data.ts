import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { computeFinalScore, type Weights } from "@/lib/grading";
import {
  announcements,
  assessments,
  attendanceRecords,
  attendanceSessions,
  classes,
  gradeWeights,
  majors,
  materials,
  students,
  submissions,
  teachingClasses,
  users,
} from "@/lib/schema";

export const ASSESSMENT_KINDS = [
  "tugas",
  "kuis",
  "uts",
  "uas",
  "praktik",
] as const;
export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];

export const KIND_LABELS: Record<AssessmentKind, string> = {
  tugas: "Tugas",
  kuis: "Kuis",
  uts: "UTS",
  uas: "UAS",
  praktik: "Praktik",
};

export const ATTENDANCE_STATUSES = ["hadir", "izin", "sakit", "alpa"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

/** Kelas ajar milik guru ini, atau null jika tidak ada / bukan miliknya. */
export async function getOwnedTeachingClass(teacherId: number, id: number) {
  if (!Number.isInteger(id) || id <= 0) return null;

  const [row] = await db
    .select({
      id: teachingClasses.id,
      subject: teachingClasses.subject,
      classId: classes.id,
      className: classes.name,
      majorCode: majors.code,
    })
    .from(teachingClasses)
    .innerJoin(classes, eq(teachingClasses.classId, classes.id))
    .innerJoin(majors, eq(classes.majorId, majors.id))
    .where(
      and(eq(teachingClasses.id, id), eq(teachingClasses.teacherId, teacherId))
    )
    .limit(1);

  return row ?? null;
}

export async function listTeachingClasses(teacherId: number) {
  const rows = await db
    .select({
      id: teachingClasses.id,
      subject: teachingClasses.subject,
      classId: classes.id,
      className: classes.name,
      majorCode: majors.code,
    })
    .from(teachingClasses)
    .innerJoin(classes, eq(teachingClasses.classId, classes.id))
    .innerJoin(majors, eq(classes.majorId, majors.id))
    .where(eq(teachingClasses.teacherId, teacherId))
    .orderBy(asc(classes.name), asc(teachingClasses.subject));

  if (rows.length === 0) return [];

  const counts = await db
    .select({ classId: students.classId, total: count() })
    .from(students)
    .where(
      inArray(
        students.classId,
        rows.map((row) => row.classId)
      )
    )
    .groupBy(students.classId);

  const totalByClass = new Map(counts.map((c) => [c.classId, c.total]));

  return rows.map((row) => ({
    ...row,
    studentCount: totalByClass.get(row.classId) ?? 0,
  }));
}

export async function listAllClassOptions() {
  return db
    .select({ id: classes.id, name: classes.name, majorCode: majors.code })
    .from(classes)
    .innerJoin(majors, eq(classes.majorId, majors.id))
    .orderBy(asc(classes.name));
}

export async function listClassStudents(classId: number) {
  return db
    .select({
      id: students.id,
      fullName: users.fullName,
      studentNumber: students.studentNumber,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(eq(students.classId, classId))
    .orderBy(asc(users.fullName));
}

export async function listMaterials(teachingClassId: number) {
  return db
    .select()
    .from(materials)
    .where(eq(materials.teachingClassId, teachingClassId))
    .orderBy(desc(materials.createdAt));
}

export async function listAssessments(
  teachingClassId: number,
  filter?: "tugas" | "lainnya"
) {
  const rows = await db
    .select()
    .from(assessments)
    .where(eq(assessments.teachingClassId, teachingClassId))
    .orderBy(desc(assessments.createdAt));

  if (filter === "tugas") return rows.filter((r) => r.kind === "tugas");
  if (filter === "lainnya") return rows.filter((r) => r.kind !== "tugas");
  return rows;
}

export async function getOwnedAssessment(
  teachingClassId: number,
  assessmentId: number
) {
  if (!Number.isInteger(assessmentId) || assessmentId <= 0) return null;

  const [row] = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.id, assessmentId),
        eq(assessments.teachingClassId, teachingClassId)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function listSubmissions(assessmentId: number) {
  return db
    .select()
    .from(submissions)
    .where(eq(submissions.assessmentId, assessmentId));
}

/** Bobot nilai kelas ajar; null jika guru belum mengaturnya. */
export async function getWeights(teachingClassId: number): Promise<Weights | null> {
  const rows = await db
    .select({ kind: gradeWeights.kind, weight: gradeWeights.weight })
    .from(gradeWeights)
    .where(eq(gradeWeights.teachingClassId, teachingClassId));

  if (rows.length === 0) return null;

  return Object.fromEntries(rows.map((r) => [r.kind, r.weight])) as Weights;
}

/** Rekap nilai: semua murid x semua item penilaian di satu kelas ajar. */
export async function getGradeMatrix(
  teachingClassId: number,
  classId: number
) {
  const [studentRows, items, weights] = await Promise.all([
    listClassStudents(classId),
    db
      .select()
      .from(assessments)
      .where(eq(assessments.teachingClassId, teachingClassId))
      .orderBy(asc(assessments.createdAt)),
    getWeights(teachingClassId),
  ]);

  const scoreRows =
    items.length === 0
      ? []
      : await db
          .select({
            assessmentId: submissions.assessmentId,
            studentId: submissions.studentId,
            score: submissions.score,
          })
          .from(submissions)
          .where(
            inArray(
              submissions.assessmentId,
              items.map((item) => item.id)
            )
          );

  const scoreMap = new Map<string, number>();

  for (const row of scoreRows) {
    if (row.score !== null) {
      scoreMap.set(`${row.studentId}:${row.assessmentId}`, row.score);
    }
  }

  const rows = studentRows.map((student) => {
    const scores = items.map(
      (item) => scoreMap.get(`${student.id}:${item.id}`) ?? null
    );

    const average = computeFinalScore(
      items,
      (itemId) => scoreMap.get(`${student.id}:${itemId}`) ?? null,
      weights
    );

    return { student, scores, average };
  });

  return { items, rows, weights };
}

export async function listAnnouncements(teachingClassId: number) {
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.teachingClassId, teachingClassId))
    .orderBy(desc(announcements.createdAt));
}

/** Per item: berapa murid sudah mengumpulkan dan berapa yang sudah dinilai. */
export async function getSubmissionCounts(assessmentIds: number[]) {
  const result = new Map<number, { submitted: number; graded: number }>();

  if (assessmentIds.length === 0) return result;

  const rows = await db
    .select({
      assessmentId: submissions.assessmentId,
      submittedAt: submissions.submittedAt,
      score: submissions.score,
    })
    .from(submissions)
    .where(inArray(submissions.assessmentId, assessmentIds));

  for (const row of rows) {
    const entry = result.get(row.assessmentId) ?? { submitted: 0, graded: 0 };

    if (row.submittedAt) entry.submitted += 1;
    if (row.score !== null) entry.graded += 1;

    result.set(row.assessmentId, entry);
  }

  return result;
}

export async function listAttendanceSessions(teachingClassId: number) {
  const sessions = await db
    .select()
    .from(attendanceSessions)
    .where(eq(attendanceSessions.teachingClassId, teachingClassId))
    .orderBy(desc(attendanceSessions.meetingDate));

  if (sessions.length === 0) return [];

  const records = await db
    .select({
      sessionId: attendanceRecords.sessionId,
      status: attendanceRecords.status,
      total: count(),
    })
    .from(attendanceRecords)
    .where(
      inArray(
        attendanceRecords.sessionId,
        sessions.map((s) => s.id)
      )
    )
    .groupBy(attendanceRecords.sessionId, attendanceRecords.status);

  return sessions.map((session) => {
    const tally: Record<AttendanceStatus, number> = {
      hadir: 0,
      izin: 0,
      sakit: 0,
      alpa: 0,
    };

    for (const r of records) {
      if (r.sessionId === session.id) tally[r.status] = r.total;
    }

    return { ...session, tally };
  });
}

export async function getOwnedAttendanceSession(
  teachingClassId: number,
  sessionId: number
) {
  if (!Number.isInteger(sessionId) || sessionId <= 0) return null;

  const [row] = await db
    .select()
    .from(attendanceSessions)
    .where(
      and(
        eq(attendanceSessions.id, sessionId),
        eq(attendanceSessions.teachingClassId, teachingClassId)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function listAttendanceRecords(sessionId: number) {
  return db
    .select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.sessionId, sessionId));
}

/** Persentase kehadiran per murid di seluruh pertemuan. */
export async function getAttendanceRecap(
  teachingClassId: number,
  classId: number
) {
  const [studentRows, sessions] = await Promise.all([
    listClassStudents(classId),
    db
      .select({ id: attendanceSessions.id })
      .from(attendanceSessions)
      .where(eq(attendanceSessions.teachingClassId, teachingClassId)),
  ]);

  const records =
    sessions.length === 0
      ? []
      : await db
          .select({
            studentId: attendanceRecords.studentId,
            status: attendanceRecords.status,
          })
          .from(attendanceRecords)
          .where(
            inArray(
              attendanceRecords.sessionId,
              sessions.map((s) => s.id)
            )
          );

  return {
    sessionCount: sessions.length,
    rows: studentRows.map((student) => {
      const tally: Record<AttendanceStatus, number> = {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
      };

      for (const r of records) {
        if (r.studentId === student.id) tally[r.status] += 1;
      }

      const percent =
        sessions.length > 0 ? (tally.hadir / sessions.length) * 100 : null;

      return { student, tally, percent };
    }),
  };
}

export async function getTeacherDashboard(teacherId: number) {
  const teaching = await listTeachingClasses(teacherId);
  const ids = teaching.map((t) => t.id);

  // Murid dihitung sekali per kelas (rombel), walau diajar beberapa mapel.
  const studentTotal = [
    ...new Map(teaching.map((t) => [t.classId, t.studentCount])).values(),
  ].reduce((sum, n) => sum + n, 0);

  if (ids.length === 0) {
    return { teaching, studentTotal, upcoming: [], ungraded: 0 };
  }

  const [upcoming, [{ total: ungraded }]] = await Promise.all([
    db
      .select({
        id: assessments.id,
        title: assessments.title,
        kind: assessments.kind,
        dueAt: assessments.dueAt,
        teachingClassId: assessments.teachingClassId,
        subject: teachingClasses.subject,
        className: classes.name,
      })
      .from(assessments)
      .innerJoin(
        teachingClasses,
        eq(assessments.teachingClassId, teachingClasses.id)
      )
      .innerJoin(classes, eq(teachingClasses.classId, classes.id))
      .where(
        and(
          inArray(assessments.teachingClassId, ids),
          gte(assessments.dueAt, new Date())
        )
      )
      .orderBy(asc(assessments.dueAt))
      .limit(5),
    db
      .select({ total: count() })
      .from(submissions)
      .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
      .where(
        and(
          inArray(assessments.teachingClassId, ids),
          isNotNull(submissions.submittedAt),
          isNull(submissions.score)
        )
      ),
  ]);

  return { teaching, studentTotal, upcoming, ungraded };
}

/** Jumlah murid yang sudah diberi nilai, per item penilaian. */
export async function countScoredByAssessment(assessmentIds: number[]) {
  if (assessmentIds.length === 0) return new Map<number, number>();

  const rows = await db
    .select({ assessmentId: submissions.assessmentId, total: count() })
    .from(submissions)
    .where(
      and(
        inArray(submissions.assessmentId, assessmentIds),
        isNotNull(submissions.score)
      )
    )
    .groupBy(submissions.assessmentId);

  return new Map(rows.map((row) => [row.assessmentId, row.total]));
}

/** Absensi lengkap: murid x pertemuan (untuk export Excel). */
export async function getAttendanceMatrix(
  teachingClassId: number,
  classId: number
) {
  const [studentRows, sessions] = await Promise.all([
    listClassStudents(classId),
    db
      .select()
      .from(attendanceSessions)
      .where(eq(attendanceSessions.teachingClassId, teachingClassId))
      .orderBy(asc(attendanceSessions.meetingDate)),
  ]);

  const records =
    sessions.length === 0
      ? []
      : await db
          .select({
            sessionId: attendanceRecords.sessionId,
            studentId: attendanceRecords.studentId,
            status: attendanceRecords.status,
          })
          .from(attendanceRecords)
          .where(
            inArray(
              attendanceRecords.sessionId,
              sessions.map((s) => s.id)
            )
          );

  const statusMap = new Map<string, AttendanceStatus>();

  for (const r of records) {
    statusMap.set(`${r.studentId}:${r.sessionId}`, r.status);
  }

  return {
    sessions,
    rows: studentRows.map((student) => ({
      student,
      statuses: sessions.map(
        (session) => statusMap.get(`${student.id}:${session.id}`) ?? null
      ),
    })),
  };
}
