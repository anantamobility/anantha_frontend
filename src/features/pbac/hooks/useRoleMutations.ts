import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  createRole,
  renameRole,
  updateRolePermissions,
} from "../api/pbac.api";
import { roleKeys } from "./useRolesQuery";

export function useRoleMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: roleKeys.all });
  };

  return {
    createMutation: useMutation({
      mutationFn: (name: string) => createRole(name),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Role created");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to create role")),
    }),
    renameMutation: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) => renameRole(id, name),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Role renamed");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to rename role")),
    }),
    permissionsMutation: useMutation({
      mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
        updateRolePermissions(id, permissions),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Permissions updated");
      },
      onError: (e) =>
        notifyError(getErrorMessage(e, "Failed to update permissions")),
    }),
  };
}
