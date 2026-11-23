import { useMemo, useState } from "react";
import type { RateCard } from "@/features/shared/entities";
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
  textareaClass,
  type DataTableColumn,
} from "@/features/shared/components/common";
import { formatMoney } from "@/features/shared/utils/money";
import { useRbac } from "@/features/shared/hooks/useRbac";
import {
  emptyToNull,
  parseOptionalJson,
} from "@/features/shared/utils/formValues";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError } from "@/features/shared/utils/notify";
import { getRateCard } from "./api/ratecards.api";
import { useRateCardsListQuery } from "./hooks/useRateCardsQuery";
import { useRateCardMutations } from "./hooks/useRateCardMutations";

const EMPTY = {
  name: "",
  code: "",
  description: "",
  rentalType: "" as "" | "B2C" | "B2B",
  dailyRate: "250",
  weeklyRate: "1500",
  fortnightlyRate: "",
  monthlyRate: "",
  securityDeposit: "3000",
  vehicleCategory: "",
  termsJson: "",
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
                onClick={async () => {
                  try {
                    const detail = await getRateCard(row.id);
                    setEditing(detail);
                    setForm({
                      name: detail.name,
                      code: detail.code,
                      description: detail.description ?? "",
                      rentalType: (detail.rentalType as "B2C" | "B2B") || "",
                      dailyRate: String(detail.dailyRate),
                      weeklyRate: String(detail.weeklyRate ?? ""),
                      fortnightlyRate: String(detail.fortnightlyRate ?? ""),
                      monthlyRate: String(detail.monthlyRate ?? ""),
                      securityDeposit: String(detail.securityDeposit ?? ""),
                      vehicleCategory: detail.vehicleCategory ?? "",
                      termsJson: detail.terms
                        ? JSON.stringify(detail.terms, null, 2)
                        : "",
                      isActive: detail.isActive,
                    });
                    setFormOpen(true);
                  } catch (error) {
                    notifyError(getErrorMessage(error, "Failed to load rate card"));
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
    let terms: unknown = null;
    try {
      terms = parseOptionalJson(form.termsJson);
    } catch {
      notifyError("Terms must be valid JSON");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: emptyToNull(form.description),
      rentalType: form.rentalType || null,
      dailyRate: form.dailyRate,
      weeklyRate: emptyToNull(form.weeklyRate),
      fortnightlyRate: emptyToNull(form.fortnightlyRate),
      monthlyRate: emptyToNull(form.monthlyRate),
      securityDeposit: emptyToNull(form.securityDeposit),
      vehicleCategory: emptyToNull(form.vehicleCategory),
      terms,
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
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormSection title="Basics">
            <Field label="Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </Field>
            {!editing ? (
              <Field label="Code (optional)">
                <input
                  className={inputClass}
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                />
              </Field>
            ) : null}
            <Field label="Description">
              <textarea
                className={textareaClass}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rental type">
                <select
                  className={inputClass}
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
              </Field>
              <Field label="Vehicle category">
                <input
                  className={inputClass}
                  value={form.vehicleCategory}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, vehicleCategory: e.target.value }))
                  }
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Rates">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Daily *">
                <input
                  className={inputClass}
                  value={form.dailyRate}
                  onChange={(e) => setForm((p) => ({ ...p, dailyRate: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Weekly">
                <input
                  className={inputClass}
                  value={form.weeklyRate}
                  onChange={(e) => setForm((p) => ({ ...p, weeklyRate: e.target.value }))}
                />
              </Field>
              <Field label="Fortnightly">
                <input
                  className={inputClass}
                  value={form.fortnightlyRate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fortnightlyRate: e.target.value }))
                  }
                />
              </Field>
              <Field label="Monthly">
                <input
                  className={inputClass}
                  value={form.monthlyRate}
                  onChange={(e) => setForm((p) => ({ ...p, monthlyRate: e.target.value }))}
                />
              </Field>
              <Field label="Security deposit">
                <input
                  className={inputClass}
                  value={form.securityDeposit}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, securityDeposit: e.target.value }))
                  }
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Terms">
            <Field label="Terms (JSON)">
              <textarea
                className={textareaClass}
                value={form.termsJson}
                onChange={(e) => setForm((p) => ({ ...p, termsJson: e.target.value }))}
                placeholder='{"graceDays": 2}'
              />
            </Field>
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
          </FormSection>

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
