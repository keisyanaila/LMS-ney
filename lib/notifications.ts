import { itemPath } from "@/lib/online";
import type { StudentPortal } from "@/lib/siswa-portal";

export type NotificationTone = "urgent" | "info" | "good";

export type StudentNotification = {
  key: string;
  tone: NotificationTone;
  title: string;
  detail: string;
  href: string;
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function untilLabel(target: Date, now: Date) {
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return "sudah lewat";

  const hours = Math.ceil(diff / HOUR);

  if (hours < 24) return `${hours} jam lagi`;

  return `${Math.ceil(diff / DAY)} hari lagi`;
}

/**
 * Notifikasi dihitung dari data yang sudah ada (tanpa tabel tambahan), jadi
 * selalu sesuai kondisi terbaru: tugas dan kuis yang perlu dikerjakan, nilai
 * tugas baru, materi belum dibaca, dan pengumuman terbaru.
 */
export function buildNotifications(
  portal: StudentPortal,
  now = new Date()
): StudentNotification[] {
  const list: (StudentNotification & { order: number })[] = [];
  const readIds = new Set(portal.readMaterialIds);

  // Tugas yang belum dikumpulkan dan tenggatnya dalam 3 hari.
  for (const t of portal.tugas) {
    if (t.submittedAt || !t.dueAt) continue;

    const left = t.dueAt.getTime() - now.getTime();

    if (left <= 0 || left > 3 * DAY) continue;

    list.push({
      key: `tugas-${t.id}`,
      tone: "urgent",
      title: `Tugas ${t.subject}: ${t.title}`,
      detail: `Tenggat ${untilLabel(t.dueAt, now)}`,
      href: itemPath("siswa", t.teachingClassId, "tugas", t.id),
      order: left,
    });
  }

  // Kuis/ujian yang sedang dibuka atau sedang dikerjakan.
  for (const o of [...portal.kuis, ...portal.ujian]) {
    if (o.state !== "dibuka" && o.state !== "mengerjakan") continue;

    const label = o.kind === "kuis" ? "Kuis" : "Ujian";
    const left = o.dueAt ? o.dueAt.getTime() - now.getTime() : 3 * DAY;

    list.push({
      key: `online-${o.id}`,
      tone: "urgent",
      title: `${label} ${o.subject}: ${o.title}`,
      detail:
        o.state === "mengerjakan"
          ? "Sedang kamu kerjakan, ayo selesaikan"
          : o.dueAt
            ? `Ditutup ${untilLabel(o.dueAt, now)}`
            : "Sudah dibuka",
      href: itemPath("siswa", o.teachingClassId, o.kind, o.id),
      order: left,
    });
  }

  // Tugas yang baru dinilai (7 hari terakhir). Angka nilai tidak ditampilkan
  // di lonceng; lihat di halaman tugas.
  for (const t of portal.tugas) {
    if (!t.gradedAt || now.getTime() - t.gradedAt.getTime() > 7 * DAY) continue;

    list.push({
      key: `nilai-${t.id}`,
      tone: "good",
      title: `Tugas ${t.subject} sudah dinilai`,
      detail: t.title,
      href: itemPath("siswa", t.teachingClassId, "tugas", t.id),
      order: 10 * DAY - (now.getTime() - t.gradedAt.getTime()),
    });
  }

  // Materi baru (7 hari terakhir) yang belum dibaca.
  for (const m of portal.materials) {
    if (readIds.has(m.id)) continue;
    if (now.getTime() - m.createdAt.getTime() > 7 * DAY) continue;

    list.push({
      key: `materi-${m.id}`,
      tone: "info",
      title: `Materi baru ${m.subject}`,
      detail: m.title,
      href: "/siswa/materi",
      order: 20 * DAY - (now.getTime() - m.createdAt.getTime()),
    });
  }

  // Pengumuman 3 hari terakhir.
  for (const a of portal.announcements) {
    if (now.getTime() - a.createdAt.getTime() > 3 * DAY) continue;

    list.push({
      key: `info-${a.id}`,
      tone: "info",
      title: `Pengumuman ${a.subject}`,
      detail: a.title,
      href: `/siswa/kelas/${a.teachingClassId}`,
      order: 30 * DAY - (now.getTime() - a.createdAt.getTime()),
    });
  }

  return list
    .sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map(({ order: _order, ...item }) => item);
}
