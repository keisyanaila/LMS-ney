
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/schema";

export async function logActivity(action: string) {
  await db.insert(activityLogs).values({
    userId: null,
    userName: "Admin",
    role: "admin",
    action,
  });
}
