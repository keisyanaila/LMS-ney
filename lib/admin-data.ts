
import { connection } from "next/server";
import { count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  teachers,
  students,
  majors,
  classes,
  activityLogs,
  academicYears,
} from "@/lib/schema";
import type { CollectionKey } from "@/lib/admin-nav";

export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type AdminRow = {
  id: number;
  [key: string]: unknown;
};

function toError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function listDocs(
  key: CollectionKey,
  limit = 50
): Promise<DataResult<AdminRow[]>> {
  await connection();

  try {
    let data: AdminRow[];

    switch (key) {
      case "users":
        data = await db
          .select()
          .from(users)
          .orderBy(desc(users.id))
          .limit(limit);
        break;

      case "teachers":
        data = await db
          .select({
            id: teachers.id,
            userId: teachers.userId,
            teacherNumber: teachers.teacherNumber,
            subject: teachers.subject,
            phone: teachers.phone,
            fullName: users.fullName,
            username: users.username,
            email: users.email,
            status: users.status,
          })
          .from(teachers)
          .innerJoin(users, eq(teachers.userId, users.id))
          .orderBy(desc(teachers.id))
          .limit(limit);
        break;

      case "students":
        data = await db
          .select({
            id: students.id,
            userId: students.userId,
            studentNumber: students.studentNumber,
            classId: students.classId,
            className: classes.name,
            major: majors.name,
            academicYear: students.academicYear,
            phone: students.phone,
            fullName: users.fullName,
            username: users.username,
            email: users.email,
            status: users.status,
          })
          .from(students)
          .innerJoin(users, eq(students.userId, users.id))
          .leftJoin(classes, eq(students.classId, classes.id))
          .leftJoin(majors, eq(classes.majorId, majors.id))
          .orderBy(desc(students.id))
          .limit(limit);
        break;

      case "majors":
        data = await db
          .select()
          .from(majors)
          .orderBy(desc(majors.id))
          .limit(limit);
        break;

      case "classes":
        data = await db
          .select({
            id: classes.id,
            name: classes.name,
            majorId: classes.majorId,
            major: majors.name,
            majorCode: majors.code,
            homeroomTeacherId: classes.homeroomTeacherId,
            homeroomTeacher: users.fullName,
            createdAt: classes.createdAt,
          })
          .from(classes)
          .innerJoin(majors, eq(classes.majorId, majors.id))
          .leftJoin(teachers, eq(classes.homeroomTeacherId, teachers.id))
          .leftJoin(users, eq(teachers.userId, users.id))
          .orderBy(desc(classes.id))
          .limit(limit);
        break;

      case "logs":
        data = await db
          .select()
          .from(activityLogs)
          .orderBy(desc(activityLogs.id))
          .limit(limit);
        break;

      default:
        return {
          ok: false,
          error: `Data "${String(key)}" tidak dikenal.`,
        };
    }

    return { ok: true, data: data as AdminRow[] };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export type ClassListRow = {
  id: number;
  name: string;
  majorId: number;
  major: string;
  majorCode: string;
  homeroomTeacherId: number | null;
  homeroomTeacher: string | null;
  studentCount: number;
};

/** Daftar kelas beserta jumlah murid di tiap kelas. */
export async function listClassesWithCounts(): Promise<
  DataResult<ClassListRow[]>
> {
  await connection();

  try {
    const data = await db
      .select({
        id: classes.id,
        name: classes.name,
        majorId: classes.majorId,
        major: majors.name,
        majorCode: majors.code,
        homeroomTeacherId: classes.homeroomTeacherId,
        homeroomTeacher: users.fullName,
        studentCount: count(students.id),
      })
      .from(classes)
      .innerJoin(majors, eq(classes.majorId, majors.id))
      .leftJoin(teachers, eq(classes.homeroomTeacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .leftJoin(students, eq(students.classId, classes.id))
      .groupBy(classes.id, majors.id, teachers.id, users.id)
      .orderBy(classes.name);

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export type ClassDetail = {
  id: number;
  name: string;
  majorId: number;
  major: string;
  majorCode: string;
  homeroomTeacherId: number | null;
  homeroomTeacher: string | null;
  homeroomTeacherNumber: string | null;
  createdAt: Date;
  students: {
    id: number;
    studentNumber: string | null;
    fullName: string;
    username: string;
    academicYear: string | null;
    status: "active" | "inactive";
  }[];
};

/** Satu kelas beserta wali kelas dan seluruh muridnya. `data` null = tidak ditemukan. */
export async function getClassDetail(
  classId: number
): Promise<DataResult<ClassDetail | null>> {
  await connection();

  try {
    const [found] = await db
      .select({
        id: classes.id,
        name: classes.name,
        majorId: classes.majorId,
        major: majors.name,
        majorCode: majors.code,
        homeroomTeacherId: classes.homeroomTeacherId,
        homeroomTeacher: users.fullName,
        homeroomTeacherNumber: teachers.teacherNumber,
        createdAt: classes.createdAt,
      })
      .from(classes)
      .innerJoin(majors, eq(classes.majorId, majors.id))
      .leftJoin(teachers, eq(classes.homeroomTeacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .where(eq(classes.id, classId))
      .limit(1);

    if (!found) return { ok: true, data: null };

    const classStudents = await db
      .select({
        id: students.id,
        studentNumber: students.studentNumber,
        fullName: users.fullName,
        username: users.username,
        academicYear: students.academicYear,
        status: users.status,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.classId, classId))
      .orderBy(users.fullName);

    return { ok: true, data: { ...found, students: classStudents } };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export type AcademicYearRow = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  studentCount: number;
};

/** Daftar tahun ajaran (terbaru di atas) beserta jumlah murid yang memakainya. */
export async function listAcademicYears(): Promise<
  DataResult<AcademicYearRow[]>
> {
  await connection();

  try {
    const [years, perYear] = await Promise.all([
      db.select().from(academicYears).orderBy(desc(academicYears.name)),
      db
        .select({ name: students.academicYear, total: count() })
        .from(students)
        .groupBy(students.academicYear),
    ]);

    const totals = new Map(perYear.map((row) => [row.name, row.total]));

    return {
      ok: true,
      data: years.map((year) => ({
        ...year,
        studentCount: totals.get(year.name) ?? 0,
      })),
    };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export async function countDocs(
  keys: CollectionKey[]
): Promise<DataResult<Record<string, number>>> {
  await connection();

  try {
    const tables = {
      users,
      teachers,
      students,
      majors,
      classes,
      logs: activityLogs,
    } as const;

    const entries = await Promise.all(
      keys.map(async (key) => {
        const [row] = await db.select({ total: count() }).from(tables[key]);
        return [key, row.total] as const;
      })
    );

    return { ok: true, data: Object.fromEntries(entries) };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export type DashboardData = {
  roleCounts: Record<string, number>;
  totalAccounts: number;
  inactiveAccounts: number;
  majorCount: number;
  classCount: number;
  studentsPerClass: { name: string; total: number }[];
  studentsWithoutClass: number;
  classesWithoutHomeroom: number;
  recentAccounts: AdminRow[];
  recentLogs: AdminRow[];
};

export async function getDashboardData(): Promise<DataResult<DashboardData>> {
  await connection();

  try {
    const [
      roleRows,
      inactiveRow,
      majorRow,
      classRow,
      perClass,
      noClassRow,
      noHomeroomRow,
      recentAccounts,
      recentLogs,
    ] = await Promise.all([
      db.select({ role: users.role, total: count() }).from(users).groupBy(users.role),
      db.select({ total: count() }).from(users).where(eq(users.status, "inactive")),
      db.select({ total: count() }).from(majors),
      db.select({ total: count() }).from(classes),
      db
        .select({ name: classes.name, total: count(students.id) })
        .from(classes)
        .leftJoin(students, eq(students.classId, classes.id))
        .groupBy(classes.id, classes.name)
        .orderBy(classes.name),
      db.select({ total: count() }).from(students).where(isNull(students.classId)),
      db.select({ total: count() }).from(classes).where(isNull(classes.homeroomTeacherId)),
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.id))
        .limit(6),
      db.select().from(activityLogs).orderBy(desc(activityLogs.id)).limit(6),
    ]);

    const roleCounts: Record<string, number> = {};
    let totalAccounts = 0;
    for (const row of roleRows) {
      roleCounts[row.role] = row.total;
      totalAccounts += row.total;
    }

    return {
      ok: true,
      data: {
        roleCounts,
        totalAccounts,
        inactiveAccounts: inactiveRow[0]?.total ?? 0,
        majorCount: majorRow[0]?.total ?? 0,
        classCount: classRow[0]?.total ?? 0,
        studentsPerClass: perClass,
        studentsWithoutClass: noClassRow[0]?.total ?? 0,
        classesWithoutHomeroom: noHomeroomRow[0]?.total ?? 0,
        recentAccounts: recentAccounts as AdminRow[],
        recentLogs: recentLogs as AdminRow[],
      },
    };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}
