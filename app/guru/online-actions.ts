"use server";

import { revalidatePath } from "next/cache";
import { and, eq, max } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assessments,
  attemptAnswers,
  attempts,
  questions,
  submissions,
} from "@/lib/schema";
import { requireTeacher } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getOwnedAssessment, getOwnedTeachingClass } from "@/lib/guru-data";
import { isOnlineKind } from "@/lib/online";
import { countAttempts, listQuestions } from "@/lib/quiz-data";
import { syncScore } from "@/lib/quiz-service";

export type OnlineFormState = { ok: boolean; message: string } | null;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function toId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

/** Guru login + kelas ajar miliknya + kuis/ujian di kelas itu. */
async function authorizeOnline(tcId: string, assessmentId: string) {
  const { user, teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, toId(tcId));
  const assessment = kelas
    ? await getOwnedAssessment(kelas.id, toId(assessmentId))
    : null;

  const ok = kelas && assessment && isOnlineKind(assessment.kind);

  return {
    kelas: ok ? kelas : null,
    assessment: ok ? assessment : null,
    actor: { userId: user.id, userName: user.fullName, role: "guru" },
  };
}

const notFound: OnlineFormState = {
  ok: false,
  message: "Kuis/ujian tidak ditemukan.",
};

function refresh(tcId: number) {
  revalidatePath(`/guru/kelas/${tcId}`, "layout");
  revalidatePath("/siswa", "layout");
}

// ---------- Terbit dan rilis nilai ----------

export async function setPublished(
  tcId: string,
  assessmentId: string,
  value: "true" | "false"
): Promise<void> {
  const { kelas, assessment, actor } = await authorizeOnline(tcId, assessmentId);

  if (!kelas || !assessment) return;

  const publish = value === "true";

  if (publish && (await listQuestions(assessment.id)).length === 0) return;

  try {
    await db
      .update(assessments)
      .set({ published: publish })
      .where(eq(assessments.id, assessment.id));

    await logActivity(
      `${publish ? "Menerbitkan" : "Menarik"} "${assessment.title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    refresh(kelas.id);
  } catch (error) {
    console.error("Set published error:", error);
  }
}

export async function setShowResult(
  tcId: string,
  assessmentId: string,
  value: "true" | "false"
): Promise<void> {
  const { kelas, assessment, actor } = await authorizeOnline(tcId, assessmentId);

  if (!kelas || !assessment) return;

  try {
    await db
      .update(assessments)
      .set({ showResult: value === "true" })
      .where(eq(assessments.id, assessment.id));

    await logActivity(
      `${value === "true" ? "Merilis" : "Menyembunyikan"} nilai "${assessment.title}" di ${kelas.subject} ${kelas.className}`,
      actor
    );

    refresh(kelas.id);
  } catch (error) {
    console.error("Set show result error:", error);
  }
}

// ---------- Soal ----------

const LOCKED: OnlineFormState = {
  ok: false,
  message:
    "Soal terkunci karena sudah ada siswa yang mengerjakan. Reset pengerjaan mereka dulu jika ingin mengubah soal.",
};

const MAX_OPTIONS = 6;

/** questionId "0" = soal baru. */
export async function saveQuestion(
  tcId: string,
  assessmentId: string,
  questionId: string,
  _prev: OnlineFormState,
  formData: FormData
): Promise<OnlineFormState> {
  const { kelas, assessment, actor } = await authorizeOnline(tcId, assessmentId);

  if (!kelas || !assessment) return notFound;

  if ((await countAttempts(assessment.id)) > 0) return LOCKED;

  const type = text(formData, "type");
  const body = text(formData, "text");
  const points = Number(text(formData, "points") || "1");

  if (type !== "pilihan_ganda" && type !== "esai") {
    return { ok: false, message: "Jenis soal tidak valid." };
  }

  if (!body) return { ok: false, message: "Teks soal wajib diisi." };
  if (body.length > 2000) {
    return { ok: false, message: "Teks soal maksimal 2000 karakter." };
  }
  if (!Number.isInteger(points) || points < 1 || points > 100) {
    return { ok: false, message: "Poin harus 1 sampai 100." };
  }

  let options: string[] | null = null;
  let correctIndex: number | null = null;

  if (type === "pilihan_ganda") {
    const picked = Number(text(formData, "correct"));
    options = [];

    for (let i = 0; i < MAX_OPTIONS; i++) {
      const option = text(formData, `option-${i}`);

      if (!option) continue;

      if (option.length > 500) {
        return { ok: false, message: "Tiap pilihan maksimal 500 karakter." };
      }

      if (i === picked) correctIndex = options.length;

      options.push(option);
    }

    if (options.length < 2) {
      return { ok: false, message: "Isi minimal 2 pilihan jawaban." };
    }

    if (correctIndex === null) {
      return {
        ok: false,
        message: "Pilih satu jawaban yang benar (dan pastikan pilihannya terisi).",
      };
    }
  }

  try {
    const id = toId(questionId);

    if (id) {
      const [updated] = await db
        .update(questions)
        .set({ type, text: body, options, correctIndex, points })
        .where(
          and(eq(questions.id, id), eq(questions.assessmentId, assessment.id))
        )
        .returning({ id: questions.id });

      if (!updated) return { ok: false, message: "Soal tidak ditemukan." };
    } else {
      const [last] = await db
        .select({ value: max(questions.position) })
        .from(questions)
        .where(eq(questions.assessmentId, assessment.id));

      await db.insert(questions).values({
        assessmentId: assessment.id,
        position: (last?.value ?? 0) + 1,
        type,
        text: body,
        options,
        correctIndex,
        points,
      });
    }

    await logActivity(
      `${id ? "Mengubah" : "Menambah"} soal di "${assessment.title}" (${kelas.subject} ${kelas.className})`,
      actor
    );

    refresh(kelas.id);

    return { ok: true, message: id ? "Soal diperbarui." : "Soal ditambahkan." };
  } catch (error) {
    console.error("Save question error:", error);
    return { ok: false, message: "Gagal menyimpan soal." };
  }
}

export async function deleteQuestion(
  tcId: string,
  assessmentId: string,
  questionId: string
): Promise<void> {
  const { kelas, assessment, actor } = await authorizeOnline(tcId, assessmentId);

  if (!kelas || !assessment) return;

  if ((await countAttempts(assessment.id)) > 0) return;

  try {
    await db
      .delete(questions)
      .where(
        and(
          eq(questions.id, toId(questionId)),
          eq(questions.assessmentId, assessment.id)
        )
      );

    await logActivity(
      `Menghapus soal di "${assessment.title}" (${kelas.subject} ${kelas.className})`,
      actor
    );

    refresh(kelas.id);
  } catch (error) {
    console.error("Delete question error:", error);
  }
}

// ---------- Pengerjaan siswa ----------

/** Hapus pengerjaan seorang murid agar ia bisa mengulang dari awal. */
export async function resetAttempt(
  tcId: string,
  assessmentId: string,
  studentId: string
): Promise<void> {
  const { kelas, assessment, actor } = await authorizeOnline(tcId, assessmentId);

  if (!kelas || !assessment) return;

  const sid = toId(studentId);

  try {
    await db
      .delete(attempts)
      .where(
        and(eq(attempts.assessmentId, assessment.id), eq(attempts.studentId, sid))
      );

    await db
      .update(submissions)
      .set({ submittedAt: null, score: null, gradedAt: null })
      .where(
        and(
          eq(submissions.assessmentId, assessment.id),
          eq(submissions.studentId, sid)
        )
      );

    await logActivity(
      `Mereset pengerjaan "${assessment.title}" seorang murid (${kelas.subject} ${kelas.className})`,
      actor
    );

    refresh(kelas.id);
  } catch (error) {
    console.error("Reset attempt error:", error);
  }
}

export async function saveEssayGrades(
  tcId: string,
  assessmentId: string,
  studentId: string,
  _prev: OnlineFormState,
  formData: FormData
): Promise<OnlineFormState> {
  const { kelas, assessment, actor } = await authorizeOnline(tcId, assessmentId);

  if (!kelas || !assessment) return notFound;

  const [attempt] = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.assessmentId, assessment.id),
        eq(attempts.studentId, toId(studentId))
      )
    )
    .limit(1);

  if (!attempt?.submittedAt) {
    return { ok: false, message: "Siswa ini belum mengirim jawaban." };
  }

  const essays = (await listQuestions(assessment.id)).filter(
    (q) => q.type === "esai"
  );

  const updates: { questionId: number; points: number }[] = [];

  for (const q of essays) {
    const raw = text(formData, `points-${q.id}`).replace(",", ".");

    if (raw === "") continue;

    const value = Number(raw);

    if (!Number.isFinite(value) || value < 0 || value > q.points) {
      return {
        ok: false,
        message: `Poin soal esai harus antara 0 dan ${q.points}.`,
      };
    }

    updates.push({ questionId: q.id, points: Math.round(value * 100) / 100 });
  }

  try {
    for (const update of updates) {
      await db
        .update(attemptAnswers)
        .set({ awardedPoints: update.points })
        .where(
          and(
            eq(attemptAnswers.attemptId, attempt.id),
            eq(attemptAnswers.questionId, update.questionId)
          )
        );
    }

    await syncScore(attempt.id);

    await logActivity(
      `Menilai esai "${assessment.title}" (${kelas.subject} ${kelas.className})`,
      actor
    );

    refresh(kelas.id);

    return { ok: true, message: "Penilaian esai tersimpan." };
  } catch (error) {
    console.error("Save essay grades error:", error);
    return { ok: false, message: "Gagal menyimpan penilaian." };
  }
}
