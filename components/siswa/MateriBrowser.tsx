"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Icon from "@/components/Icon";
import { Badge } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";

type Item = {
  id: number;
  subject: string;
  teacherName: string;
  title: string;
  description: string | null;
  fileId: number | null;
  fileName: string | null;
  linkUrl: string | null;
  createdAt: string;
};

// Belum ada tabel "sudah dibaca" di database, jadi status baca disimpan di
// browser siswa (per akun). Cukup untuk penanda pribadi; tidak ikut pindah
// perangkat.
const EVENT = "materi-dibaca-berubah";

function storageKey(studentId: number) {
  return `lms-materi-dibaca-${studentId}`;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

function readRaw(key: string) {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeIds(key: string, ids: Set<number>) {
  try {
    window.localStorage.setItem(key, [...ids].join(","));
  } catch {
    // Penyimpanan diblokir: status baca hanya berlaku selama halaman terbuka.
  }

  window.dispatchEvent(new Event(EVENT));
}

function isVideo(url: string | null) {
  return !!url && /(youtube\.com|youtu\.be|vimeo\.com|\.mp4($|\?))/i.test(url);
}

function fileLabel(name: string | null) {
  return name && /\.pdf$/i.test(name) ? "PDF" : "Dokumen";
}

type StatusFilter = "semua" | "belum" | "sudah";

export default function MateriBrowser({
  studentId,
  subjects,
  items,
}: {
  studentId: number;
  subjects: string[];
  items: Item[];
}) {
  const key = storageKey(studentId);
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => ""
  );
  const read = useMemo(
    () => new Set(raw.split(",").filter(Boolean).map(Number)),
    [raw]
  );

  const [subject, setSubject] = useState("semua");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [query, setQuery] = useState("");

  function setRead(id: number, value: boolean) {
    const next = new Set(read);

    if (value) next.add(id);
    else next.delete(id);

    writeIds(key, next);
  }

  const visible = items.filter((item) => {
    if (subject !== "semua" && item.subject !== subject) return false;
    if (status === "belum" && read.has(item.id)) return false;
    if (status === "sudah" && !read.has(item.id)) return false;
    if (query && !`${item.title} ${item.description ?? ""}`.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }

    return true;
  });

  const unread = items.filter((item) => !read.has(item.id)).length;

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
      active
        ? "bg-blue-600 text-white"
        : "bg-white text-black/65 ring-1 ring-black/10 hover:bg-blue-50"
    }`;

  // Kelompokkan per mata pelajaran, urutan sesuai daftar mapel.
  const groups = subjects
    .map((name) => ({
      name,
      items: visible.filter((item) => item.subject === name),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter mata pelajaran">
          <button type="button" className={chip(subject === "semua")} onClick={() => setSubject("semua")}>
            Semua
          </button>
          {subjects.map((name) => (
            <button
              key={name}
              type="button"
              className={chip(subject === name)}
              onClick={() => setSubject(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari materi..."
          aria-label="Cari materi"
          className="w-full rounded-full border border-black/15 px-4 py-2 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 lg:w-64"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-black/55">{unread} belum dibaca</span>
        <span className="text-black/20">|</span>
        {(
          [
            ["semua", "Semua status"],
            ["belum", "Belum dibaca"],
            ["sudah", "Sudah dibaca"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`font-semibold ${
              status === value ? "text-blue-700 underline" : "text-black/55 hover:text-black"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-sm text-black/55">
          Belum ada materi dari gurumu.
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-sm text-black/55">
          Tidak ada materi yang cocok dengan filter ini.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.name}>
              <h2 className="mb-3 text-lg font-bold">{group.name}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {group.items.map((item) => {
                  const done = read.has(item.id);
                  const video = isVideo(item.linkUrl);

                  return (
                    <article
                      key={item.id}
                      className="flex flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(62,8,37,0.04)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold leading-snug">{item.title}</h3>
                        <Badge tone={done ? "green" : "gray"}>
                          {done ? "Sudah dibaca" : "Belum dibaca"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-black/50">
                        {item.teacherName} · {formatDateTime(item.createdAt)}
                      </p>

                      {item.description && (
                        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-black/70">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                        {item.fileId && (
                          <a
                            href={`/api/files/${item.fileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setRead(item.id, true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            <Icon name={fileLabel(item.fileName) === "PDF" ? "file" : "download"} className="h-4 w-4" />
                            {fileLabel(item.fileName) === "PDF" ? "Buka PDF" : "Unduh dokumen"}
                          </a>
                        )}
                        {item.linkUrl && (
                          <a
                            href={item.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setRead(item.id, true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            <Icon name={video ? "video" : "arrow"} className="h-4 w-4" />
                            {video ? "Tonton video" : "Buka tautan"}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setRead(item.id, !done)}
                          className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold transition hover:bg-blue-50"
                        >
                          {done ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
