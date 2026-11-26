import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  adminResetPassword,
  assignUserRole,
  changeUserStatus,
  revokeUserSessions,
  updateUser,
  type AssignUserRolePayload,
  type ChangeUserStatusPayload,
  type UpdateUserPayload,
} from "./users.api";

async function invalidatePeople(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["staff"] }),
    queryClient.invalidateQueries({ queryKey: ["riders"] }),
    queryClient.invalidateQueries({ queryKey: ["entities", "riders"] }),
  ]);
}

export function useUserAccountMutations() {
  const queryClient = useQueryClient();

  return {
    updateMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateUserPayload;
      }) => updateUser(id, payload),
      onSuccess: async () => {
        await invalidatePeople(queryClient);
        notifySuccess("Account contact updated");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to update account")),
    }),
    roleMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: AssignUserRolePayload;
      }) => assignUserRole(id, payload),
      onSuccess: async () => {
        await invalidatePeople(queryClient);
        notifySuccess("Role updated");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to assign role")),
    }),
    statusMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ChangeUserStatusPayload;
      }) => changeUserStatus(id, payload),
      onSuccess: async () => {
        await invalidatePeople(queryClient);
        notifySuccess("Login status updated");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to update login status")),
    }),
    revokeSessionsMutation: useMutation({
      mutationFn: (id: string) => revokeUserSessions(id),
      onSuccess: async () => {
        await invalidatePeople(queryClient);
        notifySuccess("Sessions revoked");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to revoke sessions")),
    }),
    resetPasswordMutation: useMutation({
      mutationFn: ({
        userId,
        newPassword,
      }: {
        userId: string;
        newPassword: string;
      }) => adminResetPassword(userId, { newPassword }),
      onSuccess: async () => {
        await invalidatePeople(queryClient);
        notifySuccess("Password reset");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to reset password")),
    }),
  };
}
