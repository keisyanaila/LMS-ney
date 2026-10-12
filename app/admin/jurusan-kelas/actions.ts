"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { collections } from "@/lib/admin-nav";
import { logActivity } from "@/lib/activity-log";

export type FormState = { ok: boolean; message: string } | null;

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
    return { ok: false, message: "Kode dan nama jurusan wajib diisi." };
  }

  try {
    const db = await getDb();
    const majors = db.collection(collections.majors);

    if (await majors.findOne({ code })) {
      return { ok: false, message: `Kode jurusan "${code}" sudah dipakai.` };
    }

    await majors.insertOne({ code, name, createdAt: new Date() });
    await logActivity(db, `Menambah jurusan ${code} - ${name}`);
  } catch (error) {
    return { ok: false, message: `Gagal menyimpan: ${String(error)}` };
  }

  revalidatePath(PAGE);
  return { ok: true, message: `Jurusan ${code} berhasil ditambahkan.` };
}

export async function deleteMajor(id: string) {
  const db = await getDb();
  const majors = db.collection(collections.majors);

  const major = await majors.findOne({ _id: new ObjectId(id) });
  if (!major) return;

  // Jangan hapus jurusan yang masih dipakai kelas
  const used = await db
    .collection(collections.classes)
    .countDocuments({ major: major.code });
  if (used > 0) return;

  await majors.deleteOne({ _id: major._id });
  await logActivity(db, `Menghapus jurusan ${major.code} - ${major.name}`);
  revalidatePath(PAGE);
}

// ---------- Kelas ----------

export async function createClass(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = text(formData, "name").toUpperCase();
  const major = text(formData, "major");
  const homeroomTeacher = text(formData, "homeroomTeacher");

  if (!name || !major) {
    return { ok: false, message: "Nama kelas dan jurusan wajib diisi." };
  }

  try {
    const db = await getDb();

    if (!(await db.collection(collections.majors).findOne({ code: major }))) {
      return { ok: false, message: "Jurusan tidak ditemukan." };
    }

    const classes = db.collection(collections.classes);
    if (await classes.findOne({ name })) {
      return { ok: false, message: `Kelas "${name}" sudah ada.` };
    }

    await classes.insertOne({
      name,
      major,
      homeroomTeacher: homeroomTeacher || null,
      createdAt: new Date(),
    });
    await logActivity(db, `Menambah kelas ${name}`);
  } catch (error) {
    return { ok: false, message: `Gagal menyimpan: ${String(error)}` };
  }

  revalidatePath(PAGE);
  return { ok: true, message: `Kelas ${name} berhasil ditambahkan.` };
}

export async function deleteClass(id: string) {
  const db = await getDb();
  const classes = db.collection(collections.classes);

  const found = await classes.findOneAndDelete({ _id: new ObjectId(id) });
  if (!found) return;

  await logActivity(db, `Menghapus kelas ${found.name}`);
  revalidatePath(PAGE);
}
