import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assessments,
  materials,
  students,
  submissions,
  teachers,
  teachingClasses,
} from "@/lib/schema";

/**
 * Siapa yang boleh membuka sebuah file:
 * - file materi: guru pemilik kelas ajar dan murid di kelas itu
 * - file tugas: murid pemiliknya dan guru pemilik kelas ajar
 * - admin: semua
 */
export async function canAccessFile(
  user: { id: number; role: string },
  fileId: number
): Promise<boolean> {
  if (user.role === "admin") return true;

  const [[material], [submission]] = await Promise.all([
    db
      .select({
        teacherId: teachingClasses.teacherId,
        classId: teachingClasses.classId,
      })
      .from(materials)
      .innerJoin(
        teachingClasses,
        eq(materials.teachingClassId, teachingClasses.id)
      )
      .where(eq(materials.fileId, fileId))
      .limit(1),
    db
      .select({
        studentId: submissions.studentId,
        teacherId: teachingClasses.teacherId,
      })
      .from(submissions)
      .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
      .innerJoin(
        teachingClasses,
        eq(assessments.teachingClassId, teachingClasses.id)
      )
      .where(eq(submissions.fileId, fileId))
      .limit(1),
  ]);

  if (!material && !submission) return false;

  if (user.role === "guru") {
    const [teacher] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.userId, user.id))
      .limit(1);

    if (!teacher) return false;

    return (
      material?.teacherId === teacher.id ||
      submission?.teacherId === teacher.id
    );
  }

  if (user.role === "murid") {
    const [student] = await db
      .select({ id: students.id, classId: students.classId })
      .from(students)
      .where(eq(students.userId, user.id))
      .limit(1);

    if (!student) return false;

    if (
      material &&
      student.classId !== null &&
      material.classId === student.classId
    ) {
      return true;
    }

    return submission?.studentId === student.id;
  }

  return false;
}
