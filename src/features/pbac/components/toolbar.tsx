import { Loader2, Pencil, Plus, Save } from "lucide-react";

type ToolbarProps = {
  saving: boolean;
  canWrite: boolean;
  renameDisabled?: boolean;
  onAddRole: () => void;
  onRenameRole: () => void;
  onSave: () => void;
};

export default function Toolbar({
  saving,
  canWrite,
  renameDisabled = false,
  onAddRole,
  onRenameRole,
  onSave,
}: ToolbarProps) {
  if (!canWrite) return null;

  return (
    <div className="mb-8 flex justify-end gap-3 max-md:flex-col max-md:items-stretch">
      <button
        type="button"
        onClick={onAddRole}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
      >
        <Plus size={18} />
        Add Role
      </button>
      <button
        type="button"
        onClick={onRenameRole}
        disabled={renameDisabled}
        className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5 font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Pencil size={18} />
        Rename
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
