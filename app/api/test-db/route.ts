import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;

    const db = client.db("lms_ney");

    await db.command({
      ping: 1,
    });

    return NextResponse.json({
      success: true,
      message: "MongoDB berhasil terhubung!",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB gagal terhubung",
      },
      {
        status: 500,
      }
    );
  }
}
