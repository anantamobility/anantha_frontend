import { useMemo, useState } from "react";
import type { RateCard } from "@/features/shared/entities";
import { useClientsQuery } from "@/features/shared/entities";
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
  rentalType: "B2C" as "B2C" | "B2B",
  billingFrequency: "WEEKLY" as "WEEKLY" | "FORTNIGHTLY" | "MONTHLY",
  dailyRate: "250",
  weeklyRate: "1500",
  securityDeposit: "3000",
  vehicleCategory: "BIKE",
  effectiveFrom: new Date().toISOString().slice(0, 10),
};

export default function RateCardsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RateCard | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<RateCard | null>(null);
  const [assignClientId, setAssignClientId] = useState("");

  const listQuery = useRateCardsListQuery(page, 20, search);
  const clientsQuery = useClientsQuery();
  const { createMutation, updateMutation, deleteMutation, assignMutation } =
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
        cell: (row) => formatMoney(row.dailyRate, row.currency || "INR"),
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
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  setEditing(row);
                  setForm({
                    name: row.name,
                    code: row.code,
                    rentalType: (row.rentalType as "B2C" | "B2B") || "B2C",
                    billingFrequency:
                      (row.billingFrequency as typeof EMPTY.billingFrequency) ||
                      "WEEKLY",
                    dailyRate: String(row.dailyRate),
                    weeklyRate: String(row.weeklyRate ?? ""),
                    securityDeposit: String(row.securityDeposit ?? ""),
                    vehicleCategory: "BIKE",
                    effectiveFrom: new Date().toISOString().slice(0, 10),
                  });
                  setFormOpen(true);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  setAssignTarget(row);
                  setAssignClientId("");
                }}
              >
                Assign
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
      name: form.name.trim(),
      rentalType: form.rentalType,
      billingFrequency: form.billingFrequency,
      dailyRate: form.dailyRate,
      weeklyRate: form.weeklyRate || null,
      securityDeposit: form.securityDeposit || null,
      vehicleCategory: form.vehicleCategory || null,
      currency: "INR",
      effectiveFrom: form.effectiveFrom,
      ...(editing ? {} : { code: form.code.trim() || undefined }),
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
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Type
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.rentalType}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    rentalType: e.target.value as "B2C" | "B2B",
                  }))
                }
              >
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </label>
            <label className="block text-sm">
              Billing
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.billingFrequency}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    billingFrequency: e.target.value as typeof EMPTY.billingFrequency,
                  }))
                }
              >
                <option value="WEEKLY">Weekly</option>
                <option value="FORTNIGHTLY">Fortnightly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
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
              Deposit
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.securityDeposit}
                onChange={(e) =>
                  setForm((p) => ({ ...p, securityDeposit: e.target.value }))
                }
              />
            </label>
          </div>
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
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setFormOpen(false)}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!assignTarget}
        title={
          assignTarget
            ? `Assign ${assignTarget.code} to client`
            : "Assign rate card"
        }
        onClose={() => setAssignTarget(null)}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!assignTarget || !assignClientId) return;
            await assignMutation.mutateAsync({
              clientId: assignClientId,
              rateCardId: assignTarget.id,
              validFrom: new Date().toISOString().slice(0, 10),
            });
            setAssignTarget(null);
            setAssignClientId("");
          }}
        >
          <label className="block text-sm">
            Client
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={assignClientId}
              onChange={(e) => setAssignClientId(e.target.value)}
              required
            >
              <option value="">Select client</option>
              {(clientsQuery.data?.clients ?? [])
                .filter((c) => c.isActive)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.clientCode})
                  </option>
                ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setAssignTarget(null)}
              loading={assignMutation.isPending}
              submitLabel="Assign"
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
