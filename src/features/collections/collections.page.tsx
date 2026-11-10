import { useMemo, useState } from "react";
import {
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
import { formatMoney } from "@/features/shared/utils/money";
import { useRbac } from "@/features/shared/hooks/useRbac";
import type { Collection } from "./api/collections.api";
import { useCollectionMutations } from "./hooks/useCollectionMutations";
import {
  useActiveRentalsForCollectionQuery,
  useCollectionsListQuery,
} from "./hooks/useCollectionsQuery";

const EMPTY = {
  rentalId: "",
  amount: "",
  paymentMethod: "UPI" as
    | "CASH"
    | "UPI"
    | "CARD"
    | "BANK_TRANSFER"
    | "CHEQUE"
    | "OTHER",
  referenceNumber: "",
  notes: "",
  status: "CLEARED" as "PENDING" | "CLEARED",
};

export default function CollectionsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const listQuery = useCollectionsListQuery(page, 20, search, status);
  const rentalsQuery = useActiveRentalsForCollectionQuery(formOpen || canWrite);
  const { createMutation } = useCollectionMutations();

  const collections = listQuery.data?.collections ?? [];
  const pagination = listQuery.data?.pagination;
  const activeRentals = rentalsQuery.data ?? [];

  const columns = useMemo<DataTableColumn<Collection>[]>(
    () => [
      {
        id: "rental",
        header: "Rental",
        cell: (row) => row.rental?.rentalNumber ?? row.rentalId.slice(0, 8),
      },
      {
        id: "payer",
        header: "Payer",
        cell: (row) => row.rider?.fullName || row.client?.name || "—",
      },
      {
        id: "amount",
        header: "Amount",
        cell: (row) => formatMoney(row.amount, row.currency || "INR"),
      },
      { id: "method", header: "Method", cell: (row) => row.paymentMethod },
      {
        id: "received",
        header: "Received",
        cell: (row) => row.receivedAt?.slice(0, 10) ?? "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMutation.mutateAsync({
      rentalId: form.rentalId,
      amount: form.amount,
      paymentMethod: form.paymentMethod,
      referenceNumber: form.referenceNumber.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    });
    setFormOpen(false);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        title="Collections"
        description="Record payments and allocate them against open dues."
        actions={
          canWrite ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setForm(EMPTY);
                setFormOpen(true);
              }}
            >
              Record collection
            </button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search collections…"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="CLEARED">Cleared</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
          <option value="REVERSED">Reversed</option>
        </select>
      </div>

      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={collections} rowKey={(r) => r.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="collections"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title="Record collection"
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Active rental
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.rentalId}
              onChange={(e) => setForm((p) => ({ ...p, rentalId: e.target.value }))}
              required
            >
              <option value="">Select rental</option>
              {activeRentals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rentalNumber} · {r.client?.name ?? "—"}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Amount
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              Method
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    paymentMethod: e.target.value as typeof form.paymentMethod,
                  }))
                }
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            Reference
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.referenceNumber}
              onChange={(e) =>
                setForm((p) => ({ ...p, referenceNumber: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            Status
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as "PENDING" | "CLEARED",
                }))
              }
            >
              <option value="CLEARED">Cleared (allocate to dues)</option>
              <option value="PENDING">Pending</option>
            </select>
          </label>
          <label className="block text-sm">
            Notes
            <textarea
              className="mt-1 min-h-20 w-full rounded-lg border border-border px-3 py-2"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setFormOpen(false)}
              loading={createMutation.isPending}
              submitLabel="Record"
            />
          </div>
        </form>
      </EntityFormDialog>
    </div>
  );
}
