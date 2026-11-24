import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getOwnedAssessment, getOwnedTeachingClass } from "@/lib/guru-data";
import { countAttempts, listQuestions } from "@/lib/quiz-data";
import { SECTION_KINDS, SECTION_LABELS, type Section } from "@/lib/online";
import { Badge, Card } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import OnlineItemNav from "@/components/guru/OnlineItemNav";
import { deleteQuestion } from "@/app/guru/online-actions";
import { QuestionForm } from "@/app/guru/online-forms";

export default async function OnlineQuestions({
  tcId,
  aid,
  section,
}: {
  tcId: string;
  aid: string;
  section: Section;
}) {
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(tcId));

  if (!kelas) notFound();

  const assessment = await getOwnedAssessment(kelas.id, Number(aid));

  if (!assessment || !SECTION_KINDS[section].includes(assessment.kind as never)) {
    notFound();
  }

  const [questionList, attemptCount] = await Promise.all([
    listQuestions(assessment.id),
    countAttempts(assessment.id),
  ]);

  const locked = attemptCount > 0;
  const totalPoints = questionList.reduce((sum, q) => sum + q.points, 0);
  const base = `/guru/kelas/${kelas.id}/${section}/${assessment.id}`;

  return (
    <>
      <Link
        href={`/guru/kelas/${kelas.id}/${section}`}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Semua {SECTION_LABELS[section].toLowerCase()}
      </Link>

      <h2 className="mb-1 text-lg font-bold">{assessment.title}</h2>
      <p className="mb-4 text-sm text-black/50">
        {questionList.length} soal · total {totalPoints} poin. Nilai siswa
        diskalakan ke nilai maksimal {assessment.maxScore}.
      </p>

      <OnlineItemNav base={base} active="soal" />

      {locked && (
        <p className="mb-4 rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Soal terkunci karena {attemptCount} siswa sudah mulai mengerjakan.
          Reset pengerjaan mereka di tab Hasil siswa jika ingin mengubah soal.
        </p>
      )}

      {!locked && (
        <Card title="Tambah soal" className="mb-6">
          <QuestionForm tcId={kelas.id} assessmentId={assessment.id} />
        </Card>
      )}

      {questionList.length === 0 ? (
        <div className="rounded-md border border-dashed border-black/10 p-10 text-center text-sm text-black/50">
          Belum ada soal.
        </div>
      ) : (
        <div className="space-y-4">
          {questionList.map((question, index) => (
            <section
              key={question.id}
              className="rounded-lg border border-black/10 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">Soal {index + 1}</span>
                  <Badge tone="gray">
                    {question.type === "pilihan_ganda"
                      ? "Pilihan ganda"
                      : "Esai"}
                  </Badge>
                  <Badge>{question.points} poin</Badge>
                </div>

                {!locked && (
                  <DeleteButton
                    action={deleteQuestion.bind(
                      null,
                      String(kelas.id),
                      String(assessment.id),
                      String(question.id)
                    )}
                    label={`soal ${index + 1}`}
                  />
                )}
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm">{question.text}</p>

              {question.type === "pilihan_ganda" && question.options && (
                <ul className="mt-3 space-y-1 text-sm">
                  {question.options.map((option, i) => (
                    <li
                      key={i}
                      className={
                        i === question.correctIndex
                          ? "font-semibold text-green-700"
                          : "text-black/70"
                      }
                    >
                      {String.fromCharCode(65 + i)}. {option}
                      {i === question.correctIndex && " (benar)"}
                    </li>
                  ))}
                </ul>
              )}

              {!locked && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                    Edit soal
                  </summary>
                  <div className="mt-3">
                    <QuestionForm
                      tcId={kelas.id}
                      assessmentId={assessment.id}
                      question={question}
                    />
                  </div>
                </details>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
