import * as XLSX from "xlsx";
import { STAFF_IMPORT_COLUMNS } from "./staffImportColumns";
import type { StaffImportCommitResponse } from "../api/staffImport.types";

function buildTemplateRows(): string[][] {
  const headers = STAFF_IMPORT_COLUMNS.map((col) => col.header);
  const exampleRow = STAFF_IMPORT_COLUMNS.map((col) => col.example ?? "");
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

export function downloadStaffImportTemplateCsv(): void {
  const [headers, exampleRow] = buildTemplateRows();
  const csv = buildCsvContent(headers, [exampleRow]);
  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, "staff-import-template.csv");
}

export function downloadStaffImportTemplateXlsx(): void {
  const [headers, exampleRow] = buildTemplateRows();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "staff-import-template.xlsx");
}

/** One-time credentials export after successful staff import. */
export function downloadStaffImportCredentialsCsv(
  result: StaffImportCommitResponse,
): void {
  const created = result.results.filter(
    (row) => row.ok && row.temporaryPassword && row.phoneNumber,
  );
  if (created.length === 0) return;

  const headers = ["Full Name", "Phone Number", "Temporary Password"];
  const rows = created.map((row) => [
    row.fullName ?? "",
    row.phoneNumber!,
    row.temporaryPassword!,
  ]);

  const csv = buildCsvContent(headers, rows);
  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, "staff-import-credentials.csv");
}
