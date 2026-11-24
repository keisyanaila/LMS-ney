import { getAdminOrNull } from "@/lib/auth";

import type { NextRequest } from "next/server";
import { listDocs } from "@/lib/admin-data";
import type { CollectionKey } from "@/lib/admin-nav";

const ALLOWED_COLLECTIONS: CollectionKey[] = [
  "users",
  "teachers",
  "students",
  "majors",
  "classes",
  "logs",
];

const HIDDEN_FIELDS = new Set([
  "password",
  "passwordHash",
]);

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  return /[",\n\r]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  if (!(await getAdminOrNull())) {
    return Response.json(
      { success: false, message: "Hanya admin yang boleh mengunduh data." },
      { status: 403 }
    );
  }

  const { collection } = await params;

  if (!ALLOWED_COLLECTIONS.includes(collection as CollectionKey)) {
    return Response.json(
      {
        success: false,
        message: `Data "${collection}" tidak dikenal.`,
      },
      { status: 404 }
    );
  }

  try {
    const result = await listDocs(collection as CollectionKey, 10000);

    if (!result.ok) {
      throw new Error(result.error);
    }

    const docs = result.data;

    const headers = [
      ...new Set(
        docs.flatMap((doc) => Object.keys(doc))
      ),
    ].filter((key) => !HIDDEN_FIELDS.has(key));

    const csv = [
      headers.join(","),
      ...docs.map((doc) =>
        headers
          .map((header) => toCsvCell(doc[header]))
          .join(",")
      ),
    ].join("\r\n");

    const date = new Date().toISOString().slice(0, 10);

    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${collection}-${date}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export CSV error:", error);

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengekspor data.",
      },
      { status: 500 }
    );
  }
}
