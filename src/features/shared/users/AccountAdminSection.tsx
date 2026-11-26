import { useEffect, useState } from "react";
import {
  ConfirmDialog,
  EntityFormDialog,
  Field,
  FormActions,
  FormSection,
  inputClass,
} from "@/features/shared/components/common";
import { emptyToNull } from "@/features/shared/utils/formValues";
import { notifyError } from "@/features/shared/utils/notify";
import { useUserAccountMutations } from "./useUserAccountMutations";
import type { AccountStatus, LinkedUserAccount } from "./users.api";

type RoleOption = { id: string; name: string };

type AccountAdminSectionProps = {
  user: LinkedUserAccount;
  roles: RoleOption[];
  onUserUpdated?: (user: LinkedUserAccount) => void;
};

const ACCOUNT_STATUSES: AccountStatus[] = [
  "ONBOARDING",
  "ACTIVE",
  "SUSPENDED",
];

export function AccountAdminSection({
  user,
  roles,
  onUserUpdated,
}: AccountAdminSectionProps) {
  const {
    updateMutation,
    roleMutation,
    statusMutation,
    revokeSessionsMutation,
    resetPasswordMutation,
  } = useUserAccountMutations();

  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [roleId, setRoleId] = useState(user.role?.id ?? "");
  const [roleReason, setRoleReason] = useState("");
  const [loginStatus, setLoginStatus] = useState<AccountStatus>(
    (user.status as AccountStatus) || "ACTIVE",
  );
  const [statusReason, setStatusReason] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    setPhoneNumber(user.phoneNumber ?? "");
    setEmail(user.email ?? "");
    setRoleId(user.role?.id ?? "");
    setLoginStatus((user.status as AccountStatus) || "ACTIVE");
  }, [user]);

  const applyUser = (next: LinkedUserAccount) => {
    onUserUpdated?.(next);
  };

  return (
    <>
      <FormSection title="Account (login)">
        <p className="text-xs text-muted-foreground">
          Login identity for this person. Employment/ops status is separate.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input
              className={inputClass}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
            disabled={updateMutation.isPending}
            onClick={async () => {
              if (!phoneNumber.trim()) {
                notifyError("Phone number is required");
                return;
              }
              try {
                const next = await updateMutation.mutateAsync({
                  id: user.id,
                  payload: {
                    phoneNumber: phoneNumber.trim(),
                    email: emptyToNull(email),
                  },
                });
                applyUser(next);
              } catch {
                // mutation notifies
              }
            }}
          >
            Save contact
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <select
              className={inputClass}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Role change reason">
            <input
              className={inputClass}
              value={roleReason}
              onChange={(e) => setRoleReason(e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
            disabled={roleMutation.isPending || !roleId}
            onClick={async () => {
              try {
                const next = await roleMutation.mutateAsync({
                  id: user.id,
                  payload: {
                    roleId,
                    reason: roleReason.trim() || undefined,
                  },
                });
                applyUser(next);
                setRoleReason("");
              } catch {
                // mutation notifies
              }
            }}
          >
            Save role
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Login status">
            <select
              className={inputClass}
              value={loginStatus}
              onChange={(e) =>
                setLoginStatus(e.target.value as AccountStatus)
              }
            >
              {ACCOUNT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status reason">
            <input
              className={inputClass}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
            disabled={statusMutation.isPending}
            onClick={async () => {
              try {
                const next = await statusMutation.mutateAsync({
                  id: user.id,
                  payload: {
                    status: loginStatus,
                    reason: statusReason.trim() || undefined,
                  },
                });
                applyUser(next);
                setStatusReason("");
              } catch {
                // mutation notifies
              }
            }}
          >
            Save login status
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
            onClick={() => setConfirmRevoke(true)}
          >
            Revoke sessions
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
            onClick={() => {
              setNewPassword("");
              setResetOpen(true);
            }}
          >
            Reset password
          </button>
        </div>
      </FormSection>

      <ConfirmDialog
        open={confirmRevoke}
        title="Revoke all sessions?"
        description="Forces this user to sign in again on every device."
        destructive
        loading={revokeSessionsMutation.isPending}
        onCancel={() => setConfirmRevoke(false)}
        onConfirm={async () => {
          await revokeSessionsMutation.mutateAsync(user.id);
          setConfirmRevoke(false);
        }}
      />

      <EntityFormDialog
        open={resetOpen}
        title="Reset password"
        onClose={() => {
          setResetOpen(false);
          setNewPassword("");
        }}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              if (!newPassword.trim()) {
                notifyError("Enter a new password");
                return;
              }
              try {
                await resetPasswordMutation.mutateAsync({
                  userId: user.id,
                  newPassword: newPassword.trim(),
                });
                setResetOpen(false);
                setNewPassword("");
              } catch {
                // mutation notifies
              }
            })();
          }}
        >
          <Field label="New password">
            <input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              At least 8 characters, including a letter and a number.
            </p>
          </Field>
          <div className="flex justify-end">
            <FormActions
              onCancel={() => {
                setResetOpen(false);
                setNewPassword("");
              }}
              loading={resetPasswordMutation.isPending}
              submitLabel="Reset password"
            />
          </div>
        </form>
      </EntityFormDialog>
    </>
  );
}
