import * as XLSX from "xlsx";
import { VEHICLE_IMPORT_COLUMNS } from "./vehicleImportColumns";

function buildTemplateRows(): string[][] {
  const headers = VEHICLE_IMPORT_COLUMNS.map((c) => c.header);
  const exampleRow = VEHICLE_IMPORT_COLUMNS.map((c) => c.example ?? "");
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

export function downloadVehicleImportTemplateCsv(): void {
  const [headers, exampleRow] = buildTemplateRows();
  const csv = buildCsvContent(headers, [exampleRow]);
  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, "vehicles-import-template.csv");
}

export function downloadVehicleImportTemplateXlsx(): void {
  const [headers, exampleRow] = buildTemplateRows();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "vehicles-import-template.xlsx");
}
