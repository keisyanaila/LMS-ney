import type { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { collections, type CollectionKey } from "@/lib/admin-nav";

// Field sensitif yang tidak boleh ikut diekspor
const HIDDEN_FIELDS = new Set(["password", "passwordHash"]);

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/export/[collection]">
) {
  const { collection } = await ctx.params;

  if (!(collection in collections)) {
    return Response.json(
      { success: false, message: `Koleksi "${collection}" tidak dikenal` },
      { status: 404 }
    );
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection(collections[collection as CollectionKey])
      .find()
      .toArray();

    const headers = [
      ...new Set(docs.flatMap((doc) => Object.keys(doc))),
    ].filter((key) => !HIDDEN_FIELDS.has(key));

    const csv = [
      headers.join(","),
      ...docs.map((doc) => headers.map((h) => toCsvCell(doc[h])).join(",")),
    ].join("\r\n");

    const date = new Date().toISOString().slice(0, 10);
    return new Response("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${collection}-${date}.csv"`,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
