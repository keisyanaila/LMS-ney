
"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { majors, classes, teachers } from "@/lib/schema";
import { logActivity } from "@/lib/activity-log";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

const PAGE = "/admin/jurusan-kelas";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// ---------- Jurusan ----------

export async function createMajor(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const code = text(formData, "code").toUpperCase();
  const name = text(formData, "name");

  if (!code || !name) {
    return {
      ok: false,
      message: "Kode dan nama jurusan wajib diisi.",
    };
  }

  try {
    await db.insert(majors).values({ code, name });

    await logActivity(`Menambah jurusan ${code} - ${name}`);

    revalidatePath(PAGE);

    return {
      ok: true,
      message: `Jurusan ${code} berhasil ditambahkan.`,
    };
  } catch (error) {
    console.error("Create major error:", error);

    return {
      ok: false,
      message: "Gagal menyimpan jurusan. Pastikan kode belum digunakan.",
    };
  }
}

export async function deleteMajor(id: string): Promise<void> {
  const majorId = Number(id);

  if (!Number.isInteger(majorId) || majorId <= 0) return;

  try {
    const [major] = await db
      .select()
      .from(majors)
      .where(eq(majors.id, majorId))
      .limit(1);

    if (!major) return;

    const usedClasses = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.majorId, majorId))
      .limit(1);

    if (usedClasses.length > 0) return;

    await db.delete(majors).where(eq(majors.id, majorId));

    await logActivity(
      `Menghapus jurusan ${major.code} - ${major.name}`
    );

    revalidatePath(PAGE);
  } catch (error) {
    console.error("Delete major error:", error);
  }
}

// ---------- Kelas ----------

export async function createClass(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = text(formData, "name").toUpperCase();
  const majorId = Number(text(formData, "majorId"));
  const teacherValue = text(formData, "homeroomTeacherId");

  const homeroomTeacherId = teacherValue
    ? Number(teacherValue)
    : null;

  if (!name || !Number.isInteger(majorId) || majorId <= 0) {
    return {
      ok: false,
      message: "Nama kelas dan jurusan wajib diisi.",
    };
  }

  if (
    homeroomTeacherId !== null &&
    (!Number.isInteger(homeroomTeacherId) || homeroomTeacherId <= 0)
  ) {
    return {
      ok: false,
      message: "Pilihan wali kelas tidak valid.",
    };
  }

  try {
    const [major] = await db
      .select()
      .from(majors)
      .where(eq(majors.id, majorId))
      .limit(1);

    if (!major) {
      return {
        ok: false,
        message: "Jurusan tidak ditemukan.",
      };
    }

    if (homeroomTeacherId !== null) {
      const [teacher] = await db
        .select()
        .from(teachers)
        .where(eq(teachers.id, homeroomTeacherId))
        .limit(1);

      if (!teacher) {
        return {
          ok: false,
          message: "Data wali kelas tidak ditemukan.",
        };
      }
    }

    await db.insert(classes).values({
      name,
      majorId,
      homeroomTeacherId,
    });

    await logActivity(`Menambah kelas ${name}`);

    revalidatePath(PAGE);

    return {
      ok: true,
      message: `Kelas ${name} berhasil ditambahkan.`,
    };
  } catch (error) {
    console.error("Create class error:", error);

    return {
      ok: false,
      message: "Gagal menyimpan kelas. Nama kelas mungkin sudah digunakan.",
    };
  }
}

export async function deleteClass(id: string): Promise<void> {
  const classId = Number(id);

  if (!Number.isInteger(classId) || classId <= 0) return;

  try {
    const [found] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!found) return;

    await db.delete(classes).where(eq(classes.id, classId));

    await logActivity(`Menghapus kelas ${found.name}`);

    revalidatePath(PAGE);
  } catch (error) {
    console.error("Delete class error:", error);
  }
}
