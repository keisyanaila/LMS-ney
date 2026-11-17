// Konfigurasi akun yang dipakai bersama oleh server dan client.
// Jangan mengimpor modul server (db, bcrypt, exceljs) di file ini.

export type AccountRole =
  | "murid"
  | "guru"
  | "kurikulum"
  | "kepala_sekolah"
  | "admin";

export const ACCOUNT_ROLES: AccountRole[] = [
  "murid",
  "guru",
  "kurikulum",
  "kepala_sekolah",
  "admin",
];

export const ROLE_LABELS: Record<AccountRole, string> = {
  murid: "Murid",
  guru: "Guru",
  kurikulum: "Kurikulum",
  kepala_sekolah: "Kepala Sekolah",
  admin: "Admin",
};

export const ROLE_HINTS: Record<AccountRole, string> = {
  murid: "Siswa yang belajar di kelas.",
  guru: "Pengajar mata pelajaran.",
  kurikulum: "Wakil kepala atau staf bidang kurikulum.",
  kepala_sekolah: "Pimpinan sekolah.",
  admin: "Pengelola sistem LMS.",
};

export function isAccountRole(value: string): value is AccountRole {
  return (ACCOUNT_ROLES as string[]).includes(value);
}

export type AccountFieldKey =
  | "fullName"
  | "username"
  | "email"
  | "studentNumber"
  | "className"
  | "academicYear"
  | "teacherNumber"
  | "subject"
  | "phone";

export type AccountField = {
  key: AccountFieldKey;
  /** Judul kolom di file Excel */
  header: string;
  /** Label di form */
  label: string;
  required: boolean;
  example: string;
  note: string;
  /** Nama kolom lain yang tetap dikenali saat impor */
  aliases?: string[];
  input?: "text" | "email" | "class";
  /** Kolom diformat teks di Excel agar angka 0 di depan tidak hilang */
  textFormat?: boolean;
  maxLength?: number;
};

export const FIELDS: Record<AccountFieldKey, AccountField> = {
  fullName: {
    key: "fullName",
    header: "nama_lengkap",
    label: "Nama lengkap",
    required: true,
    example: "Budi Santoso",
    note: "Sesuai data resmi.",
    aliases: ["nama", "nama_murid", "nama_siswa", "nama_guru"],
    maxLength: 150,
  },
  username: {
    key: "username",
    header: "username",
    label: "Username",
    required: true,
    example: "budi.santoso",
    note: "Untuk login. Huruf kecil, angka, titik, strip; 3-50 karakter. Tidak boleh sama dengan akun lain.",
    maxLength: 50,
  },
  email: {
    key: "email",
    header: "email",
    label: "Email",
    required: true,
    example: "budi@sekolah.sch.id",
    note: "Tidak boleh sama dengan akun lain.",
    input: "email",
    maxLength: 150,
  },
  studentNumber: {
    key: "studentNumber",
    header: "nis",
    label: "NIS",
    required: true,
    example: "261001",
    note: "Tidak boleh sama dengan murid lain. Dipakai sebagai username login murid.",
    aliases: ["nomor_induk", "no_induk"],
    textFormat: true,
    maxLength: 50,
  },
  className: {
    key: "className",
    header: "kelas",
    label: "Kelas",
    required: true,
    example: "X PPLG 1",
    note: "Harus sama dengan nama kelas di menu Jurusan & Kelas.",
    aliases: ["rombel", "nama_kelas"],
    input: "class",
  },
  academicYear: {
    key: "academicYear",
    header: "tahun_ajaran",
    label: "Tahun ajaran",
    required: true,
    example: "2026/2027",
    note: "Format AAAA/AAAA, contoh 2026/2027.",
    aliases: ["tahun_pelajaran", "angkatan"],
    textFormat: true,
    maxLength: 20,
  },
  teacherNumber: {
    key: "teacherNumber",
    header: "nip_nuptk",
    label: "NIP / NUPTK",
    required: false,
    example: "198501012010011001",
    note: "Boleh kosong. Tidak boleh sama dengan guru lain.",
    aliases: ["nip", "nuptk"],
    textFormat: true,
    maxLength: 50,
  },
  subject: {
    key: "subject",
    header: "mata_pelajaran",
    label: "Mata pelajaran",
    required: true,
    example: "Matematika",
    note: "Jika lebih dari satu, pisahkan dengan koma.",
    aliases: ["mapel"],
    maxLength: 150,
  },
  phone: {
    key: "phone",
    header: "no_hp",
    label: "No. HP",
    required: false,
    example: "081234567890",
    note: "Boleh kosong. Hanya angka.",
    aliases: ["hp", "telepon", "no_telepon"],
    textFormat: true,
    maxLength: 30,
  },
};

/** Kolom untuk membuat akun baru (form tambah dan template Excel). */
export const CREATE_KEYS: Record<AccountRole, AccountFieldKey[]> = {
  murid: ["fullName", "studentNumber", "className", "academicYear"],
  guru: ["fullName", "username", "email", "teacherNumber", "subject", "phone"],
  kurikulum: ["fullName", "username", "email"],
  kepala_sekolah: ["fullName", "username", "email"],
  admin: ["fullName", "username", "email"],
};

/** Kolom di form edit. Murid tetap bisa diubah username dan emailnya. */
export const EDIT_KEYS: Record<AccountRole, AccountFieldKey[]> = {
  murid: [
    "fullName",
    "username",
    "email",
    "studentNumber",
    "className",
    "academicYear",
  ],
  guru: ["fullName", "username", "email", "teacherNumber", "subject", "phone"],
  kurikulum: ["fullName", "username", "email"],
  kepala_sekolah: ["fullName", "username", "email"],
  admin: ["fullName", "username", "email"],
};

export const MAX_IMPORT_ROWS = 300;
export const MAX_IMPORT_BYTES = 1024 * 1024; // 1 MB, batas bawaan Server Actions

/** Tahun ajaran berjalan: Juli-Desember = tahun/tahun+1, Januari-Juni = tahun-1/tahun. */
export function currentAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  const start = date.getMonth() >= 6 ? year : year - 1;
  return `${start}/${start + 1}`;
}

// ---------- Tipe hasil aksi (dipakai server action dan komponen client) ----------

export type CreatedAccount = {
  rowNumber: number;
  fullName: string;
  username: string;
  password: string;
  role: AccountRole;
};

export type RowIssue = { rowNumber: number; message: string };

export type CreateState = {
  ok: boolean;
  message: string;
  created?: CreatedAccount[];
} | null;

export type SimpleResult = {
  ok: boolean;
  message: string;
  password?: string;
};

export type UpdateState = { ok: boolean; message: string } | null;

export type ImportState = {
  ok: boolean;
  stage: "preview" | "committed";
  message: string;
  total: number;
  ready: number;
  issues: RowIssue[];
  previewRows?: {
    rowNumber: number;
    fullName: string;
    username: string;
    detail: string;
  }[];
  created?: CreatedAccount[];
} | null;
