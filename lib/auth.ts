import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, teachers, students } from "@/lib/schema";
import { readSession } from "@/lib/session";
import { CHANGE_PASSWORD_PATH } from "@/lib/roles";

/** Pengguna yang sedang login (null jika belum login atau akun nonaktif). */
export const getCurrentUser = cache(async () => {
  const session = await readSession();

  if (!session) return null;

  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      role: users.role,
      status: users.status,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || user.status !== "active") return null;

  return user;
});

/** Halaman ganti password: cukup login, peran apa pun. */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  return user;
}

/**
 * Wajib login sebagai guru. Dipanggil di setiap halaman dan server action
 * guru, karena proxy.ts hanya pemeriksaan awal dan bukan otorisasi.
 */
export const requireTeacher = cache(async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "guru") redirect("/");
  if (user.mustChangePassword) redirect(CHANGE_PASSWORD_PATH);

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.userId, user.id))
    .limit(1);

  if (!teacher) redirect("/");

  return { user, teacher };
});

/** Wajib login sebagai siswa dan sudah mengganti password sementara. */
export const requireStudent = cache(async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "murid") redirect("/");
  if (user.mustChangePassword) redirect(CHANGE_PASSWORD_PATH);

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.userId, user.id))
    .limit(1);

  if (!student) redirect("/");

  return { user, student };
});

/**
 * Wajib login sebagai admin. Dipanggil di layout admin, setiap server action
 * admin, dan setiap API admin (proxy.ts hanya pemeriksaan awal).
 */
export const requireAdmin = cache(async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") redirect("/");
  if (user.mustChangePassword) redirect(CHANGE_PASSWORD_PATH);

  return { user };
});

/** Untuk route handler: kembalikan null jika bukan admin (tanpa redirect). */
export async function getAdminOrNull() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin" || user.mustChangePassword) return null;

  return user;
}
