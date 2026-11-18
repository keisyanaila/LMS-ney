import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import {
  getOwnedAttendanceSession,
  getOwnedTeachingClass,
  listAttendanceRecords,
  listClassStudents,
} from "@/lib/guru-data";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/admin/ui";
import { AttendanceForm, type AttendanceRow } from "../../../../forms";

export default async function AbsensiPertemuanPage({
  params,
}: {
  params: Promise<{ id: string; sid: string }>;
}) {
  const { id, sid } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) notFound();

  const session = await getOwnedAttendanceSession(kelas.id, Number(sid));

  if (!session) notFound();

  const [studentList, records] = await Promise.all([
    listClassStudents(kelas.classId),
    listAttendanceRecords(session.id),
  ]);

  const recordByStudent = new Map(records.map((r) => [r.studentId, r]));

  const rows: AttendanceRow[] = studentList.map((student) => {
    const record = recordByStudent.get(student.id);

    return {
      studentId: student.id,
      fullName: student.fullName,
      studentNumber: student.studentNumber,
      status: record?.status ?? "hadir",
      note: record?.note ?? null,
    };
  });

  return (
    <>
      <Link
        href={`/guru/kelas/${kelas.id}/kehadiran`}
        className="mb-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        &larr; Kembali ke daftar pertemuan
      </Link>

      <Card className="mb-6">
        <h2 className="text-lg font-bold">{formatDate(session.meetingDate)}</h2>
        {session.topic && (
          <p className="mt-1 text-sm text-black/60">Topik: {session.topic}</p>
        )}
      </Card>

      <Card title="Absensi">
        <AttendanceForm
          tcId={kelas.id}
          sessionId={session.id}
          rows={rows}
        />
      </Card>
    </>
  );
}
