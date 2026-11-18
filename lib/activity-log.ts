import { db } from "@/lib/db";
import { activityLogs } from "@/lib/schema";

export type ActivityActor = {
  userId: number | null;
  userName: string;
  role: string;
};

const ADMIN_ACTOR: ActivityActor = {
  userId: null,
  userName: "Admin",
  role: "admin",
};

export async function logActivity(
  action: string,
  actor: ActivityActor = ADMIN_ACTOR
) {
  await db.insert(activityLogs).values({
    userId: actor.userId,
    userName: actor.userName,
    role: actor.role,
    action,
  });
}
