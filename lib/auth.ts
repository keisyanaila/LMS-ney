import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, teachers } from "@/lib/schema";
import { readSession } from "@/lib/session";

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
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || user.status !== "active") return null;

  return user;
});

/**
 * Wajib login sebagai guru. Dipanggil di setiap halaman dan server action
 * guru, karena proxy.ts hanya pemeriksaan awal dan bukan otorisasi.
 */
export const requireTeacher = cache(async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "guru") redirect("/");

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.userId, user.id))
    .limit(1);

  if (!teacher) redirect("/");

  return { user, teacher };
});
