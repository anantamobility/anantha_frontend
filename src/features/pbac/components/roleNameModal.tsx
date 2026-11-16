import { Loader2, X } from "lucide-react";

type RoleNameModalProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  submittingLabel: string;
  roleName: string;
  submitting: boolean;
  onRoleNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function RoleNameModal({
  open,
  title,
  submitLabel,
  submittingLabel,
  roleName,
  submitting,
  onRoleNameChange,
  onClose,
  onSubmit,
}: RoleNameModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 max-md:items-end max-md:p-0">
      <div className="w-96 max-w-[90vw] rounded-lg border border-border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-foreground">
            Role Name
          </label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => onRoleNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            placeholder="e.g., Supervisor, Analyst"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border px-4 py-2 text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
