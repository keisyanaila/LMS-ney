import { connection } from "next/server";
import type { Document } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { collections, type CollectionKey } from "@/lib/admin-nav";

export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function listDocs(
  key: CollectionKey,
  limit = 50
): Promise<DataResult<Document[]>> {
  await connection();
  try {
    const db = await getDb();
    const data = await db
      .collection(collections[key])
      .find()
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export async function countDocs(
  keys: CollectionKey[]
): Promise<DataResult<Record<string, number>>> {
  await connection();
  try {
    const db = await getDb();
    const counts = await Promise.all(
      keys.map((key) => db.collection(collections[key]).countDocuments())
    );
    return {
      ok: true,
      data: Object.fromEntries(keys.map((key, i) => [key, counts[i]])),
    };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}
