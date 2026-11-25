"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gt, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  announcements,
  assessments,
  attendanceRecords,
  attendanceSessions,
  classes,
  gradeWeights,
  materials,
  submissions,
  teachingClasses,
} from "@/lib/schema";
import { requireTeacher } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  ATTENDANCE_STATUSES,
  getOwnedAssessment,
  getOwnedAttendanceSession,
  getOwnedTeachingClass,
  listClassStudents,
  type AssessmentKind,
  type AttendanceStatus,
} from "@/lib/guru-data";
import { parseJakartaLocal } from "@/lib/format";
import { isOnlineKind, sectionOfKind } from "@/lib/online";
import { countAttempts } from "@/lib/quiz-data";
import { deleteFile, pickFile, uploadFile } from "@/lib/storage";

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

/** Data kelas ajar tampil juga di panel siswa. */
function revalidateStudents() {
  revalidatePath("/siswa", "layout");
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
    // Kumpulkan file dulu: baris database ikut terhapus lewat cascade.
    const [materialFiles, submissionFiles] = await Promise.all([
      db
        .select({ id: materials.fileId })
        .from(materials)
        .where(
          and(
            eq(materials.teachingClassId, kelas.id),
            isNotNull(materials.fileId)
          )
        ),
      db
        .select({ id: submissions.fileId })
        .from(submissions)
        .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
        .where(
          and(
            eq(assessments.teachingClassId, kelas.id),
            isNotNull(submissions.fileId)
          )
        ),
    ]);

    await db.delete(teachingClasses).where(eq(teachingClasses.id, kelas.id));

    await Promise.all(
      [...materialFiles, ...submissionFiles].map((f) => deleteFile(f.id))
    );

    await logActivity(
      `Menghapus kelas ajar ${kelas.subject} di ${kelas.className}`,
      actor
    );

    revalidatePath("/guru", "layout");
    revalidateStudents();
  } catch (error) {
    console.error("Delete teaching class error:", error);
    return;
  }

  redirect("/guru/kelas");
}

// ---------- Materi ----------

type MaterialInput = {
  title: string;
  description: string;
  linkUrl: string;
};

function readMaterial(formData: FormData): MaterialInput | string {
  const title = text(formData, "title");
  const description = text(formData, "description");
  const linkUrl = text(formData, "linkUrl");

  if (!title) return "Judul materi wajib diisi.";
  if (title.length > 200) return "Judul maksimal 200 karakter.";
  if (linkUrl && !isHttpUrl(linkUrl)) {
    return "Link harus diawali http:// atau https://.";
  }

  return { title, description, linkUrl };
}

export async function createMaterial(
  tcId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const input = readMaterial(formData);

  if (typeof input === "string") return { ok: false, message: input };

  let fileId: number | null = null;
  let fileName: string | null = null;

  const file = pickFile(formData, "file");

  if (file) {
    const uploaded = await uploadFile(file);

    if (!uploaded.ok) return { ok: false, message: uploaded.message };

    fileId = uploaded.id;
    fileName = uploaded.name;
  }

  try {
    await db.insert(materials).values({
      teachingClassId: kelas.id,
      title: input.title,
      description: input.description || null,
      linkUrl: input.linkUrl || null,
      fileId,
      fileName,
    });

    await logActivity(
      `Menambah materi "${input.title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();

    return { ok: true, message: "Materi berhasil ditambahkan." };
  } catch (error) {
    console.error("Create material error:", error);
    await deleteFile(fileId);
    return { ok: false, message: "Gagal menyimpan materi." };
  }
}

export async function updateMaterial(
  tcId: string,
  materialId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const input = readMaterial(formData);

  if (typeof input === "string") return { ok: false, message: input };

  const [existing] = await db
    .select()
    .from(materials)
    .where(
      and(
        eq(materials.id, toId(materialId)),
        eq(materials.teachingClassId, kelas.id)
      )
    )
    .limit(1);

  if (!existing) return { ok: false, message: "Materi tidak ditemukan." };

  let fileId = existing.fileId;
  let fileName = existing.fileName;
  let oldFileToDelete: number | null = null;

  const newFile = pickFile(formData, "file");

  if (newFile) {
    const uploaded = await uploadFile(newFile);

    if (!uploaded.ok) return { ok: false, message: uploaded.message };

    oldFileToDelete = existing.fileId;
    fileId = uploaded.id;
    fileName = uploaded.name;
  } else if (formData.get("removeFile") === "on" && existing.fileId) {
    oldFileToDelete = existing.fileId;
    fileId = null;
    fileName = null;
  }

  try {
    await db
      .update(materials)
      .set({
        title: input.title,
        description: input.description || null,
        linkUrl: input.linkUrl || null,
        fileId,
        fileName,
      })
      .where(eq(materials.id, existing.id));

    await deleteFile(oldFileToDelete);

    await logActivity(
      `Mengubah materi "${input.title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();
  } catch (error) {
    console.error("Update material error:", error);

    if (newFile) await deleteFile(fileId);

    return { ok: false, message: "Gagal menyimpan perubahan." };
  }

  redirect(`/guru/kelas/${kelas.id}/materi`);
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
      .returning({ title: materials.title, fileId: materials.fileId });

    if (deleted) {
      await deleteFile(deleted.fileId);

      await logActivity(
        `Menghapus materi "${deleted.title}" di ${kelas.subject} ${kelas.className}`,
        actor
      );
    }

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();
  } catch (error) {
    console.error("Delete material error:", error);
  }
}

// ---------- Pengumuman ----------

export async function createAnnouncement(
  tcId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const title = text(formData, "title");
  const body = text(formData, "body");

  if (!title || !body) {
    return { ok: false, message: "Judul dan isi pengumuman wajib diisi." };
  }

  if (title.length > 200) {
    return { ok: false, message: "Judul maksimal 200 karakter." };
  }

  try {
    await db
      .insert(announcements)
      .values({ teachingClassId: kelas.id, title, body });

    await logActivity(
      `Membuat pengumuman "${title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();

    return { ok: true, message: "Pengumuman dikirim ke murid." };
  } catch (error) {
    console.error("Create announcement error:", error);
    return { ok: false, message: "Gagal menyimpan pengumuman." };
  }
}

export async function deleteAnnouncement(
  tcId: string,
  announcementId: string
): Promise<void> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return;

  try {
    const [deleted] = await db
      .delete(announcements)
      .where(
        and(
          eq(announcements.id, toId(announcementId)),
          eq(announcements.teachingClassId, kelas.id)
        )
      )
      .returning({ title: announcements.title });

    if (deleted) {
      await logActivity(
        `Menghapus pengumuman "${deleted.title}" di ${kelas.subject} ${kelas.className}`,
        actor
      );
    }

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();
  } catch (error) {
    console.error("Delete announcement error:", error);
  }
}

// ---------- Tugas dan penilaian ----------

type OnlineFields = {
  opensAt: Date | null;
  durationMinutes: number | null;
  showResult: boolean;
  shuffleQuestions: boolean;
};

/** Pengaturan khusus kuis/ujian online; string = pesan error. */
function readOnlineFields(
  formData: FormData,
  dueAt: Date | null
): OnlineFields | string {
  const opensRaw = text(formData, "opensAt");
  const durationRaw = text(formData, "durationMinutes");

  const opensAt = opensRaw ? parseJakartaLocal(opensRaw) : null;

  if (opensRaw && !opensAt) return "Format waktu dibuka tidak valid.";

  let durationMinutes: number | null = null;

  if (durationRaw) {
    durationMinutes = Number(durationRaw);

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 600
    ) {
      return "Durasi harus 1 sampai 600 menit.";
    }
  }

  if (opensAt && dueAt && opensAt >= dueAt) {
    return "Waktu dibuka harus sebelum waktu ditutup.";
  }

  return {
    opensAt,
    durationMinutes,
    showResult: formData.get("showResult") === "on",
    shuffleQuestions: formData.get("shuffleQuestions") === "on",
  };
}

/**
 * mode "tugas" = tugas; "kuis" = kuis online; "ujian" = UTS/UAS online;
 * "lainnya" = penilaian praktik (nilai diisi guru).
 */
export async function createAssessment(
  tcId: string,
  mode: "tugas" | "kuis" | "ujian" | "lainnya",
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const title = text(formData, "title");
  const instructions = text(formData, "instructions");
  const dueRaw = text(formData, "dueAt");
  const maxScore = Number(text(formData, "maxScore") || "100");

  let kind: AssessmentKind;

  if (mode === "ujian") {
    const picked = text(formData, "kind");

    if (picked !== "uts" && picked !== "uas") {
      return { ok: false, message: "Pilih UTS atau UAS." };
    }

    kind = picked;
  } else if (mode === "kuis") {
    kind = "kuis";
  } else if (mode === "lainnya") {
    kind = "praktik";
  } else {
    kind = "tugas";
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

  const online = isOnlineKind(kind) ? readOnlineFields(formData, dueAt) : null;

  if (typeof online === "string") return { ok: false, message: online };

  try {
    await db.insert(assessments).values({
      teachingClassId: kelas.id,
      kind,
      title,
      instructions: instructions || null,
      dueAt,
      maxScore,
      ...(online ?? {}),
      // Kuis/ujian dibuat sebagai draf sampai soalnya siap dan diterbitkan.
      published: online ? false : true,
    });

    await logActivity(
      `Menambah ${kind} "${title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();

    return {
      ok: true,
      message: online
        ? `${title} dibuat sebagai draf. Tambahkan soal lalu terbitkan.`
        : `${title} berhasil dibuat.`,
    };
  } catch (error) {
    console.error("Create assessment error:", error);
    return { ok: false, message: "Gagal menyimpan." };
  }
}

export async function updateAssessment(
  tcId: string,
  assessmentId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const existing = await getOwnedAssessment(kelas.id, toId(assessmentId));

  if (!existing) return { ok: false, message: "Penilaian tidak ditemukan." };

  const title = text(formData, "title");
  const instructions = text(formData, "instructions");
  const dueRaw = text(formData, "dueAt");
  const maxScore = Number(text(formData, "maxScore") || "100");

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

  const online = isOnlineKind(existing.kind)
    ? readOnlineFields(formData, dueAt)
    : null;

  if (typeof online === "string") return { ok: false, message: online };

  // Nilai kuis/ujian sudah diskalakan ke nilai maksimal, jadi dikunci setelah ada yang mengerjakan.
  if (
    online &&
    maxScore !== existing.maxScore &&
    (await countAttempts(existing.id)) > 0
  ) {
    return {
      ok: false,
      message:
        "Nilai maksimal tidak bisa diubah karena sudah ada siswa yang mengerjakan.",
    };
  }

  // Nilai maksimal tidak boleh lebih kecil dari nilai yang sudah diberikan.
  const [tooHigh] = await db
    .select({ score: submissions.score })
    .from(submissions)
    .where(
      and(
        eq(submissions.assessmentId, existing.id),
        gt(submissions.score, maxScore)
      )
    )
    .limit(1);

  if (tooHigh) {
    return {
      ok: false,
      message: `Sudah ada nilai ${tooHigh.score} yang melebihi ${maxScore}. Ubah nilainya dulu atau naikkan nilai maksimal.`,
    };
  }

  try {
    await db
      .update(assessments)
      .set({
        title,
        instructions: instructions || null,
        dueAt,
        maxScore,
        ...(online ?? {}),
      })
      .where(eq(assessments.id, existing.id));

    await logActivity(
      `Mengubah "${title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();
  } catch (error) {
    console.error("Update assessment error:", error);
    return { ok: false, message: "Gagal menyimpan perubahan." };
  }

  const section = sectionOfKind(existing.kind);

  redirect(
    section
      ? `/guru/kelas/${kelas.id}/${section}/${existing.id}`
      : existing.kind === "tugas"
        ? `/guru/kelas/${kelas.id}/tugas`
        : `/guru/kelas/${kelas.id}/penilaian`
  );
}

export async function deleteAssessment(
  tcId: string,
  assessmentId: string
): Promise<void> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return;

  try {
    const id = toId(assessmentId);

    const files = await db
      .select({ id: submissions.fileId })
      .from(submissions)
      .innerJoin(assessments, eq(submissions.assessmentId, assessments.id))
      .where(
        and(
          eq(submissions.assessmentId, id),
          eq(assessments.teachingClassId, kelas.id),
          isNotNull(submissions.fileId)
        )
      );

    const [deleted] = await db
      .delete(assessments)
      .where(
        and(eq(assessments.id, id), eq(assessments.teachingClassId, kelas.id))
      )
      .returning({ title: assessments.title });

    if (deleted) {
      await Promise.all(files.map((f) => deleteFile(f.id)));

      await logActivity(
        `Menghapus "${deleted.title}" di ${kelas.subject} ${kelas.className}`,
        actor
      );
    }

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();
  } catch (error) {
    console.error("Delete assessment error:", error);
  }
}

const WEIGHT_KINDS = ["tugas", "kuis", "uts", "uas", "praktik"] as const;

export async function saveWeights(
  tcId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return notFound;

  const values: { kind: (typeof WEIGHT_KINDS)[number]; weight: number }[] = [];
  let total = 0;

  for (const kind of WEIGHT_KINDS) {
    const raw = text(formData, `weight-${kind}`);
    const weight = raw === "" ? 0 : Number(raw);

    if (!Number.isInteger(weight) || weight < 0 || weight > 100) {
      return { ok: false, message: "Bobot harus bilangan bulat 0 sampai 100." };
    }

    total += weight;

    if (weight > 0) values.push({ kind, weight });
  }

  if (total !== 100) {
    return {
      ok: false,
      message: `Total bobot harus 100 (sekarang ${total}).`,
    };
  }

  try {
    await db
      .delete(gradeWeights)
      .where(eq(gradeWeights.teachingClassId, kelas.id));

    await db
      .insert(gradeWeights)
      .values(values.map((v) => ({ teachingClassId: kelas.id, ...v })));

    await logActivity(
      `Mengatur bobot nilai ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();

    return { ok: true, message: "Bobot nilai tersimpan." };
  } catch (error) {
    console.error("Save weights error:", error);
    return { ok: false, message: "Gagal menyimpan bobot." };
  }
}

export async function clearWeights(tcId: string): Promise<void> {
  const { kelas, actor } = await authorize(tcId);

  if (!kelas) return;

  try {
    await db
      .delete(gradeWeights)
      .where(eq(gradeWeights.teachingClassId, kelas.id));

    await logActivity(
      `Menghapus bobot nilai ${kelas.subject} ${kelas.className}`,
      actor
    );

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();
  } catch (error) {
    console.error("Clear weights error:", error);
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

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();

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

    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");
    revalidateStudents();

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
