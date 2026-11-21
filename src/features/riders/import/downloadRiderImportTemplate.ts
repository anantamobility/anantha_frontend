import * as XLSX from "xlsx";
import { RIDER_IMPORT_COLUMNS } from "./riderImportColumns";
import type { RiderImportCommitResponse } from "../api/riderImport.types";

function buildTemplateRows(): string[][] {
  const headers = RIDER_IMPORT_COLUMNS.map((col) => col.header);
  const exampleRow = RIDER_IMPORT_COLUMNS.map((col) => col.example ?? "");
  return [headers, exampleRow];
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsvContent(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function downloadRiderImportTemplateCsv(): void {
  const [headers, exampleRow] = buildTemplateRows();
  const csv = buildCsvContent(headers, [exampleRow]);
  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, "riders-import-template.csv");
}

export function downloadRiderImportTemplateXlsx(): void {
  const [headers, exampleRow] = buildTemplateRows();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "riders-import-template.xlsx");
}

/** One-time credentials export after successful rider import. */
export function downloadRiderImportCredentialsCsv(
  result: RiderImportCommitResponse,
  nameByPhone: Map<string, string>,
): void {
  const created = result.results.filter(
    (row) => row.ok && row.temporaryPassword && row.phoneNumber,
  );
  if (created.length === 0) return;

  const headers = ["Full Name", "Phone Number", "Temporary Password"];
  const rows = created.map((row) => [
    nameByPhone.get(row.phoneNumber!) ?? "",
    row.phoneNumber!,
    row.temporaryPassword!,
  ]);

  const csv = buildCsvContent(headers, rows);
  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, "rider-import-credentials.csv");
}
