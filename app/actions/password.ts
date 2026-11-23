"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { HOME_BY_ROLE } from "@/lib/roles";

export type PasswordState = { message: string } | null;

const MIN_LENGTH = 8;
const MAX_LENGTH = 72; // batas bcrypt

export async function changePassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const user = await getCurrentUser();

  if (!user) redirect("/");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < MIN_LENGTH) {
    return { message: `Password baru minimal ${MIN_LENGTH} karakter.` };
  }

  if (newPassword.length > MAX_LENGTH) {
    return { message: `Password baru maksimal ${MAX_LENGTH} karakter.` };
  }

  if (newPassword !== confirmPassword) {
    return { message: "Konfirmasi password tidak sama." };
  }

  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row) redirect("/");

  // Saat wajib ganti (login pertama), sesi sudah membuktikan pemilik akun.
  // Saat ganti sukarela, password lama diminta lagi.
  if (!user.mustChangePassword) {
    if (!currentPassword || !(await compare(currentPassword, row.passwordHash))) {
      return { message: "Password saat ini salah." };
    }
  }

  if (await compare(newPassword, row.passwordHash)) {
    return { message: "Password baru harus berbeda dari password sebelumnya." };
  }

  try {
    await db
      .update(users)
      .set({
        passwordHash: await hash(newPassword, 10),
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await logActivity("Mengganti password akun", {
      userId: user.id,
      userName: user.fullName,
      role: user.role,
    });
  } catch (error) {
    console.error("Change password error:", error);
    return { message: "Gagal menyimpan password baru. Coba lagi." };
  }

  redirect(HOME_BY_ROLE[user.role] ?? "/");
}
