import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import {
  getStudentTeachingClass,
  listStudentOnline,
  type OnlineState,
} from "@/lib/siswa-data";
import { KIND_LABELS } from "@/lib/guru-data";
import { SECTION_LABELS, type Section } from "@/lib/online";
import { formatDateTime, formatScore } from "@/lib/format";
import { Badge } from "@/components/admin/ui";

const STATE: Record<
  OnlineState,
  { label: string; tone: "blue" | "green" | "red" | "gray" }
> = {
  belum_dibuka: { label: "Belum dibuka", tone: "gray" },
  dibuka: { label: "Sudah dibuka", tone: "blue" },
  mengerjakan: { label: "Sedang dikerjakan", tone: "blue" },
  selesai: { label: "Selesai", tone: "green" },
  ditutup: { label: "Ditutup", tone: "red" },
};

export default async function OnlineList({
  tcId,
  section,
}: {
  tcId: string;
  section: Section;
}) {
  const { student } = await requireStudent();
  const kelas = await getStudentTeachingClass(student, Number(tcId));

  if (!kelas) notFound();

  const items = await listStudentOnline(student.id, kelas.id, section);
  const label = SECTION_LABELS[section].toLowerCase();

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-black/10 bg-white p-10 text-center text-sm text-black/50">
        Belum ada {label} untuk mata pelajaran ini.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/siswa/kelas/${kelas.id}/${section}/${item.id}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-5 transition hover:border-blue-500"
        >
          <div>
            <p className="font-bold">
              {item.title}
              {section === "ujian" && (
                <span className="ml-2 align-middle">
                  <Badge tone="gray">{KIND_LABELS[item.kind]}</Badge>
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-black/50">
              Dibuka: {formatDateTime(item.opensAt)} · Ditutup:{" "}
              {formatDateTime(item.dueAt)}
              {item.durationMinutes ? ` · ${item.durationMinutes} menit` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {item.score !== null && (
              <Badge tone="green">
                Nilai {formatScore(item.score)}/{item.maxScore}
              </Badge>
            )}
            <Badge tone={STATE[item.state].tone}>
              {STATE[item.state].label}
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
