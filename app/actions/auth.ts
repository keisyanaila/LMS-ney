"use server";

import { redirect } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { createSession, deleteSession } from "@/lib/session";
import { CHANGE_PASSWORD_PATH, HOME_BY_ROLE } from "@/lib/roles";

export type LoginState = { message: string } | null;

// Hash palsu agar waktu respons sama saat akun tidak ditemukan.
const DUMMY_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.4B8sQ1eN6Zp3H8vYk5d5Qe1iS3yK";


export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { message: "Email/username dan password wajib diisi." };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);

  const valid = await compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid || user.status !== "active") {
    return { message: "Email/username atau password salah." };
  }

  const home = HOME_BY_ROLE[user.role];

  if (!home) {
    return {
      message: "Halaman untuk peran ini belum tersedia. Hubungi admin sekolah.",
    };
  }

  await createSession({ userId: user.id, role: user.role });

  // Password sementara dari admin wajib diganti sebelum memakai aplikasi.
  redirect(user.mustChangePassword ? CHANGE_PASSWORD_PATH : home);
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
