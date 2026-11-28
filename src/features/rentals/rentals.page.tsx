import { useMemo, useState } from "react";
import type { Rental } from "@/features/shared/entities";
import {
  useClientsQuery,
  useHubsQuery,
  useRidersQuery,
  useVehiclesQuery,
} from "@/features/shared/entities";
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
import { emptyToNull } from "@/features/shared/utils/formValues";
import { useRentalDeploymentsQuery } from "@/features/deployments/hooks/useDeploymentsQuery";
import { useDeploymentMutations } from "@/features/deployments/hooks/useDeploymentMutations";
import {
  useDepositLedgerQuery,
  useRentalCollectionsQuery,
  useRentalDepositQuery,
  useRentalDetailQuery,
  useRentalDuesQuery,
  useRentalsListQuery,
} from "./hooks/useRentalsQuery";
import { useRentalMutations } from "./hooks/useRentalMutations";

const EMPTY_CREATE = {
  rentalType: "B2C" as "B2C" | "B2B",
  b2cMode: "AML_RIDER" as "AML_RIDER" | "INDIVIDUAL_RIDER",
  b2bRiderMgmt: "CLIENT_MANAGED" as "CLIENT_MANAGED" | "AML_MANAGED",
  clientId: "",
  riderId: "",
  hubId: "",
  vehicleId: "",
  startDate: new Date().toISOString().slice(0, 10),
  expectedEndDate: "",
  collectionPeriod: "MONTHLY" as "WEEKLY" | "FORTNIGHTLY" | "MONTHLY",
  securityDepositAmount: "0",
  dailyRate: "",
  weeklyRate: "",
  fortnightlyRate: "",
  monthlyRate: "",
  notes: "",
};

function money(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

function activeVehicleLabel(rental: Rental) {
  const assignment = rental.assignments?.find((row) => row.status === "ACTIVE");
  return assignment?.vehicle?.registrationNumber ?? "—";
}

export default function RentalsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CREATE);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [closeId, setCloseId] = useState<string | null>(null);
  const [depositForm, setDepositForm] = useState({
    mode: "receive" as "receive" | "refund",
    amount: "",
    paymentMethod: "CASH" as
      | "CASH"
      | "UPI"
      | "CARD"
      | "BANK_TRANSFER"
      | "CHEQUE"
      | "OTHER",
    reference: "",
    reason: "",
  });
  const [deployOutOpen, setDeployOutOpen] = useState(false);
  const [deployOutForm, setDeployOutForm] = useState({
    vehicleId: "",
    outHubId: "",
    reason: "",
  });
  const [deployInOpen, setDeployInOpen] = useState(false);
  const [deployInForm, setDeployInForm] = useState({
    inHubId: "",
    endOdometer: "",
    vehicleReturnStatus: "IDLE" as
      | "IDLE"
      | "IN_SERVICE"
      | "UNDER_REPAIR"
      | "OUT_OF_SERVICE",
  });

  const listQuery = useRentalsListQuery(page, 20, search);
  const detailQuery = useRentalDetailQuery(detailId);
  const duesQuery = useRentalDuesQuery(detailId);
  const collectionsQuery = useRentalCollectionsQuery(detailId);
  const depositQuery = useRentalDepositQuery(detailId);
  const depositId = depositQuery.data?.deposit?.id ?? null;
  const depositLedgerQuery = useDepositLedgerQuery(depositId);
  const deploymentsQuery = useRentalDeploymentsQuery(detailId);
  const clientsQuery = useClientsQuery();
  const hubsQuery = useHubsQuery();
  const ridersQuery = useRidersQuery();
  const vehiclesQuery = useVehiclesQuery();
  const {
    createMutation,
    closeMutation,
    generateDuesMutation,
    receiveDepositMutation,
    refundDepositMutation,
  } = useRentalMutations();
  const { deployOutMutation, deployInMutation } = useDeploymentMutations();

  const rentals = listQuery.data?.rentals ?? [];
  const pagination = listQuery.data?.pagination;
  const detail = detailQuery.data;
  const activeAssignment = detail?.assignments?.find(
    (row) => row.status === "ACTIVE",
  );
  const idleVehicles = (vehiclesQuery.data?.vehicles ?? []).filter(
    (vehicle) => vehicle.status === "IDLE" || !vehicle.status,
  );

  const columns = useMemo<DataTableColumn<Rental>[]>(
    () => [
      {
        id: "number",
        header: "Rental",
        cell: (row) => row.rentalNumber || row.id.slice(0, 8),
      },
      {
        id: "type",
        header: "Type",
        cell: (row) => row.rentalType,
      },
      {
        id: "client",
        header: "Client",
        cell: (row) => row.client?.name || "—",
      },
      {
        id: "rider",
        header: "Rider",
        cell: (row) => row.rider?.fullName || "—",
      },
      {
        id: "hub",
        header: "Hub",
        cell: (row) => row.hub?.name || "—",
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs text-primary"
              onClick={() => setDetailId(row.id)}
            >
              Open
            </button>
            {canWrite && row.status === "ACTIVE" ? (
              <button
                type="button"
                className="text-xs text-destructive"
                onClick={() => setCloseId(row.id)}
              >
                Close
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    [canWrite],
  );

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      rentalType: form.rentalType,
      b2cMode: form.rentalType === "B2C" ? form.b2cMode : null,
      b2bRiderMgmt: form.rentalType === "B2B" ? form.b2bRiderMgmt : null,
      clientId: form.clientId,
      riderId:
        form.rentalType === "B2C"
          ? form.riderId
          : emptyToNull(form.riderId) || null,
      hubId: form.hubId,
      vehicleId: form.vehicleId,
      startDate: form.startDate,
      expectedEndDate: emptyToNull(form.expectedEndDate),
      collectionPeriod: form.collectionPeriod,
      securityDepositAmount: form.securityDepositAmount.trim() || "0",
      manualPricing: {
        dailyRate: form.dailyRate.trim(),
        weeklyRate: emptyToNull(form.weeklyRate),
        fortnightlyRate: emptyToNull(form.fortnightlyRate),
        monthlyRate: emptyToNull(form.monthlyRate),
        securityDeposit: emptyToNull(form.securityDepositAmount),
      },
      notes: emptyToNull(form.notes),
    };
    await createMutation.mutateAsync(payload);
    setFormOpen(false);
    setForm(EMPTY_CREATE);
  };

  const submitDeposit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detailId) return;
    if (depositForm.mode === "receive") {
      await receiveDepositMutation.mutateAsync({
        id: detailId,
        payload: {
          amount: depositForm.amount.trim(),
          paymentMethod: depositForm.paymentMethod,
          reference: emptyToNull(depositForm.reference),
          reason: emptyToNull(depositForm.reason),
        },
      });
    } else {
      await refundDepositMutation.mutateAsync({
        id: detailId,
        payload: {
          amount: depositForm.amount.trim(),
          reference: emptyToNull(depositForm.reference),
          reason: emptyToNull(depositForm.reason),
        },
      });
    }
    setDepositForm((prev) => ({
      ...prev,
      amount: "",
      reference: "",
      reason: "",
    }));
  };

  return (
    <div>
      <PageHeader
        title="Rentals"
        description="Create and manage live rentals, dues, and deposits."
        actions={
          canWrite ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setForm(EMPTY_CREATE);
                setFormOpen(true);
              }}
            >
              Create rental
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
          placeholder="Search rentals…"
        />
      </div>

      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={rentals} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="rentals"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title="Create rental"
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitCreate}>
          <FormSection title="Classification">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select
                  className={inputClass}
                  value={form.rentalType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      rentalType: e.target.value as "B2C" | "B2B",
                    }))
                  }
                >
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </select>
              </Field>
              {form.rentalType === "B2C" ? (
                <Field label="B2C mode">
                  <select
                    className={inputClass}
                    value={form.b2cMode}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        b2cMode: e.target.value as typeof form.b2cMode,
                      }))
                    }
                  >
                    <option value="AML_RIDER">AML rider</option>
                    <option value="INDIVIDUAL_RIDER">Individual rider</option>
                  </select>
                </Field>
              ) : (
                <Field label="B2B rider mgmt">
                  <select
                    className={inputClass}
                    value={form.b2bRiderMgmt}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        b2bRiderMgmt: e.target
                          .value as typeof form.b2bRiderMgmt,
                      }))
                    }
                  >
                    <option value="CLIENT_MANAGED">Client managed</option>
                    <option value="AML_MANAGED">AML managed</option>
                  </select>
                </Field>
              )}
              <Field label="Client">
                <select
                  className={inputClass}
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, clientId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select client</option>
                  {(clientsQuery.data?.clients ?? []).map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={form.rentalType === "B2C" ? "Rider *" : "Rider"}>
                <select
                  className={inputClass}
                  value={form.riderId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, riderId: e.target.value }))
                  }
                  required={form.rentalType === "B2C"}
                >
                  <option value="">Select rider</option>
                  {(ridersQuery.data?.riders ?? []).map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.fullName}
                      {rider.riderCode ? ` (${rider.riderCode})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hub">
                <select
                  className={inputClass}
                  value={form.hubId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hubId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select hub</option>
                  {(hubsQuery.data?.hubs ?? []).map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Vehicle">
                <select
                  className={inputClass}
                  value={form.vehicleId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, vehicleId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select vehicle</option>
                  {(vehiclesQuery.data?.vehicles ?? []).map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registrationNumber}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Schedule & pricing">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <input
                  type="date"
                  className={inputClass}
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Expected end">
                <input
                  type="date"
                  className={inputClass}
                  value={form.expectedEndDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      expectedEndDate: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Collection period">
                <select
                  className={inputClass}
                  value={form.collectionPeriod}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      collectionPeriod: e.target
                        .value as typeof form.collectionPeriod,
                    }))
                  }
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="FORTNIGHTLY">Fortnightly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </Field>
              <Field label="Security deposit">
                <input
                  className={inputClass}
                  value={form.securityDepositAmount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      securityDepositAmount: e.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="Daily rate">
                <input
                  className={inputClass}
                  value={form.dailyRate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dailyRate: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Weekly rate">
                <input
                  className={inputClass}
                  value={form.weeklyRate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, weeklyRate: e.target.value }))
                  }
                />
              </Field>
              <Field label="Fortnightly rate">
                <input
                  className={inputClass}
                  value={form.fortnightlyRate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      fortnightlyRate: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Monthly rate">
                <input
                  className={inputClass}
                  value={form.monthlyRate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      monthlyRate: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                className={inputClass}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
              />
            </Field>
          </FormSection>

          <div className="flex justify-end gap-2">
            <FormActions
              onCancel={() => setFormOpen(false)}
              loading={createMutation.isPending}
              submitLabel="Create"
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!detailId}
        title={
          detail
            ? `Rental ${detail.rentalNumber || detail.id.slice(0, 8)}`
            : "Rental detail"
        }
        onClose={() => setDetailId(null)}
      >
        {detailQuery.isLoading || !detail ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <StatusBadge status={detail.status} />
              </p>
              <p>
                <span className="text-muted-foreground">Type:</span>{" "}
                {detail.rentalType}
              </p>
              <p>
                <span className="text-muted-foreground">Client:</span>{" "}
                {detail.client?.name || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Rider:</span>{" "}
                {detail.rider?.fullName || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Hub:</span>{" "}
                {detail.hub?.name || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Vehicle:</span>{" "}
                {activeVehicleLabel(detail)}
              </p>
              <p>
                <span className="text-muted-foreground">Start:</span>{" "}
                {detail.startDate?.slice(0, 10) || "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Deposit required:</span>{" "}
                {money(detail.securityDepositRequired)}
              </p>
            </div>

            <FormSection title="Deployments">
              <div className="mb-3 flex flex-wrap justify-end gap-2">
                {canWrite && !activeAssignment ? (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    onClick={() => {
                      setDeployOutForm({
                        vehicleId: "",
                        outHubId: detail.hubId || "",
                        reason: "",
                      });
                      setDeployOutOpen(true);
                    }}
                  >
                    Deploy out
                  </button>
                ) : null}
                {canWrite && activeAssignment ? (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    onClick={() => {
                      setDeployInForm({
                        inHubId: detail.hubId || "",
                        endOdometer: "",
                        vehicleReturnStatus: "IDLE",
                      });
                      setDeployInOpen(true);
                    }}
                  >
                    Deploy in
                  </button>
                ) : null}
              </div>
              {activeAssignment ? (
                <p className="mb-2 text-sm">
                  Active:{" "}
                  {activeAssignment.vehicle?.registrationNumber ||
                    activeAssignment.vehicleId}
                </p>
              ) : (
                <p className="mb-2 text-sm text-muted-foreground">
                  No active vehicle assignment.
                </p>
              )}
              {deploymentsQuery.isLoading ? (
                <LoadingSkeleton />
              ) : (deploymentsQuery.data?.deployments ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deployment history.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 pr-2">Vehicle</th>
                        <th className="py-2 pr-2">Start</th>
                        <th className="py-2 pr-2">End</th>
                        <th className="py-2 pr-2">Out hub</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deploymentsQuery.data?.deployments ?? []).map((row) => (
                        <tr key={row.id} className="border-b border-border/60">
                          <td className="py-2 pr-2">
                            {row.vehicle?.registrationNumber || row.vehicleId}
                          </td>
                          <td className="py-2 pr-2">
                            {row.startDate?.slice(0, 10) || "—"}
                          </td>
                          <td className="py-2 pr-2">
                            {row.endDate?.slice(0, 10) || "—"}
                          </td>
                          <td className="py-2 pr-2">
                            {row.outHub?.name || "—"}
                          </td>
                          <td className="py-2">
                            <StatusBadge status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FormSection>

            <FormSection title="Dues">
              <div className="mb-3 flex justify-end">
                {canWrite ? (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    onClick={() =>
                      generateDuesMutation.mutate({ id: detail.id })
                    }
                    disabled={generateDuesMutation.isPending}
                  >
                    Generate dues
                  </button>
                ) : null}
              </div>
              {duesQuery.isLoading ? (
                <LoadingSkeleton />
              ) : (duesQuery.data?.dues ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No dues yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 pr-2">Due date</th>
                        <th className="py-2 pr-2">Period</th>
                        <th className="py-2 pr-2">Due</th>
                        <th className="py-2 pr-2">Collected</th>
                        <th className="py-2 pr-2">Outstanding</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(duesQuery.data?.dues ?? []).map((due) => (
                        <tr key={due.id} className="border-b border-border/60">
                          <td className="py-2 pr-2">
                            {due.dueDate?.slice(0, 10)}
                          </td>
                          <td className="py-2 pr-2">
                            {due.periodStart?.slice(0, 10)} →{" "}
                            {due.periodEnd?.slice(0, 10)}
                          </td>
                          <td className="py-2 pr-2">{money(due.amountDue)}</td>
                          <td className="py-2 pr-2">
                            {money(due.amountCollected)}
                          </td>
                          <td className="py-2 pr-2">
                            {money(due.outstandingAmount)}
                          </td>
                          <td className="py-2">
                            <StatusBadge status={due.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FormSection>

            <FormSection title="Collections on this rental">
              {collectionsQuery.isLoading ? (
                <LoadingSkeleton />
              ) : (collectionsQuery.data?.collections ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No collections yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(collectionsQuery.data?.collections ?? []).map((row) => (
                    <li
                      key={row.id}
                      className="flex justify-between gap-3 border-b border-border/50 pb-2"
                    >
                      <span>
                        {money(row.amount)} · {row.paymentMethod}
                        {row.referenceNumber
                          ? ` · ${row.referenceNumber}`
                          : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {row.receivedAt?.slice(0, 10) || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </FormSection>

            <FormSection title="Security deposit">
              {depositQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  No deposit record for this rental.
                </p>
              ) : depositQuery.isLoading ? (
                <LoadingSkeleton />
              ) : depositQuery.data ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <p>
                      Status:{" "}
                      <StatusBadge
                        status={depositQuery.data.deposit.status || "UNKNOWN"}
                      />
                    </p>
                    <p>Required: {money(depositQuery.data.deposit.amountRequired)}</p>
                    <p>Balance: {money(depositQuery.data.balance)}</p>
                    <p>
                      Credits / Debits: {money(depositQuery.data.totalCredits)} /{" "}
                      {money(depositQuery.data.totalDebits)}
                    </p>
                  </div>
                  {canWrite ? (
                    <form className="space-y-3" onSubmit={submitDeposit}>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Action">
                          <select
                            className={inputClass}
                            value={depositForm.mode}
                            onChange={(e) =>
                              setDepositForm((prev) => ({
                                ...prev,
                                mode: e.target.value as "receive" | "refund",
                              }))
                            }
                          >
                            <option value="receive">Receive</option>
                            <option value="refund">Refund</option>
                          </select>
                        </Field>
                        <Field label="Amount">
                          <input
                            className={inputClass}
                            value={depositForm.amount}
                            onChange={(e) =>
                              setDepositForm((prev) => ({
                                ...prev,
                                amount: e.target.value,
                              }))
                            }
                            required
                          />
                        </Field>
                        {depositForm.mode === "receive" ? (
                          <Field label="Payment method">
                            <select
                              className={inputClass}
                              value={depositForm.paymentMethod}
                              onChange={(e) =>
                                setDepositForm((prev) => ({
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
                        ) : null}
                        <Field label="Reference">
                          <input
                            className={inputClass}
                            value={depositForm.reference}
                            onChange={(e) =>
                              setDepositForm((prev) => ({
                                ...prev,
                                reference: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Reason">
                        <input
                          className={inputClass}
                          value={depositForm.reason}
                          onChange={(e) =>
                            setDepositForm((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                        />
                      </Field>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
                          disabled={
                            receiveDepositMutation.isPending ||
                            refundDepositMutation.isPending
                          }
                        >
                          {depositForm.mode === "receive"
                            ? "Receive deposit"
                            : "Refund deposit"}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  <div className="pt-2">
                    <p className="mb-2 text-sm font-medium">Deposit ledger</p>
                    {depositLedgerQuery.isLoading ? (
                      <LoadingSkeleton />
                    ) : (depositLedgerQuery.data?.transactions ?? []).length ===
                      0 ? (
                      <p className="text-sm text-muted-foreground">
                        No deposit movements yet.
                      </p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {(depositLedgerQuery.data?.transactions ?? []).map(
                          (tx) => (
                            <li
                              key={tx.id}
                              className="flex justify-between gap-3 border-b border-border/50 pb-2"
                            >
                              <span>
                                {tx.type} · {tx.direction} · {money(tx.amount)}
                                {tx.reference ? ` · ${tx.reference}` : ""}
                              </span>
                              <span className="text-muted-foreground">
                                {tx.createdAt?.slice(0, 10) || "—"}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}
            </FormSection>
          </div>
        )}
      </EntityFormDialog>

      <EntityFormDialog
        open={deployOutOpen}
        title="Deploy vehicle out"
        onClose={() => setDeployOutOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!detail) return;
            try {
              await deployOutMutation.mutateAsync({
                rentalId: detail.id,
                vehicleId: deployOutForm.vehicleId,
                outHubId: deployOutForm.outHubId,
                reason: deployOutForm.reason.trim() || undefined,
              });
              setDeployOutOpen(false);
            } catch {
              // mutation notifies
            }
          }}
        >
          <Field label="Vehicle">
            <select
              className={inputClass}
              value={deployOutForm.vehicleId}
              onChange={(e) =>
                setDeployOutForm((prev) => ({
                  ...prev,
                  vehicleId: e.target.value,
                }))
              }
              required
            >
              <option value="">Select vehicle</option>
              {idleVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNumber}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Out hub">
            <select
              className={inputClass}
              value={deployOutForm.outHubId}
              onChange={(e) =>
                setDeployOutForm((prev) => ({
                  ...prev,
                  outHubId: e.target.value,
                }))
              }
              required
            >
              <option value="">Select hub</option>
              {(hubsQuery.data?.hubs ?? []).map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reason">
            <input
              className={inputClass}
              value={deployOutForm.reason}
              onChange={(e) =>
                setDeployOutForm((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
            />
          </Field>
          <div className="flex justify-end">
            <FormActions
              onCancel={() => setDeployOutOpen(false)}
              loading={deployOutMutation.isPending}
              submitLabel="Deploy out"
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={deployInOpen}
        title="Deploy vehicle in"
        onClose={() => setDeployInOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!detail || !activeAssignment) return;
            try {
              await deployInMutation.mutateAsync({
                id: activeAssignment.id,
                rentalId: detail.id,
                payload: {
                  inHubId: deployInForm.inHubId,
                  endOdometer: deployInForm.endOdometer.trim()
                    ? Number.parseInt(deployInForm.endOdometer, 10)
                    : undefined,
                  vehicleReturnStatus: deployInForm.vehicleReturnStatus,
                },
              });
              setDeployInOpen(false);
            } catch {
              // mutation notifies
            }
          }}
        >
          <Field label="In hub">
            <select
              className={inputClass}
              value={deployInForm.inHubId}
              onChange={(e) =>
                setDeployInForm((prev) => ({
                  ...prev,
                  inHubId: e.target.value,
                }))
              }
              required
            >
              <option value="">Select hub</option>
              {(hubsQuery.data?.hubs ?? []).map((hub) => (
                <option key={hub.id} value={hub.id}>
                  {hub.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="End odometer">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={deployInForm.endOdometer}
              onChange={(e) =>
                setDeployInForm((prev) => ({
                  ...prev,
                  endOdometer: e.target.value,
                }))
              }
            />
          </Field>
          <Field label="Vehicle return status">
            <select
              className={inputClass}
              value={deployInForm.vehicleReturnStatus}
              onChange={(e) =>
                setDeployInForm((prev) => ({
                  ...prev,
                  vehicleReturnStatus: e.target
                    .value as typeof prev.vehicleReturnStatus,
                }))
              }
            >
              <option value="IDLE">IDLE</option>
              <option value="IN_SERVICE">IN_SERVICE</option>
              <option value="UNDER_REPAIR">UNDER_REPAIR</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
            </select>
          </Field>
          <div className="flex justify-end">
            <FormActions
              onCancel={() => setDeployInOpen(false)}
              loading={deployInMutation.isPending}
              submitLabel="Deploy in"
            />
          </div>
        </form>
      </EntityFormDialog>

      <ConfirmDialog
        open={!!closeId}
        title="Close rental?"
        description="Closes an ACTIVE rental and finalizes vehicle return."
        loading={closeMutation.isPending}
        destructive
        confirmLabel="Close rental"
        onCancel={() => setCloseId(null)}
        onConfirm={async () => {
          if (!closeId) return;
          await closeMutation.mutateAsync({ id: closeId });
          setCloseId(null);
          if (detailId === closeId) setDetailId(null);
        }}
      />
    </div>
  );
}
