
import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { getNavItem } from "@/lib/admin-nav";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { PageHeader, ErrorNotice } from "@/components/admin/ui";
import AccountManager from "./account-manager";

export default async function ManajemenAkunPage() {
  await connection();

  let accounts;

  try {
    accounts = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        username: users.username,
        email: users.email,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .orderBy(desc(users.id));
  } catch (error) {
    console.error("Gagal mengambil data akun:", error);

    return (
      <>
        <PageHeader item={getNavItem("/admin/akun")} />
        <ErrorNotice message="Data akun gagal dimuat. Periksa koneksi database." />
      </>
    );
  }

  return (
    <>
      <PageHeader item={getNavItem("/admin/akun")} />
      <AccountManager accounts={accounts} />
    </>
  );
}
