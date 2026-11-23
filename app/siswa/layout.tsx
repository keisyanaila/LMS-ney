import type { Metadata } from "next";
import type { ReactNode } from "react";
import PanelSidebar from "@/components/PanelSidebar";
import { requireStudent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Siswa | LMS Ney",
};

export default async function SiswaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireStudent();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-black lg:flex-row">
      <PanelSidebar
        name={user.fullName}
        panelLabel="Siswa"
        homeHref="/siswa"
        nav={[
          { href: "/siswa", label: "Beranda" },
          { href: "/siswa/kelas", label: "Mata Pelajaran" },
        ]}
      />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
