import Papa from "papaparse";
import * as XLSX from "xlsx";
import { getStaffImportHeaderMap } from "./staffImportColumns";

export type StaffImportParsedRow = Record<string, string | null>;

function normalizeRowKeys(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
): StaffImportParsedRow {
  const normalized: StaffImportParsedRow = {};

  for (const [key, value] of Object.entries(row)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;

    const field = headerMap.get(trimmedKey.toLowerCase());
    if (!field) continue;

    if (value === null || value === undefined || value === "") {
      normalized[field] = null;
      continue;
    }

    const trimmed = String(value).trim();
    normalized[field] = trimmed === "" ? null : trimmed;
  }

  return normalized;
}

function isRowEmpty(row: StaffImportParsedRow): boolean {
  return Object.values(row).every((value) => value === null || value === "");
}

export async function parseStaffImportFile(
  file: File,
): Promise<StaffImportParsedRow[]> {
  const headerMap = getStaffImportHeaderMap();
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0]?.message ?? "Failed to parse CSV file.");
    }

    return parsed.data
      .map((row) => normalizeRowKeys(row, headerMap))
      .filter((row) => !isRowEmpty(row));
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Excel file has no sheets.");

    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    return json
      .map((row) => normalizeRowKeys(row, headerMap))
      .filter((row) => !isRowEmpty(row));
  }

  throw new Error("Unsupported file type. Upload a .csv or .xlsx file.");
}

export function getStaffImportAcceptTypes(): string {
  return ".csv,.xlsx,.xls";
}
