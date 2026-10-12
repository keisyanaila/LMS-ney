import type { Db } from "mongodb";
import { collections } from "@/lib/admin-nav";

// Catat aktivitas ke koleksi activity_logs (tampil di Dashboard & Log Aktivitas)
export async function logActivity(db: Db, action: string) {
  // TODO: ganti dengan user yang sedang login setelah fitur login dibuat
  await db.collection(collections.logs).insertOne({
    createdAt: new Date(),
    user: "admin",
    role: "Admin",
    action,
  });
}
