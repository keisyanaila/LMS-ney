import ExcelJS from "exceljs";
import {
  CREATE_KEYS,
  FIELDS,
  MAX_IMPORT_ROWS,
  ROLE_LABELS,
  type AccountFieldKey,
  type AccountRole,
} from "@/lib/account-config";
import type { RowInput, RowValues } from "@/lib/account-service";

export class ImportError extends Error {}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  const obj = value as unknown as Record<string, unknown>;

  if (Array.isArray(obj.richText)) {
    return (obj.richText as { text?: string }[])
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  }
  if (typeof obj.text === "string") return obj.text.trim();
  if ("result" in obj && obj.result !== undefined) {
    return cellText(obj.result as ExcelJS.CellValue);
  }
  if ("error" in obj) return "";

  return String(value).trim();
}

/** Membaca file .xlsx dan mengubahnya menjadi baris data akun untuk satu peran. */
export async function parseAccountWorkbook(
  buffer: Buffer,
  role: AccountRole
): Promise<RowInput[]> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    throw new ImportError(
      "File tidak bisa dibaca. Pastikan formatnya .xlsx (Excel), bukan .xls atau .csv."
    );
  }

  const sheet =
    workbook.getWorksheet("Data") ?? workbook.worksheets[0] ?? undefined;

  if (!sheet) throw new ImportError("File Excel tidak memiliki sheet.");

  const keys = CREATE_KEYS[role];

  // Peta nama kolom (termasuk alias) -> kunci field
  const lookup = new Map<string, AccountFieldKey>();
  for (const key of keys) {
    const field = FIELDS[key];
    for (const name of [field.header, ...(field.aliases ?? [])]) {
      lookup.set(normalizeHeader(name), key);
    }
  }

  const columnByKey = new Map<AccountFieldKey, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const key = lookup.get(normalizeHeader(cellText(cell.value)));
    if (key && !columnByKey.has(key)) columnByKey.set(key, colNumber);
  });

  const missing = keys.filter(
    (key) => FIELDS[key].required && !columnByKey.has(key)
  );

  if (missing.length > 0) {
    throw new ImportError(
      `Kolom wajib tidak ditemukan di baris 1: ${missing
        .map((key) => FIELDS[key].header)
        .join(", ")}. Unduh template ${ROLE_LABELS[role]} lalu salin datanya ke sana.`
    );
  }

  const rows: RowInput[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const values: RowValues = {};
    let hasData = false;

    for (const key of keys) {
      const col = columnByKey.get(key);
      const text = col ? cellText(row.getCell(col).value) : "";
      values[key] = text;
      if (text) hasData = true;
    }

    if (!hasData) continue;

    // Baris contoh dari template tidak ikut diimpor.
    const isExample = keys.every(
      (key) => (values[key] ?? "") === FIELDS[key].example
    );
    if (isExample) continue;

    rows.push({ rowNumber, values });

    if (rows.length > MAX_IMPORT_ROWS) {
      throw new ImportError(
        `Maksimal ${MAX_IMPORT_ROWS} baris per unggahan. Bagi file menjadi beberapa bagian.`
      );
    }
  }

  if (rows.length === 0) {
    throw new ImportError(
      "Tidak ada data. Isi data mulai baris 2 pada sheet Data."
    );
  }

  return rows;
}

const NAVY = "FF1F3864";
const LIGHT = "FFD9E2F3";
const GREY = "FF7F7F7F";

/** Membuat file template Excel untuk satu peran. */
export async function buildTemplateWorkbook(
  role: AccountRole,
  classNames: string[]
) {
  const workbook = new ExcelJS.Workbook();
  const keys = CREATE_KEYS[role];
  const lastRow = MAX_IMPORT_ROWS + 1;

  const sheet = workbook.addWorksheet("Data", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  keys.forEach((key, index) => {
    const field = FIELDS[key];
    const col = index + 1;

    sheet.getColumn(col).width = Math.max(20, field.header.length + 8);

    const header = sheet.getCell(1, col);
    header.value = field.header;
    header.font = {
      name: "Arial",
      bold: true,
      color: { argb: field.required ? "FFFFFFFF" : NAVY },
    };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: field.required ? NAVY : LIGHT },
    };
    header.alignment = { horizontal: "center", vertical: "middle" };

    const example = sheet.getCell(2, col);
    example.value = field.example;
    example.font = { name: "Arial", italic: true, color: { argb: GREY } };

    if (field.textFormat) {
      for (let row = 2; row <= lastRow; row++) {
        sheet.getCell(row, col).numFmt = "@";
      }
    }
  });

  sheet.getRow(1).height = 24;

  // Kolom kelas memakai daftar kelas yang ada di sistem.
  if (role === "murid" && classNames.length > 0) {
    const list = workbook.addWorksheet("Daftar Kelas");
    list.getColumn(1).width = 28;
    list.getCell(1, 1).value = "Nama kelas";
    list.getCell(1, 1).font = { name: "Arial", bold: true };
    classNames.forEach((name, index) => {
      list.getCell(index + 2, 1).value = name;
    });

    const classCol = keys.indexOf("className") + 1;
    const formula = `'Daftar Kelas'!$A$2:$A$${classNames.length + 1}`;

    for (let row = 3; row <= lastRow; row++) {
      sheet.getCell(row, classCol).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [formula],
        showErrorMessage: true,
        errorTitle: "Kelas tidak dikenal",
        error: "Pilih kelas dari daftar.",
      };
    }
  }

  // Sheet petunjuk
  const guide = workbook.addWorksheet("Petunjuk");
  guide.getColumn(1).width = 20;
  guide.getColumn(2).width = 10;
  guide.getColumn(3).width = 24;
  guide.getColumn(4).width = 70;

  guide.getCell(1, 1).value = `Template impor akun ${ROLE_LABELS[role]}`;
  guide.getCell(1, 1).font = { name: "Arial", bold: true, size: 14 };

  const notes = [
    "Isi data di sheet Data, mulai baris 2. Baris contoh berwarna abu-abu boleh dibiarkan, tidak ikut diimpor.",
    "Jangan mengubah judul kolom di baris 1. Kolom biru tua wajib diisi, biru muda opsional.",
    "Password tidak perlu diisi. Sistem membuat password acak untuk setiap akun dan menampilkannya sekali setelah impor.",
    `Maksimal ${MAX_IMPORT_ROWS} baris per unggahan.`,
  ];
  if (role === "murid") {
    notes.push(
      "Username murid sama dengan NIS. Email dibuat otomatis oleh sistem."
    );
  }
  notes.forEach((note, index) => {
    const cell = guide.getCell(3 + index, 1);
    cell.value = note;
    cell.font = { name: "Arial" };
  });

  const tableTop = 3 + notes.length + 1;
  ["Kolom", "Wajib", "Contoh", "Keterangan"].forEach((title, index) => {
    const cell = guide.getCell(tableTop, index + 1);
    cell.value = title;
    cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  });

  keys.forEach((key, index) => {
    const field = FIELDS[key];
    const row = tableTop + 1 + index;
    const values = [
      field.header,
      field.required ? "Ya" : "Tidak",
      field.example,
      field.note,
    ];
    values.forEach((value, colIndex) => {
      const cell = guide.getCell(row, colIndex + 1);
      cell.value = value;
      cell.font = { name: "Arial" };
      cell.alignment = { vertical: "top", wrapText: true };
      if (colIndex === 2) cell.numFmt = "@";
    });
  });

  return workbook.xlsx.writeBuffer();
}
