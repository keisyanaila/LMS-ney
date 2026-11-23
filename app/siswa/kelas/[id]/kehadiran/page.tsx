import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import {
  getStudentAttendance,
  getStudentTeachingClass,
} from "@/lib/siswa-data";
import { STATUS_LABELS } from "@/lib/guru-data";
import { formatDate } from "@/lib/format";
import { Badge, Card } from "@/components/admin/ui";

const TONES = {
  hadir: "green",
  izin: "blue",
  sakit: "gray",
  alpa: "red",
} as const;

export default async function SiswaKehadiranPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(id));

  if (!kelas) notFound();

  const { rows, tally, percent } = await getStudentAttendance(
    student.id,
    kelas.id
  );

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-5">
        <div className="rounded-lg border border-black/10 bg-white p-5 sm:col-span-1">
          <p className="text-sm text-black/50">Kehadiran</p>
          <p className="mt-1 text-3xl font-bold">
            {percent === null ? "—" : `${percent.toFixed(0)}%`}
          </p>
        </div>
        {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map(
          (status) => (
            <div
              key={status}
              className="rounded-lg border border-black/10 bg-white p-5"
            >
              <p className="text-sm text-black/50">{STATUS_LABELS[status]}</p>
              <p className="mt-1 text-3xl font-bold">{tally[status]}</p>
            </div>
          )
        )}
      </div>

      <Card title="Riwayat pertemuan">
        {rows.length === 0 ? (
          <p className="text-sm text-black/50">Belum ada pertemuan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-black/50">
                  <th className="px-3 py-3 font-bold">Tanggal</th>
                  <th className="px-3 py-3 font-bold">Topik</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ session, status, note }) => (
                  <tr key={session.id} className="border-b border-black/5">
                    <td className="px-3 py-3 font-semibold">
                      {formatDate(session.meetingDate)}
                    </td>
                    <td className="px-3 py-3">{session.topic ?? "—"}</td>
                    <td className="px-3 py-3">
                      {status ? (
                        <Badge tone={TONES[status]}>
                          {STATUS_LABELS[status]}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-black/70">{note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
