import { hash } from "bcryptjs";
import { inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { classes, students, teachers, users } from "@/lib/schema";
import { generatePassword } from "@/lib/passwords";
import {
  CREATE_KEYS,
  EDIT_KEYS,
  FIELDS,
  type AccountFieldKey,
  type AccountRole,
  type CreatedAccount,
  type RowIssue,
} from "@/lib/account-config";

// Cost 10 cukup untuk password acak dan menjaga impor ratusan akun tetap cepat.
const BCRYPT_COST = 10;

export type RowValues = Partial<Record<AccountFieldKey, string>>;
export type RowInput = { rowNumber: number; values: RowValues };

export type PreparedAccount = {
  rowNumber: number;
  role: AccountRole;
  fullName: string;
  username: string;
  email: string;
  studentNumber: string | null;
  classId: number | null;
  className: string | null;
  academicYear: string | null;
  teacherNumber: string | null;
  subject: string | null;
  phone: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9._-]{3,50}$/;
const NIS_RE = /^[A-Za-z0-9._-]{3,50}$/;
const NIP_RE = /^[A-Za-z0-9.-]{3,50}$/;
const PHONE_RE = /^\+?[0-9]{8,20}$/;
const YEAR_RE = /^(\d{4})\/(\d{4})$/;

export type ClassOption = { id: number; name: string };

export function buildClassMap(list: ClassOption[]) {
  return new Map(list.map((item) => [item.name.trim().toLowerCase(), item]));
}

/**
 * Memeriksa dan merapikan satu baris data akun.
 * mode "create": murid hanya mengisi NIS, username dan email dibuat otomatis.
 * mode "edit": semua kolom di EDIT_KEYS dipakai apa adanya.
 */
export function normalizeRow(
  role: AccountRole,
  values: RowValues,
  rowNumber: number,
  classMap: Map<string, ClassOption>,
  mode: "create" | "edit" = "create"
): { data: PreparedAccount | null; problems: string[] } {
  const keys = mode === "create" ? CREATE_KEYS[role] : EDIT_KEYS[role];
  const problems: string[] = [];
  const get = (key: AccountFieldKey) => (values[key] ?? "").trim();

  for (const key of keys) {
    const field = FIELDS[key];
    const value = get(key);

    if (field.required && !value) {
      problems.push(`${field.label} wajib diisi`);
    } else if (field.maxLength && value.length > field.maxLength) {
      problems.push(`${field.label} maksimal ${field.maxLength} karakter`);
    }
  }

  const fullName = get("fullName");
  let username = get("username").toLowerCase();
  let email = get("email").toLowerCase();

  let studentNumber: string | null = null;
  let classId: number | null = null;
  let className: string | null = null;
  let academicYear: string | null = null;
  let teacherNumber: string | null = null;
  let subject: string | null = null;
  let phone: string | null = null;

  if (role === "murid") {
    studentNumber = get("studentNumber");

    if (studentNumber && !NIS_RE.test(studentNumber)) {
      problems.push("NIS hanya boleh huruf, angka, titik, strip (3-50 karakter)");
    }

    if (mode === "create" && studentNumber) {
      username = studentNumber.toLowerCase();
      email = `${username}@murid.lms.local`;
    }

    const rawClass = get("className");
    if (rawClass) {
      const found = classMap.get(rawClass.toLowerCase());
      if (found) {
        classId = found.id;
        className = found.name;
      } else {
        problems.push(`Kelas "${rawClass}" tidak ada di Jurusan & Kelas`);
      }
    }

    academicYear = get("academicYear");
    const match = YEAR_RE.exec(academicYear);
    if (academicYear && (!match || Number(match[2]) !== Number(match[1]) + 1)) {
      problems.push("Tahun ajaran harus berformat AAAA/AAAA, contoh 2026/2027");
    }
  }

  if (role === "guru") {
    teacherNumber = get("teacherNumber").replace(/\s+/g, "") || null;
    if (teacherNumber && !NIP_RE.test(teacherNumber)) {
      problems.push("NIP/NUPTK hanya boleh huruf, angka, titik, strip (3-50 karakter)");
    }

    subject = get("subject") || null;

    const rawPhone = get("phone").replace(/[\s-]/g, "");
    phone = rawPhone || null;
    if (phone && !PHONE_RE.test(phone)) {
      problems.push("No. HP hanya boleh angka (8-20 digit)");
    }
  }

  // Username murid berasal dari NIS yang sudah diperiksa di atas.
  const derivedUsername = role === "murid" && mode === "create";

  if (username && !derivedUsername && !USERNAME_RE.test(username)) {
    problems.push(
      "Username hanya boleh huruf kecil, angka, titik, strip (3-50 karakter)"
    );
  }

  if (email && !EMAIL_RE.test(email)) {
    problems.push("Format email tidak valid");
  }

  if (problems.length > 0) return { data: null, problems };

  return {
    data: {
      rowNumber,
      role,
      fullName,
      username,
      email,
      studentNumber,
      classId,
      className,
      academicYear,
      teacherNumber,
      subject,
      phone,
    },
    problems,
  };
}

export async function loadClassOptions(): Promise<ClassOption[]> {
  return db.select({ id: classes.id, name: classes.name }).from(classes);
}

/**
 * Memeriksa semua baris (isi, duplikat di dalam file, duplikat di database).
 * Baris yang bermasalah dikembalikan sebagai issues dan tidak ikut dibuat.
 */
export async function prepareAccounts(
  role: AccountRole,
  rows: RowInput[]
): Promise<{ prepared: PreparedAccount[]; issues: RowIssue[] }> {
  const issues: RowIssue[] = [];
  const candidates: PreparedAccount[] = [];

  const classMap =
    role === "murid" ? buildClassMap(await loadClassOptions()) : new Map();

  for (const row of rows) {
    const { data, problems } = normalizeRow(
      role,
      row.values,
      row.rowNumber,
      classMap
    );

    if (data) {
      candidates.push(data);
    } else {
      issues.push({ rowNumber: row.rowNumber, message: problems.join("; ") });
    }
  }

  // Duplikat di dalam file
  const seen = {
    username: new Map<string, number>(),
    email: new Map<string, number>(),
    number: new Map<string, number>(),
  };
  const unique: PreparedAccount[] = [];

  for (const item of candidates) {
    const numberKey = item.studentNumber ?? item.teacherNumber;
    const clash: string[] = [];

    const checks: [Map<string, number>, string | null, string][] = [
      [seen.username, item.username, "Username"],
      [seen.email, item.email, "Email"],
      [seen.number, numberKey, role === "murid" ? "NIS" : "NIP/NUPTK"],
    ];

    for (const [map, key, label] of checks) {
      if (!key) continue;
      const first = map.get(key);
      if (first !== undefined) {
        clash.push(`${label} "${key}" sama dengan baris ${first}`);
      }
    }

    if (clash.length > 0) {
      issues.push({ rowNumber: item.rowNumber, message: clash.join("; ") });
      continue;
    }

    seen.username.set(item.username, item.rowNumber);
    seen.email.set(item.email, item.rowNumber);
    if (numberKey) seen.number.set(numberKey, item.rowNumber);
    unique.push(item);
  }

  // Duplikat dengan data yang sudah ada di database
  const usernames = unique.map((item) => item.username);
  const emails = unique.map((item) => item.email);
  const studentNumbers = unique.flatMap((item) =>
    item.studentNumber ? [item.studentNumber] : []
  );
  const teacherNumbers = unique.flatMap((item) =>
    item.teacherNumber ? [item.teacherNumber] : []
  );

  const existingUsers: { username: string; email: string }[] =
    unique.length > 0
      ? await db
          .select({ username: users.username, email: users.email })
          .from(users)
          .where(
            or(
              inArray(users.username, usernames),
              inArray(users.email, emails)
            )
          )
      : [];

  const existingStudents: { value: string | null }[] =
    studentNumbers.length > 0
      ? await db
          .select({ value: students.studentNumber })
          .from(students)
          .where(inArray(students.studentNumber, studentNumbers))
      : [];

  const existingTeachers: { value: string | null }[] =
    teacherNumbers.length > 0
      ? await db
          .select({ value: teachers.teacherNumber })
          .from(teachers)
          .where(inArray(teachers.teacherNumber, teacherNumbers))
      : [];

  const takenUsernames = new Set(existingUsers.map((u) => u.username));
  const takenEmails = new Set(existingUsers.map((u) => u.email));
  const takenStudents = new Set(existingStudents.map((s) => s.value));
  const takenTeachers = new Set(existingTeachers.map((t) => t.value));

  const prepared: PreparedAccount[] = [];

  for (const item of unique) {
    const clash: string[] = [];

    if (takenUsernames.has(item.username)) {
      clash.push(`Username "${item.username}" sudah dipakai`);
    }
    if (takenEmails.has(item.email)) {
      clash.push(`Email "${item.email}" sudah dipakai`);
    }
    if (item.studentNumber && takenStudents.has(item.studentNumber)) {
      clash.push(`NIS "${item.studentNumber}" sudah terdaftar`);
    }
    if (item.teacherNumber && takenTeachers.has(item.teacherNumber)) {
      clash.push(`NIP/NUPTK "${item.teacherNumber}" sudah terdaftar`);
    }

    if (clash.length > 0) {
      issues.push({ rowNumber: item.rowNumber, message: clash.join("; ") });
    } else {
      prepared.push(item);
    }
  }

  issues.sort((a, b) => a.rowNumber - b.rowNumber);

  return { prepared, issues };
}

/**
 * Membuat akun beserta data profilnya dengan password acak.
 * Driver neon-http tidak mendukung transaksi, jadi bila pembuatan profil gagal
 * akun yang baru dibuat dihapus kembali.
 */
export async function createAccounts(
  role: AccountRole,
  items: PreparedAccount[]
): Promise<CreatedAccount[]> {
  if (items.length === 0) return [];

  const passwords = items.map(() => generatePassword());
  const hashes = await Promise.all(
    passwords.map((password) => hash(password, BCRYPT_COST))
  );

  const inserted = await db
    .insert(users)
    .values(
      items.map((item, index) => ({
        fullName: item.fullName,
        username: item.username,
        email: item.email,
        passwordHash: hashes[index],
        role,
        status: "active" as const,
        // Password acak dari admin hanya sementara.
        mustChangePassword: role === "murid" || role === "guru",
      }))
    )
    .returning({ id: users.id, username: users.username });

  const idByUsername = new Map(inserted.map((row) => [row.username, row.id]));

  try {
    if (role === "murid") {
      await db.insert(students).values(
        items.map((item) => ({
          userId: idByUsername.get(item.username)!,
          studentNumber: item.studentNumber,
          classId: item.classId,
          academicYear: item.academicYear,
        }))
      );
    }

    if (role === "guru") {
      await db.insert(teachers).values(
        items.map((item) => ({
          userId: idByUsername.get(item.username)!,
          teacherNumber: item.teacherNumber,
          subject: item.subject,
          phone: item.phone,
        }))
      );
    }
  } catch (error) {
    await db
      .delete(users)
      .where(inArray(users.id, inserted.map((row) => row.id)));
    throw error;
  }

  return items.map((item, index) => ({
    rowNumber: item.rowNumber,
    fullName: item.fullName,
    username: item.username,
    password: passwords[index],
    role,
  }));
}
