import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import {
  getStudentTeachingClass,
  listStudentAssessments,
  submissionStatus,
} from "@/lib/siswa-data";
import { formatDateTime } from "@/lib/format";
import StatusBadge from "@/components/siswa/StatusBadge";

export default async function SiswaTugasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(id));

  if (!kelas) notFound();

  const items = (await listStudentAssessments(student.id, kelas.id)).filter(
    (item) => item.kind === "tugas"
  );

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-black/10 bg-white p-10 text-center text-sm text-black/50">
        Belum ada tugas untuk mata pelajaran ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/siswa/kelas/${kelas.id}/tugas/${item.id}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-5 transition hover:border-blue-500"
        >
          <div>
            <p className="font-bold">{item.title}</p>
            <p className="mt-1 text-xs text-black/50">
              Tenggat: {formatDateTime(item.dueAt)}
            </p>
          </div>
          <StatusBadge
            status={submissionStatus(item)}
            score={item.submission?.score ?? null}
            max={item.maxScore}
          />
        </Link>
      ))}
    </div>
  );
}
