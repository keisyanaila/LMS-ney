import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { canAccessFile } from "@/lib/file-access";

// PDF dan gambar dibuka di browser; sisanya diunduh.
const INLINE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fileId = Number(id);

  const user = await getCurrentUser();

  if (!user) return new Response("Silakan login terlebih dahulu.", { status: 401 });
  if (user.mustChangePassword) {
    return new Response("Ganti password terlebih dahulu.", { status: 403 });
  }

  if (
    !Number.isInteger(fileId) ||
    fileId <= 0 ||
    !(await canAccessFile(user, fileId))
  ) {
    return new Response("File tidak ditemukan.", { status: 404 });
  }

  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  if (!file) return new Response("File tidak ditemukan.", { status: 404 });

  const bytes = new Uint8Array(Buffer.from(file.data, "base64"));
  const inline = INLINE_TYPES.includes(file.mimeType);

  return new Response(bytes, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
