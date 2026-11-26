import { useMemo, useState } from "react";
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
import { getStaff, type StaffMember } from "./api/staff.api";
import { StaffImportDialog } from "./components/StaffImportDialog";
import { useStaffListQuery } from "./hooks/useStaffQuery";
import { useStaffMutations } from "./hooks/useStaffMutations";

const EMPTY = {
  fullName: "",
  gender: "MALE" as "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY",
  dateOfBirth: "",
  phoneNumber: "",
  email: "",
  password: "",
  roleId: "",
  hubId: "",
  department: "",
  employeeCode: "",
  jobTitle: "",
  status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "SUSPENDED",
  alternatePhone: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  bloodGroup: "",
  employmentType: "" as
    | ""
    | "INTERN"
    | "TRAINEE"
    | "FULL_TIME"
    | "PART_TIME"
    | "CONSULTANT",
  workMode: "" as "" | "REMOTE" | "ONSITE" | "HYBRID",
  educationalQualification: "",
  anniversary: "",
  dateOfJoining: "",
  probationEndDate: "",
  dateOfLastWorkingDay: "",
  dateOfRelieving: "",
  aadharNumber: "",
  panNumber: "",
  bankName: "",
  branch: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankHolderName: "",
  address: { ...EMPTY_ADDRESS },
};

export default function StaffPage() {
  const { canManageMasterData } = useRbac();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const listQuery = useStaffListQuery(page, 20, search);
  const hubsQuery = useHubsQuery();
  const rolesQuery = useRolesQuery(canManageMasterData);
  const { createMutation, updateMutation, deleteMutation } = useStaffMutations();

  const staff = listQuery.data?.staff ?? [];
  const pagination = listQuery.data?.pagination;
  const roles = rolesQuery.data?.roles ?? [];

  const setAddress = (patch: Partial<AddressForm>) =>
    setForm((prev) => ({ ...prev, address: { ...prev.address, ...patch } }));

  const columns = useMemo<DataTableColumn<StaffMember>[]>(
    () => [
      { id: "name", header: "Name", cell: (row) => row.fullName },
      {
        id: "code",
        header: "Code",
        cell: (row) => row.employeeCode || "—",
      },
      {
        id: "phone",
        header: "Phone",
        cell: (row) => row.user?.phoneNumber ?? "—",
      },
      {
        id: "dept",
        header: "Department",
        cell: (row) => row.department || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: (row) =>
          canManageMasterData ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs text-primary"
                onClick={async () => {
                  try {
                    const detail = await getStaff(row.id);
                    setEditing(detail);
                    setForm({
                      fullName: detail.fullName,
                      gender:
                        (detail.gender as typeof EMPTY.gender) || "MALE",
                      dateOfBirth: toDateInput(detail.dateOfBirth),
                      phoneNumber: detail.user?.phoneNumber ?? "",
                      email: detail.user?.email ?? "",
                      password: "",
                      roleId: detail.user?.role?.id ?? "",
                      hubId: detail.hubId ?? "",
                      department: detail.department ?? "",
                      employeeCode: detail.employeeCode ?? "",
                      jobTitle: detail.jobTitle ?? "",
                      status:
                        (detail.status as typeof EMPTY.status) || "ACTIVE",
                      alternatePhone: detail.alternatePhone ?? "",
                      emergencyContactName: detail.emergencyContactName ?? "",
                      emergencyContactPhone: detail.emergencyContactPhone ?? "",
                      bloodGroup: detail.bloodGroup ?? "",
                      employmentType:
                        (detail.employmentType as typeof EMPTY.employmentType) ||
                        "",
                      workMode:
                        (detail.workMode as typeof EMPTY.workMode) || "",
                      educationalQualification:
                        detail.educationalQualification ?? "",
                      anniversary: toDateInput(detail.anniversary),
                      dateOfJoining: toDateInput(detail.dateOfJoining),
                      probationEndDate: toDateInput(detail.probationEndDate),
                      dateOfLastWorkingDay: toDateInput(
                        detail.dateOfLastWorkingDay,
                      ),
                      dateOfRelieving: toDateInput(detail.dateOfRelieving),
                      aadharNumber: detail.aadharNumber ?? "",
                      panNumber: detail.panNumber ?? "",
                      bankName: detail.bankName ?? "",
                      branch: detail.branch ?? "",
                      bankAccountNumber: detail.bankAccountNumber ?? "",
                      bankIfsc: detail.bankIfsc ?? "",
                      bankHolderName: detail.bankHolderName ?? "",
                      address: addressFromUnknown(detail.address),
                    });
                    setFormOpen(true);
                  } catch (error) {
                    notifyError(getErrorMessage(error, "Failed to load staff"));
                  }
                }}
              >
                Edit
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
    gender: form.gender,
    dateOfBirth: emptyToDate(form.dateOfBirth),
    department: emptyToNull(form.department),
    employeeCode: emptyToNull(form.employeeCode),
    hubId: form.hubId || null,
    jobTitle: emptyToNull(form.jobTitle),
    status: form.status,
    alternatePhone: emptyToNull(form.alternatePhone),
    address: addressPayload(form.address),
    emergencyContactName: emptyToNull(form.emergencyContactName),
    emergencyContactPhone: emptyToNull(form.emergencyContactPhone),
    bloodGroup: emptyToNull(form.bloodGroup),
    employmentType: form.employmentType || null,
    workMode: form.workMode || null,
    educationalQualification: emptyToNull(form.educationalQualification),
    anniversary: emptyToDate(form.anniversary),
    dateOfJoining: emptyToDate(form.dateOfJoining),
    probationEndDate: emptyToDate(form.probationEndDate),
    dateOfLastWorkingDay: emptyToDate(form.dateOfLastWorkingDay),
    dateOfRelieving: emptyToDate(form.dateOfRelieving),
    aadharNumber: emptyToNull(form.aadharNumber),
    panNumber: emptyToNull(form.panNumber),
    bankName: emptyToNull(form.bankName),
    branch: emptyToNull(form.branch),
    bankAccountNumber: emptyToNull(form.bankAccountNumber),
    bankIfsc: emptyToNull(form.bankIfsc),
    bankHolderName: emptyToNull(form.bankHolderName),
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
        roleId: form.roleId || undefined,
      });
    }
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Operator accounts and HR profile — full staff record."
        actions={
          canManageMasterData ? (
            <div className="flex flex-wrap gap-2">
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
                Add staff
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
          placeholder="Search staff…"
        />
      </div>
      {listQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DataTable columns={columns} rows={staff} rowKey={(row) => row.id} />
          <PaginationBar
            page={pagination?.page ?? page}
            totalPages={pagination?.totalPages ?? 1}
            total={pagination?.total ?? 0}
            limit={pagination?.limit ?? 20}
            onPageChange={setPage}
            itemLabel="staff"
          />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        title={editing ? "Edit staff" : "Create staff"}
        onClose={() => setFormOpen(false)}
      >
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender *">
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
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </Field>
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
              <Field label="Employee code">
                <input
                  className={inputClass}
                  value={form.employeeCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, employeeCode: e.target.value }))
                  }
                />
              </Field>
              <Field label="Blood group">
                <input
                  className={inputClass}
                  value={form.bloodGroup}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bloodGroup: e.target.value }))
                  }
                />
              </Field>
            </div>
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
                <Field label="Role *">
                  <select
                    className={inputClass}
                    value={form.roleId}
                    onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
                    required
                  >
                    <option value="">Select role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            ) : null}
          </FormSection>

          <FormSection title="Organization">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hub">
                <select
                  className={inputClass}
                  value={form.hubId}
                  onChange={(e) => setForm((p) => ({ ...p, hubId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {(hubsQuery.data?.hubs ?? []).map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Employment status">
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      status: e.target.value as typeof EMPTY.status,
                    }))
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </Field>
              <Field label="Department">
                <input
                  className={inputClass}
                  value={form.department}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, department: e.target.value }))
                  }
                />
              </Field>
              <Field label="Job title">
                <input
                  className={inputClass}
                  value={form.jobTitle}
                  onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                />
              </Field>
              <Field label="Employment type">
                <select
                  className={inputClass}
                  value={form.employmentType}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      employmentType: e.target.value as typeof EMPTY.employmentType,
                    }))
                  }
                >
                  <option value="">Unset</option>
                  <option value="INTERN">Intern</option>
                  <option value="TRAINEE">Trainee</option>
                  <option value="FULL_TIME">Full time</option>
                  <option value="PART_TIME">Part time</option>
                  <option value="CONSULTANT">Consultant</option>
                </select>
              </Field>
              <Field label="Work mode">
                <select
                  className={inputClass}
                  value={form.workMode}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      workMode: e.target.value as typeof EMPTY.workMode,
                    }))
                  }
                >
                  <option value="">Unset</option>
                  <option value="REMOTE">Remote</option>
                  <option value="ONSITE">Onsite</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </Field>
              <Field label="Educational qualification">
                <input
                  className={inputClass}
                  value={form.educationalQualification}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      educationalQualification: e.target.value,
                    }))
                  }
                />
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

          <FormSection title="Contacts">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Alternate phone">
                <input
                  className={inputClass}
                  value={form.alternatePhone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, alternatePhone: e.target.value }))
                  }
                />
              </Field>
              <Field label="Emergency contact name">
                <input
                  className={inputClass}
                  value={form.emergencyContactName}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      emergencyContactName: e.target.value,
                    }))
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
            </div>
          </FormSection>

          <FormSection title="Employment dates">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Anniversary">
                <input
                  type="date"
                  className={inputClass}
                  value={form.anniversary}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, anniversary: e.target.value }))
                  }
                />
              </Field>
              <Field label="Date of joining">
                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfJoining}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dateOfJoining: e.target.value }))
                  }
                />
              </Field>
              <Field label="Probation end">
                <input
                  type="date"
                  className={inputClass}
                  value={form.probationEndDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, probationEndDate: e.target.value }))
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
              <Field label="Date of relieving">
                <input
                  type="date"
                  className={inputClass}
                  value={form.dateOfRelieving}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dateOfRelieving: e.target.value }))
                  }
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="IDs">
            <div className="grid grid-cols-2 gap-3">
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
              <Field label="Account number">
                <input
                  className={inputClass}
                  value={form.bankAccountNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bankAccountNumber: e.target.value }))
                  }
                />
              </Field>
              <Field label="IFSC">
                <input
                  className={inputClass}
                  value={form.bankIfsc}
                  onChange={(e) => setForm((p) => ({ ...p, bankIfsc: e.target.value }))}
                />
              </Field>
              <Field label="Account holder">
                <input
                  className={inputClass}
                  value={form.bankHolderName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bankHolderName: e.target.value }))
                  }
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

        {editing?.user ? (
          <div className="mt-4">
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
      </EntityFormDialog>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete staff?"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteMutation.mutateAsync(deleteId);
          setDeleteId(null);
        }}
      />

      <StaffImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
