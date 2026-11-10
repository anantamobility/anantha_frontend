import { useMemo, useState } from "react";
import type { Vehicle } from "@/features/shared/entities";
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
import { useVehiclesListQuery } from "./hooks/useVehiclesQuery";
import { useVehicleMutations } from "./hooks/useVehicleMutations";

const EMPTY = {
  registrationNumber: "",
  hubId: "",
  make: "",
  model: "",
  year: "",
  isActive: true,
};

export default function VehiclesPage() {
  const { canManageMasterData } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useVehiclesListQuery(page, 20, search);
  const hubsQuery = useHubsQuery();
  const { createMutation, updateMutation, deleteMutation } = useVehicleMutations();
  const vehicles = listQuery.data?.vehicles ?? [];
  const pagination = listQuery.data?.pagination;
  const hubs = hubsQuery.data?.hubs ?? [];

  const columns = useMemo<DataTableColumn<Vehicle>[]>(
    () => [
      { id: "reg", header: "Registration", cell: (row) => row.registrationNumber },
      {
        id: "vehicle",
        header: "Make / Model",
        cell: (row) => [row.make, row.model].filter(Boolean).join(" ") || "—",
      },
      { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
      {
        id: "active",
        header: "Active",
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
                    registrationNumber: row.registrationNumber,
                    hubId: row.hubId ?? "",
                    make: row.make ?? "",
                    model: row.model ?? "",
                    year: row.year != null ? String(row.year) : "",
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
      registrationNumber: form.registrationNumber.trim(),
      hubId: form.hubId || null,
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      year: form.year ? Number(form.year) : null,
      isActive: form.isActive,
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Fleet inventory by hub."
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
              Add vehicle
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
          placeholder="Search vehicles…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={vehicles} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="vehicles"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit vehicle" : "Create vehicle"}
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Registration number
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.registrationNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, registrationNumber: e.target.value }))
              }
              required
            />
          </label>
          <label className="block text-sm">
            Hub
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.hubId}
              onChange={(e) => setForm((prev) => ({ ...prev, hubId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Make
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.make}
                onChange={(e) => setForm((prev) => ({ ...prev, make: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Model
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.model}
                onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-sm">
            Year
            <input
              type="number"
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.year}
              onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
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
        title="Delete vehicle?"
        description="Soft-deletes the vehicle if allowed."
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
