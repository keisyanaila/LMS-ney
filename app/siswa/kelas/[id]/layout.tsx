import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import StudentClassTabs from "@/components/siswa/StudentClassTabs";
import { requireStudent } from "@/lib/auth";
import { getStudentTeachingClass } from "@/lib/siswa-data";

export default async function SiswaKelasLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(id));

  if (!kelas) notFound();

  return (
    <>
      <Link
        href="/siswa/kelas"
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Semua mata pelajaran
      </Link>

      <div className="mb-5">
        <h1 className="text-2xl font-bold">{kelas.subject}</h1>
        <p className="mt-1 text-sm text-black/50">Guru: {kelas.teacherName}</p>
      </div>

      <StudentClassTabs id={kelas.id} />

      <div className="mt-6">{children}</div>
    </>
  );
}
