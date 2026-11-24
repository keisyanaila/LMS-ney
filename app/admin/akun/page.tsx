import { connection } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getNavItem } from "@/lib/admin-nav";
import { db } from "@/lib/db";
import { classes, students, teachers, users } from "@/lib/schema";
import { PageHeader, ErrorNotice } from "@/components/admin/ui";
import AccountManager from "./account-manager";

// Impor Excel meng-hash ratusan password, beri waktu lebih panjang.
export const maxDuration = 60;

export default async function ManajemenAkunPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; tambah?: string }>;
}) {
  await connection();

  const { role, tambah } = await searchParams;

  let loaded;

  try {
    loaded = await Promise.all([
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          username: users.username,
          email: users.email,
          role: users.role,
          status: users.status,
          studentNumber: students.studentNumber,
          className: classes.name,
          academicYear: students.academicYear,
          teacherNumber: teachers.teacherNumber,
          subject: teachers.subject,
          phone: sql<string | null>`coalesce(${teachers.phone}, ${students.phone})`,
        })
        .from(users)
        .leftJoin(students, eq(students.userId, users.id))
        .leftJoin(classes, eq(students.classId, classes.id))
        .leftJoin(teachers, eq(teachers.userId, users.id))
        .orderBy(desc(users.id)),
      db.select({ id: classes.id, name: classes.name }).from(classes).orderBy(classes.name),
    ]);
  } catch (error) {
    console.error("Gagal mengambil data akun:", error);

    return (
      <>
        <PageHeader item={getNavItem("/admin/akun")} />
        <ErrorNotice message="Data akun gagal dimuat. Periksa koneksi database dan pastikan migrasi terbaru sudah dijalankan." />
      </>
    );
  }
  const [accounts, classList] = loaded;

  return (
    <>
      <PageHeader item={getNavItem("/admin/akun")} />
      <AccountManager
        accounts={accounts}
        classes={classList}
        initialFilter={role ?? null}
        initialAdd={tambah ?? null}
      />
    </>
  );
}
