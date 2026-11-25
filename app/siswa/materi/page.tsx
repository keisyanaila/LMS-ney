import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth";
import { loadStudentPortal } from "@/lib/siswa-portal";
import { EmptyState, PageTitle } from "@/components/siswa/widgets";
import MateriBrowser from "@/components/siswa/MateriBrowser";

export const metadata: Metadata = { title: "Materi | RoboLearn" };

export default async function MateriPage() {
  const { student } = await requireStudent();
  const portal = await loadStudentPortal(student);

  return (
    <>
      <PageTitle
        title="Materi"
        description="Semua materi dari guru, dikelompokkan per mata pelajaran."
      />

      {portal.classes.length === 0 ? (
        <EmptyState>Belum ada mata pelajaran untuk kelasmu.</EmptyState>
      ) : (
        <MateriBrowser
          readIds={portal.readMaterialIds}
          subjects={portal.classes.map((c) => c.subject)}
          items={portal.materials.map((m) => ({
            id: m.id,
            subject: m.subject,
            teacherName: m.teacherName,
            title: m.title,
            description: m.description,
            fileId: m.fileId,
            fileName: m.fileName,
            linkUrl: m.linkUrl,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      )}
    </>
  );
}
