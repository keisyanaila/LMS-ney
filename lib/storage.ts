import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/schema";
import {
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
} from "@/lib/upload-config";

// Tipe konten ditentukan dari ekstensi (bukan dari klaim browser).
export const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain; charset=utf-8",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  zip: "application/zip",
};

export type UploadResult =
  | { ok: true; id: number; name: string }
  | { ok: false; message: string };

/** Mengambil file dari FormData; null jika tidak ada file yang dipilih. */
export function pickFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0 || !value.name) return null;

  return value;
}

/** Simpan file ke database dan kembalikan ID-nya. */
export async function uploadFile(file: File): Promise<UploadResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      ok: false,
      message: `Jenis file .${extension || "?"} tidak didukung. Gunakan: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      message: `Ukuran file maksimal ${MAX_UPLOAD_LABEL}.`,
    };
  }

  try {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const name = file.name.slice(0, 255);

    const [row] = await db
      .insert(files)
      .values({
        name,
        mimeType: MIME_BY_EXTENSION[extension] ?? "application/octet-stream",
        size: file.size,
        data,
      })
      .returning({ id: files.id });

    return { ok: true, id: row.id, name };
  } catch (error) {
    console.error("Upload file error:", error);

    return { ok: false, message: "Gagal menyimpan file. Coba lagi." };
  }
}

/** Hapus file; kegagalan tidak menghentikan proses utama. */
export async function deleteFile(id: number | null | undefined) {
  if (!id) return;

  try {
    await db.delete(files).where(eq(files.id, id));
  } catch (error) {
    console.error("Delete file error:", error);
  }
}
