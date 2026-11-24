// Jadwal pelajaran.
//
// Database belum punya tabel jadwal, jadi jadwal di sini CONTOH: mata pelajaran
// dan nama guru asli milik siswa, tetapi hari, jam, dan ruangnya disusun
// otomatis dan tetap (tidak acak). Kalau nanti ada tabel jadwal, cukup ganti
// isi buildSchedule() dengan data dari database.

export const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;

export const SLOTS = [
  { start: "07:00", end: "08:30" },
  { start: "08:30", end: "10:00" },
  { start: "10:15", end: "11:45" },
  { start: "12:30", end: "14:00" },
] as const;

export type ScheduleEntry = {
  day: number; // 0 = Senin ... 4 = Jumat
  slot: number; // indeks di SLOTS
  tcId: number;
  subject: string;
  teacherName: string;
  room: string;
  start: string;
  end: string;
};

type ClassRef = { id: number; subject: string; teacherName: string };

export function buildSchedule(classes: ClassRef[]): ScheduleEntry[] {
  const cells = DAYS.length * SLOTS.length;
  const perSubject = classes.length <= cells / 2 ? 2 : 1;
  const taken = new Set<number>();
  const entries: ScheduleEntry[] = [];

  classes.forEach((cls, index) => {
    for (let k = 0; k < perSubject; k += 1) {
      if (taken.size >= cells) return;

      // Sesi kedua digeser beberapa hari dari sesi pertama.
      let cell = (index * 3 + k * 9) % cells;

      while (taken.has(cell)) cell = (cell + 1) % cells;
      taken.add(cell);

      const day = Math.floor(cell / SLOTS.length);
      const slot = cell % SLOTS.length;

      entries.push({
        day,
        slot,
        tcId: cls.id,
        subject: cls.subject,
        teacherName: cls.teacherName,
        room: `R. ${101 + (cls.id % 9)}`,
        start: SLOTS[slot].start,
        end: SLOTS[slot].end,
      });
    }
  });

  return entries.sort((a, b) => a.day - b.day || a.slot - b.slot);
}

/** Hari (0 = Senin ... 6 = Minggu) dan menit sejak tengah malam, waktu WIB. */
export function jakartaNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hour = Number(get("hour")) % 24;

  return {
    day: names.indexOf(get("weekday")),
    minutes: hour * 60 + Number(get("minute")),
  };
}

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);

  return h * 60 + m;
}

/** Pelajaran hari ini, ditandai sudah lewat / sedang berlangsung / berikutnya. */
export function todayLessons(schedule: ScheduleEntry[], now = jakartaNow()) {
  const lessons = schedule
    .filter((entry) => entry.day === now.day)
    .map((entry) => {
      const status =
        now.minutes >= toMinutes(entry.end)
          ? ("selesai" as const)
          : now.minutes >= toMinutes(entry.start)
            ? ("berlangsung" as const)
            : ("akan" as const);

      return { ...entry, status };
    });

  const current = lessons.find((l) => l.status === "berlangsung") ?? null;
  const next = lessons.find((l) => l.status === "akan") ?? null;

  return { lessons, current, next };
}
