import { useMemo, useState } from "react";
import type { Rider } from "@/features/shared/entities";
import { useClientsQuery, useHubsQuery } from "@/features/shared/entities";
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
import { useRidersListQuery } from "./hooks/useRidersQuery";
import { useRiderMutations } from "./hooks/useRiderMutations";

const EMPTY = {
  fullName: "",
  phoneNumber: "",
  email: "",
  rentalType: "B2C" as "B2C" | "B2B",
  b2cMode: "AML_RIDER" as "AML_RIDER" | "INDIVIDUAL_RIDER",
  b2bRiderMgmt: "CLIENT_MANAGED" as "CLIENT_MANAGED" | "AML_MANAGED",
  clientId: "",
  hubId: "",
};

export default function RidersPage() {
  const { canManageMasterData } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useRidersListQuery(page, 20, search);
  const hubsQuery = useHubsQuery();
  const clientsQuery = useClientsQuery();
  const { createMutation, updateMutation, deleteMutation } = useRiderMutations();
  const riders = listQuery.data?.riders ?? [];
  const pagination = listQuery.data?.pagination;

  const columns = useMemo<DataTableColumn<Rider>[]>(
    () => [
      { id: "name", header: "Name", cell: (row) => row.fullName },
      { id: "phone", header: "Phone", cell: (row) => row.phoneNumber },
      { id: "type", header: "Type", cell: (row) => row.rentalType },
      { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
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
                    phoneNumber: row.phoneNumber,
                    email: row.email ?? "",
                    rentalType: (row.rentalType as "B2C" | "B2B") || "B2C",
                    b2cMode: (row.b2cMode as typeof EMPTY.b2cMode) || "AML_RIDER",
                    b2bRiderMgmt: "CLIENT_MANAGED",
                    clientId: row.clientId ?? "",
                    hubId: row.hubId ?? "",
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
      fullName: form.fullName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || null,
      rentalType: form.rentalType,
      b2cMode: form.rentalType === "B2C" ? form.b2cMode : null,
      b2bRiderMgmt: form.rentalType === "B2B" ? form.b2bRiderMgmt : null,
      clientId: form.rentalType === "B2B" ? form.clientId || null : null,
      hubId: form.hubId || null,
    };
    if (editing) await updateMutation.mutateAsync({ id: editing.id, payload });
    else await createMutation.mutateAsync(payload);
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        title="Riders"
        description="Driver / rider master data."
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
              Add rider
            </button>
          ) : null
        }
      />
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search riders…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={riders} rowKey={(r) => r.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="riders"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit rider" : "Create rider"}
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
            Phone
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.phoneNumber}
              onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
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
            Rental type
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.rentalType}
              onChange={(e) =>
                setForm((p) => ({ ...p, rentalType: e.target.value as "B2C" | "B2B" }))
              }
            >
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
          </label>
          {form.rentalType === "B2C" ? (
            <label className="block text-sm">
              B2C mode
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.b2cMode}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    b2cMode: e.target.value as typeof EMPTY.b2cMode,
                  }))
                }
              >
                <option value="AML_RIDER">AML rider</option>
                <option value="INDIVIDUAL_RIDER">Individual rider</option>
              </select>
            </label>
          ) : (
            <>
              <label className="block text-sm">
                B2B rider management
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.b2bRiderMgmt}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      b2bRiderMgmt: e.target.value as typeof EMPTY.b2bRiderMgmt,
                    }))
                  }
                >
                  <option value="CLIENT_MANAGED">Client managed</option>
                  <option value="AML_MANAGED">AML managed</option>
                </select>
              </label>
              <label className="block text-sm">
                Client
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.clientId}
                  onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
                  required
                >
                  <option value="">Select client</option>
                  {(clientsQuery.data?.clients ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="block text-sm">
            Hub
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.hubId}
              onChange={(e) => setForm((p) => ({ ...p, hubId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {(hubsQuery.data?.hubs ?? []).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
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
        title="Delete rider?"
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
