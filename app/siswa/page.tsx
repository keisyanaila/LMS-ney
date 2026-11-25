import Link from "next/link";
import Image from "next/image";
import { requireStudent } from "@/lib/auth";
import { computeProgress, loadStudentPortal } from "@/lib/siswa-portal";
import { buildSchedule, todayLessons } from "@/lib/jadwal";
import { formatDateTime } from "@/lib/format";
import { itemPath } from "@/lib/online";
import Icon, { type IconName } from "@/components/Icon";
import { Badge } from "@/components/admin/ui";
import {
  EmptyState,
  Panel,
  ProgressBar,
  ProgressRing,
  StatCard,
} from "@/components/siswa/widgets";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function SiswaDashboardPage() {
  const { user, student } = await requireStudent();
  const portal = await loadStudentPortal(student);
  const progress = computeProgress(portal);
  const now = new Date();

  if (!student.classId) {
    return (
      <EmptyState>
        Kamu belum terdaftar di kelas mana pun. Hubungi admin sekolah.
      </EmptyState>
    );
  }

  const schedule = buildSchedule(portal.classes);
  const today = todayLessons(schedule);

  // ---- Kartu ringkasan
  const kuisOpen = portal.kuis.filter(
    (k) => k.state === "dibuka" || k.state === "mengerjakan"
  );
  const kuisDone = portal.kuis.filter((k) => k.state === "selesai");

  const upcomingExams = portal.ujian
    .filter((u) => u.state !== "selesai" && u.state !== "ditutup")
    .sort(
      (a, b) =>
        (a.opensAt ?? a.dueAt ?? now).getTime() -
        (b.opensAt ?? b.dueAt ?? now).getTime()
    );
  const nextExam = upcomingExams[0] ?? null;
  const latestMaterial = portal.materials[0] ?? null;

  const lessonFocus = today.current ?? today.next;
  const lessonValue = lessonFocus
    ? lessonFocus.subject
    : today.lessons.length > 0
      ? "Selesai"
      : "Libur";
  const lessonHint = lessonFocus
    ? `${today.current ? "Berlangsung" : "Berikutnya"} · ${lessonFocus.start}–${lessonFocus.end} · ${lessonFocus.room}`
    : today.lessons.length > 0
      ? "Semua pelajaran hari ini sudah selesai."
      : "Tidak ada pelajaran hari ini.";

  // ---- Perlu segera dikerjakan
  type Urgent = {
    key: string;
    title: string;
    subject: string;
    kindLabel: string;
    dueAt: Date | null;
    href: string;
  };

  const urgent: Urgent[] = [
    ...[...kuisOpen, ...portal.ujian.filter((u) => u.state === "dibuka" || u.state === "mengerjakan")].map(
      (item) => ({
        key: `o${item.id}`,
        title: item.title,
        subject: item.subject,
        kindLabel: item.kind === "kuis" ? "Kuis" : item.kind.toUpperCase(),
        dueAt: item.dueAt,
        href: itemPath("siswa", item.teachingClassId, item.kind, item.id),
      })
    ),
    ...portal.tugas
      .filter((t) => !t.submittedAt)
      .map((item) => ({
        key: `t${item.id}`,
        title: item.title,
        subject: item.subject,
        kindLabel: "Tugas",
        dueAt: item.dueAt,
        href: itemPath("siswa", item.teachingClassId, "tugas", item.id),
      })),
  ]
    .sort(
      (a, b) =>
        (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
    )
    .slice(0, 5);

  // ---- Aktivitas terbaru
  type Activity = { key: string; icon: IconName; text: string; sub: string; at: Date };

  const activities: Activity[] = [
    ...portal.materials.slice(0, 5).map((m) => ({
      key: `m${m.id}`,
      icon: "book" as const,
      text: `Materi baru: ${m.title}`,
      sub: m.subject,
      at: m.createdAt,
    })),
    ...portal.announcements.slice(0, 5).map((a) => ({
      key: `a${a.id}`,
      icon: "bell" as const,
      text: `Pengumuman: ${a.title}`,
      sub: a.subject,
      at: a.createdAt,
    })),
    ...[...portal.kuis, ...portal.ujian]
      .filter((o) => o.attempt?.submittedAt)
      .map((o) => ({
        key: `s${o.id}`,
        icon: "check" as const,
        text: `Kamu menyelesaikan ${o.kind === "kuis" ? "kuis" : "ujian"} ${o.title}`,
        sub: o.subject,
        at: o.attempt!.submittedAt!,
      })),
    ...portal.tugas
      .filter((t) => t.submittedAt)
      .map((t) => ({
        key: `u${t.id}`,
        icon: "check" as const,
        text: `Kamu mengumpulkan tugas ${t.title}`,
        sub: t.subject,
        at: t.submittedAt!,
      })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  return (
    <>
      {/* Sapaan + progress */}
      <section className="relative mb-6 min-h-[245px] overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-[#f0efff] via-[#e4e5ff] to-[#d8e4ff] px-6 py-7 shadow-[0_10px_30px_rgba(91,82,190,0.10)] sm:px-9 sm:py-8">
        <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border-[28px] border-white/30" />
        <div className="pointer-events-none absolute bottom-[-105px] right-[22%] h-56 w-[420px] rotate-[-18deg] rounded-full bg-white/30 blur-[1px]" />
        <div className="relative z-10 max-w-[calc(100%-64px)] sm:max-w-[60%]">
          <p className="mb-3 text-xs font-bold tracking-wide text-blue-700">YOUR LEARNING JOURNEY, YOUR WAY</p>
          <h1 className="text-3xl font-bold leading-[1.12] tracking-tight text-[#24234f] sm:text-[38px]">
            Hai, {user.fullName.split(" ")[0]}! <span aria-hidden="true">👋</span>
            <span className="block text-blue-600">Siap belajar hari ini?</span>
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#55547d] sm:text-[15px]">
            Yuk, lanjutkan perjalanan belajarmu dan raih hal baru setiap hari.
          </p>
          <p className="mt-4 inline-flex rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-xs font-semibold text-blue-800">
            {progress.total === 0
              ? "Belum ada tugas, kuis, atau ujian untuk kelasmu."
              : `${progress.done} dari ${progress.total} tugas, kuis, dan ujian sudah selesai.`}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Terus bertumbuh, satu materi setiap waktu
          </div>
        </div>
        <div className="absolute -bottom-2 right-[-12px] z-0 h-[190px] w-[160px] sm:-bottom-5 sm:right-7 sm:h-[300px] sm:w-[285px]">
          <Image src="/robolearn-mascot.png" alt="Maskot robot RoboLearn" fill priority sizes="(max-width: 640px) 235px, 285px" className="object-contain object-bottom drop-shadow-[0_12px_16px_rgba(58,47,140,0.18)]" />
        </div>
        <div className="absolute bottom-5 right-5 z-10 hidden rounded-2xl border border-white/70 bg-white/75 p-3 text-center shadow-sm sm:block">
          <p className="text-2xl font-extrabold text-blue-700">{progress.percent}%</p>
          <p className="text-[10px] font-medium text-slate-500">Progress kamu</p>
        </div>
      </section>

      {/* Ringkasan tiap menu */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/siswa/jadwal"
          icon="calendar"
          label="Jadwal pelajaran"
          value={lessonValue}
          hint={lessonHint}
        />
        <StatCard
          href="/siswa/materi"
          icon="book"
          label="Materi"
          value={`${portal.materials.length} tersedia`}
          hint={latestMaterial ? `Terbaru: ${latestMaterial.title}` : "Belum ada materi."}
        />
        <StatCard
          href="/siswa/kuis"
          icon="quiz"
          label="Kuis"
          value={`${kuisOpen.length} tersedia`}
          hint={`${kuisDone.length} sudah dikerjakan · ${portal.kuis.length - kuisDone.length} belum`}
        />
        <StatCard
          href="/siswa/ujian"
          icon="exam"
          label="Ujian"
          value={nextExam ? nextExam.title : "Tidak ada"}
          hint={
            nextExam
              ? `${nextExam.subject} · ${formatDateTime(nextExam.opensAt ?? nextExam.dueAt)}`
              : "Belum ada ujian mendatang."
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel
            title="Perlu segera dikerjakan"
            action={
              <Link href="/siswa/kuis" className="text-sm font-semibold text-blue-700 hover:underline">
                Lihat kuis
              </Link>
            }
          >
            {urgent.length === 0 ? (
              <p className="text-sm text-black/55">
                Hebat, tidak ada tugas, kuis, atau ujian yang tertunda.
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {urgent.map((item) => {
                  const overdue = item.dueAt !== null && item.dueAt < now;
                  const soon =
                    item.dueAt !== null &&
                    !overdue &&
                    item.dueAt.getTime() - now.getTime() < DAY_MS;

                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between gap-3 py-3 transition hover:text-blue-700"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {item.title}
                          </span>
                          <span className="text-xs text-black/50">
                            {item.kindLabel} · {item.subject} ·{" "}
                            {item.dueAt ? `batas ${formatDateTime(item.dueAt)}` : "tanpa batas waktu"}
                          </span>
                        </span>
                        {overdue ? (
                          <Badge tone="red">Lewat tenggat</Badge>
                        ) : soon ? (
                          <Badge tone="red">Kurang dari 24 jam</Badge>
                        ) : (
                          <Icon name="arrow" className="h-4 w-4 text-black/30" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Aktivitas belajar terbaru">
            {activities.length === 0 ? (
              <p className="text-sm text-black/55">Belum ada aktivitas.</p>
            ) : (
              <ul className="space-y-4">
                {activities.map((item) => (
                  <li key={item.key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold">{item.text}</span>
                      <span className="text-xs text-black/50">
                        {item.sub} · {formatDateTime(item.at)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Jadwal hari ini"
            action={
              <Link href="/siswa/jadwal" className="text-sm font-semibold text-blue-700 hover:underline">
                Semua
              </Link>
            }
          >
            {today.lessons.length === 0 ? (
              <p className="text-sm text-black/55">
                Tidak ada pelajaran hari ini. Selamat beristirahat.
              </p>
            ) : (
              <ul className="space-y-3">
                {today.lessons.map((lesson) => (
                  <li
                    key={`${lesson.tcId}-${lesson.slot}`}
                    className={`rounded-xl border p-3 ${
                      lesson.status === "berlangsung"
                        ? "border-blue-600 bg-blue-50"
                        : "border-black/10"
                    } ${lesson.status === "selesai" ? "opacity-55" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold">{lesson.subject}</p>
                      {lesson.status === "berlangsung" && <Badge>Berlangsung</Badge>}
                      {lesson.status === "akan" && lesson === today.next && (
                        <Badge tone="gray">Berikutnya</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-black/55">
                      {lesson.start}–{lesson.end} · {lesson.room}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-black/40">
              Jadwal contoh, disusun otomatis dari mata pelajaranmu.
            </p>
          </Panel>

          <Panel title="Progress per mata pelajaran">
            {progress.bySubject.length === 0 ? (
              <p className="text-sm text-black/55">Belum ada mata pelajaran.</p>
            ) : (
              <ul className="space-y-4">
                {progress.bySubject.map((item) => (
                  <li key={item.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                      <Link
                        href={`/siswa/kelas/${item.id}`}
                        className="truncate font-semibold hover:text-blue-700"
                      >
                        {item.subject}
                      </Link>
                      <span className="shrink-0 text-xs text-black/50">
                        {item.percent === null ? "—" : `${item.percent}%`}
                      </span>
                    </div>
                    <ProgressBar percent={item.percent ?? 0} label={item.subject} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
