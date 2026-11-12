
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Sidebar from "@/components/admin/Sidebar";

export const metadata: Metadata = {
  title: "Admin | LMS Ney",
};

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-black lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
