import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { getOwnedAssessment, getOwnedTeachingClass } from "@/lib/guru-data";
import { toDatetimeLocal } from "@/lib/format";
import { itemPath } from "@/lib/online";
import { Card } from "@/components/admin/ui";
import { AssessmentEditForm } from "../../../../../forms";

export default async function EditPenilaianPage({
  params,
}: {
  params: Promise<{ id: string; aid: string }>;
}) {
  const { id, aid } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const assessment = await getOwnedAssessment(kelas.id, Number(aid));

  if (!assessment) notFound();

  return (
    <>
      <Link
        href={itemPath("guru", kelas.id, assessment.kind, assessment.id)}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Kembali
      </Link>

      <Card title={`Edit ${assessment.title}`}>
        <AssessmentEditForm
          tcId={kelas.id}
          assessment={{
            id: assessment.id,
            kind: assessment.kind,
            title: assessment.title,
            instructions: assessment.instructions,
            dueAt: toDatetimeLocal(assessment.dueAt),
            maxScore: assessment.maxScore,
            opensAt: toDatetimeLocal(assessment.opensAt),
            durationMinutes: assessment.durationMinutes,
            showResult: assessment.showResult,
            shuffleQuestions: assessment.shuffleQuestions,
          }}
        />
      </Card>
    </>
  );
}
