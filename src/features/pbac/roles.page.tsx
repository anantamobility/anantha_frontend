import { useMemo, useState } from "react";
import {
  EntityFormDialog,
  FormActions,
  LoadingSkeleton,
  PageHeader,
} from "@/features/shared/components/common";
import { useRbac } from "@/features/shared/hooks/useRbac";
import type { Role } from "./api/pbac.api";
import { useRolesQuery } from "./hooks/useRolesQuery";
import { useRoleMutations } from "./hooks/useRoleMutations";

export default function RolesPage() {
  const { isAdmin } = useRbac();
  const rolesQuery = useRolesQuery();
  const { createMutation, renameMutation, permissionsMutation } = useRoleMutations();
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [renameTarget, setRenameTarget] = useState<Role | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [permTarget, setPermTarget] = useState<Role | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const roles = rolesQuery.data?.roles ?? [];
  const entities = rolesQuery.data?.entities ?? [];

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === permTarget?.id) ?? null,
    [roles, permTarget],
  );

  return (
    <div>
      <PageHeader
        title="Roles and permissions"
        description="Role definitions and permission assignments."

        actions={
          isAdmin ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setNewRoleName("");
                setCreateOpen(true);
              }}
            >
              Add role
            </button>
          ) : null
        }
      />

      {rolesQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <div>
                <p className="font-medium">{role.name}</p>
                <p className="text-xs text-muted-foreground">
                  {role.permissions.length} permissions
                </p>
              </div>
              {isAdmin ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-primary"
                    onClick={() => {
                      setRenameTarget(role);
                      setRenameValue(role.name);
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="text-xs text-primary"
                    onClick={() => {
                      setPermTarget(role);
                      setSelectedPerms(role.permissions.map((p) => p.id));
                    }}
                  >
                    Permissions
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <EntityFormDialog
        open={createOpen}
        title="Create role"
        onClose={() => setCreateOpen(false)}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await createMutation.mutateAsync(newRoleName.trim());
            setCreateOpen(false);
          }}
        >
          <label className="block text-sm">
            Name
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setCreateOpen(false)}
              loading={createMutation.isPending}
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!renameTarget}
        title="Rename role"
        onClose={() => setRenameTarget(null)}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!renameTarget) return;
            await renameMutation.mutateAsync({
              id: renameTarget.id,
              name: renameValue.trim(),
            });
            setRenameTarget(null);
          }}
        >
          <label className="block text-sm">
            Name
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setRenameTarget(null)}
              loading={renameMutation.isPending}
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!permTarget}
        title={selectedRole ? `Permissions — ${selectedRole.name}` : "Permissions"}
        onClose={() => setPermTarget(null)}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!permTarget) return;
            await permissionsMutation.mutateAsync({
              id: permTarget.id,
              permissions: selectedPerms,
            });
            setPermTarget(null);
          }}
        >
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {entities.map((entity) => (
              <div key={entity.name}>
                <p className="mb-2 text-sm font-medium">{entity.name}</p>
                <div className="grid grid-cols-2 gap-2">
                  {entity.actions.map((action) => {
                    const checked = selectedPerms.includes(action.id);
                    return (
                      <label key={action.id} className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedPerms((prev) =>
                              checked
                                ? prev.filter((id) => id !== action.id)
                                : [...prev, action.id],
                            )
                          }
                        />
                        {action.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setPermTarget(null)}
              loading={permissionsMutation.isPending}
              submitLabel="Save"
            />
          </div>
        </form>
      </EntityFormDialog>
    </div>
  );
}
