// Pembantu murni untuk kuis dan ujian online (aman dipakai di server maupun client).

export const ONLINE_KINDS = ["kuis", "uts", "uas"] as const;
export type OnlineKind = (typeof ONLINE_KINDS)[number];

export function isOnlineKind(kind: string): kind is OnlineKind {
  return (ONLINE_KINDS as readonly string[]).includes(kind);
}

/** Halaman (tab) tempat kuis/ujian ditampilkan, untuk guru maupun siswa. */
export type Section = "kuis" | "ujian";

export const SECTION_KINDS: Record<Section, OnlineKind[]> = {
  kuis: ["kuis"],
  ujian: ["uts", "uas"],
};

export const SECTION_LABELS: Record<Section, string> = {
  kuis: "Kuis",
  ujian: "Ujian",
};

export function sectionOfKind(kind: string): Section | null {
  if (kind === "kuis") return "kuis";
  if (kind === "uts" || kind === "uas") return "ujian";
  return null;
}

/** Alamat halaman sebuah item penilaian, sesuai jenis dan peran. */
export function itemPath(
  role: "guru" | "siswa",
  tcId: number,
  kind: string,
  assessmentId: number
) {
  const base = `/${role}/kelas/${tcId}`;
  const section = sectionOfKind(kind);

  if (section) return `${base}/${section}/${assessmentId}`;
  if (kind === "tugas") {
    return role === "guru"
      ? `${base}/penilaian/${assessmentId}`
      : `${base}/tugas/${assessmentId}`;
  }

  return role === "guru" ? `${base}/penilaian/${assessmentId}` : `${base}/nilai`;
}

// Toleransi keterlambatan jaringan saat mengirim jawaban.
export const GRACE_MS = 30_000;

/** Batas akhir pengerjaan: yang lebih awal antara durasi dan waktu tutup. */
export function attemptDeadline(
  startedAt: Date,
  durationMinutes: number | null,
  closesAt: Date | null
): Date | null {
  const byDuration = durationMinutes
    ? new Date(startedAt.getTime() + durationMinutes * 60_000)
    : null;

  if (byDuration && closesAt) {
    return byDuration < closesAt ? byDuration : closesAt;
  }

  return byDuration ?? closesAt;
}

export type WindowState = "belum_dibuka" | "dibuka" | "ditutup";

export function windowState(
  item: { opensAt: Date | null; dueAt: Date | null },
  now: Date
): WindowState {
  if (item.opensAt && now < item.opensAt) return "belum_dibuka";
  if (item.dueAt && now > item.dueAt) return "ditutup";

  return "dibuka";
}

export function pointsToScore(points: number, total: number, maxScore: number) {
  if (total <= 0) return 0;

  return Math.round((points / total) * maxScore * 100) / 100;
}
