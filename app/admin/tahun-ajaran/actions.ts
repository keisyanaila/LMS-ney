"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { academicYears, students } from "@/lib/schema";
import { logActivity } from "@/lib/activity-log";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

const PAGE = "/admin/tahun-ajaran";

/** Format tahun ajaran: 2026/2027 (tahun kedua = tahun pertama + 1). */
function checkName(raw: string): string | null {
  const match = /^(\d{4})\/(\d{4})$/.exec(raw);

  if (!match) return "Tulis tahun ajaran dengan format 2026/2027.";
  if (Number(match[2]) !== Number(match[1]) + 1) {
    return "Tahun kedua harus satu tahun setelah tahun pertama (mis. 2026/2027).";
  }

  return null;
}

function nameOf(formData: FormData) {
  return String(formData.get("name") ?? "")
    .trim()
    .replace(/\s+/g, "");
}

export async function createAcademicYear(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = nameOf(formData);
  const wantsActive = formData.get("isActive") === "on";

  const problem = checkName(name);
  if (problem) return { ok: false, message: problem };

  try {
    const existing = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .limit(1);

    // Tahun ajaran pertama otomatis menjadi yang aktif.
    const makeActive = wantsActive || existing.length === 0;

    const [created] = await db
      .insert(academicYears)
      .values({ name, isActive: false })
      .returning({ id: academicYears.id });

    if (makeActive) {
      // Satu perintah: hanya tahun ajaran ini yang aktif, yang lain nonaktif.
      await db
        .update(academicYears)
        .set({ isActive: sql`(${academicYears.id} = ${created.id})` });
    }

    await logActivity(
      makeActive
        ? `Menambah tahun ajaran ${name} (aktif)`
        : `Menambah tahun ajaran ${name}`
    );

    revalidatePath(PAGE);

    return {
      ok: true,
      message: `Tahun ajaran ${name} berhasil ditambahkan.`,
    };
  } catch (error) {
    console.error("Create academic year error:", error);

    return {
      ok: false,
      message: "Gagal menyimpan. Tahun ajaran ini mungkin sudah ada.",
    };
  }
}

export async function updateAcademicYear(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const yearId = Number(id);
  const name = nameOf(formData);

  if (!Number.isInteger(yearId) || yearId <= 0) {
    return { ok: false, message: "Tahun ajaran tidak valid." };
  }

  const problem = checkName(name);
  if (problem) return { ok: false, message: problem };

  try {
    const [existing] = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, yearId))
      .limit(1);

    if (!existing) {
      return { ok: false, message: "Tahun ajaran tidak ditemukan." };
    }

    if (existing.name === name) {
      return { ok: true, message: "Tidak ada perubahan." };
    }

    // Ubah nama dulu: jika nama bentrok, gagal sebelum data murid disentuh.
    await db
      .update(academicYears)
      .set({ name })
      .where(eq(academicYears.id, yearId));

    // Murid menyimpan tahun ajarannya sebagai teks, ikut diperbarui.
    await db
      .update(students)
      .set({ academicYear: name })
      .where(eq(students.academicYear, existing.name));

    await logActivity(
      `Mengubah tahun ajaran ${existing.name} menjadi ${name}`
    );

    revalidatePath(PAGE);

    return {
      ok: true,
      message: `Tahun ajaran diubah menjadi ${name}.`,
    };
  } catch (error) {
    console.error("Update academic year error:", error);

    return {
      ok: false,
      message: "Gagal menyimpan. Tahun ajaran ini mungkin sudah ada.",
    };
  }
}

export async function setActiveAcademicYear(id: string): Promise<void> {
  const yearId = Number(id);

  if (!Number.isInteger(yearId) || yearId <= 0) return;

  try {
    const [found] = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, yearId))
      .limit(1);

    if (!found) return;

    await db
      .update(academicYears)
      .set({ isActive: sql`(${academicYears.id} = ${yearId})` });

    await logActivity(`Mengaktifkan tahun ajaran ${found.name}`);

    revalidatePath(PAGE);
  } catch (error) {
    console.error("Set active academic year error:", error);
  }
}

export async function deleteAcademicYear(id: string): Promise<void> {
  const yearId = Number(id);

  if (!Number.isInteger(yearId) || yearId <= 0) return;

  try {
    const [found] = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.id, yearId))
      .limit(1);

    // Tahun ajaran aktif atau yang masih dipakai murid tidak boleh dihapus.
    if (!found || found.isActive) return;

    const used = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.academicYear, found.name))
      .limit(1);

    if (used.length > 0) return;

    await db.delete(academicYears).where(eq(academicYears.id, yearId));

    await logActivity(`Menghapus tahun ajaran ${found.name}`);

    revalidatePath(PAGE);
  } catch (error) {
    console.error("Delete academic year error:", error);
  }
}
