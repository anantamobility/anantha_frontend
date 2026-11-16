import { useMemo, useState } from "react";
import {
  ConfirmDialog,
  DataTable,
  EntityFormDialog,
  FormActions,
  LoadingSkeleton,
  PageHeader,
  PaginationBar,
  SearchBar,
  StatusBadge,
  type DataTableColumn,
} from "@/features/shared/components/common";
import { useRbac } from "@/features/shared/hooks/useRbac";
import { useRolesQuery } from "@/features/pbac/hooks/useRolesQuery";
import type { AppUser } from "./api/users.api";
import { useUsersListQuery } from "./hooks/useUsersQuery";
import { useUserMutations } from "./hooks/useUserMutations";

function displayName(user: AppUser) {
  return (
    user.staffProfile?.fullName ||
    user.riderProfile?.fullName ||
    user.phoneNumber
  );
}

export default function UsersPage() {
  const { isAdmin, canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState({ phoneNumber: "", email: "" });
  const [roleTarget, setRoleTarget] = useState<AppUser | null>(null);
  const [roleId, setRoleId] = useState("");
  const [statusTarget, setStatusTarget] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<"ONBOARDING" | "ACTIVE" | "SUSPENDED">(
    "ACTIVE",
  );
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useUsersListQuery(page, 20, search);
  const rolesQuery = useRolesQuery(isAdmin || canWrite);
  const {
    updateMutation,
    roleMutation,
    statusMutation,
    revokeMutation,
    deleteMutation,
    resetPasswordMutation,
  } = useUserMutations();

  const users = listQuery.data?.users ?? [];
  const pagination = listQuery.data?.pagination;
  const roles = rolesQuery.data?.roles ?? [];

  const columns = useMemo<DataTableColumn<AppUser>[]>(
    () => [
      { id: "name", header: "Name", cell: (row) => displayName(row) },
      { id: "phone", header: "Phone", cell: (row) => row.phoneNumber },
      { id: "role", header: "Role", cell: (row) => row.role?.name ?? "—" },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: (row) => (
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  setEditTarget(row);
                  setEditForm({
                    phoneNumber: row.phoneNumber,
                    email: row.email ?? "",
                  });
                }}
              >
                Edit
              </button>
            ) : null}
            {isAdmin ? (
              <>
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() => {
                    setRoleTarget(row);
                    setRoleId(row.roleId);
                  }}
                >
                  Role
                </button>
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() => {
                    setStatusTarget(row);
                    setStatus(row.status as "ONBOARDING" | "ACTIVE" | "SUSPENDED");
                  }}
                >
                  Status
                </button>
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() => revokeMutation.mutate(row.id)}
                >
                  Revoke
                </button>
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() => {
                    setResetTarget(row);
                    setNewPassword("");
                  }}
                >
                  Reset pw
                </button>
                <button
                  type="button"
                  className="text-xs text-destructive"
                  onClick={() => setDeleteId(row.id)}
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [canWrite, isAdmin, revokeMutation],
  );

  return (
    <div>
      <PageHeader
        title="Users"
        description="Account credentials, roles, and sessions."
      />
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search users…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={users} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="users"
          />
        </>
      )}

      <EntityFormDialog
        open={!!editTarget}
        title="Edit user contact"
        onClose={() => setEditTarget(null)}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!editTarget) return;
            await updateMutation.mutateAsync({
              id: editTarget.id,
              payload: {
                phoneNumber: editForm.phoneNumber.trim(),
                email: editForm.email.trim() || null,
              },
            });
            setEditTarget(null);
          }}
        >
          <label className="block text-sm">
            Phone
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={editForm.phoneNumber}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, phoneNumber: e.target.value }))
              }
              required
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={editForm.email}
              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setEditTarget(null)}
              loading={updateMutation.isPending}
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!roleTarget}
        title="Assign role"
        onClose={() => setRoleTarget(null)}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!roleTarget) return;
            await roleMutation.mutateAsync({
              id: roleTarget.id,
              payload: { roleId },
            });
            setRoleTarget(null);
          }}
        >
          <label className="block text-sm">
            Role
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setRoleTarget(null)}
              loading={roleMutation.isPending}
              submitLabel="Assign"
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!statusTarget}
        title="Change user status"
        onClose={() => setStatusTarget(null)}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!statusTarget) return;
            await statusMutation.mutateAsync({
              id: statusTarget.id,
              payload: { status },
            });
            setStatusTarget(null);
          }}
        >
          <label className="block text-sm">
            Status
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "ONBOARDING" | "ACTIVE" | "SUSPENDED")
              }
            >
              <option value="ONBOARDING">ONBOARDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setStatusTarget(null)}
              loading={statusMutation.isPending}
              submitLabel="Update"
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!resetTarget}
        title={
          resetTarget
            ? `Reset password — ${displayName(resetTarget)}`
            : "Reset password"
        }
        onClose={() => setResetTarget(null)}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!resetTarget) return;
            await resetPasswordMutation.mutateAsync({
              id: resetTarget.id,
              newPassword,
            });
            setResetTarget(null);
            setNewPassword("");
          }}
        >
          <label className="block text-sm">
            New password
            <input
              type="password"
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            8+ characters with a letter and a digit. Active sessions are revoked.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setResetTarget(null)}
              loading={resetPasswordMutation.isPending}
              submitLabel="Reset"
            />
          </div>
        </form>
      </EntityFormDialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete user?"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteMutation.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
