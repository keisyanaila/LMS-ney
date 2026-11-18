
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
    description: "Kelola akun admin, kepala sekolah, kurikulum, guru, dan murid.",
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
    href: "/admin/kelas",
    label: "Kelas",
    description: "Kelola kelas, wali kelas, dan lihat daftar murid di setiap kelas.",
  },
  {
    href: "/admin/ekspor",
    label: "Ekspor Data",
    description: "Unduh data LMS dalam format CSV yang bisa dibuka di Excel.",
  },
  {
    href: "/admin/log",
    label: "Log Aktivitas",
    description: "Riwayat aktivitas pengguna di sistem.",
  },
  {
    href: "/admin/tahun-ajaran",
    label: "Tahun Ajaran",
    description: "Kelola tahun ajaran dan tentukan tahun ajaran yang sedang aktif.",
  },
  {
    href: "/admin/backup",
    label: "Backup & Pemulihan",
    description: "Cadangkan dan pulihkan data LMS.",
  },
];

export function getNavItem(href: string): AdminNavItem {
  const item = adminNav.find((nav) => nav.href === href);

  if (!item) {
    throw new Error(`Menu admin tidak ditemukan: ${href}`);
  }

  return item;
}

export type CollectionKey =
  | "users"
  | "teachers"
  | "students"
  | "majors"
  | "classes"
  | "logs";
