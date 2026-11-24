import { getAdminOrNull } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classes } from "@/lib/schema";
import { isAccountRole, ROLE_LABELS } from "@/lib/account-config";
import { buildTemplateWorkbook } from "@/lib/excel-accounts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  if (!(await getAdminOrNull())) {
    return Response.json(
      { success: false, message: "Hanya admin yang boleh mengunduh template." },
      { status: 403 }
    );
  }

  const { role } = await params;

  if (!isAccountRole(role)) {
    return Response.json(
      { success: false, message: `Jenis akun "${role}" tidak dikenal.` },
      { status: 404 }
    );
  }

  let classNames: string[] = [];

  if (role === "murid") {
    try {
      const rows = await db.select({ name: classes.name }).from(classes);
      classNames = rows.map((row) => row.name).sort();
    } catch (error) {
      // Template tetap bisa diunduh tanpa daftar kelas.
      console.error("Template: gagal memuat daftar kelas:", error);
    }
  }

  const buffer = await buildTemplateWorkbook(role, classNames);
  const filename = `template-akun-${ROLE_LABELS[role]
    .toLowerCase()
    .replace(/\s+/g, "-")}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
