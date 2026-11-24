import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireTeacher } from "@/lib/auth";
import {
  getAttendanceMatrix,
  getGradeMatrix,
  getOwnedTeachingClass,
  KIND_LABELS,
  STATUS_LABELS,
  type AttendanceStatus,
} from "@/lib/guru-data";

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const STATUS_CODE: Record<AttendanceStatus, string> = {
  hadir: "H",
  izin: "I",
  sakit: "S",
  alpa: "A",
};

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDBEAFE" },
    };
    cell.border = { bottom: { style: "thin" } };
  });
}

function round(value: number | null, digits = 1) {
  return value === null ? "" : Number(value.toFixed(digits));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { teacher } = await requireTeacher();
  const kelas = await getOwnedTeachingClass(teacher.id, Number(id));

  if (!kelas) {
    return Response.json(
      { success: false, message: "Kelas ajar tidak ditemukan." },
      { status: 404 }
    );
  }

  const jenis = request.nextUrl.searchParams.get("jenis");

  if (jenis !== "nilai" && jenis !== "absensi") {
    return Response.json(
      { success: false, message: "Jenis export harus nilai atau absensi." },
      { status: 400 }
    );
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Learnova";

  const title = `${kelas.subject} - ${kelas.className}`;

  if (jenis === "nilai") {
    const { items, rows, weights } = await getGradeMatrix(
      kelas.id,
      kelas.classId
    );

    const sheet = workbook.addWorksheet("Nilai");
    sheet.addRow([`Rekap Nilai ${title}`]).font = { bold: true, size: 13 };
    sheet.addRow([]);

    const header = sheet.addRow([
      "No",
      "NIS",
      "Nama",
      ...items.map(
        (item) => `${item.title}\n(${KIND_LABELS[item.kind]}, maks ${item.maxScore})`
      ),
      "Nilai Akhir",
    ]);
    styleHeader(header);
    header.height = 42;

    rows.forEach(({ student, scores, average }, index) => {
      sheet.addRow([
        index + 1,
        student.studentNumber ?? "",
        student.fullName,
        ...scores.map((score) => (score === null ? "" : score)),
        round(average),
      ]);
    });

    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 14;
    sheet.getColumn(3).width = 30;
    for (let i = 0; i < items.length + 1; i++) {
      sheet.getColumn(4 + i).width = 16;
    }
    sheet.views = [{ state: "frozen", xSplit: 3, ySplit: 3 }];

    sheet.addRow([]);
    const note = sheet.addRow([
      weights
        ? `Nilai akhir berbobot: ${Object.entries(weights)
            .map(([kind, w]) => `${KIND_LABELS[kind as keyof typeof KIND_LABELS]} ${w}%`)
            .join(", ")}.`
        : "Nilai akhir = rata-rata persentase semua item yang sudah dinilai (belum ada bobot).",
    ]);
    note.font = { italic: true, color: { argb: "FF666666" } };
  } else {
    const { sessions, rows } = await getAttendanceMatrix(
      kelas.id,
      kelas.classId
    );

    const sheet = workbook.addWorksheet("Absensi");
    sheet.addRow([`Rekap Kehadiran ${title}`]).font = { bold: true, size: 13 };
    sheet.addRow([]);

    const header = sheet.addRow([
      "No",
      "NIS",
      "Nama",
      ...sessions.map((s) => s.meetingDate),
      "Hadir",
      "Izin",
      "Sakit",
      "Alpa",
      "% Hadir",
    ]);
    styleHeader(header);

    rows.forEach(({ student, statuses }, index) => {
      const tally: Record<AttendanceStatus, number> = {
        hadir: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
      };

      for (const status of statuses) {
        if (status) tally[status] += 1;
      }

      sheet.addRow([
        index + 1,
        student.studentNumber ?? "",
        student.fullName,
        ...statuses.map((status) => (status ? STATUS_CODE[status] : "")),
        tally.hadir,
        tally.izin,
        tally.sakit,
        tally.alpa,
        sessions.length > 0
          ? Number(((tally.hadir / sessions.length) * 100).toFixed(0))
          : "",
      ]);
    });

    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 14;
    sheet.getColumn(3).width = 30;
    for (let i = 0; i < sessions.length; i++) {
      sheet.getColumn(4 + i).width = 12;
    }
    sheet.views = [{ state: "frozen", xSplit: 3, ySplit: 3 }];

    sheet.addRow([]);
    const legend = sheet.addRow([
      `Keterangan: ${(Object.keys(STATUS_CODE) as AttendanceStatus[])
        .map((s) => `${STATUS_CODE[s]} = ${STATUS_LABELS[s]}`)
        .join(", ")}.`,
    ]);
    legend.font = { italic: true, color: { argb: "FF666666" } };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": `attachment; filename="${jenis}-${safe}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
