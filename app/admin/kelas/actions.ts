"use server";

import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { majors, classes, teachers, students } from "@/lib/schema";
import { logActivity } from "@/lib/activity-log";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

const PAGE = "/admin/kelas";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

// ---------- Jurusan ----------

export async function createMajor(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
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
  await requireAdmin();
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

type ClassInput = {
  name: string;
  majorId: number;
  homeroomTeacherId: number | null;
};

/** Membaca dan memeriksa isian form kelas (dipakai untuk tambah dan ubah). */
async function readClassForm(
  formData: FormData
): Promise<{ error: string } | { values: ClassInput }> {
  const name = text(formData, "name").toUpperCase();
  const majorId = Number(text(formData, "majorId"));
  const teacherValue = text(formData, "homeroomTeacherId");

  const homeroomTeacherId = teacherValue ? Number(teacherValue) : null;

  if (!name || !Number.isInteger(majorId) || majorId <= 0) {
    return { error: "Nama kelas dan jurusan wajib diisi." };
  }

  if (
    homeroomTeacherId !== null &&
    (!Number.isInteger(homeroomTeacherId) || homeroomTeacherId <= 0)
  ) {
    return { error: "Pilihan wali kelas tidak valid." };
  }

  const [major] = await db
    .select({ id: majors.id })
    .from(majors)
    .where(eq(majors.id, majorId))
    .limit(1);

  if (!major) return { error: "Jurusan tidak ditemukan." };

  if (homeroomTeacherId !== null) {
    const [teacher] = await db
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.id, homeroomTeacherId))
      .limit(1);

    if (!teacher) return { error: "Data wali kelas tidak ditemukan." };
  }

  return { values: { name, majorId, homeroomTeacherId } };
}

export async function createClass(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  try {
    const parsed = await readClassForm(formData);

    if ("error" in parsed) return { ok: false, message: parsed.error };

    await db.insert(classes).values(parsed.values);

    await logActivity(`Menambah kelas ${parsed.values.name}`);

    revalidatePath(PAGE);

    return {
      ok: true,
      message: `Kelas ${parsed.values.name} berhasil ditambahkan.`,
    };
  } catch (error) {
    console.error("Create class error:", error);

    return {
      ok: false,
      message: "Gagal menyimpan kelas. Nama kelas mungkin sudah digunakan.",
    };
  }
}

export async function updateClass(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();
  const classId = Number(id);

  if (!Number.isInteger(classId) || classId <= 0) {
    return { ok: false, message: "Kelas tidak valid." };
  }

  try {
    const [existing] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!existing) {
      return { ok: false, message: "Kelas tidak ditemukan." };
    }

    const parsed = await readClassForm(formData);

    if ("error" in parsed) return { ok: false, message: parsed.error };

    await db.update(classes).set(parsed.values).where(eq(classes.id, classId));

    await logActivity(
      parsed.values.name === existing.name
        ? `Mengubah kelas ${existing.name}`
        : `Mengubah kelas ${existing.name} menjadi ${parsed.values.name}`
    );

    revalidatePath(PAGE);
    revalidatePath(`${PAGE}/${classId}`);

    return {
      ok: true,
      message: `Kelas ${parsed.values.name} berhasil diperbarui.`,
    };
  } catch (error) {
    console.error("Update class error:", error);

    return {
      ok: false,
      message: "Gagal memperbarui kelas. Nama kelas mungkin sudah digunakan.",
    };
  }
}

/**
 * Menghapus kelas. Murid di dalamnya tidak ikut terhapus, hanya menjadi
 * "belum punya kelas". Dari halaman detail, `goBack` mengembalikan ke daftar.
 */
export async function deleteClass(
  id: string,
  goBack = false
): Promise<void> {
  await requireAdmin();
  const classId = Number(id);

  if (!Number.isInteger(classId) || classId <= 0) return;

  try {
    const [found] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (found) {
      const [{ total }] = await db
        .select({ total: count() })
        .from(students)
        .where(eq(students.classId, classId));

      await db.delete(classes).where(eq(classes.id, classId));

      await logActivity(
        total > 0
          ? `Menghapus kelas ${found.name} (${total} murid kini belum punya kelas)`
          : `Menghapus kelas ${found.name}`
      );

      revalidatePath(PAGE);
    }
  } catch (error) {
    console.error("Delete class error:", error);
    return;
  }

  // redirect() bekerja dengan melempar error, jadi harus di luar try/catch.
  if (goBack) redirect(PAGE);
}
