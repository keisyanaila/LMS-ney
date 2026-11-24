import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions } from "@/lib/schema";
import { requireStudent } from "@/lib/auth";
import { getOwnedAssessment } from "@/lib/guru-data";
import { getStudentTeachingClass } from "@/lib/siswa-data";
import {
  getAttempt,
  listAttemptAnswers,
  listQuestions,
} from "@/lib/quiz-data";
import { sweepExpired } from "@/lib/quiz-service";
import {
  SECTION_KINDS,
  SECTION_LABELS,
  type Section,
  windowState,
} from "@/lib/online";
import { formatDateTime, formatScore } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";
import { startAttempt } from "@/app/siswa/online-actions";

export default async function OnlineDetail({
  tcId,
  aid,
  section,
}: {
  tcId: string;
  aid: string;
  section: Section;
}) {
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(tcId));

  if (!kelas) notFound();

  const assessment = await getOwnedAssessment(kelas.id, Number(aid));

  if (
    !assessment ||
    !assessment.published ||
    !SECTION_KINDS[section].includes(assessment.kind as never)
  ) {
    notFound();
  }

  await sweepExpired(assessment);

  const [questionList, attempt, [submission]] = await Promise.all([
    listQuestions(assessment.id),
    getAttempt(assessment.id, student.id),
    db
      .select({ score: submissions.score })
      .from(submissions)
      .where(
        and(
          eq(submissions.assessmentId, assessment.id),
          eq(submissions.studentId, student.id)
        )
      )
      .limit(1),
  ]);

  const totalPoints = questionList.reduce((sum, q) => sum + q.points, 0);
  const window = windowState(assessment, new Date());
  const label = SECTION_LABELS[section].toLowerCase();
  const base = `/siswa/kelas/${kelas.id}/${section}`;

  const submitted = Boolean(attempt?.submittedAt);
  const inProgress = Boolean(attempt && !attempt.submittedAt);
  const score = submission?.score ?? null;

  const answers = attempt ? await listAttemptAnswers(attempt.id) : [];
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

  return (
    <>
      <Link
        href={base}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Semua {label}
      </Link>

      <Card className="mb-6">
        <h2 className="text-lg font-bold">{assessment.title}</h2>
        <p className="mt-1 text-sm text-black/50">
          {questionList.length} soal · {totalPoints} poin
          {assessment.durationMinutes
            ? ` · waktu ${assessment.durationMinutes} menit`
            : ""}
        </p>
        <p className="mt-1 text-xs text-black/50">
          Dibuka: {formatDateTime(assessment.opensAt)} · Ditutup:{" "}
          {formatDateTime(assessment.dueAt)}
        </p>
        {assessment.instructions && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-black/70">
            {assessment.instructions}
          </p>
        )}
      </Card>

      {!attempt && (
        <Card title={`Mulai ${label}`} className="mb-6">
          {window === "belum_dibuka" && (
            <p className="text-sm text-black/60">
              Belum dibuka. Bisa dikerjakan mulai{" "}
              {formatDateTime(assessment.opensAt)}.
            </p>
          )}

          {window === "ditutup" && (
            <p className="text-sm text-red-700">
              Waktu pengerjaan sudah ditutup, jadi {label} ini tidak bisa
              dikerjakan lagi. Hubungi gurumu jika ada kendala.
            </p>
          )}

          {window === "dibuka" && questionList.length === 0 && (
            <p className="text-sm text-black/60">
              Soal belum tersedia. Coba lagi nanti.
            </p>
          )}

          {window === "dibuka" && questionList.length > 0 && (
            <>
              <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-black/70">
                <li>Hanya ada satu kesempatan mengerjakan.</li>
                {assessment.durationMinutes && (
                  <li>
                    Waktu {assessment.durationMinutes} menit mulai berjalan
                    saat kamu menekan tombol Mulai dan tidak berhenti walau
                    halaman ditutup.
                  </li>
                )}
                <li>Jawaban tersimpan otomatis selama kamu mengerjakan.</li>
                <li>Kirim jawaban sebelum waktu habis.</li>
              </ul>

              <form
                action={startAttempt.bind(
                  null,
                  String(kelas.id),
                  String(assessment.id)
                )}
              >
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Mulai Kerjakan
                </button>
              </form>
            </>
          )}
        </Card>
      )}

      {inProgress && (
        <Card title="Sedang dikerjakan" className="mb-6">
          <p className="mb-4 text-sm text-black/60">
            Kamu sudah memulai. Lanjutkan sebelum waktunya habis.
          </p>
          <Link
            href={`${base}/${assessment.id}/kerjakan`}
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Lanjutkan Mengerjakan
          </Link>
        </Card>
      )}

      {submitted && (
        <Card title="Hasil" className="mb-6">
          <p className="text-xs text-black/50">
            Dikirim {formatDateTime(attempt?.submittedAt)}
          </p>

          {!assessment.showResult ? (
            <p className="mt-2 text-sm text-black/70">
              Jawabanmu sudah terkirim. Nilai akan terlihat setelah guru
              merilisnya.
            </p>
          ) : score === null ? (
            <p className="mt-2 text-sm text-black/70">
              Jawabanmu sudah terkirim. Ada soal esai yang masih menunggu
              penilaian guru, jadi nilai akhir belum keluar.
            </p>
          ) : (
            <p className="mt-2 text-4xl font-bold">
              {formatScore(score)}
              <span className="text-base font-normal text-black/50">
                {" "}
                / {assessment.maxScore}
              </span>
            </p>
          )}
        </Card>
      )}

      {submitted && assessment.showResult && (
        <Card title="Pembahasan">
          <ol className="space-y-6">
            {questionList.map((question, index) => {
              const answer = answerByQuestion.get(question.id);

              return (
                <li key={question.id} className="text-sm">
                  <p className="font-semibold">
                    {index + 1}. {question.text}
                  </p>

                  {question.type === "pilihan_ganda" ? (
                    <ul className="mt-2 space-y-1">
                      {(question.options ?? []).map((option, i) => {
                        const chosen = answer?.selectedIndex === i;
                        const correct = question.correctIndex === i;

                        return (
                          <li
                            key={i}
                            className={
                              correct
                                ? "font-semibold text-green-700"
                                : chosen
                                  ? "font-semibold text-red-600"
                                  : "text-black/70"
                            }
                          >
                            {String.fromCharCode(65 + i)}. {option}
                            {correct && " (jawaban benar)"}
                            {chosen && !correct && " (jawabanmu)"}
                            {chosen && correct && " (jawabanmu)"}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-black/70">
                      {answer?.essayText || "(tidak dijawab)"}
                    </p>
                  )}

                  <div className="mt-2">
                    {answer?.awardedPoints !== null &&
                    answer?.awardedPoints !== undefined ? (
                      <Badge
                        tone={answer.awardedPoints > 0 ? "green" : "red"}
                      >
                        {formatScore(answer.awardedPoints)} / {question.points}{" "}
                        poin
                      </Badge>
                    ) : (
                      <Badge tone="gray">Menunggu penilaian guru</Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </>
  );
}
