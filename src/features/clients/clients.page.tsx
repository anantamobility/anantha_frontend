import { useMemo, useState } from "react";
import type { Client } from "@/features/shared/entities";
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
import { useClientsListQuery } from "./hooks/useClientsQuery";
import { useClientMutations } from "./hooks/useClientMutations";

const EMPTY = {
  type: "CORPORATE" as "INDIVIDUAL" | "CORPORATE",
  name: "",
  clientCode: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phoneNumber: "",
};

export default function ClientsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useClientsListQuery(page, 20, search);
  const { createMutation, updateMutation, deleteMutation } = useClientMutations();
  const clients = listQuery.data?.clients ?? [];
  const pagination = listQuery.data?.pagination;

  const columns = useMemo<DataTableColumn<Client>[]>(
    () => [
      { id: "code", header: "Code", cell: (row) => row.clientCode },
      { id: "name", header: "Name", cell: (row) => row.name },
      { id: "type", header: "Type", cell: (row) => row.type },
      { id: "phone", header: "Phone", cell: (row) => row.phoneNumber || "—" },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
      },
      {
        id: "actions",
        header: "",
        cell: (row) =>
          canWrite ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  setEditing(row);
                  setForm({
                    type: row.type as "INDIVIDUAL" | "CORPORATE",
                    name: row.name,
                    clientCode: row.clientCode,
                    companyName: row.companyName ?? "",
                    contactPerson: "",
                    email: row.email ?? "",
                    phoneNumber: row.phoneNumber ?? "",
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
    [canWrite],
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      type: form.type,
      name: form.name.trim(),
      companyName: form.companyName.trim() || null,
      contactPerson: form.contactPerson.trim() || null,
      email: form.email.trim() || null,
      phoneNumber: form.phoneNumber.trim() || null,
      ...(editing ? {} : { clientCode: form.clientCode.trim() || undefined }),
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
        title="Clients"
        description="B2B and individual rental customers."
        actions={
          canWrite ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY);
                setFormOpen(true);
              }}
            >
              Add client
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
          placeholder="Search clients…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={clients} rowKey={(r) => r.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="clients"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit client" : "Create client"}
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Type
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.type}
              onChange={(e) =>
                setForm((p) => ({ ...p, type: e.target.value as typeof EMPTY.type }))
              }
            >
              <option value="CORPORATE">Corporate</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
          </label>
          <label className="block text-sm">
            Name
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </label>
          {!editing ? (
            <label className="block text-sm">
              Client code (optional)
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.clientCode}
                onChange={(e) => setForm((p) => ({ ...p, clientCode: e.target.value }))}
              />
            </label>
          ) : null}
          <label className="block text-sm">
            Company
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.companyName}
              onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            Phone
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.phoneNumber}
              onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
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
        title="Delete client?"
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
