"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const words = ["Dikenal.", "Didukung.", "Berkembang."];

const features = [
  {
    title: "Kelas & Materi",
    short: "Semua materi dalam satu tempat.",
    description:
      "Temukan materi, kelas, modul, dan aktivitas pembelajaran dengan tampilan yang lebih terstruktur.",
    icon: "📚",
    number: "01",
  },
  {
    title: "Tugas & Quiz",
    short: "Kerjakan tugas tanpa ribet.",
    description:
      "Kerjakan tugas dan quiz langsung dari LMS dengan proses yang sederhana dan praktis.",
    icon: "✏️",
    number: "02",
  },
  {
    title: "Nilai & Perkembangan",
    short: "Pantau perkembangan belajar.",
    description:
      "Lihat hasil belajar, nilai, dan perkembanganmu melalui informasi yang mudah dipahami.",
    icon: "📊",
    number: "03",
  },
  {
    title: "Kolaborasi",
    short: "Belajar bersama secara digital.",
    description:
      "Guru dan siswa dapat berinteraksi dan berkolaborasi dalam proses pembelajaran.",
    icon: "🤝",
    number: "04",
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

const PANEL =
  "h-[100dvh] w-[var(--pw,100vw)] shrink-0 overflow-hidden";

export default function Home() {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const maxRef = useRef(0);
  const rafRef = useRef(0);

  const [outerHeight, setOuterHeight] = useState<number | null>(
    null
  );

  const [scrollProgress, setScrollProgress] = useState(0);

  const [wordIndex, setWordIndex] = useState(0);

  const [activeFeature, setActiveFeature] = useState(0);

  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
  });

  /* =====================================================
     HERO WORD
  ===================================================== */

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((current) => (current + 1) % words.length);
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  /* =====================================================
     VIDEO
  ===================================================== */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  /* =====================================================
     SCROLL ENGINE
  ===================================================== */

  useEffect(() => {
    const update = () => {
      rafRef.current = 0;

      const outer = outerRef.current;
      const track = trackRef.current;

      if (!outer || !track) return;

      const max = maxRef.current;

      const p =
        max > 0
          ? Math.min(
              Math.max(
                -outer.getBoundingClientRect().top,
                0
              ),
              max
            ) / max
          : 0;

      setScrollProgress(p);

      const position = p * max;

      track.style.transform = `
        translate3d(${-position}px, 0, 0)
      `;

      if (barRef.current) {
        barRef.current.style.transform =
          `scaleX(${p})`;
      }
    };

    const requestUpdate = () => {
      if (!rafRef.current) {
        rafRef.current =
          requestAnimationFrame(update);
      }
    };

    const measure = () => {
      const track = trackRef.current;
      const sticky = stickyRef.current;

      if (!track || !sticky) return;

      track.style.setProperty(
        "--pw",
        `${sticky.clientWidth}px`
      );

      const max = Math.max(
        0,
        track.scrollWidth -
          sticky.clientWidth
      );

      maxRef.current = max;

      setOuterHeight(
        max + window.innerHeight
      );

      update();
    };

    measure();

    window.addEventListener(
      "scroll",
      requestUpdate,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      measure
    );

    const resizeObserver =
      new ResizeObserver(measure);

    resizeObserver.observe(trackRef.current!);

    return () => {
      window.removeEventListener(
        "scroll",
        requestUpdate
      );

      window.removeEventListener(
        "resize",
        measure
      );

      resizeObserver.disconnect();

      cancelAnimationFrame(
        rafRef.current
      );
    };
  }, []);

  /* =====================================================
     AUTOMATIC FEATURE FROM SCROLL
  ===================================================== */

  useEffect(() => {
    const featureProgress = Math.max(
      0,
      Math.min(
        0.999,
        (scrollProgress - 0.25) / 0.25
      )
    );

    const calculated =
      Math.floor(
        featureProgress *
          features.length
      );

    if (
      featureProgress > 0 &&
      calculated >= 0 &&
      calculated < features.length
    ) {
      setActiveFeature(calculated);
    }
  }, [scrollProgress]);

  /* =====================================================
     FEATURE NAVIGATION
  ===================================================== */

  const nextFeature = () => {
    setActiveFeature(
      (current) =>
        (current + 1) %
        features.length
    );
  };

  const previousFeature = () => {
    setActiveFeature(
      (current) =>
        (current - 1 + features.length) %
        features.length
    );
  };

  /* =====================================================
     MOUSE 3D
  ===================================================== */

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) /
        rect.width -
        0.5) *
      2;

    const y =
      ((event.clientY - rect.top) /
        rect.height -
        0.5) *
      2;

    setMouse({ x, y });
  };

  const handleMouseLeave = () => {
    setMouse({
      x: 0,
      y: 0,
    });
  };

  /* =====================================================
     PROGRESS
  ===================================================== */

  const heroProgress = Math.min(
    1,
    scrollProgress * 4
  );

  const featureProgress = Math.max(
    0,
    Math.min(
      1,
      (scrollProgress - 0.25) * 4
    )
  );

  const stepProgress = Math.max(
    0,
    Math.min(
      1,
      (scrollProgress - 0.5) * 4
    )
  );

  const loginProgress = Math.max(
    0,
    Math.min(
      1,
      (scrollProgress - 0.75) * 4
    )
  );

  const selected =
    features[activeFeature];

  return (
    <main className="overflow-x-clip bg-[#F8FAFC] text-[#0F172A]">

      {/* =================================================
          PROGRESS BAR
      ================================================= */}

      <div className="fixed bottom-0 left-0 right-0 z-[100] h-1 bg-black/10">

        <div
          ref={barRef}
          className="h-full origin-left bg-[#2563EB]"
        />

      </div>


      {/* =================================================
          SCROLL CONTAINER
      ================================================= */}

      <div
        ref={outerRef}
        style={{
          height:
            outerHeight ?? "400vh",
        }}
        className="relative"
      >

        <div
          ref={stickyRef}
          className="sticky top-0 h-[100dvh] overflow-hidden"
        >

          <div
            ref={trackRef}
            className="flex h-full w-max will-change-transform"
          >

            {/* =================================================
                PAGE 1 — HERO
            ================================================= */}

            <section
              className={`
                ${PANEL}
                relative
                flex
                items-center
                justify-center
                bg-black
                px-6
                text-center
                text-white
              `}
            >

              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                <source
                  src="/hero.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="absolute inset-0 bg-black/60" />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />


              <div
                className="relative z-10 mx-auto max-w-5xl"
                style={{
                  opacity:
                    1 -
                    heroProgress * 0.8,

                  transform:
                    `translateY(${
                      heroProgress * -100
                    }px)`,
                }}
              >

                <div
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB] text-2xl font-black shadow-[0_0_70px_rgba(37,99,235,0.6)]"
                  style={{
                    transform:
                      `rotate(${
                        heroProgress * 180
                      }deg)`,
                  }}
                >
                  N
                </div>

                <p className="text-base italic text-white/70 sm:text-xl">
                  Kami percaya setiap siswa layak
                </p>

                <h1
                  key={wordIndex}
                  className="hero-word mt-3 text-[clamp(2.25rem,11vw,7.5rem)] font-black uppercase leading-none tracking-tight text-[#60A5FA]"
                >
                  {words[wordIndex]}
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-white/70 sm:text-lg">
                  LMS Ney adalah satu platform
                  untuk mengelola kelas, materi,
                  tugas, quiz, dan perkembangan
                  belajar secara lebih sederhana.
                </p>

                <Link
                  href="/login"
                  className="mt-8 inline-flex rounded-full bg-[#2563EB] px-12 py-4 font-black uppercase text-white shadow-[0_20px_70px_rgba(37,99,235,0.4)] transition-all duration-300 hover:-translate-y-2 hover:bg-[#60A5FA] hover:text-black"
                >
                  Masuk
                </Link>

              </div>


              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-white/50">
                Scroll ↓
              </div>

            </section>


            {/* =================================================
                PAGE 2 — SUPER INTERACTIVE FEATURES
            ================================================= */}

            <section
              className={`
                ${PANEL}
                relative
                flex
                items-center
                overflow-hidden
                bg-[#EFF6FF]
              `}
            >

              {/* BACKGROUND BLOBS */}

              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] rounded-full bg-[#2563EB]/10 blur-3xl"
                style={{
                  transform:
                    `translate(-50%, -50%) scale(${
                      0.8 +
                      featureProgress *
                        0.5
                    })`,
                }}
              />

              <div
                className="pointer-events-none absolute right-[-10%] top-[-20%] h-[400px] w-[400px] rounded-full bg-[#60A5FA]/20 blur-3xl"
              />


              <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12">

                {/* TOP */}

                <div className="flex items-end justify-between gap-5">

                  <div
                    style={{
                      opacity:
                        featureProgress,

                      transform:
                        `translateY(${
                          80 -
                          featureProgress *
                            80
                        }px)`,
                    }}
                  >

                    <p className="text-sm italic text-[#2563EB] sm:text-lg">
                      Fitur LMS Ney
                    </p>

                    <h2 className="mt-2 max-w-3xl text-[clamp(1.75rem,6vw,4rem)] font-black uppercase leading-[0.95] tracking-tight">
                      Semua kebutuhan
                      <br />
                      belajar.
                    </h2>

                  </div>


                  {/* FEATURE NUMBER */}

                  <div className="hidden items-center gap-3 sm:flex">

                    <span className="font-mono text-sm text-black/40">
                      FEATURE
                    </span>

                    <span className="text-4xl font-black text-[#2563EB]">
                      {selected.number}
                    </span>

                    <span className="text-black/20">
                      /
                    </span>

                    <span className="font-mono text-sm text-black/40">
                      04
                    </span>

                  </div>

                </div>


                {/* =================================================
                    MAIN INTERACTIVE AREA
                ================================================= */}

                <div className="mt-7 grid items-center gap-6 lg:grid-cols-[0.8fr_1.6fr_0.8fr]">

                  {/* LEFT NAV */}

                  <div className="hidden lg:block">

                    <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-black/30">
                      Explore
                    </p>

                    <div className="space-y-2">

                      {features.map(
                        (feature, index) => (
                          <button
                            key={feature.number}
                            onClick={() =>
                              setActiveFeature(
                                index
                              )
                            }
                            className={`
                              group
                              flex
                              w-full
                              items-center
                              gap-4
                              rounded-xl
                              p-3
                              text-left
                              transition-all
                              duration-300

                              ${
                                activeFeature ===
                                index
                                  ? "bg-white shadow-lg"
                                  : "hover:bg-white/60"
                              }
                            `}
                          >

                            <span
                              className={`
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                text-xs
                                font-black
                                transition-all
                                ${
                                  activeFeature ===
                                  index
                                    ? "bg-[#2563EB] text-white"
                                    : "bg-black/5 text-black/40"
                                }
                              `}
                            >
                              {feature.number}
                            </span>

                            <span
                              className={`
                                text-sm
                                font-black
                                uppercase
                                transition-all
                                ${
                                  activeFeature ===
                                  index
                                    ? "text-[#2563EB]"
                                    : "text-black/40"
                                }
                              `}
                            >
                              {feature.title}
                            </span>

                          </button>
                        )
                      )}

                    </div>

                  </div>


                  {/* =================================================
                      CENTER 3D CARD
                  ================================================= */}

                  <div
                    className="relative mx-auto w-full max-w-[520px]"
                    onMouseMove={
                      handleMouseMove
                    }
                    onMouseLeave={
                      handleMouseLeave
                    }
                  >

                    {/* GLOW */}

                    <div
                      className="absolute inset-8 rounded-[3rem] bg-[#2563EB]/30 blur-3xl"
                      style={{
                        transform:
                          `scale(${
                            0.8 +
                            featureProgress *
                              0.3
                          })`,
                      }}
                    />


                    {/* CARD */}

                    <div
                      key={activeFeature}
                      className="feature-main-card relative aspect-[1.15/1] overflow-hidden rounded-[2rem] bg-[#2563EB] p-7 text-white shadow-[0_40px_100px_rgba(37,99,235,0.3)] sm:p-10"
                      style={{
                        transform:
                          `perspective(1000px)
                           rotateX(${
                             -mouse.y * 5
                           }deg)
                           rotateY(${
                             mouse.x * 5
                           }deg)
                           translateY(${
                             Math.sin(
                               featureProgress *
                                 Math.PI *
                                 2
                             ) * 5
                           }px)`,
                      }}
                    >

                      {/* GRID */}

                      <div className="pointer-events-none absolute inset-0 opacity-10">

                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
                            backgroundSize:
                              "35px 35px",
                          }}
                        />

                      </div>


                      {/* BIG NUMBER */}

                      <div className="absolute right-5 top-0 text-[10rem] font-black leading-none text-white/10 sm:text-[13rem]">
                        {selected.number}
                      </div>


                      {/* ICON */}

                      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl backdrop-blur-md sm:h-20 sm:w-20 sm:text-5xl">
                        {selected.icon}
                      </div>


                      {/* CONTENT */}

                      <div className="relative z-10 mt-10 sm:mt-12">

                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/50">
                          LMS Ney Feature
                        </p>

                        <h3 className="mt-2 text-3xl font-black uppercase leading-none sm:text-5xl">
                          {selected.title}
                        </h3>

                        <p className="mt-4 max-w-md text-sm leading-6 text-white/70 sm:text-base">
                          {selected.description}
                        </p>

                      </div>


                      {/* BOTTOM */}

                      <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between sm:bottom-10 sm:left-10 sm:right-10">

                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                          {selected.short}
                        </span>

                        <div className="flex gap-1">

                          {features.map(
                            (_, index) => (
                              <span
                                key={index}
                                className={`
                                  h-1.5
                                  rounded-full
                                  transition-all
                                  duration-500
                                  ${
                                    index ===
                                    activeFeature
                                      ? "w-8 bg-white"
                                      : "w-1.5 bg-white/30"
                                  }
                                `}
                              />
                            )
                          )}

                        </div>

                      </div>

                    </div>


                    {/* CARD SHADOW */}

                    <div
                      className="absolute -bottom-4 left-10 right-10 -z-10 h-10 rounded-full bg-[#2563EB]/30 blur-2xl"
                    />

                  </div>


                  {/* RIGHT INFO */}

                  <div className="hidden lg:block">

                    <div
                      key={activeFeature}
                      className="feature-info"
                    >

                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB] text-2xl shadow-lg shadow-blue-500/20">
                        {selected.icon}
                      </div>

                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563EB]">
                        0{activeFeature + 1}
                      </p>

                      <h3 className="mt-2 text-2xl font-black uppercase leading-tight">
                        {selected.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-black/50">
                        {selected.description}
                      </p>


                      {/* PROGRESS */}

                      <div className="mt-7">

                        <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-black/30">

                          <span>
                            Progress
                          </span>

                          <span>
                            {Math.round(
                              ((activeFeature +
                                1) /
                                features.length) *
                                100
                            )}
                            %
                          </span>

                        </div>

                        <div className="h-1 overflow-hidden rounded-full bg-black/10">

                          <div
                            className="h-full bg-[#2563EB] transition-all duration-500"
                            style={{
                              width:
                                `${
                                  ((activeFeature +
                                    1) /
                                    features.length) *
                                  100
                                }%`,
                            }}
                          />

                        </div>

                      </div>

                    </div>

                  </div>

                </div>


                {/* =================================================
                    MOBILE NAV
                ================================================= */}

                <div className="mt-5 flex items-center justify-between lg:hidden">

                  <button
                    onClick={
                      previousFeature
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-[#2563EB] hover:text-white"
                  >
                    ←
                  </button>


                  <div className="flex gap-2">

                    {features.map(
                      (_, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            setActiveFeature(
                              index
                            )
                          }
                          className={`
                            h-2
                            rounded-full
                            transition-all
                            ${
                              activeFeature ===
                              index
                                ? "w-8 bg-[#2563EB]"
                                : "w-2 bg-black/20"
                            }
                          `}
                        />
                      )
                    )}

                  </div>


                  <button
                    onClick={
                      nextFeature
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-md transition hover:bg-[#1D4ED8]"
                  >
                    →
                  </button>

                </div>


                {/* SCROLL HINT */}

                <div className="mt-5 hidden items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 lg:flex">

                  <span>
                    Scroll untuk menjelajah fitur
                  </span>

                  <span className="h-px w-16 bg-black/10" />

                  <span>
                    {activeFeature + 1} / 4
                  </span>

                </div>

              </div>

            </section>


            {/* =================================================
                PAGE 3 — STEPS
            ================================================= */}

            <section
              className={`
                ${PANEL}
                flex
                items-center
                bg-white
              `}
            >

              <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">

                <div
                  style={{
                    opacity:
                      stepProgress,
                    transform:
                      `translateX(${
                        -100 +
                        stepProgress *
                          100
                      }px)`,
                  }}
                >

                  <p className="text-sm italic text-[#2563EB] sm:text-lg">
                    Cara kerja
                  </p>

                  <h2 className="mt-2 max-w-3xl text-[clamp(1.75rem,7vw,3.5rem)] font-black uppercase leading-[0.98]">
                    Mulai dalam
                    <br />
                    empat langkah
                  </h2>

                </div>


                <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">

                  {steps.map(
                    (step, index) => {

                      const progress =
                        Math.max(
                          0,
                          Math.min(
                            1,
                            (stepProgress -
                              index *
                                0.15) /
                              0.5
                          )
                        );

                      return (
                        <div
                          key={step.number}
                          style={{
                            opacity:
                              progress,
                            transform:
                              `translateY(${
                                100 -
                                progress *
                                  100
                              }px)`,
                          }}
                        >

                          <div className="group border-t-2 border-black pt-5 transition hover:border-[#2563EB]">

                            <div className="flex justify-between">

                              <span className="font-mono text-sm text-black/30">
                                {step.number}
                              </span>

                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB]/10 text-xl transition duration-500 group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white">
                                {step.icon}
                              </span>

                            </div>

                            <h3 className="mt-6 text-xl font-black uppercase">
                              {step.title}
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-black/50">
                              {step.description}
                            </p>

                            <div className="mt-5 h-1 rounded-full bg-black/10">

                              <div
                                className="h-full rounded-full bg-[#2563EB]"
                                style={{
                                  width:
                                    `${progress * 100}%`,
                                }}
                              />

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>

            </section>


            {/* =================================================
                PAGE 4 — LOGIN
            ================================================= */}

            <section
              className={`
                ${PANEL}
                flex
                flex-col
                bg-[#020617]
                text-white
              `}
            >

              <div className="flex flex-1 items-center justify-center px-6 text-center">

                <div
                  className="max-w-4xl"
                  style={{
                    opacity:
                      loginProgress,
                    transform:
                      `translateY(${
                        100 -
                        loginProgress *
                          100
                      }px) scale(${
                        0.85 +
                        loginProgress *
                          0.15
                      })`,
                  }}
                >

                  <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB] text-2xl font-black shadow-[0_0_80px_rgba(37,99,235,0.6)]">
                    N
                  </div>

                  <p className="text-[#60A5FA]">
                    Siap untuk mulai belajar?
                  </p>

                  <h2 className="mt-2 text-[clamp(3rem,13vw,6rem)] font-black uppercase leading-none">
                    Masuk
                  </h2>

                  <p className="mx-auto mt-5 max-w-xl text-white/50">
                    Akses seluruh kelas,
                    materi, tugas, serta
                    aktivitas pembelajaranmu.
                  </p>

                  <Link
                    href="/login"
                    className="mt-8 inline-flex rounded-full bg-[#2563EB] px-12 py-4 font-black uppercase text-white shadow-[0_20px_70px_rgba(37,99,235,0.4)] transition-all duration-300 hover:-translate-y-2 hover:bg-[#60A5FA] hover:text-black"
                  >
                    Masuk ke LMS
                  </Link>

                  <p className="mt-8 text-sm text-white/30">
                    Belum punya akun?
                    <br />
                    Hubungi admin atau wali kelas.
                  </p>

                </div>

              </div>


              <footer className="border-t border-white/10 px-6 py-6">

                <div className="mx-auto flex max-w-7xl justify-between text-sm text-white/30">

                  <span className="font-bold text-white">
                    LMS Ney
                  </span>

                  <span>
                    © 2026 LMS Ney
                  </span>

                </div>

              </footer>

            </section>

          </div>

        </div>

      </div>


      {/* =================================================
          CSS
      ================================================= */}

      <style jsx global>{`

        * {
          scroll-behavior: smooth;
        }

        .hero-word {
          animation:
            heroWord
            0.7s
            cubic-bezier(.2,.8,.2,1)
            both;
        }

        .feature-main-card {
          animation:
            featureCardIn
            0.55s
            cubic-bezier(.2,.8,.2,1)
            both;
        }

        .feature-info {
          animation:
            featureInfoIn
            0.45s
            cubic-bezier(.2,.8,.2,1)
            both;
        }

        @keyframes heroWord {

          from {
            opacity: 0;
            transform:
              translateY(40px)
              scale(.9);
            filter: blur(8px);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
            filter: blur(0);
          }

        }

        @keyframes featureCardIn {

          from {
            opacity: 0;
            transform:
              scale(.85)
              rotateX(10deg)
              translateY(50px);
            filter: blur(8px);
          }

          to {
            opacity: 1;
            transform:
              scale(1)
              rotateX(0)
              translateY(0);
            filter: blur(0);
          }

        }

        @keyframes featureInfoIn {

          from {
            opacity: 0;
            transform:
              translateX(30px);
          }

          to {
            opacity: 1;
            transform:
              translateX(0);
          }

        }

        @media (prefers-reduced-motion: reduce) {

          *,
          *::before,
          *::after {
            animation: none !important;
            transition: none !important;
          }

        }

      `}</style>

    </main>
  );
}
