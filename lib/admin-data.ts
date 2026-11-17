
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
} from "@/lib/schema";
import type { CollectionKey } from "@/lib/admin-nav";

export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type AdminRow = {
  id: number;
  [key: string]: any;
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
