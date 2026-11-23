"use server";

import { hash } from "bcryptjs";
import { and, count, eq, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { students, teachers, users } from "@/lib/schema";
import { logActivity } from "@/lib/activity-log";
import { generatePassword } from "@/lib/passwords";
import {
  EDIT_KEYS,
  CREATE_KEYS,
  MAX_IMPORT_BYTES,
  ROLE_LABELS,
  isAccountRole,
  type AccountFieldKey,
  type AccountRole,
  type CreateState,
  type ImportState,
  type SimpleResult,
  type UpdateState,
} from "@/lib/account-config";
import {
  buildClassMap,
  createAccounts,
  loadClassOptions,
  normalizeRow,
  prepareAccounts,
  type RowValues,
} from "@/lib/account-service";
import { ImportError, parseAccountWorkbook } from "@/lib/excel-accounts";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function readValues(
  keys: AccountFieldKey[],
  formData: FormData
): RowValues {
  const values: RowValues = {};
  for (const key of keys) values[key] = text(formData, key);
  return values;
}

function parseId(formData: FormData) {
  const id = Number(text(formData, "id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/akun");
  revalidatePath("/admin/guru");
  revalidatePath("/admin/murid");
  revalidatePath("/admin/log");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ---------- Tambah akun satu per satu ----------

export async function createAccountAction(
  _prev: CreateState,
  formData: FormData
): Promise<CreateState> {
  const role = text(formData, "role");

  if (!isAccountRole(role)) {
    return { ok: false, message: "Pilih jenis akun terlebih dahulu." };
  }

  try {
    const values = readValues(CREATE_KEYS[role], formData);
    const { prepared, issues } = await prepareAccounts(role, [
      { rowNumber: 1, values },
    ]);

    if (issues.length > 0) {
      return { ok: false, message: capitalize(issues[0].message) + "." };
    }

    const created = await createAccounts(role, prepared);

    await logActivity(
      `Membuat akun ${ROLE_LABELS[role]} ${created[0].fullName} (${created[0].username})`
    );
    refresh();

    return {
      ok: true,
      message: `Akun ${ROLE_LABELS[role]} ${created[0].fullName} berhasil dibuat.`,
      created,
    };
  } catch (error) {
    console.error("Create account error:", error);
    return { ok: false, message: "Gagal menyimpan akun. Coba lagi." };
  }
}

// ---------- Edit akun ----------

export async function updateAccount(
  _prev: UpdateState,
  formData: FormData
): Promise<UpdateState> {
  const id = parseId(formData);

  if (!id) return { ok: false, message: "ID akun tidak valid." };

  try {
    const [account] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!account) return { ok: false, message: "Akun tidak ditemukan." };

    const role = account.role as AccountRole;
    const classMap = role === "murid" ? buildClassMap(await loadClassOptions()) : new Map();

    const { data, problems } = normalizeRow(
      role,
      readValues(EDIT_KEYS[role], formData),
      1,
      classMap,
      "edit"
    );

    if (!data) return { ok: false, message: capitalize(problems.join("; ")) + "." };

    // Cek duplikat terhadap akun lain
    const clashes = await db
      .select({ username: users.username, email: users.email })
      .from(users)
      .where(
        and(
          ne(users.id, id),
          or(eq(users.username, data.username), eq(users.email, data.email))
        )
      );

    if (clashes.some((u) => u.username === data.username)) {
      return { ok: false, message: `Username "${data.username}" sudah dipakai akun lain.` };
    }
    if (clashes.some((u) => u.email === data.email)) {
      return { ok: false, message: `Email "${data.email}" sudah dipakai akun lain.` };
    }

    if (role === "murid" && data.studentNumber) {
      const [dupe] = await db
        .select({ userId: students.userId })
        .from(students)
        .where(and(eq(students.studentNumber, data.studentNumber), ne(students.userId, id)))
        .limit(1);
      if (dupe) return { ok: false, message: `NIS "${data.studentNumber}" sudah terdaftar.` };
    }

    if (role === "guru" && data.teacherNumber) {
      const [dupe] = await db
        .select({ userId: teachers.userId })
        .from(teachers)
        .where(and(eq(teachers.teacherNumber, data.teacherNumber), ne(teachers.userId, id)))
        .limit(1);
      if (dupe) return { ok: false, message: `NIP/NUPTK "${data.teacherNumber}" sudah terdaftar.` };
    }

    await db
      .update(users)
      .set({
        fullName: data.fullName,
        username: data.username,
        email: data.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    // Akun lama bisa belum punya data profil, jadi dibuat bila belum ada.
    if (role === "murid") {
      const profile = {
        studentNumber: data.studentNumber,
        classId: data.classId,
        academicYear: data.academicYear,
      };
      await db
        .insert(students)
        .values({ userId: id, ...profile })
        .onConflictDoUpdate({ target: students.userId, set: profile });
    }

    if (role === "guru") {
      const profile = {
        teacherNumber: data.teacherNumber,
        subject: data.subject,
        phone: data.phone,
      };
      await db
        .insert(teachers)
        .values({ userId: id, ...profile })
        .onConflictDoUpdate({ target: teachers.userId, set: profile });
    }

    await logActivity(`Mengubah akun ${ROLE_LABELS[role]} ${data.fullName} (${data.username})`);
    refresh();

    return { ok: true, message: `Akun ${data.fullName} berhasil diperbarui.` };
  } catch (error) {
    console.error("Update account error:", error);
    return { ok: false, message: "Gagal menyimpan perubahan. Coba lagi." };
  }
}

// ---------- Status, hapus, reset password ----------

async function isLastActiveAdmin(id: number) {
  const [target] = await db
    .select({ role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target || target.role !== "admin" || target.status !== "active") {
    return false;
  }

  const [others] = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(eq(users.role, "admin"), eq(users.status, "active"), ne(users.id, id))
    );

  return others.total === 0;
}

export async function toggleAccountStatus(
  formData: FormData
): Promise<SimpleResult> {
  const id = parseId(formData);
  const status = text(formData, "status");

  if (!id) return { ok: false, message: "ID akun tidak valid." };
  if (status !== "active" && status !== "inactive") {
    return { ok: false, message: "Status akun tidak valid." };
  }

  try {
    if (status === "inactive" && (await isLastActiveAdmin(id))) {
      return {
        ok: false,
        message: "Tidak bisa menonaktifkan admin aktif terakhir.",
      };
    }

    const [updated] = await db
      .update(users)
      .set({ status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ fullName: users.fullName });

    if (!updated) return { ok: false, message: "Akun tidak ditemukan." };

    await logActivity(
      `${status === "active" ? "Mengaktifkan" : "Menonaktifkan"} akun ${updated.fullName}`
    );
    refresh();

    return {
      ok: true,
      message: `Akun ${updated.fullName} ${status === "active" ? "diaktifkan" : "dinonaktifkan"}.`,
    };
  } catch (error) {
    console.error("Toggle status error:", error);
    return { ok: false, message: "Gagal mengubah status akun." };
  }
}

export async function deleteAccount(formData: FormData): Promise<SimpleResult> {
  const id = parseId(formData);

  if (!id) return { ok: false, message: "ID akun tidak valid." };

  try {
    if (await isLastActiveAdmin(id)) {
      return { ok: false, message: "Tidak bisa menghapus admin aktif terakhir." };
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ fullName: users.fullName, username: users.username });

    if (!deleted) return { ok: false, message: "Akun tidak ditemukan." };

    await logActivity(`Menghapus akun ${deleted.fullName} (${deleted.username})`);
    refresh();

    return { ok: true, message: `Akun ${deleted.fullName} dihapus.` };
  } catch (error) {
    console.error("Delete account error:", error);
    return { ok: false, message: "Gagal menghapus akun." };
  }
}

/** Password baru dibuat acak dan dikembalikan sekali agar bisa diberikan ke pemilik akun. */
export async function resetAccountPassword(
  formData: FormData
): Promise<SimpleResult> {
  const id = parseId(formData);

  if (!id) return { ok: false, message: "ID akun tidak valid." };

  try {
    const password = generatePassword();
    const passwordHash = await hash(password, 10);

    const [updated] = await db
      .update(users)
      .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ fullName: users.fullName, username: users.username });

    if (!updated) return { ok: false, message: "Akun tidak ditemukan." };

    await logActivity(`Mengatur ulang password akun ${updated.fullName} (${updated.username})`);

    return {
      ok: true,
      message: `Password baru untuk ${updated.fullName} (${updated.username}) sudah dibuat.`,
      password,
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return { ok: false, message: "Gagal mengatur ulang password." };
  }
}

// ---------- Impor Excel ----------

export async function importAccountsAction(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const role = text(formData, "role");
  const mode = text(formData, "mode") === "commit" ? "committed" : "preview";
  const file = formData.get("file");

  const fail = (message: string): ImportState => ({
    ok: false,
    stage: mode,
    message,
    total: 0,
    ready: 0,
    issues: [],
  });

  if (!isAccountRole(role)) return fail("Pilih jenis akun terlebih dahulu.");
  if (!(file instanceof File) || file.size === 0) return fail("Pilih file Excel terlebih dahulu.");
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return fail("File harus berformat .xlsx. Unduh template agar formatnya sesuai.");
  }
  if (file.size > MAX_IMPORT_BYTES) return fail("Ukuran file maksimal 1 MB.");

  try {
    const rows = await parseAccountWorkbook(
      Buffer.from(await file.arrayBuffer()),
      role
    );
    const { prepared, issues } = await prepareAccounts(role, rows);

    if (mode === "preview") {
      return {
        ok: true,
        stage: "preview",
        message:
          issues.length === 0
            ? `${prepared.length} baris siap dibuat.`
            : `${prepared.length} baris siap dibuat, ${issues.length} baris bermasalah akan dilewati.`,
        total: rows.length,
        ready: prepared.length,
        issues,
        previewRows: prepared.slice(0, 10).map((item) => ({
          rowNumber: item.rowNumber,
          fullName: item.fullName,
          username: item.username,
          detail:
            role === "murid"
              ? [item.className, item.academicYear].filter(Boolean).join(" · ")
              : role === "guru"
                ? [item.subject, item.teacherNumber].filter(Boolean).join(" · ")
                : item.email,
        })),
      };
    }

    const created = await createAccounts(role, prepared);

    if (created.length > 0) {
      await logActivity(
        `Impor Excel: ${created.length} akun ${ROLE_LABELS[role]} dibuat${issues.length > 0 ? `, ${issues.length} baris dilewati` : ""}`
      );
      refresh();
    }

    return {
      ok: created.length > 0,
      stage: "committed",
      message:
        created.length > 0
          ? `${created.length} akun ${ROLE_LABELS[role]} berhasil dibuat.`
          : "Tidak ada akun yang dibuat.",
      total: rows.length,
      ready: created.length,
      issues,
      created,
    };
  } catch (error) {
    if (error instanceof ImportError) return fail(error.message);

    console.error("Import accounts error:", error);
    return fail("Impor gagal karena kesalahan di server. Coba lagi.");
  }
}
