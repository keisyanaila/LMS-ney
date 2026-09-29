"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const words = ["Dikenal.", "Didukung.", "Berkembang."];

const features = [
  {
    title: "Kelas & Materi",
    description:
      "Temukan materi dan aktivitas pembelajaran dari semua kelas dalam satu tempat.",
    icon: "📚",
    style: "bg-[#ACFF64] text-black",
    muted: "text-black/65",
  },
  {
    title: "Tugas & Quiz",
    description:
      "Kerjakan tugas dan quiz langsung dari LMS dengan proses yang lebih praktis.",
    icon: "✏️",
    style: "bg-white text-black border border-black/10",
    muted: "text-black/60",
  },
  {
    title: "Nilai & Perkembangan",
    description:
      "Lihat hasil belajar dengan informasi nilai yang mudah dipahami.",
    icon: "📊",
    style: "bg-black text-white",
    muted: "text-white/60",
  },
  {
    title: "Kolaborasi",
    description:
      "Guru dan siswa berinteraksi dalam proses pembelajaran secara digital.",
    icon: "🤝",
    style: "bg-[#ACFF64] text-black",
    muted: "text-black/65",
  },
];

const steps = [
  {
    number: "01",
    title: "Masuk",
    description: "Gunakan akun yang diberikan oleh sekolah.",
    icon: "🔑",
  },
  {
    number: "02",
    title: "Pilih Kelas",
    description: "Buka kelas dan materi yang tersedia untukmu.",
    icon: "🏫",
  },
  {
    number: "03",
    title: "Belajar",
    description: "Pelajari materi, kerjakan tugas, dan ikuti quiz.",
    icon: "✏️",
  },
  {
    number: "04",
    title: "Pantau",
    description: "Lihat nilai dan perkembangan belajar secara berkala.",
    icon: "📈",
  },
];

/* Lebar panel = lebar layar sebenarnya (tanpa scrollbar), diisi lewat --pw */
const PANEL = "h-[100dvh] w-[var(--pw,100vw)] shrink-0 overflow-hidden";

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [outerHeight, setOuterHeight] = useState<number | null>(null);

  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxRef = useRef(0);

  // Kata hero berganti
  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((i) => (i + 1) % words.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Video: putar hanya saat hero terlihat, hormati "kurangi gerakan"
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  // Scroll vertikal -> geser track ke kiri (halaman bergerak ke kanan)
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const outer = outerRef.current;
      const track = trackRef.current;
      if (!outer || !track) return;
      const max = maxRef.current;
      const p = Math.min(Math.max(-outer.getBoundingClientRect().top, 0), max);
      track.style.transform = `translate3d(${-p}px, 0, 0)`;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${max ? p / max : 0})`;
      }
    };

    const measure = () => {
      const track = trackRef.current;
      const sticky = stickyRef.current;
      if (!track || !sticky) return;
      track.style.setProperty("--pw", `${sticky.clientWidth}px`);
      const max = Math.max(0, track.scrollWidth - sticky.clientWidth);
      maxRef.current = max;
      setOuterHeight(max + window.innerHeight);
      update();
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="overflow-x-clip bg-[#f7f8f5] text-[#111]">
      {/* Progress scroll */}
      <div className="fixed inset-x-0 bottom-0 z-50 h-1 bg-black/10">
        <div
          ref={barRef}
          className="h-full origin-left scale-x-0 bg-[#ACFF64]"
        />
      </div>

      {/* Tinggi wrapper = jarak geser horizontal + tinggi layar */}
      <div
        ref={outerRef}
        style={{ height: outerHeight ?? "400vh" }}
        className="relative"
      >
        <div ref={stickyRef} className="sticky top-0 h-[100dvh] overflow-hidden">
          <div ref={trackRef} className="flex h-full w-max will-change-transform">
            {/* HALAMAN 1: HERO + VIDEO BACKGROUND */}
            <section
              className={`${PANEL} relative flex items-center justify-center bg-black px-6 text-center text-white`}
            >
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden="true"
              >
                <source src="/hero.mp4" type="video/mp4" />
              </video>

              {/* Lapisan gelap agar teks tetap terbaca */}
              <div className="absolute inset-0 bg-black/55" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

              <div className="relative z-10 mx-auto max-w-5xl">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ACFF64] text-2xl font-black text-black">
                  N
                </div>

                <p className="text-base italic text-white/75 sm:text-xl">
                  Kami percaya setiap siswa layak
                </p>

                <h1
                  key={wordIndex}
                  className="hero-word mt-2 min-h-[1.1em] text-[clamp(2.25rem,11vw,7.5rem)] font-black uppercase leading-none tracking-tight text-[#ACFF64]"
                >
                  {words[wordIndex]}
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-white/75 sm:text-lg sm:leading-7">
                  LMS Ney adalah satu platform untuk mengelola kelas, materi,
                  tugas, quiz, dan perkembangan belajar secara lebih sederhana.
                </p>

                <Link
                  href="/login"
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-[#ACFF64] px-12 py-4 text-base font-black uppercase tracking-wide text-black transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_60px_rgba(172,255,100,0.35)] focus:outline-none focus-visible:ring-4 focus-visible:ring-white active:scale-95 sm:px-14 sm:py-5 sm:text-lg"
                >
                  Masuk
                </Link>
              </div>

              <p className="scroll-cue absolute bottom-8 left-1/2 text-xs uppercase tracking-widest text-white/60">
                Scroll ke bawah untuk menjelajah
              </p>
            </section>

            {/* HALAMAN 2: FITUR */}
            <section className={`${PANEL} flex items-center bg-[#f7f8f5]`}>
              <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
                <Reveal>
                  <p className="text-sm italic text-black/45 sm:text-lg">
                    Fitur LMS Ney
                  </p>
                  <h2 className="mt-1 max-w-3xl break-words text-[clamp(1.75rem,min(7vw,6.5dvh),3.5rem)] font-black uppercase leading-[0.98] tracking-tight">
                    Semua kebutuhan belajar dalam satu tempat
                  </h2>
                </Reveal>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-10 lg:grid-cols-4">
                  {features.map((feature, index) => (
                    <Reveal key={feature.title} delay={index * 120}>
                      <div
                        className={`flex h-full flex-col rounded-[1.5rem] p-4 transition hover:-translate-y-1 hover:shadow-xl sm:p-6 lg:min-h-[44dvh] ${feature.style}`}
                      >
                        <span className="text-3xl sm:text-5xl">
                          {feature.icon}
                        </span>
                        <h3 className="mt-3 break-words text-base font-black uppercase leading-tight tracking-tight sm:mt-auto sm:pt-8 sm:text-2xl">
                          {feature.title}
                        </h3>
                        <p
                          className={`mt-2 text-xs leading-5 sm:text-sm sm:leading-6 ${feature.muted}`}
                        >
                          {feature.description}
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>

            {/* HALAMAN 3: CARA KERJA */}
            <section className={`${PANEL} flex items-center bg-white`}>
              <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
                <Reveal>
                  <p className="text-sm italic text-black/45 sm:text-lg">
                    Cara kerja
                  </p>
                  <h2 className="mt-1 max-w-3xl break-words text-[clamp(1.75rem,min(7vw,6.5dvh),3.5rem)] font-black uppercase leading-[0.98] tracking-tight">
                    Mulai dalam empat langkah
                  </h2>
                </Reveal>

                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 lg:mt-12 lg:grid-cols-4 lg:gap-x-8">
                  {steps.map((step, index) => (
                    <Reveal key={step.number} delay={index * 120}>
                      <div className="group border-t-2 border-black pt-4 transition hover:border-[#ACFF64] sm:pt-6">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm text-black/40">
                            {step.number}
                          </span>
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ACFF64]/30 text-xl transition group-hover:bg-[#ACFF64] sm:h-14 sm:w-14 sm:text-2xl">
                            {step.icon}
                          </span>
                        </div>
                        <h3 className="mt-4 text-lg font-black uppercase tracking-tight sm:mt-6 sm:text-2xl">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-black/55 sm:text-sm sm:leading-6">
                          {step.description}
                        </p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>

            {/* HALAMAN 4: MASUK + FOOTER */}
            <section className={`${PANEL} flex flex-col bg-black text-white`}>
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <Reveal className="max-w-4xl">
                  <p className="text-base italic text-white/50 sm:text-lg">
                    Siap untuk mulai belajar?
                  </p>
                  <h2 className="mt-1 text-[clamp(2.75rem,min(13vw,14dvh),5.5rem)] font-black uppercase leading-none tracking-tight">
                    Masuk
                  </h2>
                  <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                    Akses seluruh kelas, materi, tugas, serta aktivitas
                    pembelajaranmu.
                  </p>

                  <Link
                    href="/login"
                    className="mt-8 inline-flex rounded-full bg-[#ACFF64] px-12 py-4 text-base font-black uppercase tracking-wide text-black transition hover:-translate-y-1 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white active:scale-95 sm:px-14 sm:py-5 sm:text-lg"
                  >
                    Masuk ke LMS
                  </Link>

                  <p className="mt-8 text-sm text-white/45">
                    Belum punya akun? Hubungi admin atau wali kelas di
                    sekolahmu.
                  </p>
                </Reveal>
              </div>

              <footer className="border-t border-white/10 px-6 pb-7 pt-5">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 font-bold text-white">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ACFF64] text-sm font-black text-black">
                      N
                    </span>
                    LMS Ney
                  </div>
                  <p>© 2026 LMS Ney. All rights reserved.</p>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateX(80px);
          transition: opacity 0.9s cubic-bezier(0.2, 0.8, 0.2, 1),
            transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .reveal-in {
          opacity: 1;
          transform: none;
        }

        .hero-word {
          animation: wordIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .scroll-cue {
          animation: cue 2s ease-in-out infinite;
        }

        @keyframes wordIn {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cue {
          0%,
          100% {
            opacity: 0.5;
            transform: translate(-50%, 0);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, 6px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </main>
  );
}