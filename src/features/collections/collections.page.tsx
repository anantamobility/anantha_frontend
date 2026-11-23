import { useEffect, useMemo, useState } from "react";
import type { Collection, RentalDue } from "@/features/shared/entities";
import {
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
import { emptyToNull } from "@/features/shared/utils/formValues";
import { listRentals, listRentalDues } from "@/features/rentals/api/rentals.api";
import { getCollection } from "./api/collections.api";
import { useCollectionsListQuery } from "./hooks/useCollectionsQuery";
import { useCollectionMutations } from "./hooks/useCollectionMutations";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError } from "@/features/shared/utils/notify";

const EMPTY = {
  rentalId: "",
  rentalDueId: "",
  amount: "",
  paymentMethod: "CASH" as
    | "CASH"
    | "UPI"
    | "CARD"
    | "BANK_TRANSFER"
    | "CHEQUE"
    | "OTHER",
  referenceNumber: "",
  notes: "",
};

function money(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

export default function CollectionsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [rentalOptions, setRentalOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [dues, setDues] = useState<RentalDue[]>([]);
  const [duesLoading, setDuesLoading] = useState(false);
  const [detail, setDetail] = useState<Collection | null>(null);

  const listQuery = useCollectionsListQuery(page, 20, search);
  const { createMutation } = useCollectionMutations();

  const collections = listQuery.data?.collections ?? [];
  const pagination = listQuery.data?.pagination;

  useEffect(() => {
    if (!formOpen) return;
    listRentals({ page: 1, limit: 100 })
      .then((result) => {
        setRentalOptions(
          result.rentals.map((rental) => ({
            id: rental.id,
            label: `${rental.rentalNumber || rental.id.slice(0, 8)} · ${
              rental.client?.name || "—"
            }`,
          })),
        );
      })
      .catch((error) =>
        notifyError(getErrorMessage(error, "Failed to load rentals")),
      );
  }, [formOpen]);

  useEffect(() => {
    if (!form.rentalId) {
      setDues([]);
      return;
    }
    let cancelled = false;
    setDuesLoading(true);
    listRentalDues(form.rentalId, { page: 1, limit: 100 })
      .then((result) => {
        if (!cancelled) setDues(result.dues);
      })
      .catch((error) =>
        notifyError(getErrorMessage(error, "Failed to load dues")),
      )
      .finally(() => {
        if (!cancelled) setDuesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.rentalId]);

  const columns = useMemo<DataTableColumn<Collection>[]>(
    () => [
      {
        id: "amount",
        header: "Amount",
        cell: (row) => money(row.amount),
      },
      {
        id: "method",
        header: "Method",
        cell: (row) => row.paymentMethod,
      },
      {
        id: "purpose",
        header: "Purpose",
        cell: (row) => row.purpose || "—",
      },
      {
        id: "reference",
        header: "Reference",
        cell: (row) => row.referenceNumber || "—",
      },
      {
        id: "received",
        header: "Received",
        cell: (row) => row.receivedAt?.slice(0, 10) || "—",
      },
      {
        id: "actions",
        header: "",
        cell: (row) => (
          <button
            type="button"
            className="text-xs text-primary"
            onClick={async () => {
              try {
                setDetail(await getCollection(row.id));
              } catch (error) {
                notifyError(
                  getErrorMessage(error, "Failed to load collection"),
                );
              }
            }}
          >
            View
          </button>
        ),
      },
    ],
    [],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMutation.mutateAsync({
      rentalDueId: form.rentalDueId,
      amount: form.amount.trim(),
      paymentMethod: form.paymentMethod,
      referenceNumber: emptyToNull(form.referenceNumber),
      notes: emptyToNull(form.notes),
    });
    setFormOpen(false);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        title="Collections"
        description="Record rent payments against open dues."
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

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search collections…"
        />
      </div>

      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={collections}
            rowKey={(row) => row.id}
          />
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
        <form className="space-y-4" onSubmit={submit}>
          <FormSection title="Due & payment">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rental">
                <select
                  className={inputClass}
                  value={form.rentalId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      rentalId: e.target.value,
                      rentalDueId: "",
                    }))
                  }
                  required
                >
                  <option value="">Select rental</option>
                  {rentalOptions.map((rental) => (
                    <option key={rental.id} value={rental.id}>
                      {rental.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rental due">
                <select
                  className={inputClass}
                  value={form.rentalDueId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      rentalDueId: e.target.value,
                    }))
                  }
                  required
                  disabled={!form.rentalId || duesLoading}
                >
                  <option value="">
                    {duesLoading ? "Loading dues…" : "Select due"}
                  </option>
                  {dues.map((due) => (
                    <option key={due.id} value={due.id}>
                      {due.dueDate?.slice(0, 10)} · outstanding{" "}
                      {money(due.outstandingAmount)} · {due.status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Amount">
                <input
                  className={inputClass}
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Payment method">
                <select
                  className={inputClass}
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target
                        .value as typeof prev.paymentMethod,
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
              </Field>
              <Field label="Reference">
                <input
                  className={inputClass}
                  value={form.referenceNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      referenceNumber: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                className={inputClass}
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </Field>
          </FormSection>
          <div className="flex justify-end gap-2">
            <FormActions
              onCancel={() => setFormOpen(false)}
              loading={createMutation.isPending}
              submitLabel="Record"
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!detail}
        title="Collection detail"
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Amount:</span>{" "}
              {money(detail.amount)}
            </p>
            <p>
              <span className="text-muted-foreground">Method:</span>{" "}
              {detail.paymentMethod}
            </p>
            <p>
              <span className="text-muted-foreground">Purpose:</span>{" "}
              {detail.purpose || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Reference:</span>{" "}
              {detail.referenceNumber || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Received:</span>{" "}
              {detail.receivedAt?.slice(0, 19) || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Due:</span>{" "}
              {detail.rentalDueId || "—"}
            </p>
            {detail.notes ? (
              <p>
                <span className="text-muted-foreground">Notes:</span>{" "}
                {detail.notes}
              </p>
            ) : null}
            {detail.purpose ? (
              <StatusBadge status={detail.purpose} />
            ) : null}
          </div>
        ) : null}
      </EntityFormDialog>
    </div>
  );
}
