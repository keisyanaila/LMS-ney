"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";

const nav = [
  { href: "/guru", label: "Dashboard" },
  { href: "/guru/kelas", label: "Kelas Saya" },
];

export default function GuruSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/guru" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 lg:hidden">
        <Link href="/guru" className="font-bold">
          RoboLearn Guru
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-black/10 px-3 py-1.5 text-sm"
        >
          Menu
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-black/10 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/guru">
            <span className="block font-bold">RoboLearn</span>
            <span className="text-xs text-black/50">Panel Guru</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-black/50 lg:hidden"
          >
            Tutup
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                isActive(item.href)
                  ? "bg-blue-50 font-semibold text-blue-700"
                  : "text-black/70 hover:bg-black/5 hover:text-black"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-black/10 px-5 py-4">
          <p className="mb-2 truncate text-sm font-semibold">{name}</p>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-black/50 hover:text-black"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
