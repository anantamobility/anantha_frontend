import { useMemo, useState } from "react";
import { useRidersQuery } from "@/features/shared/entities";
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
import type { PayStatement } from "./api/payStatements.api";
import { usePayStatementMutations } from "./hooks/usePayStatementMutations";
import {
  usePayStatementDetailQuery,
  usePayStatementsListQuery,
} from "./hooks/usePayStatementsQuery";

const PAYABLE_STATUSES = new Set(["PAYABLE"]);

const STATUS_FILTERS = [
  "",
  "DRAFT",
  "PENDING_APPROVAL",
  "PAYABLE",
  "APPROVED",
  "PAID",
  "FAILED",
  "RECONCILED",
  "REVERSED",
] as const;

function money(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

export default function PayStatementsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [riderId, setRiderId] = useState("");
  const [status, setStatus] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    riderId: "",
    periodStart: "",
    grossCredits: "",
    earningsReference: "",
    notes: "",
  });
  const [payForm, setPayForm] = useState({
    paymentMethod: "UPI" as
      | "CASH"
      | "UPI"
      | "CARD"
      | "BANK_TRANSFER"
      | "CHEQUE"
      | "OTHER",
    referenceNumber: "",
    notes: "",
  });

  const ridersQuery = useRidersQuery();
  const listQuery = usePayStatementsListQuery(
    page,
    20,
    search,
    riderId,
    status,
  );
  const detailQuery = usePayStatementDetailQuery(detailId);
  const { generateMutation, payMutation } = usePayStatementMutations();

  const statements = listQuery.data?.payStatements ?? [];
  const pagination = listQuery.data?.pagination;
  const detail = detailQuery.data;
  const riders = ridersQuery.data?.riders ?? [];

  const columns = useMemo<DataTableColumn<PayStatement>[]>(
    () => [
      {
        id: "number",
        header: "Statement",
        cell: (row) => row.statementNumber,
      },
      {
        id: "period",
        header: "Period",
        cell: (row) =>
          `${row.periodStart?.slice(0, 10) || "—"} → ${row.periodEnd?.slice(0, 10) || "—"}`,
      },
      {
        id: "gross",
        header: "Gross",
        cell: (row) => money(row.grossCredits),
      },
      {
        id: "net",
        header: "Net payable",
        cell: (row) => money(row.netPayable),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: (row) => (
          <button
            type="button"
            className="text-xs text-primary"
            onClick={() => setDetailId(row.id)}
          >
            Open
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Pay statements"
        description="Generate weekly rider pay statements and record payouts."
        actions={
          canWrite ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setGenerateForm({
                  riderId: riderId || "",
                  periodStart: "",
                  grossCredits: "",
                  earningsReference: "",
                  notes: "",
                });
                setGenerateOpen(true);
              }}
            >
              Generate statement
            </button>
          ) : null
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search statements…"
        />
        <Field label="Rider">
          <select
            className={inputClass}
            value={riderId}
            onChange={(e) => {
              setRiderId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All riders</option>
            {riders.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value || "all"} value={value}>
                {value || "All statuses"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={statements}
            rowKey={(row) => row.id}
          />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="statements"
          />
        </>
      )}

      <EntityFormDialog
        open={generateOpen}
        title="Generate pay statement"
        onClose={() => setGenerateOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const result = await generateMutation.mutateAsync({
                riderId: generateForm.riderId,
                periodStart: generateForm.periodStart,
                cycle: "WEEKLY",
                grossCredits: generateForm.grossCredits.trim(),
                earningsReference: emptyToNull(generateForm.earningsReference),
                notes: emptyToNull(generateForm.notes),
              });
              setGenerateOpen(false);
              setDetailId(result.payStatement.id);
            } catch {
              // mutation notifies
            }
          }}
        >
          <FormSection title="Weekly cycle">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rider">
                <select
                  className={inputClass}
                  value={generateForm.riderId}
                  onChange={(e) =>
                    setGenerateForm((prev) => ({
                      ...prev,
                      riderId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select rider</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Period start">
                <input
                  type="date"
                  className={inputClass}
                  value={generateForm.periodStart}
                  onChange={(e) =>
                    setGenerateForm((prev) => ({
                      ...prev,
                      periodStart: e.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="Gross credits">
                <input
                  className={inputClass}
                  value={generateForm.grossCredits}
                  onChange={(e) =>
                    setGenerateForm((prev) => ({
                      ...prev,
                      grossCredits: e.target.value,
                    }))
                  }
                  placeholder="e.g. 5000.00"
                  required
                />
              </Field>
              <Field label="Earnings reference">
                <input
                  className={inputClass}
                  value={generateForm.earningsReference}
                  onChange={(e) =>
                    setGenerateForm((prev) => ({
                      ...prev,
                      earningsReference: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                className={inputClass}
                rows={2}
                value={generateForm.notes}
                onChange={(e) =>
                  setGenerateForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </Field>
          </FormSection>
          <div className="flex justify-end">
            <FormActions
              onCancel={() => setGenerateOpen(false)}
              loading={generateMutation.isPending}
              submitLabel="Generate"
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!detailId}
        title={
          detail
            ? `Statement ${detail.statementNumber}`
            : "Pay statement"
        }
        onClose={() => {
          setDetailId(null);
          setPayOpen(false);
        }}
      >
        {detailQuery.isLoading || !detail ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <StatusBadge status={detail.status} />
              </p>
              <p>
                <span className="text-muted-foreground">Rider:</span>{" "}
                {detail.rider?.fullName || detail.riderId}
              </p>
              <p>
                <span className="text-muted-foreground">Period:</span>{" "}
                {detail.periodStart?.slice(0, 10)} →{" "}
                {detail.periodEnd?.slice(0, 10)}
              </p>
              <p>
                <span className="text-muted-foreground">Gross:</span>{" "}
                {money(detail.grossCredits)}
              </p>
              <p>
                <span className="text-muted-foreground">Deductions:</span>{" "}
                {money(detail.totalDeductions)}
              </p>
              <p>
                <span className="text-muted-foreground">Net payable:</span>{" "}
                {money(detail.netPayable)}
              </p>
            </div>

            <FormSection title="Lines">
              {(detail.lines ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No lines.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(detail.lines ?? []).map((line) => (
                    <li
                      key={line.id}
                      className="flex justify-between gap-3 border-b border-border/50 pb-2"
                    >
                      <span>
                        {line.lineType} · {line.direction} ·{" "}
                        {money(line.amount)}
                        {line.description ? ` — ${line.description}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </FormSection>

            {canWrite && PAYABLE_STATUSES.has(detail.status) ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                  onClick={() => {
                    setPayForm({
                      paymentMethod: "UPI",
                      referenceNumber: "",
                      notes: "",
                    });
                    setPayOpen(true);
                  }}
                >
                  Record payment
                </button>
              </div>
            ) : null}
          </div>
        )}
      </EntityFormDialog>

      <EntityFormDialog
        open={payOpen}
        title="Record payment"
        onClose={() => setPayOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!detailId) return;
            try {
              await payMutation.mutateAsync({
                id: detailId,
                payload: {
                  paymentMethod: payForm.paymentMethod,
                  referenceNumber: emptyToNull(payForm.referenceNumber),
                  notes: emptyToNull(payForm.notes),
                },
              });
              setPayOpen(false);
            } catch {
              // mutation notifies
            }
          }}
        >
          <Field label="Payment method">
            <select
              className={inputClass}
              value={payForm.paymentMethod}
              onChange={(e) =>
                setPayForm((prev) => ({
                  ...prev,
                  paymentMethod: e.target.value as typeof prev.paymentMethod,
                }))
              }
              required
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
              value={payForm.referenceNumber}
              onChange={(e) =>
                setPayForm((prev) => ({
                  ...prev,
                  referenceNumber: e.target.value,
                }))
              }
            />
          </Field>
          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={2}
              value={payForm.notes}
              onChange={(e) =>
                setPayForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </Field>
          <div className="flex justify-end">
            <FormActions
              onCancel={() => setPayOpen(false)}
              loading={payMutation.isPending}
              submitLabel="Pay"
            />
          </div>
        </form>
      </EntityFormDialog>
    </div>
  );
}
