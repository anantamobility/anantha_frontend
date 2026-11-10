import { useCallback, useMemo } from "react";
import { useAuth } from "@/features/shared/context/authContext";

/**
 * Soft RBAC for nav/buttons. Mirrors anantha_backend/src/database/roles.ts.
 * API 403 remains the authorization source of truth.
 */
const ROLE_MODULE_ACCESS: Record<string, string[]> = {
  ADMIN: [
    "dashboard",
    "hub",
    "vehicle",
    "rider",
    "client",
    "ratecard",
    "rental",
    "collection",
  ],
  SUPERVISOR: [
    "dashboard",
    "client",
    "ratecard",
    "rental",
    "collection",
  ],
  OPERATOR: [
    "hub",
    "vehicle",
    "rider",
    "client",
    "rental",
    "collection",
  ],
};

export function useRbac() {
  const { user } = useAuth();
  const role = user?.role ?? "";

  const canAccessModule = useCallback(
    (resource: string) => {
      if (!role) return false;
      if (role === "ADMIN") return true;
      return (ROLE_MODULE_ACCESS[role] ?? []).includes(resource);
    },
    [role],
  );

  const canWrite = useMemo(() => role === "ADMIN" || role === "SUPERVISOR", [role]);

  /** Master-data writes (hub/vehicle/rider) are ADMIN-only per backend seed buckets. */
  const canManageMasterData = useMemo(() => role === "ADMIN", [role]);

  return {
    role,
    canAccessModule,
    canWrite,
    canManageMasterData,
    isAdmin: role === "ADMIN",
  };
}
