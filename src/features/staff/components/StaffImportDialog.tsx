import { useRef, useState } from "react";
import { EntityFormDialog } from "@/features/shared/components/common";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError } from "@/features/shared/utils/notify";
import type {
  StaffImportCommitResponse,
  StaffImportRow,
  StaffImportValidateResponse,
} from "../api/staffImport.types";
import {
  downloadStaffImportCredentialsCsv,
  downloadStaffImportTemplateCsv,
  downloadStaffImportTemplateXlsx,
} from "../import/downloadStaffImportTemplate";
import {
  getStaffImportAcceptTypes,
  parseStaffImportFile,
} from "../import/parseStaffImportFile";
import { useStaffImportMutations } from "../hooks/useStaffImportMutations";

type StaffImportDialogProps = {
  open: boolean;
  onClose: () => void;
};

function resetFileInput(input: HTMLInputElement | null) {
  if (input) input.value = "";
}

export function StaffImportDialog({ open, onClose }: StaffImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { validateMutation, importMutation } = useStaffImportMutations();

  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<StaffImportRow[]>([]);
  const [validateResult, setValidateResult] =
    useState<StaffImportValidateResponse | null>(null);
  const [importResult, setImportResult] =
    useState<StaffImportCommitResponse | null>(null);
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
      const parsed = await parseStaffImportFile(file);
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
    } catch {
      // mutation onError notifies
    }
  };

  const failedValidateRows =
    validateResult?.results.filter((row) => !row.ok) ?? [];
  const failedImportRows =
    importResult?.results.filter((row) => !row.ok) ?? [];
  const createdWithPasswords =
    importResult?.results.filter(
      (row) => row.ok && row.temporaryPassword && row.phoneNumber,
    ) ?? [];

  return (
    <EntityFormDialog
      open={open}
      title="Import staff"
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
          Create-only import. Required:{" "}
          <span className="font-medium text-foreground">Full Name</span>,{" "}
          <span className="font-medium text-foreground">Gender</span>,{" "}
          <span className="font-medium text-foreground">Phone Number</span>,{" "}
          <span className="font-medium text-foreground">Role Name</span>{" "}
          (ADMIN or SUPERVISOR). Use Hub Code (not UUID). Passwords are generated
          by the server. Status defaults to ACTIVE. Max 500 rows.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={downloadStaffImportTemplateCsv}
            disabled={busy}
          >
            Template CSV
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={downloadStaffImportTemplateXlsx}
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
            accept={getStaffImportAcceptTypes()}
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

            {createdWithPasswords.length > 0 ? (
              <div className="mt-3 space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  Temporary passwords are shown once. Download the credentials
                  CSV before closing this dialog.
                </p>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  onClick={() =>
                    downloadStaffImportCredentialsCsv(importResult)
                  }
                >
                  Download credentials CSV
                </button>
              </div>
            ) : null}

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
