"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/actions/auth";
import Icon, { type IconName } from "@/components/Icon";

type NavItem = { href: string; label: string; icon?: IconName };

export default function PanelSidebar({
  name,
  panelLabel,
  homeHref,
  nav,
}: {
  name: string;
  panelLabel: string;
  homeHref: string;
  nav: NavItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === homeHref
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Bilah atas (HP) */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-violet-100 bg-white px-4 py-3 text-blue-950 shadow-sm lg:hidden">
        <Link href={homeHref} className="font-display text-lg font-semibold">
          Learnova <span className="text-sm font-normal text-blue-500">{panelLabel}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className="rounded-lg bg-white/10 px-3.5 py-1.5 text-sm font-semibold transition hover:bg-white/20"
        >
          Menu
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-violet-100/80 bg-white/90 text-blue-950 shadow-[4px_0_24px_rgba(70,60,150,0.04)] backdrop-blur transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-6 pt-8 pb-7">
          <Link href={homeHref} className="block">
            <span className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-lg font-black text-white shadow-md">L</span>
              <span className="block font-display text-2xl font-bold tracking-tight leading-none">Learnova</span>
            </span>
            <span className="ml-[50px] mt-1.5 block text-xs font-medium text-violet-500">Panel {panelLabel}</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-sm text-blue-500 hover:bg-white/10 lg:hidden"
          >
            Tutup
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition ${
                  active
                    ? "bg-gradient-to-r from-violet-100 to-indigo-100 font-semibold text-violet-700 shadow-sm"
                    : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                {item.icon && <Icon name={item.icon} />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-violet-100 px-6 py-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
              {name.trim().charAt(0).toUpperCase()}
            </span>
            <p className="truncate text-sm font-semibold">{name}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/ganti-password"
              className="text-blue-500 transition hover:text-white"
            >
              Ganti password
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md bg-blue-50 px-3 py-1.5 text-blue-700 font-semibold transition hover:bg-white/20"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
