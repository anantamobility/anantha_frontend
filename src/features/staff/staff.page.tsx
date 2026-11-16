import { useMemo, useState } from "react";
import { useHubsQuery } from "@/features/shared/entities";
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
import type { StaffMember } from "./api/staff.api";
import { useStaffListQuery } from "./hooks/useStaffQuery";
import { useStaffMutations } from "./hooks/useStaffMutations";

const EMPTY = {
  fullName: "",
  gender: "MALE" as "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY",
  phoneNumber: "",
  email: "",
  password: "",
  roleId: "",
  hubId: "",
  department: "",
  jobTitle: "",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "SUSPENDED",
};

export default function StaffPage() {
  const { canManageMasterData } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useStaffListQuery(page, 20, search);
  const hubsQuery = useHubsQuery();
  const rolesQuery = useRolesQuery(canManageMasterData);
  const { createMutation, updateMutation, deleteMutation } = useStaffMutations();

  const staff = listQuery.data?.staff ?? [];
  const pagination = listQuery.data?.pagination;
  const roles = rolesQuery.data?.roles ?? [];

  const columns = useMemo<DataTableColumn<StaffMember>[]>(
    () => [
      { id: "name", header: "Name", cell: (row) => row.fullName },
      {
        id: "code",
        header: "Code",
        cell: (row) => row.employeeCode || "—",
      },
      {
        id: "phone",
        header: "Phone",
        cell: (row) => row.user?.phoneNumber ?? "—",
      },
      {
        id: "dept",
        header: "Department",
        cell: (row) => row.department || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: (row) =>
          canManageMasterData ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  setEditing(row);
                  setForm({
                    fullName: row.fullName,
                    gender: (row.gender as typeof EMPTY.gender) || "MALE",
                    phoneNumber: row.user?.phoneNumber ?? "",
                    email: row.user?.email ?? "",
                    password: "",
                    roleId: "",
                    hubId: row.hubId ?? "",
                    department: row.department ?? "",
                    jobTitle: row.jobTitle ?? "",
                    status: (row.status as typeof EMPTY.status) || "ACTIVE",
                  });
                  setFormOpen(true);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-xs text-destructive"
                onClick={() => setDeleteId(row.id)}
              >
                Delete
              </button>
            </div>
          ) : null,
      },
    ],
    [canManageMasterData],
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        payload: {
          fullName: form.fullName.trim(),
          gender: form.gender,
          hubId: form.hubId || null,
          department: form.department.trim() || null,
          jobTitle: form.jobTitle.trim() || null,
          status: form.status,
        },
      });
    } else {
      await createMutation.mutateAsync({
        fullName: form.fullName.trim(),
        gender: form.gender,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || null,
        password: form.password,
        roleId: form.roleId || undefined,
        hubId: form.hubId || null,
        department: form.department.trim() || null,
        jobTitle: form.jobTitle.trim() || null,
      });
    }
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Create operator accounts with roles (not via signup)."
        actions={
          canManageMasterData ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY);
                setFormOpen(true);
              }}
            >
              Add staff
            </button>
          ) : null
        }
      />
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search staff…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={staff} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="staff"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit staff" : "Create staff"}
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Full name
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            Gender
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.gender}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  gender: e.target.value as typeof EMPTY.gender,
                }))
              }
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </label>
          {!editing ? (
            <>
              <label className="block text-sm">
                Phone
                <input
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="block text-sm">
                Email
                <input
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                Password
                <input
                  type="password"
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  minLength={8}
                />
              </label>
              <label className="block text-sm">
                Role
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.roleId}
                  onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
                  required
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="block text-sm">
              Status
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    status: e.target.value as typeof EMPTY.status,
                  }))
                }
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </label>
          )}
          <label className="block text-sm">
            Hub
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.hubId}
              onChange={(e) => setForm((p) => ({ ...p, hubId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {(hubsQuery.data?.hubs ?? []).map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Department
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Job title
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.jobTitle}
                onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setFormOpen(false)}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </form>
      </EntityFormDialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete staff?"
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
