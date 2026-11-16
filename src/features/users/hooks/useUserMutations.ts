import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { adminResetPassword } from "@/features/auth/api/auth.api";
import {
  assignUserRole,
  changeUserStatus,
  deleteUser,
  revokeUserSessions,
  updateUser,
} from "../api/users.api";
import { userKeys } from "./useUsersQuery";

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: userKeys.all });
  };

  return {
    updateMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: { phoneNumber?: string; email?: string | null };
      }) => updateUser(id, payload),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("User updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to update user")),
    }),
    roleMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: { roleId: string; reason?: string };
      }) => assignUserRole(id, payload),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Role updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to assign role")),
    }),
    statusMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: { status: "ONBOARDING" | "ACTIVE" | "SUSPENDED"; reason?: string };
      }) => changeUserStatus(id, payload),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("User status updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to update status")),
    }),
    revokeMutation: useMutation({
      mutationFn: (id: string) => revokeUserSessions(id),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Sessions revoked");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to revoke sessions")),
    }),
    deleteMutation: useMutation({
      mutationFn: (id: string) => deleteUser(id),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("User deleted");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to delete user")),
    }),
    resetPasswordMutation: useMutation({
      mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
        adminResetPassword(id, newPassword),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Password reset");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to reset password")),
    }),
  };
}
