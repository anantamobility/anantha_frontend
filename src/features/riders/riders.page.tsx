import { useEffect, useMemo, useState } from "react";
import type { Rider } from "@/features/shared/entities";
import { useClientsQuery, useHubsQuery } from "@/features/shared/entities";
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
import { useRolesQuery } from "@/features/pbac/hooks/useRolesQuery";
import { AccountAdminSection } from "@/features/shared/users/AccountAdminSection";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError } from "@/features/shared/utils/notify";
import {
  EMPTY_ADDRESS,
  addressFromUnknown,
  addressPayload,
  emptyToDate,
  emptyToNull,
  toDateInput,
  type AddressForm,
} from "@/features/shared/utils/formValues";
import {
  downloadRiderDocument,
  getRider,
  listRiderDocuments,
  type RiderDocument,
  type RiderStatusPayload,
} from "./api/riders.api";
import { RiderImportDialog } from "./components/RiderImportDialog";
import { useRidersListQuery } from "./hooks/useRidersQuery";
import { useRiderMutations } from "./hooks/useRiderMutations";

const RIDER_STATUSES: RiderStatusPayload["status"][] = [
  "ONBOARDING",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "TERMINATED",
];

const DOCUMENT_TYPES = [
  "ID_PROOF",
  "ADDRESS_PROOF",
  "DRIVING_LICENSE",
  "VEHICLE_PERMIT",
  "INSURANCE",
  "REGISTRATION",
  "CONTRACT",
  "PVC",
  "BGV",
  "OTHER",
] as const;

const EMPTY = {
  fullName: "",
  riderCode: "",
  phoneNumber: "",
  email: "",
  password: "",
  dateOfBirth: "",
  gender: "" as "" | "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY",
  emergencyContactName: "",
  emergencyContactPhone: "",
  aadharNumber: "",
  panNumber: "",
  licenseNumber: "",
  medicalReportExpiryDate: "",
  agreementDate: "",
  policeVerificationValidUpto: "",
  backgroundVerificationExpiryDate: "",
  dateOfLastWorkingDay: "",
  bankName: "",
  branch: "",
  rentalType: "B2C" as "B2C" | "B2B",
  b2cMode: "AML_RIDER" as "AML_RIDER" | "INDIVIDUAL_RIDER",
  b2bRiderMgmt: "CLIENT_MANAGED" as "CLIENT_MANAGED" | "AML_MANAGED",
  clientId: "",
  hubId: "",
  address: { ...EMPTY_ADDRESS },
};

export default function RidersPage() {
  const { canManageMasterData } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Rider | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<Rider | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: "ACTIVE" as RiderStatusPayload["status"],
    reason: "",
  });
  const [docsTarget, setDocsTarget] = useState<Rider | null>(null);
  const [documents, setDocuments] = useState<RiderDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docForm, setDocForm] = useState({
    documentType: "ID_PROOF",
    title: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
    file: null as File | null,
  });

  const listQuery = useRidersListQuery(page, 20, search);
  const hubsQuery = useHubsQuery();
  const clientsQuery = useClientsQuery(undefined, form.rentalType === "B2B");
  const rolesQuery = useRolesQuery(canManageMasterData);
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    statusMutation,
    uploadDocumentMutation,
    deleteDocumentMutation,
  } = useRiderMutations();
  const riders = listQuery.data?.riders ?? [];
  const pagination = listQuery.data?.pagination;
  const roles = rolesQuery.data?.roles ?? [];

  const setAddress = (patch: Partial<AddressForm>) =>
    setForm((prev) => ({ ...prev, address: { ...prev.address, ...patch } }));

  useEffect(() => {
    if (!docsTarget) {
      setDocuments([]);
      return;
    }
    let cancelled = false;
    setDocsLoading(true);
    listRiderDocuments(docsTarget.id, { page: 1, limit: 50 })
      .then((result) => {
        if (!cancelled) setDocuments(result.documents);
      })
      .catch((error) => notifyError(getErrorMessage(error, "Failed to load documents")))
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [docsTarget]);

  const columns = useMemo<DataTableColumn<Rider>[]>(
    () => [
      { id: "name", header: "Name", cell: (row) => row.fullName },
      {
        id: "phone",
        header: "Phone",
        cell: (row) => row.user?.phoneNumber ?? "—",
      },
      { id: "type", header: "Type", cell: (row) => row.rentalType },
      { id: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
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
                    const detail = await getRider(row.id);
                    setEditing(detail);
                  setForm({
                      fullName: detail.fullName,
                      riderCode: detail.riderCode ?? "",
                      phoneNumber: detail.user?.phoneNumber ?? "",
                      email: detail.user?.email ?? "",
                      password: "",
                      dateOfBirth: toDateInput(detail.dateOfBirth),
                      gender:
                        (detail.gender as typeof EMPTY.gender) || "",
                      emergencyContactName: detail.emergencyContactName ?? "",
                      emergencyContactPhone: detail.emergencyContactPhone ?? "",
                      aadharNumber: detail.aadharNumber ?? "",
                      panNumber: detail.panNumber ?? "",
                      licenseNumber: detail.licenseNumber ?? "",
                      medicalReportExpiryDate: toDateInput(
                        detail.medicalReportExpiryDate,
                      ),
                      agreementDate: toDateInput(detail.agreementDate),
                      policeVerificationValidUpto: toDateInput(
                        detail.policeVerificationValidUpto,
                      ),
                      backgroundVerificationExpiryDate: toDateInput(
                        detail.backgroundVerificationExpiryDate,
                      ),
                      dateOfLastWorkingDay: toDateInput(
                        detail.dateOfLastWorkingDay,
                      ),
                      bankName: detail.bankName ?? "",
                      branch: detail.branch ?? "",
                      rentalType: (detail.rentalType as "B2C" | "B2B") || "B2C",
                      b2cMode:
                        (detail.b2cMode as typeof EMPTY.b2cMode) || "AML_RIDER",
                      b2bRiderMgmt:
                        (detail.b2bRiderMgmt as typeof EMPTY.b2bRiderMgmt) ||
                        "CLIENT_MANAGED",
                      clientId: detail.clientId ?? "",
                      hubId: detail.hubId ?? "",
                      address: addressFromUnknown(detail.address),
                  });
                  setFormOpen(true);
                  } catch (error) {
                    notifyError(getErrorMessage(error, "Failed to load rider"));
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
                    status: row.status as RiderStatusPayload["status"],
                    reason: "",
                  });
                }}
              >
                Status
              </button>
              <button
                type="button"
                className="text-xs text-primary"
                onClick={() => {
                  setDocsTarget(row);
                  setDocForm({
                    documentType: "ID_PROOF",
                    title: "",
                    issueDate: "",
                    expiryDate: "",
                    notes: "",
                    file: null,
                  });
                }}
              >
                Docs
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

  const profilePayload = () => ({
      fullName: form.fullName.trim(),
    riderCode: form.riderCode.trim() || undefined,
    dateOfBirth: emptyToDate(form.dateOfBirth),
    gender: form.gender || null,
    address: addressPayload(form.address),
    emergencyContactName: emptyToNull(form.emergencyContactName),
    emergencyContactPhone: emptyToNull(form.emergencyContactPhone),
    aadharNumber: emptyToNull(form.aadharNumber),
    panNumber: emptyToNull(form.panNumber),
    licenseNumber: emptyToNull(form.licenseNumber),
    medicalReportExpiryDate: emptyToDate(form.medicalReportExpiryDate),
    agreementDate: emptyToDate(form.agreementDate),
    policeVerificationValidUpto: emptyToDate(form.policeVerificationValidUpto),
    backgroundVerificationExpiryDate: emptyToDate(
      form.backgroundVerificationExpiryDate,
    ),
    dateOfLastWorkingDay: emptyToDate(form.dateOfLastWorkingDay),
    bankName: emptyToNull(form.bankName),
    branch: emptyToNull(form.branch),
      rentalType: form.rentalType,
      b2cMode: form.rentalType === "B2C" ? form.b2cMode : null,
      b2bRiderMgmt: form.rentalType === "B2B" ? form.b2bRiderMgmt : null,
      clientId: form.rentalType === "B2B" ? form.clientId || null : null,
      hubId: form.hubId || null,
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        payload: profilePayload(),
      });
    } else {
      await createMutation.mutateAsync({
        ...profilePayload(),
        phoneNumber: form.phoneNumber.trim(),
        email: emptyToNull(form.email),
        password: form.password,
      });
    }
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        title="Riders"
        description="Driver / rider master data — full profile."
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
                  setForm(EMPTY);
                  setFormOpen(true);
                }}
              >
                Add rider
              </button>
            </div>
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
          placeholder="Search riders…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={riders} rowKey={(r) => r.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="riders"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit rider" : "Create rider"}
        onClose={() => setFormOpen(false)}
      >
        {editing?.user ? (
          <div className="mb-4">
            <AccountAdminSection
              user={editing.user}
              roles={roles}
              onUserUpdated={(next) =>
                setEditing((prev) =>
                  prev
                    ? {
                        ...prev,
                        user: {
                          id: next.id,
                          email: next.email,
                          phoneNumber: next.phoneNumber,
                          status: next.status,
                          role: next.role,
                        },
                      }
                    : prev,
                )
              }
            />
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormSection title="Identity">
            <Field label="Full name *">
            <input
                className={inputClass}
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
            </Field>
            <Field label="Rider code (optional)">
              <input
                className={inputClass}
                value={form.riderCode}
                onChange={(e) => setForm((p) => ({ ...p, riderCode: e.target.value }))}
              />
            </Field>
            {!editing ? (
              <>
                <Field label="Phone *">
            <input
                    className={inputClass}
              value={form.phoneNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                    }
              required
            />
                </Field>
                <Field label="Email">
            <input
                    className={inputClass}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
                </Field>
                <Field label="Password *">
                  <input
                    type="password"
                    className={inputClass}
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    At least 8 characters, including a letter and a number.
                  </p>
                </Field>
              </>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of birth">
                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dateOfBirth: e.target.value }))
                  }
                />
              </Field>
              <Field label="Gender">
                <select
                  className={inputClass}
                  value={form.gender}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      gender: e.target.value as typeof EMPTY.gender,
                    }))
                  }
                >
                  <option value="">Unset</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Address">
            <Field label="Line 1">
              <input
                className={inputClass}
                value={form.address.line1}
                onChange={(e) => setAddress({ line1: e.target.value })}
              />
            </Field>
            <Field label="Line 2">
              <input
                className={inputClass}
                value={form.address.line2}
                onChange={(e) => setAddress({ line2: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input
                  className={inputClass}
                  value={form.address.city}
                  onChange={(e) => setAddress({ city: e.target.value })}
                />
              </Field>
              <Field label="State">
                <input
                  className={inputClass}
                  value={form.address.state}
                  onChange={(e) => setAddress({ state: e.target.value })}
                />
              </Field>
              <Field label="Postal code">
                <input
                  className={inputClass}
                  value={form.address.postalCode}
                  onChange={(e) => setAddress({ postalCode: e.target.value })}
                />
              </Field>
              <Field label="Country">
                <input
                  className={inputClass}
                  value={form.address.country}
                  onChange={(e) => setAddress({ country: e.target.value })}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Classification">
            <Field label="Rental type">
            <select
                className={inputClass}
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
            </Field>
          {form.rentalType === "B2C" ? (
              <Field label="B2C mode">
              <select
                  className={inputClass}
                value={form.b2cMode}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    b2cMode: e.target.value as typeof EMPTY.b2cMode,
                  }))
                }
              >
                <option value="AML_RIDER">AML rider</option>
                <option value="INDIVIDUAL_RIDER">Individual rider</option>
              </select>
              </Field>
          ) : (
            <>
                <Field label="B2B rider management">
                <select
                    className={inputClass}
                  value={form.b2bRiderMgmt}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      b2bRiderMgmt: e.target.value as typeof EMPTY.b2bRiderMgmt,
                    }))
                  }
                >
                  <option value="CLIENT_MANAGED">Client managed</option>
                  <option value="AML_MANAGED">AML managed</option>
                </select>
                </Field>
                <Field label="Client *">
                  <select
                    className={inputClass}
                    value={form.clientId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, clientId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select client</option>
                    {(clientsQuery.data?.clients ?? []).map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                        {client.clientCode ? ` (${client.clientCode})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
            </>
          )}
            <Field label="Hub">
            <select
                className={inputClass}
              value={form.hubId}
              onChange={(e) => setForm((p) => ({ ...p, hubId: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {(hubsQuery.data?.hubs ?? []).map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            </Field>
          </FormSection>

          <FormSection title="Emergency & IDs">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Emergency contact name">
                <input
                  className={inputClass}
                  value={form.emergencyContactName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, emergencyContactName: e.target.value }))
                  }
                />
              </Field>
              <Field label="Emergency contact phone">
                <input
                  className={inputClass}
                  value={form.emergencyContactPhone}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      emergencyContactPhone: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Aadhar">
                <input
                  className={inputClass}
                  value={form.aadharNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, aadharNumber: e.target.value }))
                  }
                />
              </Field>
              <Field label="PAN">
                <input
                  className={inputClass}
                  value={form.panNumber}
                  onChange={(e) => setForm((p) => ({ ...p, panNumber: e.target.value }))}
                />
              </Field>
              <Field label="License number">
                <input
                  className={inputClass}
                  value={form.licenseNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, licenseNumber: e.target.value }))
                  }
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Compliance dates">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Medical report expiry">
                <input
                  type="date"
                  className={inputClass}
                  value={form.medicalReportExpiryDate}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      medicalReportExpiryDate: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Agreement date">
                <input
                  type="date"
                  className={inputClass}
                  value={form.agreementDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, agreementDate: e.target.value }))
                  }
                />
              </Field>
              <Field label="PVC valid upto">
                <input
                  type="date"
                  className={inputClass}
                  value={form.policeVerificationValidUpto}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      policeVerificationValidUpto: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="BGV expiry">
                <input
                  type="date"
                  className={inputClass}
                  value={form.backgroundVerificationExpiryDate}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      backgroundVerificationExpiryDate: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Last working day">
                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfLastWorkingDay}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      dateOfLastWorkingDay: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Bank">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bank name">
                <input
                  className={inputClass}
                  value={form.bankName}
                  onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                />
              </Field>
              <Field label="Branch">
                <input
                  className={inputClass}
                  value={form.branch}
                  onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              Account number / IFSC are on the schema but not in the live rider API
              validation yet.
            </p>
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
            ? `Rider status — ${statusTarget.fullName}`
            : "Rider status"
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
          <Field label="Ops status">
            <select
              className={inputClass}
              value={statusForm.status}
              onChange={(e) =>
                setStatusForm((p) => ({
                  ...p,
                  status: e.target.value as RiderStatusPayload["status"],
                }))
              }
            >
              {RIDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-muted-foreground">
            Rider employment/ops status. Login account status is under Edit →
            Account.
          </p>
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

      <EntityFormDialog
        open={!!docsTarget}
        title={docsTarget ? `Documents — ${docsTarget.fullName}` : "Documents"}
        onClose={() => setDocsTarget(null)}
      >
        <div className="space-y-4">
          {docsLoading ? (
            <LoadingSkeleton rows={3} />
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.documentType}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-primary"
                      onClick={() =>
                        downloadRiderDocument(
                          docsTarget!.id,
                          doc.id,
                          doc.title || "document",
                        ).catch((error) =>
                          notifyError(getErrorMessage(error, "Download failed")),
                        )
                      }
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="text-xs text-destructive"
                      onClick={async () => {
                        await deleteDocumentMutation.mutateAsync({
                          riderId: docsTarget!.id,
                          documentId: doc.id,
                        });
                        const result = await listRiderDocuments(docsTarget!.id, {
                          page: 1,
                          limit: 50,
                        });
                        setDocuments(result.documents);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form
            className="space-y-3 border-t border-border pt-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!docsTarget || !docForm.file) return;
              await uploadDocumentMutation.mutateAsync({
                riderId: docsTarget.id,
                file: docForm.file,
                meta: {
                  documentType: docForm.documentType,
                  title: docForm.title.trim(),
                  issueDate: docForm.issueDate || null,
                  expiryDate: docForm.expiryDate || null,
                  notes: docForm.notes.trim() || undefined,
                },
              });
              const result = await listRiderDocuments(docsTarget.id, {
                page: 1,
                limit: 50,
              });
              setDocuments(result.documents);
              setDocForm({
                documentType: "ID_PROOF",
                title: "",
                issueDate: "",
                expiryDate: "",
                notes: "",
                file: null,
              });
            }}
          >
            <p className="text-sm font-medium">Upload document</p>
            <Field label="Type">
              <select
                className={inputClass}
                value={docForm.documentType}
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, documentType: e.target.value }))
                }
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input
                className={inputClass}
                value={docForm.title}
                onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </Field>
            <Field label="File">
              <input
                type="file"
                className="w-full text-sm"
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))
                }
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Issue date">
                <input
                  type="date"
                  className={inputClass}
                  value={docForm.issueDate}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, issueDate: e.target.value }))
                  }
                />
              </Field>
              <Field label="Expiry date">
                <input
                  type="date"
                  className={inputClass}
                  value={docForm.expiryDate}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <FormActions
                onCancel={() => setDocsTarget(null)}
                loading={uploadDocumentMutation.isPending}
                submitLabel="Upload"
              />
            </div>
          </form>
        </div>
      </EntityFormDialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete rider?"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteMutation.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <RiderImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
