type FormActionsProps = {
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
};

export function FormActions({
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  disabled = false,
}: FormActionsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-border px-3 py-2 text-sm"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={loading || disabled}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </>
  );
}
