import type { Metadata } from "next";
import type { ReactNode } from "react";
import GuruSidebar from "@/components/guru/GuruSidebar";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Guru | LMS Ney",
};

export default async function GuruLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireTeacher();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-black lg:flex-row">
      <GuruSidebar name={user.fullName} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
