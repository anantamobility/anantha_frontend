import { useMemo, useState } from "react";
import type { RateCard } from "@/features/shared/entities";
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
import { formatMoney } from "@/features/shared/utils/money";
import { useRbac } from "@/features/shared/hooks/useRbac";
import { useRateCardsListQuery } from "./hooks/useRateCardsQuery";
import { useRateCardMutations } from "./hooks/useRateCardMutations";

const EMPTY = {
  name: "",
  code: "",
  rentalType: "" as "" | "B2C" | "B2B",
  dailyRate: "250",
  weeklyRate: "1500",
  fortnightlyRate: "",
  monthlyRate: "",
  securityDeposit: "3000",
  vehicleCategory: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  isActive: true,
};

export default function RateCardsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RateCard | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useRateCardsListQuery(page, 20, search);
  const { createMutation, updateMutation, deleteMutation, statusMutation } =
    useRateCardMutations();
  const rateCards = listQuery.data?.rateCards ?? [];
  const pagination = listQuery.data?.pagination;

  const columns = useMemo<DataTableColumn<RateCard>[]>(
    () => [
      { id: "code", header: "Code", cell: (row) => row.code },
      { id: "name", header: "Name", cell: (row) => row.name },
      { id: "type", header: "Type", cell: (row) => row.rentalType || "—" },
      {
        id: "daily",
        header: "Daily",
        cell: (row) => formatMoney(row.dailyRate),
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
          canWrite ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  setEditing(row);
                  setForm({
                    name: row.name,
                    code: row.code,
                    rentalType: (row.rentalType as "B2C" | "B2B") || "",
                    dailyRate: String(row.dailyRate),
                    weeklyRate: String(row.weeklyRate ?? ""),
                    fortnightlyRate: String(row.fortnightlyRate ?? ""),
                    monthlyRate: String(row.monthlyRate ?? ""),
                    securityDeposit: String(row.securityDeposit ?? ""),
                    vehicleCategory: row.vehicleCategory ?? "",
                    effectiveFrom: row.effectiveFrom
                      ? row.effectiveFrom.slice(0, 10)
                      : new Date().toISOString().slice(0, 10),
                    isActive: row.isActive,
                  });
                  setFormOpen(true);
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
                className="text-xs text-destructive"
                onClick={() => setDeleteId(row.id)}
              >
                Delete
              </button>
            </div>
          ) : null,
      },
    ],
    [canWrite, statusMutation],
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      rentalType: form.rentalType || null,
      dailyRate: form.dailyRate,
      weeklyRate: form.weeklyRate || null,
      fortnightlyRate: form.fortnightlyRate || null,
      monthlyRate: form.monthlyRate || null,
      securityDeposit: form.securityDeposit || null,
      vehicleCategory: form.vehicleCategory.trim() || null,
      effectiveFrom: form.effectiveFrom,
      ...(editing
        ? {}
        : {
            code: form.code.trim() || undefined,
            isActive: form.isActive,
          }),
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
        title="Rate cards"
        description="Commercial pricing templates for rentals."
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
              Add rate card
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
          placeholder="Search rate cards…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={rateCards} rowKey={(r) => r.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="rate cards"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit rate card" : "Create rate card"}
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-3" onSubmit={onSubmit}>
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
              Code (optional)
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              />
            </label>
          ) : null}
          <label className="block text-sm">
            Type
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.rentalType}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  rentalType: e.target.value as "" | "B2C" | "B2B",
                }))
              }
            >
              <option value="">Any</option>
              <option value="B2C">B2C</option>
              <option value="B2B">B2B</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Daily
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.dailyRate}
                onChange={(e) => setForm((p) => ({ ...p, dailyRate: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              Weekly
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.weeklyRate}
                onChange={(e) => setForm((p) => ({ ...p, weeklyRate: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              Fortnightly
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.fortnightlyRate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fortnightlyRate: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              Monthly
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.monthlyRate}
                onChange={(e) => setForm((p) => ({ ...p, monthlyRate: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-sm">
            Security deposit
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.securityDeposit}
              onChange={(e) =>
                setForm((p) => ({ ...p, securityDeposit: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            Vehicle category
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.vehicleCategory}
              onChange={(e) =>
                setForm((p) => ({ ...p, vehicleCategory: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            Effective from
            <input
              type="date"
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.effectiveFrom}
              onChange={(e) => setForm((p) => ({ ...p, effectiveFrom: e.target.value }))}
              required
            />
          </label>
          {!editing ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
          ) : null}
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
        title="Delete rate card?"
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
