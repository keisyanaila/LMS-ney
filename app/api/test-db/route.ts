
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      success: true,
      message: "Neon PostgreSQL berhasil terhubung!",
      database: "PostgreSQL",
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Neon PostgreSQL gagal terhubung.",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
