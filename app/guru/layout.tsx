import type { Metadata } from "next";
import type { ReactNode } from "react";
import PanelSidebar from "@/components/PanelSidebar";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Guru | Learnova",
};

export default async function GuruLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireTeacher();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-black lg:flex-row">
      <PanelSidebar
        name={user.fullName}
        panelLabel="Guru"
        homeHref="/guru"
        nav={[
          { href: "/guru", label: "Dashboard" },
          { href: "/guru/kelas", label: "Kelas Saya" },
        ]}
      />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
