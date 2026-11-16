import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError } from "@/features/shared/utils/notify";
import {
  createRole,
  renameRole,
  updateRolePermissions,
} from "../api/pbac.api";
import { roleKeys } from "./useRolesQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: roleKeys.all });
}

export function useUpdateRolePermissionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) => updateRolePermissions(roleId, permissionIds),
    onSuccess: async () => {
      await invalidate(queryClient);
    },
    onError: (error) =>
      notifyError(getErrorMessage(error, "Error saving permissions")),
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleName: string) => createRole(roleName),
    onSuccess: async () => {
      await invalidate(queryClient);
    },
    onError: (error) =>
      notifyError(getErrorMessage(error, "Error creating role")),
  });
}

export function useRenameRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, name }: { roleId: string; name: string }) =>
      renameRole(roleId, name),
    onSuccess: async () => {
      await invalidate(queryClient);
    },
    onError: (error) =>
      notifyError(getErrorMessage(error, "Error renaming role")),
  });
}
