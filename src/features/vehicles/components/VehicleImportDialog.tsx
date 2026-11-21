import { useRef, useState } from "react";
import { EntityFormDialog } from "@/features/shared/components/common";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError } from "@/features/shared/utils/notify";
import type {
  VehicleImportCommitResponse,
  VehicleImportRow,
  VehicleImportValidateResponse,
} from "../api/vehicleImport.types";
import {
  downloadVehicleImportTemplateCsv,
  downloadVehicleImportTemplateXlsx,
} from "../import/downloadVehicleImportTemplate";
import {
  getVehicleImportAcceptTypes,
  parseVehicleImportFile,
} from "../import/parseVehicleImportFile";
import { useVehicleImportMutations } from "../hooks/useVehicleImportMutations";

type VehicleImportDialogProps = {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
};

function resetFileInput(input: HTMLInputElement | null) {
  if (input) input.value = "";
}

export function VehicleImportDialog({
  open,
  onClose,
  onComplete,
}: VehicleImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateMutation, importMutation } = useVehicleImportMutations();

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<VehicleImportRow[]>([]);
  const [validateResult, setValidateResult] =
    useState<VehicleImportValidateResponse | null>(null);
  const [importResult, setImportResult] =
    useState<VehicleImportCommitResponse | null>(null);
  const [parsing, setParsing] = useState(false);

  const busy =
    parsing || validateMutation.isPending || importMutation.isPending;

  const resetState = () => {
    setFileName(null);
    setRows([]);
    setValidateResult(null);
    setImportResult(null);
    setParsing(false);
    resetFileInput(fileInputRef.current);
  };

  const handleClose = () => {
    if (busy) return;
    resetState();
    onClose();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setImportResult(null);
    setValidateResult(null);

    try {
      const parsed = await parseVehicleImportFile(file);
      if (parsed.length === 0) {
        throw new Error("No data rows found in the file.");
      }
      if (parsed.length > 500) {
        throw new Error("Import is limited to 500 rows per file.");
      }

      setFileName(file.name);
      setRows(parsed);

      const result = await validateMutation.mutateAsync(parsed);
      setValidateResult(result);
    } catch (error) {
      setFileName(null);
      setRows([]);
      setValidateResult(null);
      notifyError(getErrorMessage(error, "Failed to read import file"));
      resetFileInput(fileInputRef.current);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (rows.length === 0 || !validateResult || validateResult.summary.valid < 1) {
      return;
    }

    try {
      const result = await importMutation.mutateAsync(rows);
      setImportResult(result);
      onComplete?.();
    } catch {
      // mutation onError notifies
    }
  };

  const failedValidateRows =
    validateResult?.results.filter((r) => !r.ok) ?? [];
  const failedImportRows =
    importResult?.results.filter((r) => !r.ok) ?? [];

  return (
    <EntityFormDialog
      open={open}
      title="Import vehicles"
      onClose={handleClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={handleClose}
            disabled={busy}
          >
            Close
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
            onClick={handleImport}
            disabled={
              busy ||
              !validateResult ||
              validateResult.summary.valid < 1 ||
              Boolean(importResult)
            }
          >
            {importMutation.isPending
              ? "Importing…"
              : validateResult
                ? `Import ${validateResult.summary.valid} valid`
                : "Import"}
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          Create-only import. Required columns:{" "}
          <span className="font-medium text-foreground">
            Registration Number
          </span>{" "}
          and{" "}
          <span className="font-medium text-foreground">Hub Code</span> (not
          hub UUID). Status is set to IDLE by the server. Max 500 rows.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={downloadVehicleImportTemplateCsv}
            disabled={busy}
          >
            Template CSV
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={downloadVehicleImportTemplateXlsx}
            disabled={busy}
          >
            Template Excel
          </button>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Upload file
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={getVehicleImportAcceptTypes()}
            onChange={handleFileChange}
            disabled={busy}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5"
          />
          {fileName ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Selected: {fileName}
              {parsing || validateMutation.isPending
                ? " — validating…"
                : null}
            </p>
          ) : null}
        </div>

        {validateResult ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="font-medium text-foreground">Validation</p>
            <p className="mt-1 text-muted-foreground">
              {validateResult.summary.valid} valid /{" "}
              {validateResult.summary.invalid} invalid of{" "}
              {validateResult.summary.total} rows
            </p>
            {failedValidateRows.length > 0 ? (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
                {failedValidateRows.map((row) => (
                  <li key={`v-${row.rowIndex}`}>
                    Row {row.rowIndex + 1}: {row.errors.join("; ")}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-green-700">
                All rows look ready to import.
              </p>
            )}
          </div>
        ) : null}

        {importResult ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="font-medium text-foreground">Import result</p>
            <p className="mt-1 text-muted-foreground">
              {importResult.summary.created} created /{" "}
              {importResult.summary.failed} failed of{" "}
              {importResult.summary.total} rows
            </p>
            {failedImportRows.length > 0 ? (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-red-600">
                {failedImportRows.map((row) => (
                  <li key={`i-${row.rowIndex}`}>
                    Row {row.rowIndex + 1}:{" "}
                    {(row.errors ?? []).join("; ") || "Failed"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </EntityFormDialog>
  );
}
