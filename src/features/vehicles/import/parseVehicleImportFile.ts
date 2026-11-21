import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  getVehicleImportCoerceMap,
  getVehicleImportHeaderMap,
} from "./vehicleImportColumns";

export type VehicleImportParsedRow = Record<string, string | number | boolean | null>;

function coerceValue(
  field: string,
  value: string | number | null,
  coerceMap: Map<string, "number" | "boolean">,
): string | number | boolean | null {
  if (value === null || value === "") return null;

  const kind = coerceMap.get(field);
  if (!kind) {
    return typeof value === "number" ? value : String(value).trim();
  }

  if (kind === "number") {
    const num = typeof value === "number" ? value : Number(String(value).trim());
    return Number.isFinite(num) ? num : null;
  }

  const raw = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(raw)) return true;
  if (["false", "0", "no", "n"].includes(raw)) return false;
  return null;
}

function normalizeRowKeys(
  row: Record<string, unknown>,
  headerMap: Map<string, string>,
  coerceMap: Map<string, "number" | "boolean">,
): VehicleImportParsedRow {
  const normalized: VehicleImportParsedRow = {};

  for (const [key, value] of Object.entries(row)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) continue;

    const field = headerMap.get(trimmedKey.toLowerCase());
    if (!field) continue;

    if (value === null || value === undefined || value === "") {
      normalized[field] = null;
      continue;
    }

    const asPrimitive =
      typeof value === "number" || typeof value === "boolean"
        ? value
        : String(value).trim();

    if (typeof asPrimitive === "boolean") {
      normalized[field] = asPrimitive;
      continue;
    }

    normalized[field] = coerceValue(field, asPrimitive, coerceMap);
  }

  return normalized;
}

function isRowEmpty(row: VehicleImportParsedRow): boolean {
  return Object.values(row).every((v) => v === null || v === "");
}

export async function parseVehicleImportFile(
  file: File,
): Promise<VehicleImportParsedRow[]> {
  const headerMap = getVehicleImportHeaderMap();
  const coerceMap = getVehicleImportCoerceMap();
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0]?.message ?? "Failed to parse CSV file.");
    }

    return parsed.data
      .map((row) => normalizeRowKeys(row, headerMap, coerceMap))
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
      .map((row) => normalizeRowKeys(row, headerMap, coerceMap))
      .filter((row) => !isRowEmpty(row));
  }

  throw new Error("Unsupported file type. Upload a .csv or .xlsx file.");
}

export function getVehicleImportAcceptTypes(): string {
  return ".csv,.xlsx,.xls";
}
