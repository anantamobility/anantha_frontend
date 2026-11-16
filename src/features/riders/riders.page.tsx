import { useEffect, useMemo, useState } from "react";
import type { Rider } from "@/features/shared/entities";
import { useHubsQuery } from "@/features/shared/entities";
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
import { useRbac } from "@/features/shared/hooks/useRbac";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError } from "@/features/shared/utils/notify";
import {
  downloadRiderDocument,
  getRider,
  listRiderDocuments,
  type RiderDocument,
  type RiderStatusPayload,
} from "./api/riders.api";
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
  phoneNumber: "",
  email: "",
  password: "",
  rentalType: "B2C" as "B2C" | "B2B",
  b2cMode: "AML_RIDER" as "AML_RIDER" | "INDIVIDUAL_RIDER",
  b2bRiderMgmt: "CLIENT_MANAGED" as "CLIENT_MANAGED" | "AML_MANAGED",
  clientId: "",
  hubId: "",
  dateOfBirth: "",
  policeVerificationValidUpto: "",
  backgroundVerificationExpiryDate: "",
};

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default function RidersPage() {
  const { canManageMasterData } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
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
                      phoneNumber: detail.user?.phoneNumber ?? "",
                      email: detail.user?.email ?? "",
                      password: "",
                      rentalType: (detail.rentalType as "B2C" | "B2B") || "B2C",
                      b2cMode:
                        (detail.b2cMode as typeof EMPTY.b2cMode) || "AML_RIDER",
                      b2bRiderMgmt:
                        (detail.b2bRiderMgmt as typeof EMPTY.b2bRiderMgmt) ||
                        "CLIENT_MANAGED",
                      clientId: detail.clientId ?? "",
                      hubId: detail.hubId ?? "",
                      dateOfBirth: toDateInput(detail.dateOfBirth),
                      policeVerificationValidUpto: toDateInput(
                        detail.policeVerificationValidUpto,
                      ),
                      backgroundVerificationExpiryDate: toDateInput(
                        detail.backgroundVerificationExpiryDate,
                      ),
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

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        payload: {
          fullName: form.fullName.trim(),
          rentalType: form.rentalType,
          b2cMode: form.rentalType === "B2C" ? form.b2cMode : null,
          b2bRiderMgmt: form.rentalType === "B2B" ? form.b2bRiderMgmt : null,
          clientId: form.rentalType === "B2B" ? form.clientId || null : null,
          hubId: form.hubId || null,
          dateOfBirth: form.dateOfBirth || null,
          policeVerificationValidUpto: form.policeVerificationValidUpto || null,
          backgroundVerificationExpiryDate:
            form.backgroundVerificationExpiryDate || null,
        },
      });
    } else {
      await createMutation.mutateAsync({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || null,
        password: form.password,
        rentalType: form.rentalType,
        b2cMode: form.rentalType === "B2C" ? form.b2cMode : null,
        b2bRiderMgmt: form.rentalType === "B2B" ? form.b2bRiderMgmt : null,
        clientId: form.rentalType === "B2B" ? form.clientId || null : null,
        hubId: form.hubId || null,
        dateOfBirth: form.dateOfBirth || null,
        policeVerificationValidUpto: form.policeVerificationValidUpto || null,
        backgroundVerificationExpiryDate:
          form.backgroundVerificationExpiryDate || null,
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
        description="Driver / rider master data."
        actions={
          canManageMasterData ? (
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
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Full name
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
          </label>
          {!editing ? (
            <>
              <label className="block text-sm">
                Phone
                <input
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                  }
                  required
                />
              </label>
              <label className="block text-sm">
                Email
                <input
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                Password
                <input
                  type="password"
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  minLength={8}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Password needs 8+ characters with a letter and a digit. Phone/email
                changes later go through Users.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Phone/email are managed on the linked user account.
            </p>
          )}
          <label className="block text-sm">
            Date of birth
            <input
              type="date"
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.dateOfBirth}
              onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            Rental type
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={form.rentalType}
              onChange={(e) =>
                setForm((p) => ({ ...p, rentalType: e.target.value as "B2C" | "B2B" }))
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
                    b2cMode: e.target.value as typeof EMPTY.b2cMode,
                  }))
                }
              >
                <option value="AML_RIDER">AML rider</option>
                <option value="INDIVIDUAL_RIDER">Individual rider</option>
              </select>
            </label>
          ) : (
            <>
              <label className="block text-sm">
                B2B rider management
                <select
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
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
              </label>
              <label className="block text-sm">
                Client ID
                <input
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={form.clientId}
                  onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
                  placeholder="UUID (clients API not live)"
                  required
                />
              </label>
            </>
          )}
          <label className="block text-sm">
            Hub
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
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
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              PVC valid upto
              <input
                type="date"
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.policeVerificationValidUpto}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    policeVerificationValidUpto: e.target.value,
                  }))
                }
              />
            </label>
            <label className="block text-sm">
              BGV expiry
              <input
                type="date"
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={form.backgroundVerificationExpiryDate}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    backgroundVerificationExpiryDate: e.target.value,
                  }))
                }
              />
            </label>
          </div>
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
        title={statusTarget ? `Status — ${statusTarget.fullName}` : "Status"}
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
          <label className="block text-sm">
            Status
            <select
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
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
          </label>
          <label className="block text-sm">
            Reason
            <input
              className="mt-1 h-9 w-full rounded-lg border border-border px-3"
              value={statusForm.reason}
              onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </label>
          {statusTarget?.statusChangedAt ? (
            <p className="text-xs text-muted-foreground">
              Last changed: {new Date(statusTarget.statusChangedAt).toLocaleString()}
            </p>
          ) : null}
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
            <label className="block text-sm">
              Type
              <select
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
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
            </label>
            <label className="block text-sm">
              Title
              <input
                className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                value={docForm.title}
                onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </label>
            <label className="block text-sm">
              File
              <input
                type="file"
                className="mt-1 w-full text-sm"
                onChange={(e) =>
                  setDocForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))
                }
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Issue date
                <input
                  type="date"
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={docForm.issueDate}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, issueDate: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm">
                Expiry date
                <input
                  type="date"
                  className="mt-1 h-9 w-full rounded-lg border border-border px-3"
                  value={docForm.expiryDate}
                  onChange={(e) =>
                    setDocForm((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                />
              </label>
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
    </div>
  );
}
