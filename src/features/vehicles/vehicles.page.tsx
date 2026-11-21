import { useMemo, useState } from "react";
import type { Vehicle } from "@/features/shared/entities";
import { useHubsQuery } from "@/features/shared/entities";
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
import { getVehicle, type VehicleStatusPayload } from "./api/vehicles.api";
import {
  EMPTY_VEHICLE_FORM,
  vehicleFormToPayload,
  vehicleToForm,
  type VehicleFormState,
} from "./vehicleForm";
import { VehicleImportDialog } from "./components/VehicleImportDialog";
import { useVehiclesListQuery } from "./hooks/useVehiclesQuery";
import { useVehicleMutations } from "./hooks/useVehicleMutations";

const VEHICLE_STATUSES: VehicleStatusPayload["status"][] = [
  "IDLE",
  "DEPLOYED",
  "IN_SERVICE",
  "UNDER_REPAIR",
  "OUT_OF_SERVICE",
  "RETIRED",
];

export default function VehiclesPage() {
  const { canManageMasterData } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormState>(EMPTY_VEHICLE_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<Vehicle | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: "IDLE" as VehicleStatusPayload["status"],
    reason: "",
  });

  const listQuery = useVehiclesListQuery(page, 20, search);
  const hubsQuery = useHubsQuery();
  const { createMutation, updateMutation, deleteMutation, statusMutation } =
    useVehicleMutations();
  const vehicles = listQuery.data?.vehicles ?? [];
  const pagination = listQuery.data?.pagination;
  const hubs = hubsQuery.data?.hubs ?? [];

  const setField = <K extends keyof VehicleFormState>(
    key: K,
    value: VehicleFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const columns = useMemo<DataTableColumn<Vehicle>[]>(
    () => [
      { id: "reg", header: "Registration", cell: (row) => row.registrationNumber },
      {
        id: "vehicle",
        header: "Make / Model",
        cell: (row) => [row.make, row.model].filter(Boolean).join(" ") || "—",
      },
      { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
      {
        id: "active",
        header: "Active",
        cell: (row) => <StatusBadge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
      },
      {
        id: "actions",
        header: "",
        cell: (row) =>
          canManageMasterData ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs text-primary"
                onClick={async () => {
                  try {
                    const detail = await getVehicle(row.id);
                    setEditing(detail);
                    setForm(vehicleToForm(detail));
                    setFormOpen(true);
                  } catch (error) {
                    notifyError(getErrorMessage(error, "Failed to load vehicle"));
                  }
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  setStatusTarget(row);
                  setStatusForm({
                    status: row.status as VehicleStatusPayload["status"],
                    reason: "",
                  });
                }}
              >
                Status
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
    [canManageMasterData],
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = vehicleFormToPayload(form);
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_VEHICLE_FORM);
  };

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Fleet inventory by hub — full asset profile."
        actions={
          canManageMasterData ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-sm"
                onClick={() => setImportOpen(true)}
              >
                Import
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                onClick={() => {
                  setEditing(null);
                  setForm(EMPTY_VEHICLE_FORM);
                  setFormOpen(true);
                }}
              >
                Add vehicle
              </button>
            </div>
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
          placeholder="Search vehicles…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={vehicles} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="vehicles"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit vehicle" : "Create vehicle"}
        onClose={() => setFormOpen(false)}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormSection title="Identity">
            <Field label="Registration number *">
              <input
                className={inputClass}
                value={form.registrationNumber}
                onChange={(e) => setField("registrationNumber", e.target.value)}
                required
                maxLength={15}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hub">
                <select
                  className={inputClass}
                  value={form.hubId}
                  onChange={(e) => setField("hubId", e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="VIN">
                <input
                  className={inputClass}
                  value={form.vin}
                  onChange={(e) => setField("vin", e.target.value)}
                />
              </Field>
              <Field label="Make">
                <input
                  className={inputClass}
                  value={form.make}
                  onChange={(e) => setField("make", e.target.value)}
                />
              </Field>
              <Field label="Model">
                <input
                  className={inputClass}
                  value={form.model}
                  onChange={(e) => setField("model", e.target.value)}
                />
              </Field>
              <Field label="Year">
                <input
                  type="number"
                  className={inputClass}
                  value={form.year}
                  onChange={(e) => setField("year", e.target.value)}
                />
              </Field>
              <Field label="Color">
                <input
                  className={inputClass}
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                />
              </Field>
              <Field label="Acquired at">
                <input
                  type="date"
                  className={inputClass}
                  value={form.acquiredAt}
                  onChange={(e) => setField("acquiredAt", e.target.value)}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
              />
              Active
            </label>
          </FormSection>

          <FormSection title="Classification">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vehicle category">
                <input
                  className={inputClass}
                  value={form.vehicleCategory}
                  onChange={(e) => setField("vehicleCategory", e.target.value)}
                />
              </Field>
              <Field label="Vehicle type">
                <input
                  className={inputClass}
                  value={form.vehicleType}
                  onChange={(e) => setField("vehicleType", e.target.value)}
                />
              </Field>
              <Field label="Registration type">
                <input
                  className={inputClass}
                  value={form.registrationType}
                  onChange={(e) => setField("registrationType", e.target.value)}
                  placeholder="commercial / private"
                />
              </Field>
              <Field label="Ownership type">
                <input
                  className={inputClass}
                  value={form.ownershipType}
                  onChange={(e) => setField("ownershipType", e.target.value)}
                  placeholder="owned / leased / financed"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Battery & charging">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Battery type">
                <input
                  className={inputClass}
                  value={form.batteryType}
                  onChange={(e) => setField("batteryType", e.target.value)}
                />
              </Field>
              <Field label="Battery capacity">
                <input
                  type="number"
                  className={inputClass}
                  value={form.batteryCapacity}
                  onChange={(e) => setField("batteryCapacity", e.target.value)}
                />
              </Field>
              <Field label="Battery number">
                <input
                  className={inputClass}
                  value={form.batteryNumber}
                  onChange={(e) => setField("batteryNumber", e.target.value)}
                />
              </Field>
              <Field label="Battery model">
                <input
                  className={inputClass}
                  value={form.batteryModelNumber}
                  onChange={(e) => setField("batteryModelNumber", e.target.value)}
                />
              </Field>
              <Field label="Battery brand">
                <input
                  className={inputClass}
                  value={form.batteryBrand}
                  onChange={(e) => setField("batteryBrand", e.target.value)}
                />
              </Field>
              <Field label="Nominal range">
                <input
                  type="number"
                  className={inputClass}
                  value={form.nominalRange}
                  onChange={(e) => setField("nominalRange", e.target.value)}
                />
              </Field>
              <Field label="Charging options">
                <input
                  className={inputClass}
                  value={form.chargingOptions}
                  onChange={(e) => setField("chargingOptions", e.target.value)}
                  placeholder="slow | fast"
                />
              </Field>
              <Field label="Charger provided">
                <select
                  className={inputClass}
                  value={form.chargerProvided}
                  onChange={(e) =>
                    setField(
                      "chargerProvided",
                      e.target.value as VehicleFormState["chargerProvided"],
                    )
                  }
                >
                  <option value="">Unknown</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Tyres">
            <Field label="Number of tyres">
              <input
                type="number"
                className={inputClass}
                value={form.noOfTyres}
                onChange={(e) => setField("noOfTyres", e.target.value)}
              />
            </Field>
            <div className="space-y-2">
              {form.tyres.map((tyre, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2"
                >
                  {(["position", "size", "serialNumber", "brand"] as const).map(
                    (key) => (
                      <Field key={key} label={key}>
                        <input
                          className={inputClass}
                          value={String(tyre[key] ?? "")}
                          onChange={(e) => {
                            const next = [...form.tyres];
                            next[index] = { ...next[index], [key]: e.target.value };
                            setField("tyres", next);
                          }}
                        />
                      </Field>
                    ),
                  )}
                  <button
                    type="button"
                    className="col-span-2 text-left text-xs text-destructive"
                    onClick={() =>
                      setField(
                        "tyres",
                        form.tyres.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove tyre
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() =>
                  setField("tyres", [
                    ...form.tyres,
                    { position: "", size: "", serialNumber: "", brand: "" },
                  ])
                }
              >
                Add tyre
              </button>
            </div>
          </FormSection>

          <FormSection title="Lifecycle dates">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["dateOfPurchase", "Purchase"],
                  ["dateOfDelivery", "Delivery"],
                  ["dateOfRegistration", "Registration"],
                  ["dateOfOperation", "Operation"],
                  ["warrantyStartDate", "Warranty start"],
                  ["warrantyEndDate", "Warranty end"],
                  ["telematicsExpiryDate", "Telematics expiry"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    type="date"
                    className={inputClass}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </FormSection>

          <FormSection title="Finance">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loan provider">
                <input
                  className={inputClass}
                  value={form.loanProvider}
                  onChange={(e) => setField("loanProvider", e.target.value)}
                />
              </Field>
              <Field label="EMI amount">
                <input
                  className={inputClass}
                  value={form.emiAmount}
                  onChange={(e) => setField("emiAmount", e.target.value)}
                />
              </Field>
              <Field label="Tenure (months)">
                <input
                  type="number"
                  className={inputClass}
                  value={form.tenurePeriod}
                  onChange={(e) => setField("tenurePeriod", e.target.value)}
                />
              </Field>
              <Field label="EMI due date">
                <input
                  type="date"
                  className={inputClass}
                  value={form.emiDueDate}
                  onChange={(e) => setField("emiDueDate", e.target.value)}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Insurance">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Policy number">
                <input
                  className={inputClass}
                  value={form.insurancePolicyNumber}
                  onChange={(e) => setField("insurancePolicyNumber", e.target.value)}
                />
              </Field>
              <Field label="Provider">
                <input
                  className={inputClass}
                  value={form.insuranceProvider}
                  onChange={(e) => setField("insuranceProvider", e.target.value)}
                />
              </Field>
              <Field label="Policy type">
                <input
                  className={inputClass}
                  value={form.insurancePolicyType}
                  onChange={(e) => setField("insurancePolicyType", e.target.value)}
                />
              </Field>
              <Field label="Status">
                <input
                  className={inputClass}
                  value={form.insuranceStatus}
                  onChange={(e) => setField("insuranceStatus", e.target.value)}
                />
              </Field>
              <Field label="Valid from">
                <input
                  type="date"
                  className={inputClass}
                  value={form.insuranceValidFrom}
                  onChange={(e) => setField("insuranceValidFrom", e.target.value)}
                />
              </Field>
              <Field label="Valid to">
                <input
                  type="date"
                  className={inputClass}
                  value={form.insuranceValidTo}
                  onChange={(e) => setField("insuranceValidTo", e.target.value)}
                />
              </Field>
              <Field label="Premium amount">
                <input
                  className={inputClass}
                  value={form.insurancePremiumAmount}
                  onChange={(e) =>
                    setField("insurancePremiumAmount", e.target.value)
                  }
                />
              </Field>
              <Field label="Third party">
                <input
                  className={inputClass}
                  value={form.insuranceThirdParty}
                  onChange={(e) => setField("insuranceThirdParty", e.target.value)}
                />
              </Field>
            </div>
          </FormSection>

          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setFormOpen(false)}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={!!statusTarget}
        title={
          statusTarget
            ? `Status — ${statusTarget.registrationNumber}`
            : "Vehicle status"
        }
        onClose={() => setStatusTarget(null)}
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!statusTarget) return;
            await statusMutation.mutateAsync({
              id: statusTarget.id,
              payload: {
                status: statusForm.status,
                reason: statusForm.reason.trim() || undefined,
              },
            });
            setStatusTarget(null);
          }}
        >
          <Field label="Status">
            <select
              className={inputClass}
              value={statusForm.status}
              onChange={(e) =>
                setStatusForm((p) => ({
                  ...p,
                  status: e.target.value as VehicleStatusPayload["status"],
                }))
              }
            >
              {VEHICLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reason">
            <input
              className={inputClass}
              value={statusForm.reason}
              onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => setStatusTarget(null)}
              loading={statusMutation.isPending}
              submitLabel="Update status"
            />
          </div>
        </form>
      </EntityFormDialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete vehicle?"
        description="Soft-deletes the vehicle if allowed."
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteMutation.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <VehicleImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
