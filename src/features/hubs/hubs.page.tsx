import { useMemo, useState } from "react";
import type { Hub } from "@/features/shared/entities";
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
import { useHubsListQuery } from "./hooks/useHubsQuery";
import { useHubMutations } from "./hooks/useHubMutations";

const EMPTY_FORM = {
  name: "",
  city: "",
  state: "",
  contactPhone: "",
  contactEmail: "",
  isActive: true,
};

export default function HubsPage() {
  const { canManageMasterData } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Hub | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useHubsListQuery(page, 20, search);
  const { createMutation, updateMutation, deleteMutation } = useHubMutations();

  const hubs = listQuery.data?.hubs ?? [];
  const pagination = listQuery.data?.pagination;

  const columns = useMemo<DataTableColumn<Hub>[]>(
    () => [
      { id: "name", header: "Name", cell: (row) => row.name },
      { id: "code", header: "Code", cell: (row) => row.hubCode },
      {
        id: "location",
        header: "Location",
        cell: (row) => `${row.city}, ${row.state}`,
      },
      {
        id: "contact",
        header: "Contact",
        cell: (row) => row.contactPhone || row.contactEmail || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
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
                    name: row.name,
                    city: row.city,
                    state: row.state,
                    contactPhone: row.contactPhone ?? "",
                    contactEmail: row.contactEmail ?? "",
                    isActive: row.isActive,
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
    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      contactPhone: form.contactPhone.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      isActive: form.isActive,
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div>
      <PageHeader
        title="Hubs"
        description="Operating locations for fleet and staff."
        actions={
          canManageMasterData ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY_FORM);
                setFormOpen(true);
              }}
            >
              Add hub
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
          placeholder="Search hubs…"
        />
      </div>

      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={hubs} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="hubs"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit hub" : "Create hub"}
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Name
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              City
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              State
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                required
              />
            </label>
          </div>
          {editing ? (
            <p className="text-xs text-muted-foreground">
              Hub code: <span className="font-medium">{editing.hubCode}</span> (read-only)
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Hub code is generated from city and state on create.
            </p>
          )}
          <label className="block text-sm">
            Phone
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.contactPhone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, contactPhone: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.contactEmail}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, contactEmail: e.target.value }))
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
            />
            Active
          </label>
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
        title="Delete hub?"
        description="This removes the hub if it has no dependencies."
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
