export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
};

export const adminNav: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Ringkasan data dan aktivitas terbaru LMS.",
  },
  {
    href: "/admin/akun",
    label: "Manajemen Akun",
    description: "Kelola akun pengguna: admin, guru, dan murid.",
  },
  {
    href: "/admin/role",
    label: "Role & Izin",
    description: "Atur role pengguna dan hak akses tiap fitur.",
  },
  {
    href: "/admin/guru",
    label: "Data Guru",
    description: "Daftar guru beserta mata pelajaran yang diampu.",
  },
  {
    href: "/admin/murid",
    label: "Data Murid",
    description: "Daftar murid beserta kelas dan jurusannya.",
  },
  {
    href: "/admin/jurusan-kelas",
    label: "Jurusan & Kelas",
    description: "Kelola jurusan dan rombongan belajar.",
  },
  {
    href: "/admin/impor-ekspor",
    label: "Impor/Ekspor Data",
    description: "Impor data massal atau ekspor data ke CSV.",
  },
  {
    href: "/admin/log",
    label: "Log Aktivitas",
    description: "Riwayat aktivitas pengguna di sistem.",
  },
  {
    href: "/admin/konfigurasi",
    label: "Konfigurasi Sistem",
    description: "Pengaturan umum sekolah dan sistem LMS.",
  },
  {
    href: "/admin/backup",
    label: "Backup & Pemulihan",
    description: "Cadangkan dan pulihkan data LMS.",
  },
  {
    href: "/admin/profil",
    label: "Profil Saya",
    description: "Kelola informasi akun admin dan kata sandi.",
  },
];

export function getNavItem(href: string): AdminNavItem {
  const item = adminNav.find((nav) => nav.href === href);
  if (!item) throw new Error(`Menu admin tidak ditemukan: ${href}`);
  return item;
}

// Koleksi MongoDB yang dipakai panel admin
export const collections = {
  users: "users",
  teachers: "teachers",
  students: "students",
  majors: "majors",
  classes: "classes",
  logs: "activity_logs",
} as const;

export type CollectionKey = keyof typeof collections;
