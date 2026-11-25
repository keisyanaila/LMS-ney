import type { Metadata } from "next";
import type { ReactNode } from "react";
import PanelSidebar from "@/components/PanelSidebar";
import { requireStudent } from "@/lib/auth";
import { loadStudentPortal } from "@/lib/siswa-portal";
import { buildNotifications } from "@/lib/notifications";
import NotificationBell from "@/components/siswa/NotificationBell";

export const metadata: Metadata = {
  title: "RoboLearn | Ruang Belajar",
};

export default async function SiswaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, student } = await requireStudent();
  const notifications = student.classId
    ? buildNotifications(await loadStudentPortal(student))
    : [];

  return (
    <div className="flex min-h-screen flex-col admin-page text-black lg:flex-row">
      <PanelSidebar
        name={user.fullName}
        panelLabel="Siswa"
        homeHref="/siswa"
        nav={[
          { href: "/siswa", label: "Dashboard", icon: "dashboard" },
          { href: "/siswa/jadwal", label: "Jadwal Pelajaran", icon: "calendar" },
          { href: "/siswa/materi", label: "Materi", icon: "book" },
          { href: "/siswa/kuis", label: "Kuis", icon: "quiz" },
          { href: "/siswa/ujian", label: "Ujian", icon: "exam" },
        ]}
      />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex justify-end">
            <NotificationBell items={notifications} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
