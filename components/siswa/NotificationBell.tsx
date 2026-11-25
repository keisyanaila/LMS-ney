"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { StudentNotification } from "@/lib/notifications";

const DOT: Record<StudentNotification["tone"], string> = {
  urgent: "bg-rose-500",
  info: "bg-blue-500",
  good: "bg-emerald-500",
};

export default function NotificationBell({
  items,
}: {
  items: StudentNotification[];
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar atau menekan Escape.
  useEffect(() => {
    if (!open) return;

    const onClick = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`Notifikasi, ${items.length} item`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-700 shadow-sm transition hover:bg-violet-50"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
          <path d="M10.3 20a2 2 0 0 0 3.4 0" />
        </svg>
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl">
          <p className="border-b border-violet-100 px-4 py-3 text-sm font-bold">
            Notifikasi
          </p>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-black/55">
              Tidak ada yang perlu kamu lakukan sekarang. Mantap!
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-violet-50 overflow-y-auto">
              {items.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 px-4 py-3 transition hover:bg-violet-50"
                  >
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[item.tone]}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-black/55">
                        {item.detail}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
