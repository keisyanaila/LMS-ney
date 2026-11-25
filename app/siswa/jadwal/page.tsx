import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth";
import { listStudentTeachingClasses } from "@/lib/siswa-data";
import { buildSchedule, DAYS, jakartaNow, SLOTS } from "@/lib/jadwal";
import Icon from "@/components/Icon";
import { Badge } from "@/components/admin/ui";
import { EmptyState, PageTitle } from "@/components/siswa/widgets";

export const metadata: Metadata = { title: "Jadwal Pelajaran | RoboLearn" };

export default async function JadwalPage() {
  const { student } = await requireStudent();
  const classes = await listStudentTeachingClasses(student);

  if (classes.length === 0) {
    return (
      <>
        <PageTitle
          title="Jadwal pelajaran"
          description="Jadwal mingguan untuk kelasmu."
        />
        <EmptyState>Belum ada mata pelajaran untuk kelasmu.</EmptyState>
      </>
    );
  }

  const schedule = buildSchedule(classes);
  const today = jakartaNow().day;

  return (
    <>
      <PageTitle
        title="Jadwal pelajaran"
        description="Jadwal mingguan: hari, jam, guru, dan ruang kelas."
      />

      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <Icon name="clock" className="mt-0.5 h-4 w-4" />
        <p>
          Ini jadwal contoh. Mata pelajaran dan gurunya asli, tetapi hari, jam,
          dan ruangnya disusun otomatis karena sekolah belum memasukkan jadwal
          ke sistem.
        </p>
      </div>

      {/* Tablet & desktop: grid mingguan */}
      <div className="hidden overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(62,8,37,0.04)] md:block">
        <table className="w-full min-w-176 table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-28 border-b border-black/10 p-3 text-left text-xs font-semibold text-black/50">
                Jam
              </th>
              {DAYS.map((day, index) => (
                <th
                  key={day}
                  className={`border-b border-l border-black/10 p-3 text-left font-semibold ${
                    index === today ? "bg-blue-50 text-blue-700" : ""
                  }`}
                >
                  {day}
                  {index === today && (
                    <span className="ml-2 align-middle">
                      <Badge>Hari ini</Badge>
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, slotIndex) => (
              <tr key={slot.start}>
                <td className="border-b border-black/5 p-3 align-top text-xs text-black/55">
                  {slot.start}
                  <br />
                  {slot.end}
                </td>
                {DAYS.map((day, dayIndex) => {
                  const entry = schedule.find(
                    (e) => e.day === dayIndex && e.slot === slotIndex
                  );

                  return (
                    <td
                      key={day}
                      className={`border-b border-l border-black/5 p-2 align-top ${
                        dayIndex === today ? "bg-blue-50/50" : ""
                      }`}
                    >
                      {entry ? (
                        <div className="h-full rounded-xl bg-blue-600/8 p-3 ring-1 ring-blue-600/15">
                          <p className="font-bold leading-snug">{entry.subject}</p>
                          <p className="mt-1 text-xs text-black/60">
                            {entry.teacherName}
                          </p>
                          <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                            <Icon name="pin" className="h-3.5 w-3.5" />
                            {entry.room}
                          </p>
                        </div>
                      ) : (
                        <span className="block p-3 text-xs text-black/25">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HP: daftar per hari */}
      <div className="space-y-4 md:hidden">
        {DAYS.map((day, dayIndex) => {
          const entries = schedule.filter((e) => e.day === dayIndex);

          return (
            <section
              key={day}
              className={`rounded-2xl border bg-white p-4 ${
                dayIndex === today ? "border-blue-600" : "border-black/10"
              }`}
            >
              <h2 className="mb-3 flex items-center gap-2 font-bold">
                {day}
                {dayIndex === today && <Badge>Hari ini</Badge>}
              </h2>
              {entries.length === 0 ? (
                <p className="text-sm text-black/50">Tidak ada pelajaran.</p>
              ) : (
                <ul className="space-y-2">
                  {entries.map((entry) => (
                    <li
                      key={`${entry.tcId}-${entry.slot}`}
                      className="rounded-xl bg-blue-50 p-3"
                    >
                      <p className="text-sm font-bold">{entry.subject}</p>
                      <p className="mt-0.5 text-xs text-black/60">
                        {entry.start}–{entry.end} · {entry.room}
                      </p>
                      <p className="text-xs text-black/60">{entry.teacherName}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
