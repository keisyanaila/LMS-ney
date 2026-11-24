import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getAdminOrNull } from "@/lib/auth";

// Hanya admin yang boleh mengecek koneksi database (tidak membocorkan detail error).
export async function GET() {
  if (!(await getAdminOrNull())) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      success: true,
      message: "Neon PostgreSQL berhasil terhubung!",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      { success: false, message: "Neon PostgreSQL gagal terhubung." },
      { status: 500 }
    );
  }
}
