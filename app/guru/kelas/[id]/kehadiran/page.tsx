import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getAttendanceRecap,
  getOwnedTeachingClass,
  listAttendanceSessions,
} from "@/lib/guru-data";
import { formatDate, todayJakarta } from "@/lib/format";
import { Card } from "@/components/admin/ui";
import DeleteButton from "@/components/admin/DeleteButton";
import { deleteAttendanceSession } from "../../../actions";
import { AttendanceSessionForm } from "../../../forms";

export default async function KehadiranPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const [sessions, recap] = await Promise.all([
    listAttendanceSessions(kelas.id),
    getAttendanceRecap(kelas.id, kelas.classId),
  ]);

  return (
    <>
      <Card title="Buat pertemuan baru" className="mb-6">
        <AttendanceSessionForm tcId={kelas.id} today={todayJakarta()} />
      </Card>

      <Card title="Daftar pertemuan" className="mb-6">
        {sessions.length === 0 ? (
          <p className="text-sm text-black/50">Belum ada pertemuan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
                  <th className="px-3 py-3 font-bold">Tanggal</th>
                  <th className="px-3 py-3 font-bold">Topik</th>
                  <th className="px-3 py-3 font-bold">H</th>
                  <th className="px-3 py-3 font-bold">I</th>
                  <th className="px-3 py-3 font-bold">S</th>
                  <th className="px-3 py-3 font-bold">A</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-black/5">
                    <td className="px-3 py-3 font-semibold">
                      {formatDate(session.meetingDate)}
                    </td>
                    <td className="px-3 py-3">{session.topic ?? "—"}</td>
                    <td className="px-3 py-3">{session.tally.hadir}</td>
                    <td className="px-3 py-3">{session.tally.izin}</td>
                    <td className="px-3 py-3">{session.tally.sakit}</td>
                    <td className="px-3 py-3">{session.tally.alpa}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/guru/kelas/${kelas.id}/kehadiran/${session.id}`}
                          className="text-xs font-semibold text-blue-700 hover:underline"
                        >
                          Buka
                        </Link>
                        <DeleteButton
                          action={deleteAttendanceSession.bind(
                            null,
                            String(kelas.id),
                            String(session.id)
                          )}
                          label={`pertemuan ${formatDate(session.meetingDate)}`}
                          warning="Data kehadiran pertemuan ini ikut terhapus."
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Rekap kehadiran per murid">
        {recap.rows.length === 0 ? (
          <p className="text-sm text-black/50">Kelas ini belum punya murid.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
                  <th className="px-3 py-3 font-bold">Murid</th>
                  <th className="px-3 py-3 font-bold">Hadir</th>
                  <th className="px-3 py-3 font-bold">Izin</th>
                  <th className="px-3 py-3 font-bold">Sakit</th>
                  <th className="px-3 py-3 font-bold">Alpa</th>
                  <th className="px-3 py-3 font-bold">% Hadir</th>
                </tr>
              </thead>
              <tbody>
                {recap.rows.map(({ student, tally, percent }) => (
                  <tr key={student.id} className="border-b border-black/5">
                    <td className="px-3 py-2 font-semibold">
                      {student.fullName}
                    </td>
                    <td className="px-3 py-2">{tally.hadir}</td>
                    <td className="px-3 py-2">{tally.izin}</td>
                    <td className="px-3 py-2">{tally.sakit}</td>
                    <td className="px-3 py-2">{tally.alpa}</td>
                    <td className="px-3 py-2 font-bold">
                      {percent === null ? "—" : `${percent.toFixed(0)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-black/50">
          Persentase dihitung dari jumlah hadir dibagi total pertemuan ({
            recap.sessionCount
          }).
        </p>
      </Card>
    </>
  );
}
