import { apiClient, unwrapData } from "@/features/shared/api/apiClient";

export type RolePermission = {
  id: string;
  resource: string;
  action: string;
};

export type Role = {
  id: string;
  name: string;
  permissions: RolePermission[];
};

export type PermissionEntity = {
  name: string;
  actions: { name: string; id: string }[];
};

export async function fetchRolesAndPermissions() {
  const response = await apiClient.get("/pbac/rolesAndPermissions");
  return unwrapData<{ roles: Role[]; entities: PermissionEntity[] }>(response.data);
}

export async function createRole(newRoleName: string) {
  const response = await apiClient.post("/pbac/addRole", { newRoleName });
  return unwrapData<{ role: Role }>(response.data).role;
}

export async function renameRole(id: string, name: string) {
  const response = await apiClient.patch(`/pbac/${id}/rename`, { name });
  return unwrapData<{ role: Role }>(response.data).role;
}

export async function updateRolePermissions(id: string, permissions: string[]) {
  const response = await apiClient.put(`/pbac/${id}/permissions`, { permissions });
  return unwrapData<{ role: Role }>(response.data).role;
}
