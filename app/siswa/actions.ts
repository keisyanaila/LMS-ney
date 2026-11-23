"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions } from "@/lib/schema";
import { requireStudent } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getOwnedAssessment } from "@/lib/guru-data";
import { getStudentTeachingClass } from "@/lib/siswa-data";
import { deleteFile, pickFile, uploadFile } from "@/lib/storage";

export type SubmitState = { ok: boolean; message: string } | null;

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function submitAssignment(
  tcId: string,
  assessmentId: string,
  _prev: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const { user, student } = await requireStudent();

  const kelas = await getStudentTeachingClass(student, Number(tcId));

  if (!kelas) return { ok: false, message: "Kelas tidak ditemukan." };

  const assessment = await getOwnedAssessment(kelas.id, Number(assessmentId));

  if (!assessment || assessment.kind !== "tugas") {
    return { ok: false, message: "Tugas tidak ditemukan." };
  }

  const [existing] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.assessmentId, assessment.id),
        eq(submissions.studentId, student.id)
      )
    )
    .limit(1);

  if (existing?.score !== null && existing?.score !== undefined) {
    return {
      ok: false,
      message: "Tugas ini sudah dinilai guru, jadi tidak bisa diubah lagi.",
    };
  }

  const answer = String(formData.get("answer") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const file = pickFile(formData, "file");

  if (linkUrl && !isHttpUrl(linkUrl)) {
    return { ok: false, message: "Link harus diawali http:// atau https://." };
  }

  if (!answer && !linkUrl && !file && !existing?.fileId) {
    return {
      ok: false,
      message: "Isi jawaban, tempel link, atau pilih file terlebih dahulu.",
    };
  }

  let fileId = existing?.fileId ?? null;
  let fileName = existing?.fileName ?? null;
  let replaced: number | null = null;

  if (file) {
    const uploaded = await uploadFile(file);

    if (!uploaded.ok) return { ok: false, message: uploaded.message };

    replaced = fileId;
    fileId = uploaded.id;
    fileName = uploaded.name;
  }

  try {
    await db
      .insert(submissions)
      .values({
        assessmentId: assessment.id,
        studentId: student.id,
        answer: answer || null,
        linkUrl: linkUrl || null,
        fileId,
        fileName,
        submittedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [submissions.assessmentId, submissions.studentId],
        set: {
          answer: answer || null,
          linkUrl: linkUrl || null,
          fileId,
          fileName,
          submittedAt: new Date(),
        },
      });

    await deleteFile(replaced);

    await logActivity(
      `Mengumpulkan tugas "${assessment.title}" (${kelas.subject})`,
      { userId: user.id, userName: user.fullName, role: "murid" }
    );

    revalidatePath("/siswa", "layout");
    revalidatePath(`/guru/kelas/${kelas.id}`, "layout");

    return {
      ok: true,
      message: existing?.submittedAt
        ? "Pengumpulan diperbarui."
        : "Tugas berhasil dikumpulkan.",
    };
  } catch (error) {
    console.error("Submit assignment error:", error);

    if (file) await deleteFile(fileId);

    return { ok: false, message: "Gagal mengumpulkan tugas. Coba lagi." };
  }
}
