import { useMemo, useState } from "react";
import type { Client, ClientContract } from "@/features/shared/entities";
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
import { emptyToNull, toDateInput } from "@/features/shared/utils/formValues";
import {
  getClient,
  type ClientContractPayload,
} from "./api/clients.api";
import { useClientsListQuery } from "./hooks/useClientsQuery";
import { useClientMutations } from "./hooks/useClientMutations";

const EMPTY_CLIENT = {
  clientCode: "",
  name: "",
  companyName: "",
  contactPerson: "",
  email: "",
  phoneNumber: "",
  isActive: true,
};

const EMPTY_CONTRACT = {
  contractNumber: "",
  hubId: "",
  riderManagement: "CLIENT_MANAGED" as "CLIENT_MANAGED" | "AML_MANAGED",
  startDate: "",
  endDate: "",
  vehicleCount: "1",
  vehicleModels: "",
  dailyRate: "",
  securityDeposit: "",
  billingFrequency: "MONTHLY" as "WEEKLY" | "FORTNIGHTLY" | "MONTHLY",
  minBillingDays: "",
  graceDays: "",
  paymentTermsDays: "",
  replacementRules: "",
  downtimeRules: "",
  damageRecoveryRules: "",
  notes: "",
};

function moneyToInput(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return String(value);
}

function optionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number.parseInt(trimmed, 10);
}

function contractToForm(contract: ClientContract): typeof EMPTY_CONTRACT {
  const billingFrequency: typeof EMPTY_CONTRACT.billingFrequency =
    contract.billingFrequency === "WEEKLY" ||
    contract.billingFrequency === "FORTNIGHTLY"
      ? contract.billingFrequency
      : "MONTHLY";

  return {
    contractNumber: contract.contractNumber,
    hubId: contract.hubId ?? "",
    riderManagement:
      contract.riderManagement === "AML_MANAGED"
        ? "AML_MANAGED"
        : "CLIENT_MANAGED",
    startDate: toDateInput(contract.startDate),
    endDate: toDateInput(contract.endDate),
    vehicleCount: String(contract.vehicleCount),
    vehicleModels: (contract.vehicleModels ?? []).join(", "),
    dailyRate: moneyToInput(contract.dailyRate),
    securityDeposit: moneyToInput(contract.securityDeposit),
    billingFrequency,
    minBillingDays:
      contract.minBillingDays == null ? "" : String(contract.minBillingDays),
    graceDays: contract.graceDays == null ? "" : String(contract.graceDays),
    paymentTermsDays:
      contract.paymentTermsDays == null
        ? ""
        : String(contract.paymentTermsDays),
    replacementRules: contract.replacementRules ?? "",
    downtimeRules: contract.downtimeRules ?? "",
    damageRecoveryRules: contract.damageRecoveryRules ?? "",
    notes: contract.notes ?? "",
  };
}

function buildContractPayload(
  form: typeof EMPTY_CONTRACT,
): ClientContractPayload {
  const models = form.vehicleModels
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    contractNumber: form.contractNumber.trim(),
    hubId: form.hubId.trim() ? form.hubId.trim() : null,
    riderManagement: form.riderManagement,
    startDate: form.startDate,
    endDate: form.endDate.trim() ? form.endDate : null,
    vehicleCount: Number.parseInt(form.vehicleCount, 10),
    vehicleModels: models,
    dailyRate: form.dailyRate.trim(),
    securityDeposit: form.securityDeposit.trim()
      ? form.securityDeposit.trim()
      : null,
    billingFrequency: form.billingFrequency,
    minBillingDays: optionalInt(form.minBillingDays),
    graceDays: optionalInt(form.graceDays),
    paymentTermsDays: optionalInt(form.paymentTermsDays),
    replacementRules: emptyToNull(form.replacementRules),
    downtimeRules: emptyToNull(form.downtimeRules),
    damageRecoveryRules: emptyToNull(form.damageRecoveryRules),
    notes: emptyToNull(form.notes),
  };
}

export default function ClientsPage() {
  const { canWrite } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_CLIENT);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<Client | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [contractOpen, setContractOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ClientContract | null>(
    null,
  );
  const [contractForm, setContractForm] = useState(EMPTY_CONTRACT);

  const listQuery = useClientsListQuery(page, 20, search);
  const hubsQuery = useHubsQuery();
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    statusMutation,
    createContractMutation,
    updateContractMutation,
  } = useClientMutations();

  const clients = listQuery.data?.clients ?? [];
  const pagination = listQuery.data?.pagination;
  const hubs = hubsQuery.data?.hubs ?? [];

  const reloadDetail = async (clientId: string) => {
    const next = await getClient(clientId);
    setDetail(next);
    return next;
  };

  const openDetail = async (clientId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      await reloadDetail(clientId);
    } catch (error) {
      notifyError(getErrorMessage(error, "Failed to load client"));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditClient = async (row: Client) => {
    try {
      const client = await getClient(row.id);
      setEditing(client);
      setForm({
        clientCode: client.clientCode ?? "",
        name: client.name,
        companyName: client.companyName ?? "",
        contactPerson: client.contactPerson ?? "",
        email: client.email ?? "",
        phoneNumber: client.phoneNumber ?? "",
        isActive: client.isActive,
      });
      setFormOpen(true);
    } catch (error) {
      notifyError(getErrorMessage(error, "Failed to load client"));
    }
  };

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
        cell: (row) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs text-primary"
              onClick={() => void openDetail(row.id)}
            >
              Open
            </button>
            {canWrite ? (
              <>
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() => void openEditClient(row)}
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
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [canWrite, statusMutation],
  );

  const submitClient = async () => {
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
      const editedId = editing?.id;
      setFormOpen(false);
      setEditing(null);
      setForm(EMPTY_CLIENT);
      if (editedId && detail?.id === editedId) {
        await reloadDetail(editedId);
      }
    } catch {
      // mutation notifies
    }
  };

  const submitContract = async () => {
    if (!detail) return;
    const payload = buildContractPayload(contractForm);
    if (!payload.vehicleModels.length) {
      notifyError("Add at least one vehicle model");
      return;
    }
    if (!Number.isFinite(payload.vehicleCount) || payload.vehicleCount < 1) {
      notifyError("Vehicle count must be greater than 0");
      return;
    }

    try {
      if (editingContract) {
        const { contractNumber: _ignored, ...updatePayload } = payload;
        await updateContractMutation.mutateAsync({
          clientId: detail.id,
          contractId: editingContract.id,
          payload: updatePayload,
        });
      } else {
        await createContractMutation.mutateAsync({
          clientId: detail.id,
          payload,
        });
      }
      setContractOpen(false);
      setEditingContract(null);
      setContractForm(EMPTY_CONTRACT);
      await reloadDetail(detail.id);
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
                setForm(EMPTY_CLIENT);
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
          setForm(EMPTY_CLIENT);
        }}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitClient();
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
                setForm(EMPTY_CLIENT);
              }}
              loading={createMutation.isPending || updateMutation.isPending}
              submitLabel={editing ? "Save" : "Create"}
            />
          </div>
        </form>
      </EntityFormDialog>

      <EntityFormDialog
        open={detailOpen}
        title={detail ? `Client — ${detail.name}` : "Client"}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
      >
        {detailLoading ? (
          <LoadingSkeleton />
        ) : detail ? (
          <div className="space-y-5">
            <FormSection title="Details">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Code</dt>
                  <dd>{detail.clientCode || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge
                      status={detail.isActive ? "ACTIVE" : "INACTIVE"}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Company</dt>
                  <dd>{detail.companyName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd>{detail.contactPerson || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{detail.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{detail.phoneNumber || "—"}</dd>
                </div>
              </dl>
            </FormSection>

            <FormSection title="Contracts">
              {canWrite ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-primary"
                    onClick={() => {
                      setEditingContract(null);
                      setContractForm(EMPTY_CONTRACT);
                      setContractOpen(true);
                    }}
                  >
                    Add contract
                  </button>
                </div>
              ) : null}
              {(detail.contracts ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No contracts yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">Number</th>
                        <th className="py-2 pr-3 font-medium">Start</th>
                        <th className="py-2 pr-3 font-medium">Vehicles</th>
                        <th className="py-2 pr-3 font-medium">Daily rate</th>
                        <th className="py-2 pr-3 font-medium">Billing</th>
                        <th className="py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.contracts ?? []).map((contract) => (
                        <tr
                          key={contract.id}
                          className="border-b border-border/60"
                        >
                          <td className="py-2 pr-3">{contract.contractNumber}</td>
                          <td className="py-2 pr-3">
                            {toDateInput(contract.startDate) || "—"}
                          </td>
                          <td className="py-2 pr-3">{contract.vehicleCount}</td>
                          <td className="py-2 pr-3">
                            {moneyToInput(contract.dailyRate) || "—"}
                          </td>
                          <td className="py-2 pr-3">
                            {contract.billingFrequency}
                          </td>
                          <td className="py-2 text-right">
                            {canWrite ? (
                              <button
                                type="button"
                                className="text-xs text-primary"
                                onClick={() => {
                                  setEditingContract(contract);
                                  setContractForm(contractToForm(contract));
                                  setContractOpen(true);
                                }}
                              >
                                Edit
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </FormSection>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Client not found.</p>
        )}
      </EntityFormDialog>

      <EntityFormDialog
        open={contractOpen}
        title={editingContract ? "Edit contract" : "Add contract"}
        onClose={() => {
          setContractOpen(false);
          setEditingContract(null);
          setContractForm(EMPTY_CONTRACT);
        }}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitContract();
          }}
        >
          <FormSection title="Contract">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contract number">
                <input
                  className={inputClass}
                  value={contractForm.contractNumber}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      contractNumber: e.target.value,
                    }))
                  }
                  disabled={Boolean(editingContract)}
                  required
                />
              </Field>
              <Field label="Hub">
                <select
                  className={inputClass}
                  value={contractForm.hubId}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      hubId: e.target.value,
                    }))
                  }
                >
                  <option value="">None</option>
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rider management">
                <select
                  className={inputClass}
                  value={contractForm.riderManagement}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      riderManagement: e.target.value as
                        | "CLIENT_MANAGED"
                        | "AML_MANAGED",
                    }))
                  }
                  required
                >
                  <option value="CLIENT_MANAGED">Client managed</option>
                  <option value="AML_MANAGED">AML managed</option>
                </select>
              </Field>
              <Field label="Billing frequency">
                <select
                  className={inputClass}
                  value={contractForm.billingFrequency}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      billingFrequency: e.target.value as
                        | "WEEKLY"
                        | "FORTNIGHTLY"
                        | "MONTHLY",
                    }))
                  }
                  required
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="FORTNIGHTLY">Fortnightly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </Field>
              <Field label="Start date">
                <input
                  type="date"
                  className={inputClass}
                  value={contractForm.startDate}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="End date">
                <input
                  type="date"
                  className={inputClass}
                  value={contractForm.endDate}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Vehicle count">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={contractForm.vehicleCount}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      vehicleCount: e.target.value,
                    }))
                  }
                  required
                />
              </Field>
              <Field label="Vehicle models">
                <input
                  className={inputClass}
                  value={contractForm.vehicleModels}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      vehicleModels: e.target.value,
                    }))
                  }
                  placeholder="Comma-separated models"
                  required
                />
              </Field>
              <Field label="Daily rate">
                <input
                  className={inputClass}
                  value={contractForm.dailyRate}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      dailyRate: e.target.value,
                    }))
                  }
                  placeholder="e.g. 450.00"
                  required
                />
              </Field>
              <Field label="Security deposit">
                <input
                  className={inputClass}
                  value={contractForm.securityDeposit}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      securityDeposit: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Min billing days">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={contractForm.minBillingDays}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      minBillingDays: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Grace days">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={contractForm.graceDays}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      graceDays: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Payment terms days">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={contractForm.paymentTermsDays}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      paymentTermsDays: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
            <div className="mt-3 grid gap-3">
              <Field label="Replacement rules">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={contractForm.replacementRules}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      replacementRules: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Downtime rules">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={contractForm.downtimeRules}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      downtimeRules: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Damage recovery rules">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={contractForm.damageRecoveryRules}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      damageRecoveryRules: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Notes">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={contractForm.notes}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </FormSection>
          <div className="flex justify-end gap-2 pt-2">
            <FormActions
              onCancel={() => {
                setContractOpen(false);
                setEditingContract(null);
                setContractForm(EMPTY_CONTRACT);
              }}
              loading={
                createContractMutation.isPending ||
                updateContractMutation.isPending
              }
              submitLabel={editingContract ? "Save" : "Create"}
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
          if (detail?.id === deleteId) {
            setDetailOpen(false);
            setDetail(null);
          }
        }}
      />
    </div>
  );
}
