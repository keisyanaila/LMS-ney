const TZ = "Asia/Jakarta";

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tanggal "YYYY-MM-DD" (kolom date) ditampilkan tanpa geser zona waktu. */
export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00+07:00`).toLocaleDateString("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function todayJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

/** Nilai input datetime-local (waktu WIB) menjadi Date. */
export function parseJakartaLocal(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
