import { useMemo, useState } from "react";
import type { Client } from "@/features/shared/entities";
import {
  ConfirmDialog,
  DataTable,
  EntityFormDialog,
  Field,
  FormActions,
  FormSection,
  LoadingSkeleton,
  PageHeader,
  PaginationBar,
  SearchBar,
  StatusBadge,
  inputClass,
  type DataTableColumn,
} from "@/features/shared/components/common";
import { useRbac } from "@/features/shared/hooks/useRbac";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError } from "@/features/shared/utils/notify";
import { emptyToNull } from "@/features/shared/utils/formValues";
import { getClient } from "./api/clients.api";
import { useClientsListQuery } from "./hooks/useClientsQuery";
import { useClientMutations } from "./hooks/useClientMutations";

const EMPTY = {
  clientCode: "",
  name: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phoneNumber: "",
  isActive: true,
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
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    statusMutation,
    generateDuesMutation,
  } = useClientMutations();

  const clients = listQuery.data?.clients ?? [];
  const pagination = listQuery.data?.pagination;

  const columns = useMemo<DataTableColumn<Client>[]>(
    () => [
      { id: "name", header: "Name", cell: (row) => row.name },
      {
        id: "code",
        header: "Code",
        cell: (row) => row.clientCode || "—",
      },
      {
        id: "company",
        header: "Company",
        cell: (row) => row.companyName || "—",
      },
      {
        id: "contact",
        header: "Contact",
        cell: (row) => row.phoneNumber || row.email || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (row) =>
          canWrite ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs text-primary"
                onClick={async () => {
                  try {
                    const detail = await getClient(row.id);
                    setEditing(detail);
                    setForm({
                      clientCode: detail.clientCode ?? "",
                      name: detail.name,
                      companyName: detail.companyName ?? "",
                      contactPerson: detail.contactPerson ?? "",
                      email: detail.email ?? "",
                      phoneNumber: detail.phoneNumber ?? "",
                      isActive: detail.isActive,
                    });
                    setFormOpen(true);
                  } catch (error) {
                    notifyError(getErrorMessage(error, "Failed to load client"));
                  }
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() =>
                  statusMutation.mutate({
                    id: row.id,
                    payload: { isActive: !row.isActive },
                  })
                }
              >
                {row.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => generateDuesMutation.mutate({ id: row.id })}
              >
                Generate dues
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
    [canWrite, generateDuesMutation, statusMutation],
  );

  const submit = async () => {
    const payload = {
      name: form.name.trim(),
      companyName: emptyToNull(form.companyName),
      contactPerson: emptyToNull(form.contactPerson),
      email: emptyToNull(form.email),
      phoneNumber: emptyToNull(form.phoneNumber),
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
      } else {
        await createMutation.mutateAsync({
          ...payload,
          clientCode: form.clientCode.trim() || undefined,
          isActive: form.isActive,
        });
      }
      setFormOpen(false);
      setEditing(null);
      setForm(EMPTY);
    } catch {
      // mutation notifies
    }
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        description="B2B clients for riders, rentals, and dues."
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
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search clients…"
        />
      </div>

      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={clients} rowKey={(row) => row.id} />
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
        title={editing ? "Edit client" : "Add client"}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          setForm(EMPTY);
        }}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <FormSection title="Identity">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Client code">
                <input
                  className={inputClass}
                  value={form.clientCode}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, clientCode: e.target.value }))
                  }
                  disabled={Boolean(editing)}
                  placeholder="Optional unique code"
                />
              </Field>
              <Field label="Company">
                <input
                  className={inputClass}
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Contact person">
                <input
                  className={inputClass}
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contactPerson: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            {!editing ? (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Active
              </label>
            ) : null}
          </FormSection>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => {
                setFormOpen(false);
                setEditing(null);
                setForm(EMPTY);
              }}
              loading={createMutation.isPending || updateMutation.isPending}
              submitLabel={editing ? "Save" : "Create"}
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
