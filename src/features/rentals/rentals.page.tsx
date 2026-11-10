import { useMemo, useState } from "react";
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
import {
  useClientsQuery,
  useHubsQuery,
  useRateCardsQuery,
  useRidersQuery,
  useVehiclesQuery,
} from "@/features/shared/entities";
import { formatMoney } from "@/features/shared/utils/money";
import { useRbac } from "@/features/shared/hooks/useRbac";
import type { Rental, RentalDue } from "./api/rentals.api";
import { useRentalMutations } from "./hooks/useRentalMutations";
import {
  useRentalDuesQuery,
  useRentalsListQuery,
} from "./hooks/useRentalsQuery";

const EMPTY_FORM = {
  rentalType: "B2C" as "B2C" | "B2B",
  b2cMode: "INDIVIDUAL_RIDER" as "AML_RIDER" | "INDIVIDUAL_RIDER",
  b2bRiderMgmt: "CLIENT_MANAGED" as "CLIENT_MANAGED" | "AML_MANAGED",
  clientId: "",
  riderId: "",
  hubId: "",
  vehicleId: "",
  rateCardId: "",
  startDate: new Date().toISOString().slice(0, 10),
  expectedEndDate: "",
  collectionPeriod: "WEEKLY" as "WEEKLY" | "EVERY_15_DAYS" | "MONTHLY",
  billingFrequency: "WEEKLY" as "WEEKLY" | "FORTNIGHTLY" | "MONTHLY",
  securityDepositAmount: "3000",
};

export default function RentalsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignVehicleId, setAssignVehicleId] = useState("");
  const [closeId, setCloseId] = useState<string | null>(null);

  const listQuery = useRentalsListQuery(page, 20, search, status);
  const duesQuery = useRentalDuesQuery(selectedId);
  const {
    createMutation,
    assignVehicleMutation,
    activateMutation,
    generateDuesMutation,
    closeMutation,
  } = useRentalMutations();

  const clientsQuery = useClientsQuery();
  const ridersQuery = useRidersQuery();
  const hubsQuery = useHubsQuery();
  const vehiclesQuery = useVehiclesQuery();
  const rateCardsQuery = useRateCardsQuery();

  const rentals = listQuery.data?.rentals ?? [];
  const pagination = listQuery.data?.pagination;
  const dues = duesQuery.data?.dues ?? [];
  const selected = rentals.find((r) => r.id === selectedId) ?? null;

  const idleVehicles = (vehiclesQuery.data?.vehicles ?? []).filter(
    (v) => v.status === "IDLE" && v.isActive,
  );

  const columns = useMemo<DataTableColumn<Rental>[]>(
    () => [
      { id: "number", header: "Rental #", cell: (row) => row.rentalNumber },
      { id: "type", header: "Type", cell: (row) => row.rentalType },
      {
        id: "client",
        header: "Client",
        cell: (row) => row.client?.name ?? "—",
      },
      {
        id: "rider",
        header: "Rider",
        cell: (row) => row.rider?.fullName ?? "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "start",
        header: "Start",
        cell: (row) => row.startDate?.slice(0, 10) ?? "—",
      },
      {
        id: "actions",
        header: "",
        cell: (row) => (
          <button
            type="button"
            className="text-xs text-primary"
            onClick={() => {
              setSelectedId(row.id);
              setAssignVehicleId("");
            }}
          >
            Open
          </button>
        ),
      },
    ],
    [],
  );

  const dueColumns = useMemo<DataTableColumn<RentalDue>[]>(
    () => [
      {
        id: "period",
        header: "Period",
        cell: (row) =>
          `${row.periodStart.slice(0, 10)} → ${row.periodEnd.slice(0, 10)}`,
      },
      {
        id: "dueDate",
        header: "Due",
        cell: (row) => row.dueDate.slice(0, 10),
      },
      {
        id: "amount",
        header: "Due amt",
        cell: (row) => formatMoney(row.amountDue),
      },
      {
        id: "outstanding",
        header: "Outstanding",
        cell: (row) => formatMoney(row.outstandingAmount),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMutation.mutateAsync({
      rentalType: form.rentalType,
      b2cMode: form.rentalType === "B2C" ? form.b2cMode : null,
      b2bRiderMgmt: form.rentalType === "B2B" ? form.b2bRiderMgmt : null,
      clientId: form.clientId,
      riderId: form.riderId || null,
      hubId: form.hubId || null,
      vehicleId: form.vehicleId || null,
      rateCardId: form.rateCardId || null,
      startDate: form.startDate,
      expectedEndDate: form.expectedEndDate || null,
      collectionPeriod: form.collectionPeriod,
      billingFrequency:
        form.rentalType === "B2B" ? form.billingFrequency : undefined,
      securityDepositAmount: form.securityDepositAmount,
      currency: "INR",
    });
    setFormOpen(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div>
      <PageHeader
        title="Rentals"
        description="Create, activate, and close rental agreements."
        actions={
          canWrite ? (
            <button
              type="button"
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
              onClick={() => {
                setForm(EMPTY_FORM);
                setFormOpen(true);
              }}
            >
              Create rental
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
            placeholder="Search rentals…"
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
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="TERMINATED">Terminated</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={rentals} rowKey={(r) => r.id} />
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
        <form className="space-y-3" onSubmit={onCreate}>
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
            {form.rentalType === "B2C" ? (
              <label className="block text-sm">
                B2C mode
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.b2cMode}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      b2cMode: e.target.value as typeof form.b2cMode,
                    }))
                  }
                >
                  <option value="INDIVIDUAL_RIDER">Individual rider</option>
                  <option value="AML_RIDER">AML rider</option>
                </select>
              </label>
            ) : (
              <label className="block text-sm">
                B2B rider mgmt
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.b2bRiderMgmt}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      b2bRiderMgmt: e.target.value as typeof form.b2bRiderMgmt,
                    }))
                  }
                >
                  <option value="CLIENT_MANAGED">Client managed</option>
                  <option value="AML_MANAGED">AML managed</option>
                </select>
              </label>
            )}
          </div>

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
                  {c.name} ({c.clientCode})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Rider {form.rentalType === "B2C" ? "(required)" : "(optional)"}
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.riderId}
              onChange={(e) => setForm((p) => ({ ...p, riderId: e.target.value }))}
              required={form.rentalType === "B2C"}
            >
              <option value="">Select rider</option>
              {(ridersQuery.data?.riders ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} · {r.phoneNumber}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Hub
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.hubId}
                onChange={(e) => setForm((p) => ({ ...p, hubId: e.target.value }))}
              >
                <option value="">Optional</option>
                {(hubsQuery.data?.hubs ?? []).map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Vehicle
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.vehicleId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, vehicleId: e.target.value }))
                }
              >
                <option value="">Optional (assign later)</option>
                {idleVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm">
            Rate card (must be assigned to client)
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.rateCardId}
              onChange={(e) =>
                setForm((p) => ({ ...p, rateCardId: e.target.value }))
              }
              required
            >
              <option value="">Select rate card</option>
              {(rateCardsQuery.data?.rateCards ?? [])
                .filter((rc) => rc.isActive)
                .map((rc) => (
                  <option key={rc.id} value={rc.id}>
                    {rc.code} · {rc.name}
                  </option>
                ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Start date
              <input
                type="date"
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startDate: e.target.value }))
                }
                required
              />
            </label>
            <label className="block text-sm">
              Expected end
              <input
                type="date"
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.expectedEndDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, expectedEndDate: e.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Collection period
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.collectionPeriod}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    collectionPeriod: e.target
                      .value as typeof form.collectionPeriod,
                  }))
                }
              >
                <option value="WEEKLY">Weekly</option>
                <option value="EVERY_15_DAYS">Every 15 days</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
            <label className="block text-sm">
              Security deposit
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.securityDepositAmount}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    securityDepositAmount: e.target.value,
                  }))
                }
                required
              />
            </label>
          </div>

          {form.rentalType === "B2B" ? (
            <label className="block text-sm">
              Billing frequency
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.billingFrequency}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    billingFrequency: e.target
                      .value as typeof form.billingFrequency,
                  }))
                }
              >
                <option value="WEEKLY">Weekly</option>
                <option value="FORTNIGHTLY">Fortnightly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setFormOpen(false)}
              loading={createMutation.isPending}
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!selectedId}
        title={selected ? `Rental ${selected.rentalNumber}` : "Rental"}
        onClose={() => setSelectedId(null)}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <StatusBadge status={selected.status} />
              </p>
              <p>
                <span className="text-muted-foreground">Client:</span>{" "}
                {selected.client?.name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Rider:</span>{" "}
                {selected.rider?.fullName ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Hub:</span>{" "}
                {selected.hub?.name ?? "—"}
              </p>
            </div>

            {canWrite &&
            (selected.status === "DRAFT" ||
              selected.status === "PENDING_APPROVAL") ? (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Lifecycle</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-9 min-w-[160px] flex-1 rounded-lg border border-border px-2 text-sm"
                    value={assignVehicleId}
                    onChange={(e) => setAssignVehicleId(e.target.value)}
                  >
                    <option value="">Assign vehicle…</option>
                    {idleVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    disabled={!assignVehicleId || assignVehicleMutation.isPending}
                    onClick={() =>
                      assignVehicleMutation.mutate({
                        id: selected.id,
                        vehicleId: assignVehicleId,
                      })
                    }
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                    disabled={activateMutation.isPending}
                    onClick={() => activateMutation.mutate(selected.id)}
                  >
                    Activate
                  </button>
                </div>
              </div>
            ) : null}

            {canWrite && selected.status === "ACTIVE" ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm"
                  disabled={generateDuesMutation.isPending}
                  onClick={() => generateDuesMutation.mutate(selected.id)}
                >
                  Generate dues
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-destructive px-3 py-1.5 text-sm text-destructive"
                  onClick={() => setCloseId(selected.id)}
                >
                  Close rental
                </button>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-medium">Dues</p>
              {duesQuery.isLoading ? (
                <LoadingSkeleton rows={3} />
              ) : (
                <DataTable
                  columns={dueColumns}
                  rows={dues}
                  rowKey={(r) => r.id}
                  emptyTitle="No dues yet"
                  emptyDescription="Activate the rental, then generate dues."
                />
              )}
            </div>
          </div>
        ) : null}
      </EntityFormDialog>

      <ConfirmDialog
        open={!!closeId}
        title="Close this rental?"
        description="This marks the rental completed/closed on the backend."
        destructive
        loading={closeMutation.isPending}
        onCancel={() => setCloseId(null)}
        onConfirm={async () => {
          if (!closeId) return;
          await closeMutation.mutateAsync(closeId);
          setCloseId(null);
        }}
      />
    </div>
  );
}
