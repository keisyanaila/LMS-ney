import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { materials } from "@/lib/schema";
import { requireTeacher } from "@/lib/auth";
import { getOwnedTeachingClass } from "@/lib/guru-data";
import { Card } from "@/components/admin/ui";
import { MaterialEditForm } from "../../../../../forms";

export default async function EditMateriPage({
  params,
}: {
  params: Promise<{ id: string; mid: string }>;
}) {
  const { id, mid } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const [material] = await db
    .select()
    .from(materials)
    .where(
      and(
        eq(materials.id, Number(mid)),
        eq(materials.teachingClassId, kelas.id)
      )
    )
    .limit(1);

  if (!material) notFound();

  return (
    <>
      <Link
        href={`/guru/kelas/${kelas.id}/materi`}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Kembali ke materi
      </Link>

      <Card title="Edit materi">
        <MaterialEditForm tcId={kelas.id} material={material} />
      </Card>
    </>
  );
}
