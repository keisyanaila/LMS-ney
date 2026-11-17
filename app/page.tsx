"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Login berhasil! (Simulasi)");
    }, 1500);
  };

  return (
    // FULL SCREEN - Menggunakan Cream Terang sebagai base
    <main className="min-h-[100dvh] w-full bg-[#FDFBF7] flex flex-col lg:flex-row font-sans selection:bg-[#351F39] selection:text-[#FDFBF7] overflow-hidden">
      
      {/* =====================================================
          BAGIAN KIRI - VISUAL ELEGAN (Desktop Only)
      ===================================================== */}
      <div className="hidden lg:flex w-5/12 relative bg-[#351F39] overflow-hidden flex-col justify-between p-16 xl:p-20">
        
        {/* Ornamen Abstrak Elegan (Soft Glow dari palet sebelumnya) */}
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#726A95] opacity-30 blur-[90px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[#709FB0] opacity-20 blur-[80px]" />
        
        {/* Garis Tipis Elegan (Muted Gold / Cream transparan) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#FDFBF7]/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#FDFBF7]/5 rounded-full" />

        {/* Logo Atas */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#A0C1B8] rounded-xl flex items-center justify-center text-[#351F39] font-black text-xl shadow-lg">
            N
          </div>
          <span className="text-[#FDFBF7] font-bold tracking-[0.2em] text-sm uppercase">LMS Ney</span>
        </div>

        {/* Tipografi Utama */}
        <div className="relative z-10 mb-12">
          <h1 className="text-5xl xl:text-6xl font-bold text-[#FDFBF7] leading-[1.1] tracking-tight">
            Ruang <br />
            <span className="text-[#A0C1B8] italic font-serif">Eksplorasi</span> <br />
            Tanpa Batas.
          </h1>
          <p className="mt-6 text-[#FDFBF7]/60 max-w-sm text-sm leading-relaxed font-medium">
            Satu platform terintegrasi untuk mengelola kelas, tugas, dan perkembangan belajarmu. Fokus, tenang, dan terorganisir.
          </p>
        </div>

        {/* Footer Kiri */}
        <div className="relative z-10 flex justify-between items-end border-t border-[#FDFBF7]/10 pt-6">
          <p className="text-[10px] font-mono text-[#FDFBF7]/40 uppercase tracking-widest">Vol. 01 / 2026</p>
          <p className="text-[10px] font-mono text-[#FDFBF7]/40 uppercase tracking-widest">Ney Studio</p>
        </div>
      </div>

      {/* =====================================================
          BAGIAN KANAN - FORM MINIMALIS (Mobile & Desktop)
      ===================================================== */}
      <div className="w-full lg:w-7/12 relative flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-[#FDFBF7]">
        
        {/* Garis vertikal estetik di background */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-[#351F39]/10 hidden lg:block" />

        <div className="w-full max-w-md">
          
          {/* Header Form */}
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#351F39] mb-3 tracking-tight">
              Selamat Datang.
            </h2>
            <p className="text-[#351F39]/60 text-sm font-medium">
              Silakan masuk menggunakan akun sekolah Anda.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            
            {/* Input Email */}
            <div className="relative group">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#351F39]/60 mb-2 group-focus-within:text-[#351F39] transition-colors">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@sekolah.sch.id"
                className="w-full bg-[#FDFBF7] border-2 border-[#351F39]/15 rounded-xl py-3.5 px-4 text-[#351F39] placeholder-[#351F39]/30 focus:outline-none focus:border-[#351F39] focus:bg-white transition-all duration-300 font-medium"
              />
            </div>

            {/* Input Password */}
            <div className="relative group">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#351F39]/60 mb-2 group-focus-within:text-[#351F39] transition-colors">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#FDFBF7] border-2 border-[#351F39]/15 rounded-xl py-3.5 px-4 text-[#351F39] placeholder-[#351F39]/30 focus:outline-none focus:border-[#351F39] focus:bg-white transition-all duration-300 font-medium"
              />
            </div>

            {/* Lupa Sandi & Ingat Saya */}
            <div className="flex justify-between items-center pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-4 h-4 border-2 border-[#351F39]/20 rounded-sm peer-checked:bg-[#351F39] peer-checked:border-[#351F39] transition-all" />
                </div>
                <span className="text-xs font-bold text-[#351F39]/60 group-hover:text-[#351F39] transition-colors">Ingat Saya</span>
              </label>
              <Link href="#" className="text-xs font-bold text-[#351F39]/60 hover:text-[#351F39] transition-colors">
                Lupa Sandi?
              </Link>
            </div>

            {/* Tombol Utama */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full relative overflow-hidden rounded-xl bg-[#351F39] px-8 py-4 font-bold uppercase tracking-[0.15em] text-[#FDFBF7] text-sm transition-all duration-300 hover:bg-[#726A95] hover:shadow-[0_10px_30px_-10px_rgba(53,31,57,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed ${
                isLoading ? "animate-pulse" : ""
              }`}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Footer Form */}
          <div className="mt-12 text-center lg:text-left">
            <p className="text-sm text-[#351F39]/50 font-medium">
              Belum punya akun?{" "}
              <Link href="#" className="font-bold text-[#351F39] hover:text-[#351F39] transition-colors border-b border-[#351F39] hover:border-[#351F39] pb-0.5">
                Hubungi Admin
              </Link>
            </p>
          </div>

          {/* Mobile Branding (Hanya muncul di HP) */}
          <div className="mt-16 lg:hidden text-center border-t border-[#351F39]/10 pt-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-[#351F39] rounded-md flex items-center justify-center text-[#FDFBF7] font-black text-sm">N</div>
              <span className="text-[#351F39] font-bold tracking-widest text-xs uppercase">LMS Ney</span>
            </div>
            <p className="text-[10px] font-mono text-[#351F39]/40 uppercase tracking-widest">© 2026 Ney Studio</p>
          </div>

        </div>
      </div>

    </main>
  );
}