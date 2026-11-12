
"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

const accountRoles = [
  "admin",
  "kepala_sekolah",
  "kurikulum",
  "guru",
  "murid",
] as const;

function getText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function validateAccount(formData: FormData) {
  const fullName = getText(formData, "fullName");
  const username = getText(formData, "username");
  const email = getText(formData, "email").toLowerCase();
  const role = getText(formData, "role");

  if (!fullName || !username || !email || !role) {
    throw new Error("Semua kolom wajib diisi.");
  }

  if (!accountRoles.includes(role as (typeof accountRoles)[number])) {
    throw new Error("Role akun tidak valid.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Format email tidak valid.");
  }

  return {
    fullName,
    username,
    email,
    role: role as (typeof accountRoles)[number],
  };
}

function handleError(error: unknown): never {
  const message =
    error instanceof Error ? error.message : "Terjadi kesalahan.";

  if (message.includes("unique") || message.includes("duplicate")) {
    throw new Error("Username atau email sudah digunakan.");
  }

  throw new Error(message);
}

export async function createAccount(formData: FormData) {
  try {
    const account = validateAccount(formData);
    const password = getText(formData, "password");

    if (password.length < 8) {
      throw new Error("Password minimal 8 karakter.");
    }

    const passwordHash = await hash(password, 12);

    await db.insert(users).values({
      ...account,
      passwordHash,
      status: "active",
    });

    revalidatePath("/admin/akun");
  } catch (error) {
    handleError(error);
  }
}

export async function updateAccount(formData: FormData) {
  try {
    const id = Number(getText(formData, "id"));

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID akun tidak valid.");
    }

    const account = validateAccount(formData);

    await db
      .update(users)
      .set({
        ...account,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    revalidatePath("/admin/akun");
  } catch (error) {
    handleError(error);
  }
}

export async function toggleAccountStatus(formData: FormData) {
  try {
    const id = Number(getText(formData, "id"));
    const status = getText(formData, "status");

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID akun tidak valid.");
    }

    if (status !== "active" && status !== "inactive") {
      throw new Error("Status akun tidak valid.");
    }

    await db
      .update(users)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    revalidatePath("/admin/akun");
  } catch (error) {
    handleError(error);
  }
}

export async function deleteAccount(formData: FormData) {
  try {
    const id = Number(getText(formData, "id"));

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID akun tidak valid.");
    }

    await db.delete(users).where(eq(users.id, id));

    revalidatePath("/admin/akun");
  } catch (error) {
    handleError(error);
  }
}

export async function resetAccountPassword(formData: FormData) {
  try {
    const id = Number(getText(formData, "id"));
    const password = getText(formData, "password");

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("ID akun tidak valid.");
    }

    if (password.length < 8) {
      throw new Error("Password baru minimal 8 karakter.");
    }

    const passwordHash = await hash(password, 12);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    revalidatePath("/admin/akun");
  } catch (error) {
    handleError(error);
  }
}
