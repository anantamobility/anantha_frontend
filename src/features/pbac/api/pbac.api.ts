import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { EntityDefinition, RoleDefinition } from "../types";

export async function fetchRolesAndPermissions() {
  const response = await apiClient.get("/pbac/rolesAndPermissions");
  return unwrapData<{
    roles: RoleDefinition[];
    entities: EntityDefinition[];
  }>(response.data);
}

export async function createRole(newRoleName: string) {
  const response = await apiClient.post("/pbac/addRole", { newRoleName });
  return unwrapData<{ role: RoleDefinition }>(response.data).role;
}

export async function renameRole(id: string, name: string) {
  const response = await apiClient.patch(`/pbac/${id}/rename`, { name });
  return unwrapData<{ role: RoleDefinition }>(response.data).role;
}

export async function updateRolePermissions(id: string, permissions: string[]) {
  const response = await apiClient.put(`/pbac/${id}/permissions`, { permissions });
  return unwrapData<{ role: RoleDefinition }>(response.data).role;
}
