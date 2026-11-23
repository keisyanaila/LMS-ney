import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import {
  getStudentTeachingClass,
  listStudentAssessments,
  submissionStatus,
} from "@/lib/siswa-data";
import { formatDateTime, formatScore } from "@/lib/format";
import { Card } from "@/components/admin/ui";
import StatusBadge from "@/components/siswa/StatusBadge";
import { SubmitForm } from "../../../../forms";

export default async function SiswaDetailTugasPage({
  params,
}: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id, aid } = await params;
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(id));

  if (!kelas) notFound();

  const item = (await listStudentAssessments(student.id, kelas.id)).find(
    (x) => x.id === Number(aid) && x.kind === "tugas"
  );

  if (!item) notFound();

  const sub = item.submission;
  const status = submissionStatus(item);
  const graded = status === "dinilai";
  const late =
    sub?.submittedAt && item.dueAt ? sub.submittedAt > item.dueAt : false;

  return (
    <>
      <Link
        href={`/siswa/kelas/${kelas.id}/tugas`}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Semua tugas
      </Link>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{item.title}</h2>
          <StatusBadge
            status={status}
            score={sub?.score ?? null}
            max={item.maxScore}
          />
        </div>
        <p className="mt-1 text-sm text-black/50">
          Tenggat: {formatDateTime(item.dueAt)} · Nilai maksimal {item.maxScore}
        </p>
        {item.instructions && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-black/70">
            {item.instructions}
          </p>
        )}
      </Card>

      {graded && (
        <Card title="Nilai dari guru" className="mb-6">
          <p className="text-3xl font-bold">
            {formatScore(sub?.score)}
            <span className="text-base font-normal text-black/50">
              {" "}
              / {item.maxScore}
            </span>
          </p>
          {sub?.feedback && (
            <p className="mt-3 whitespace-pre-wrap text-sm text-black/70">
              <span className="font-semibold">Catatan guru: </span>
              {sub.feedback}
            </p>
          )}
        </Card>
      )}

      {sub?.submittedAt && (
        <Card title="Pengumpulanmu" className="mb-6">
          <p className="text-xs text-black/50">
            Dikumpulkan {formatDateTime(sub.submittedAt)}
            {late ? " (terlambat)" : ""}
          </p>
          {sub.answer && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-black/70">
              {sub.answer}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-6 text-sm font-semibold">
            {sub.fileId && (
              <a
                href={`/api/files/${sub.fileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-700 hover:underline"
              >
                {sub.fileName ?? "Lihat file"}
              </a>
            )}
            {sub.linkUrl && (
              <a
                href={sub.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-700 hover:underline"
              >
                Buka link
              </a>
            )}
          </div>
        </Card>
      )}

      {graded ? (
        <p className="text-sm text-black/50">
          Tugas ini sudah dinilai, jadi tidak bisa diubah lagi.
        </p>
      ) : (
        <Card title={sub?.submittedAt ? "Perbarui pengumpulan" : "Kumpulkan tugas"}>
          {status === "terlambat" && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              Tenggat sudah lewat. Kamu masih bisa mengumpulkan, tapi akan
              tercatat terlambat.
            </p>
          )}
          <SubmitForm
            tcId={kelas.id}
            assessmentId={item.id}
            initial={{
              answer: sub?.answer ?? null,
              linkUrl: sub?.linkUrl ?? null,
              fileName: sub?.fileName ?? null,
              alreadySubmitted: Boolean(sub?.submittedAt),
            }}
          />
        </Card>
      )}
    </>
  );
}
