"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assessments,
  attendanceRecords,
  attendanceSessions,
  classes,
  materials,
  submissions,
  teachingClasses,
} from "@/lib/schema";
import { requireTeacher } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  ATTENDANCE_STATUSES,
  ASSESSMENT_KINDS,
  getOwnedAssessment,
  getOwnedAttendanceSession,
  getOwnedTeachingClass,
  listClassStudents,
  type AssessmentKind,
  type AttendanceStatus,
} from "@/lib/guru-data";
import { parseJakartaLocal } from "@/lib/format";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function toId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Guru yang login + kelas ajar yang benar-benar miliknya. */
async function authorize(tcId: string) {
  const { user, teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, toId(tcId));

  const actor = {
    userId: user.id,
    userName: user.fullName,
    role: "guru",
  };

  return { teacher, kelas, actor };
}

const notFound: FormState = {
  ok: false,
  message: "Kelas tidak ditemukan atau bukan kelas Anda.",
};

// ---------- Kelas ajar ----------

export async function createTeachingClass(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { user, teacher } = await requireTeacher();

  const classId = toId(text(formData, "classId"));
  const subject = text(formData, "subject");

  if (!classId || !subject) {
    return { ok: false, message: "Kelas dan mata pelajaran wajib diisi." };
  }

  if (subject.length > 150) {
    return { ok: false, message: "Nama mata pelajaran maksimal 150 karakter." };
  }

  try {
    const [cls] = await db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!cls) return { ok: false, message: "Kelas tidak ditemukan." };

    await db
      .insert(teachingClasses)
      .values({ teacherId: teacher.id, classId, subject });

    await logActivity(`Menambah kelas ajar ${subject} di ${cls.name}`, {
      userId: user.id,
      userName: user.fullName,
      role: "guru",
    });

    revalidatePath("/guru", "layout");

    return { ok: true, message: `${subject} - ${cls.name} ditambahkan.` };
  } catch (error) {
    console.error("Create teaching class error:", error);

    return {
      ok: false,
      message: "Gagal menyimpan. Kelas dan mata pelajaran ini mungkin sudah ada.",
    };
  }
}

export async function deleteTeachingClass(tcId: string): Promise<void> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return;

  try {
    await db.delete(teachingClasses).where(eq(teachingClasses.id, kelas.id));

    await logActivity(
      `Menghapus kelas ajar ${kelas.subject} di ${kelas.className}`,
      actor
    );

    revalidatePath("/guru", "layout");
  } catch (error) {
    console.error("Delete teaching class error:", error);
    return;
  }

  redirect("/guru/kelas");
}

// ---------- Materi ----------

export async function createMaterial(
  tcId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const title = text(formData, "title");
  const description = text(formData, "description");
  const linkUrl = text(formData, "linkUrl");

  if (!title) return { ok: false, message: "Judul materi wajib diisi." };
  if (title.length > 200) {
    return { ok: false, message: "Judul maksimal 200 karakter." };
  }
  if (linkUrl && !isHttpUrl(linkUrl)) {
    return {
      ok: false,
      message: "Link harus diawali http:// atau https://.",
    };
  }

  try {
    await db.insert(materials).values({
      teachingClassId: kelas.id,
      title,
      description: description || null,
      linkUrl: linkUrl || null,
    });

    await logActivity(
      `Menambah materi "${title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}/materi`);

    return { ok: true, message: "Materi berhasil ditambahkan." };
  } catch (error) {
    console.error("Create material error:", error);
    return { ok: false, message: "Gagal menyimpan materi." };
  }
}

export async function deleteMaterial(
  tcId: string,
  materialId: string
): Promise<void> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return;

  try {
    const [deleted] = await db
      .delete(materials)
      .where(
        and(
          eq(materials.id, toId(materialId)),
          eq(materials.teachingClassId, kelas.id)
        )
      )
      .returning({ title: materials.title });

    if (deleted) {
      await logActivity(
        `Menghapus materi "${deleted.title}" di ${kelas.subject} ${kelas.className}`,
        actor
      );
    }

    revalidatePath(`/guru/kelas/${kelas.id}/materi`);
  } catch (error) {
    console.error("Delete material error:", error);
  }
}

// ---------- Tugas dan penilaian ----------

/** mode "tugas": selalu tugas. mode "lainnya": kuis, UTS, UAS, atau praktik. */
export async function createAssessment(
  tcId: string,
  mode: "tugas" | "lainnya",
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const title = text(formData, "title");
  const instructions = text(formData, "instructions");
  const dueRaw = text(formData, "dueAt");
  const maxScore = Number(text(formData, "maxScore") || "100");

  let kind: AssessmentKind = "tugas";

  if (mode === "lainnya") {
    const picked = text(formData, "kind") as AssessmentKind;

    if (!ASSESSMENT_KINDS.includes(picked) || picked === "tugas") {
      return { ok: false, message: "Jenis penilaian tidak valid." };
    }

    kind = picked;
  }

  if (!title) return { ok: false, message: "Judul wajib diisi." };
  if (title.length > 200) {
    return { ok: false, message: "Judul maksimal 200 karakter." };
  }
  if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 1000) {
    return { ok: false, message: "Nilai maksimal harus 1 sampai 1000." };
  }

  const dueAt = dueRaw ? parseJakartaLocal(dueRaw) : null;

  if (dueRaw && !dueAt) {
    return { ok: false, message: "Format tenggat tidak valid." };
  }

  try {
    await db.insert(assessments).values({
      teachingClassId: kelas.id,
      kind,
      title,
      instructions: instructions || null,
      dueAt,
      maxScore,
    });

    await logActivity(
      `Menambah ${kind} "${title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}/tugas`);
    revalidatePath(`/guru/kelas/${kelas.id}/penilaian`);

    return { ok: true, message: `${title} berhasil dibuat.` };
  } catch (error) {
    console.error("Create assessment error:", error);
    return { ok: false, message: "Gagal menyimpan." };
  }
}

export async function deleteAssessment(
  tcId: string,
  assessmentId: string
): Promise<void> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return;

  try {
    const [deleted] = await db
      .delete(assessments)
      .where(
        and(
          eq(assessments.id, toId(assessmentId)),
          eq(assessments.teachingClassId, kelas.id)
        )
      )
      .returning({ title: assessments.title });

    if (deleted) {
      await logActivity(
        `Menghapus "${deleted.title}" di ${kelas.subject} ${kelas.className}`,
        actor
      );
    }

    revalidatePath(`/guru/kelas/${kelas.id}/tugas`);
    revalidatePath(`/guru/kelas/${kelas.id}/penilaian`);
  } catch (error) {
    console.error("Delete assessment error:", error);
  }
}

export async function saveScores(
  tcId: string,
  assessmentId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const assessment = await getOwnedAssessment(kelas.id, toId(assessmentId));

  if (!assessment) return { ok: false, message: "Penilaian tidak ditemukan." };

  const studentList = await listClassStudents(kelas.classId);

  const toSave: {
    assessmentId: number;
    studentId: number;
    score: number | null;
    feedback: string | null;
    gradedAt: Date | null;
  }[] = [];
  const toClear: number[] = [];
  let scored = 0;

  for (const student of studentList) {
    const raw = text(formData, `score-${student.id}`).replace(",", ".");
    const feedback = text(formData, `feedback-${student.id}`);

    if (raw === "" && feedback === "") {
      toClear.push(student.id);
      continue;
    }

    let score: number | null = null;

    if (raw !== "") {
      const value = Number(raw);

      if (!Number.isFinite(value) || value < 0 || value > assessment.maxScore) {
        return {
          ok: false,
          message: `Nilai ${student.fullName} harus antara 0 dan ${assessment.maxScore}.`,
        };
      }

      score = Math.round(value * 100) / 100;
      scored += 1;
    }

    toSave.push({
      assessmentId: assessment.id,
      studentId: student.id,
      score,
      feedback: feedback || null,
      gradedAt: score !== null ? new Date() : null,
    });
  }

  try {
    if (toSave.length > 0) {
      await db
        .insert(submissions)
        .values(toSave)
        .onConflictDoUpdate({
          target: [submissions.assessmentId, submissions.studentId],
          set: {
            score: sql`excluded.score`,
            feedback: sql`excluded.feedback`,
            gradedAt: sql`excluded.graded_at`,
          },
        });
    }

    if (toClear.length > 0) {
      await db
        .update(submissions)
        .set({ score: null, feedback: null, gradedAt: null })
        .where(
          and(
            eq(submissions.assessmentId, assessment.id),
            inArray(submissions.studentId, toClear)
          )
        );
    }

    await logActivity(
      `Menyimpan nilai "${assessment.title}" di ${kelas.subject} ${kelas.className} (${scored} murid)`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}/penilaian`, "layout");
    revalidatePath(`/guru/kelas/${kelas.id}/tugas`);

    return { ok: true, message: `Nilai tersimpan (${scored} murid dinilai).` };
  } catch (error) {
    console.error("Save scores error:", error);
    return { ok: false, message: "Gagal menyimpan nilai." };
  }
}

// ---------- Kehadiran ----------

export async function createAttendanceSession(
  tcId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const meetingDate = text(formData, "meetingDate");
  const topic = text(formData, "topic");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)) {
    return { ok: false, message: "Tanggal pertemuan wajib diisi." };
  }

  if (topic.length > 200) {
    return { ok: false, message: "Topik maksimal 200 karakter." };
  }

  let sessionId: number;

  try {
    const [created] = await db
      .insert(attendanceSessions)
      .values({
        teachingClassId: kelas.id,
        meetingDate,
        topic: topic || null,
      })
      .returning({ id: attendanceSessions.id });

    sessionId = created.id;

    // Semua murid diawali "hadir"; guru tinggal mengubah yang tidak hadir.
    const studentList = await listClassStudents(kelas.classId);

    if (studentList.length > 0) {
      await db.insert(attendanceRecords).values(
        studentList.map((student) => ({
          sessionId,
          studentId: student.id,
          status: "hadir" as const,
        }))
      );
    }

    await logActivity(
      `Membuat pertemuan ${meetingDate} di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}/kehadiran`);
  } catch (error) {
    console.error("Create attendance session error:", error);

    return {
      ok: false,
      message: "Gagal membuat pertemuan. Tanggal ini mungkin sudah ada.",
    };
  }

  // redirect() melempar error, jadi harus di luar try/catch.
  redirect(`/guru/kelas/${kelas.id}/kehadiran/${sessionId}`);
}

export async function saveAttendance(
  tcId: string,
  sessionId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const session = await getOwnedAttendanceSession(kelas.id, toId(sessionId));

  if (!session) return { ok: false, message: "Pertemuan tidak ditemukan." };

  const studentList = await listClassStudents(kelas.classId);

  if (studentList.length === 0) {
    return { ok: false, message: "Kelas ini belum punya murid." };
  }

  const values = studentList.map((student) => {
    const status = text(formData, `status-${student.id}`) as AttendanceStatus;
    const note = text(formData, `note-${student.id}`).slice(0, 200);

    return {
      sessionId: session.id,
      studentId: student.id,
      status: ATTENDANCE_STATUSES.includes(status) ? status : ("hadir" as const),
      note: note || null,
    };
  });

  try {
    await db
      .insert(attendanceRecords)
      .values(values)
      .onConflictDoUpdate({
        target: [attendanceRecords.sessionId, attendanceRecords.studentId],
        set: {
          status: sql`excluded.status`,
          note: sql`excluded.note`,
        },
      });

    await logActivity(
      `Menyimpan kehadiran ${session.meetingDate} di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}/kehadiran`, "layout");

    return { ok: true, message: "Kehadiran tersimpan." };
  } catch (error) {
    console.error("Save attendance error:", error);
    return { ok: false, message: "Gagal menyimpan kehadiran." };
  }
}

export async function deleteAttendanceSession(
  tcId: string,
  sessionId: string
): Promise<void> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return;

  try {
    const [deleted] = await db
      .delete(attendanceSessions)
      .where(
        and(
          eq(attendanceSessions.id, toId(sessionId)),
          eq(attendanceSessions.teachingClassId, kelas.id)
        )
      )
      .returning({ date: attendanceSessions.meetingDate });

    if (deleted) {
      await logActivity(
        `Menghapus pertemuan ${deleted.date} di ${kelas.subject} ${kelas.className}`,
        actor
      );
    }

    revalidatePath(`/guru/kelas/${kelas.id}/kehadiran`, "layout");
  } catch (error) {
    console.error("Delete attendance session error:", error);
    return;
  }

  redirect(`/guru/kelas/${kelas.id}/kehadiran`);
}
