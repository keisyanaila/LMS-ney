import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { announcements, assessments, materials, submissions } from "@/lib/schema";
import {
  listStudentOnlineMany,
  listStudentTeachingClasses,
} from "@/lib/siswa-data";

type StudentRef = { id: number; classId: number | null };

export type PortalOnline = Awaited<
  ReturnType<typeof listStudentOnlineMany>
>[number] & { subject: string; teacherName: string };

/** Ada di sini supaya halaman dashboard, materi, kuis, dan ujian memakai data yang sama. */
export async function loadStudentPortal(student: StudentRef) {
  const classes = await listStudentTeachingClasses(student);
  const ids = classes.map((c) => c.id);
  const byId = new Map(classes.map((c) => [c.id, c]));

  const decorate = <T extends { teachingClassId: number }>(row: T) => ({
    ...row,
    subject: byId.get(row.teachingClassId)?.subject ?? "",
    teacherName: byId.get(row.teachingClassId)?.teacherName ?? "",
  });

  if (ids.length === 0) {
    return {
      classes,
      materials: [],
      kuis: [] as PortalOnline[],
      ujian: [] as PortalOnline[],
      tugas: [],
      announcements: [],
    };
  }

  const [materialRows, kuis, ujian, tugasRows, announcementRows] =
    await Promise.all([
      db
        .select()
        .from(materials)
        .where(inArray(materials.teachingClassId, ids))
        .orderBy(desc(materials.createdAt)),
      listStudentOnlineMany(student.id, ids, "kuis"),
      listStudentOnlineMany(student.id, ids, "ujian"),
      db
        .select()
        .from(assessments)
        .where(
          and(
            inArray(assessments.teachingClassId, ids),
            eq(assessments.published, true),
            eq(assessments.kind, "tugas")
          )
        ),
      db
        .select()
        .from(announcements)
        .where(inArray(announcements.teachingClassId, ids))
        .orderBy(desc(announcements.createdAt))
        .limit(8),
    ]);

  const mine =
    tugasRows.length === 0
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
                tugasRows.map((t) => t.id)
              )
            )
          );

  const submittedAt = new Map(mine.map((s) => [s.assessmentId, s.submittedAt]));

  return {
    classes,
    materials: materialRows.map(decorate),
    kuis: kuis.map(decorate) as PortalOnline[],
    ujian: ujian.map(decorate) as PortalOnline[],
    tugas: tugasRows.map((t) =>
      decorate({ ...t, submittedAt: submittedAt.get(t.id) ?? null })
    ),
    announcements: announcementRows.map(decorate),
  };
}

export type StudentPortal = Awaited<ReturnType<typeof loadStudentPortal>>;

const DONE_STATES = new Set(["selesai"]);

/** Persentase penyelesaian: kuis, ujian, dan tugas yang sudah selesai dari semuanya. */
export function computeProgress(portal: StudentPortal) {
  const online = [...portal.kuis, ...portal.ujian];
  const total = online.length + portal.tugas.length;
  const done =
    online.filter((o) => DONE_STATES.has(o.state)).length +
    portal.tugas.filter((t) => t.submittedAt).length;

  const bySubject = portal.classes.map((cls) => {
    const o = online.filter((x) => x.teachingClassId === cls.id);
    const t = portal.tugas.filter((x) => x.teachingClassId === cls.id);
    const all = o.length + t.length;
    const finished =
      o.filter((x) => DONE_STATES.has(x.state)).length +
      t.filter((x) => x.submittedAt).length;

    return {
      id: cls.id,
      subject: cls.subject,
      total: all,
      done: finished,
      percent: all === 0 ? null : Math.round((finished / all) * 100),
    };
  });

  return {
    total,
    done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    bySubject,
  };
}
