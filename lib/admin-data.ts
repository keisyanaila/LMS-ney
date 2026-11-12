
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
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
            phone: students.phone,
            fullName: users.fullName,
            username: users.username,
            email: users.email,
            status: users.status,
          })
          .from(students)
          .innerJoin(users, eq(students.userId, users.id))
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
    const counts: Record<string, number> = {};

    for (const key of keys) {
      switch (key) {
        case "users":
          counts[key] = (await db.select({ id: users.id }).from(users)).length;
          break;
        case "teachers":
          counts[key] = (await db.select({ id: teachers.id }).from(teachers)).length;
          break;
        case "students":
          counts[key] = (await db.select({ id: students.id }).from(students)).length;
          break;
        case "majors":
          counts[key] = (await db.select({ id: majors.id }).from(majors)).length;
          break;
        case "classes":
          counts[key] = (await db.select({ id: classes.id }).from(classes)).length;
          break;
        case "logs":
          counts[key] = (await db.select({ id: activityLogs.id }).from(activityLogs)).length;
          break;
      }
    }

    return { ok: true, data: counts };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}
