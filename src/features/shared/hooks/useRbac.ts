import { useCallback, useMemo } from "react";
import { useAuth } from "@/features/shared/context/authContext";

/**
 * Soft RBAC for nav/buttons. Mirrors live anantha_backend seed buckets.
 * API 403 remains the authorization source of truth.
 */
const ROLE_MODULE_ACCESS: Record<string, string[]> = {
  ADMIN: [
    "hub",
    "vehicle",
    "rider",
    "client",
    "ratecard",
    "staff",
    "rental",
    "collection",
    "deposit",
    "ledgerEntry",
    "role",
    "auditLog",
  ],
  SUPERVISOR: [
    "ratecard",
    "rental",
    "collection",
    "deposit",
    "ledgerEntry",
    "role",
    "auditLog",
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

  /** Master-data writes (hub/vehicle/rider/staff) are ADMIN-only per backend seed. */
  const canManageMasterData = useMemo(() => role === "ADMIN", [role]);

  return {
    role,
    canAccessModule,
    canWrite,
    canManageMasterData,
    isAdmin: role === "ADMIN",
  };
}
