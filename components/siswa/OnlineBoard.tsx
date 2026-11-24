import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { loadStudentPortal, type PortalOnline } from "@/lib/siswa-portal";
import { type OnlineState } from "@/lib/siswa-data";
import { formatDateTime, formatScore } from "@/lib/format";
import { KIND_LABELS } from "@/lib/guru-data";
import type { Section } from "@/lib/online";
import Icon from "@/components/Icon";
import { Badge } from "@/components/admin/ui";
import { EmptyState, PageTitle } from "@/components/siswa/widgets";

const STATE: Record<
  OnlineState,
  { label: string; tone: "blue" | "green" | "red" | "gray" }
> = {
  belum_dibuka: { label: "Belum dibuka", tone: "gray" },
  dibuka: { label: "Sudah dibuka", tone: "blue" },
  mengerjakan: { label: "Sedang dikerjakan", tone: "blue" },
  selesai: { label: "Selesai", tone: "green" },
  ditutup: { label: "Terlewat", tone: "red" },
};

const COPY = {
  kuis: {
    title: "Kuis",
    description: "Kerjakan kuis dari semua mata pelajaran dan lihat riwayat nilainya.",
    noun: "kuis",
    start: "Mulai kuis",
    emptyOpen: "Tidak ada kuis yang bisa dikerjakan sekarang.",
  },
  ujian: {
    title: "Ujian",
    description: "Jadwal ujian mendatang, ujian yang sudah selesai, dan nilainya.",
    noun: "ujian",
    start: "Mulai ujian",
    emptyOpen: "Tidak ada ujian yang sedang dibuka.",
  },
} as const;

function Meta({ item }: { item: PortalOnline }) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      <div>
        <dt className="text-black/45">Durasi</dt>
        <dd className="font-semibold">
          {item.durationMinutes ? `${item.durationMinutes} menit` : "Tidak dibatasi"}
        </dd>
      </div>
      <div>
        <dt className="text-black/45">Dibuka</dt>
        <dd className="font-semibold">{formatDateTime(item.opensAt)}</dd>
      </div>
      <div className="col-span-2">
        <dt className="text-black/45">Batas waktu</dt>
        <dd className="font-semibold">{formatDateTime(item.dueAt)}</dd>
      </div>
    </dl>
  );
}

function Card({
  item,
  href,
  action,
  section,
}: {
  item: PortalOnline;
  href: string;
  action: string;
  section: Section;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-[0_1px_2px_rgba(62,8,37,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold leading-snug">{item.title}</h3>
          <p className="mt-0.5 text-xs text-black/50">
            {item.subject}
            {section === "ujian" && ` · ${KIND_LABELS[item.kind]}`}
          </p>
        </div>
        <Badge tone={STATE[item.state].tone}>{STATE[item.state].label}</Badge>
      </div>

      <Meta item={item} />

      <Link
        href={href}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        {action}
        <Icon name="arrow" className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default async function OnlineBoard({
  section,
  mapel,
}: {
  section: Section;
  mapel?: string;
}) {
  const { student } = await requireStudent();
  const portal = await loadStudentPortal(student);
  const copy = COPY[section];

  const all = section === "kuis" ? portal.kuis : portal.ujian;
  const filterId = Number(mapel);
  const items = filterId ? all.filter((i) => i.teachingClassId === filterId) : all;

  const pathOf = (item: PortalOnline) =>
    `/siswa/kelas/${item.teachingClassId}/${section}/${item.id}`;

  const open = items
    .filter((i) => i.state === "dibuka" || i.state === "mengerjakan")
    .sort(
      (a, b) =>
        (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
    );
  const upcoming = items
    .filter((i) => i.state === "belum_dibuka")
    .sort((a, b) => (a.opensAt?.getTime() ?? 0) - (b.opensAt?.getTime() ?? 0));
  const history = items
    .filter((i) => i.state === "selesai" || i.state === "ditutup")
    .sort(
      (a, b) =>
        (b.attempt?.submittedAt ?? b.dueAt ?? b.createdAt).getTime() -
        (a.attempt?.submittedAt ?? a.dueAt ?? a.createdAt).getTime()
    );

  const finished = all.filter((i) => i.state === "selesai").length;

  const base = `/siswa/${section}`;
  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
      active
        ? "bg-blue-600 text-white"
        : "bg-white text-black/65 ring-1 ring-black/10 hover:bg-blue-50"
    }`;

  return (
    <>
      <PageTitle title={copy.title} description={copy.description} />

      {portal.classes.length === 0 ? (
        <EmptyState>Belum ada mata pelajaran untuk kelasmu.</EmptyState>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Tersedia sekarang", all.filter((i) => i.state === "dibuka" || i.state === "mengerjakan").length],
              ["Sudah dikerjakan", finished],
              ["Belum dikerjakan", all.length - finished],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(62,8,37,0.04)]"
              >
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-black/55">{label}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter mata pelajaran">
            <Link href={base} className={chip(!filterId)}>
              Semua
            </Link>
            {portal.classes.map((cls) => (
              <Link
                key={cls.id}
                href={`${base}?mapel=${cls.id}`}
                className={chip(filterId === cls.id)}
              >
                {cls.subject}
              </Link>
            ))}
          </div>

          <section className="mb-10">
            <h2 className="mb-3 text-lg font-bold">
              {section === "kuis" ? "Tersedia" : "Sedang dibuka"}
            </h2>
            {open.length === 0 ? (
              <EmptyState>{copy.emptyOpen}</EmptyState>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {open.map((item) => (
                  <Card
                    key={item.id}
                    item={item}
                    section={section}
                    href={pathOf(item)}
                    action={item.state === "mengerjakan" ? "Lanjutkan" : copy.start}
                  />
                ))}
              </div>
            )}
          </section>

          {upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-3 text-lg font-bold">Mendatang</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((item) => (
                  <Card
                    key={item.id}
                    item={item}
                    section={section}
                    href={pathOf(item)}
                    action="Lihat detail"
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-bold">Riwayat dan nilai</h2>
            {history.length === 0 ? (
              <EmptyState>Belum ada riwayat {copy.noun}.</EmptyState>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(62,8,37,0.04)]">
                <table className="w-full min-w-136 text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-xs text-black/55">
                      <th className="px-4 py-3 font-semibold">Nama</th>
                      <th className="px-4 py-3 font-semibold">Mata pelajaran</th>
                      <th className="px-4 py-3 font-semibold">Selesai</th>
                      <th className="px-4 py-3 font-semibold">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item.id} className="border-b border-black/5 last:border-0 hover:bg-blue-50/40">
                        <td className="px-4 py-3">
                          <Link href={pathOf(item)} className="font-semibold hover:text-blue-700">
                            {item.title}
                          </Link>
                          {section === "ujian" && (
                            <span className="ml-2 align-middle">
                              <Badge tone="gray">{KIND_LABELS[item.kind]}</Badge>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-black/65">{item.subject}</td>
                        <td className="px-4 py-3 text-black/65">
                          {item.attempt?.submittedAt ? (
                            formatDateTime(item.attempt.submittedAt)
                          ) : (
                            <Badge tone="red">Tidak dikerjakan</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.score !== null ? (
                            <Badge tone="green">
                              {formatScore(item.score)}/{item.maxScore}
                            </Badge>
                          ) : item.state === "selesai" ? (
                            <span className="text-xs text-black/50">
                              Menunggu dirilis guru
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
