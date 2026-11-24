import type { Metadata } from "next";
import type { ReactNode } from "react";
import PanelSidebar from "@/components/PanelSidebar";
import { adminNav } from "@/lib/admin-nav";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin | Learnova",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="admin-page flex min-h-screen flex-col text-blue-950 lg:flex-row">
      <PanelSidebar
        name={user.fullName}
        panelLabel="Admin"
        homeHref="/admin"
        nav={adminNav.map(({ href, label }) => ({ href, label }))}
      />
      <main className="min-w-0 flex-1 px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="mx-auto max-w-[1500px]">
          <header className="mb-5 flex items-center justify-between rounded-2xl border border-violet-100/80 bg-white/75 px-5 py-3 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-violet-900">Ruang administrasi <span className="font-normal text-slate-400">/ Learnova</span></div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:inline">{user.fullName}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">{user.fullName.trim().charAt(0).toUpperCase()}</span>
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
