import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import ClassTabs from "@/components/guru/ClassTabs";
import { requireTeacher } from "@/lib/auth";
import { getOwnedTeachingClass } from "@/lib/guru-data";

export default async function KelasAjarLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  return (
    <>
      <Link
        href="/guru/kelas"
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Kembali ke Kelas Saya
      </Link>

      <div className="mb-5">
        <h1 className="text-2xl font-bold">{kelas.subject}</h1>
        <p className="mt-1 text-sm text-black/50">
          {kelas.className} · {kelas.majorCode}
        </p>
      </div>

      <ClassTabs id={kelas.id} />

      <div className="mt-6">{children}</div>
    </>
  );
}
