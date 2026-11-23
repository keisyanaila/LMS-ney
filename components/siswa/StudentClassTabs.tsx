"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StudentClassTabs({ id }: { id: number }) {
  const pathname = usePathname();
  const base = `/siswa/kelas/${id}`;

  const tabs = [
    { href: base, label: "Pengumuman" },
    { href: `${base}/materi`, label: "Materi" },
    { href: `${base}/tugas`, label: "Tugas" },
    { href: `${base}/nilai`, label: "Nilai" },
    { href: `${base}/kehadiran`, label: "Kehadiran" },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-black/10">
      {tabs.map((tab) => {
        const active =
          tab.href === base ? pathname === base : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition ${
              active
                ? "border-blue-600 font-semibold text-blue-700"
                : "border-transparent text-black/60 hover:text-black"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
