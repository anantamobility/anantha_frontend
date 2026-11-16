import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import type { EntityPermissions } from "../types";
import {
  appendRolePermissions,
  buildInitialPermissions,
  collectEnabledPermissionIds,
  countEnabledPermissions,
  countTotalPermissions,
  filterEntitiesBySearch,
  getDefaultReadPermissionIds,
  renameRoleInPermissions,
} from "../utils";
import {
  useCreateRoleMutation,
  useRenameRoleMutation,
  useUpdateRolePermissionsMutation,
} from "./useRoleMutations";
import { useRolesQuery } from "./useRolesQuery";

export function useRolesPermissions() {
  const catalogQuery = useRolesQuery();
  const updateMutation = useUpdateRolePermissionsMutation();
  const createMutation = useCreateRoleMutation();
  const renameMutation = useRenameRoleMutation();

  const roles = catalogQuery.data?.roles ?? [];
  const entities = catalogQuery.data?.entities ?? [];
  const loading = catalogQuery.isLoading;

  const [selectedRole, setSelectedRole] = useState("");
  const [permissions, setPermissions] = useState<EntityPermissions | undefined>();
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showRenameRoleModal, setShowRenameRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [renameRoleName, setRenameRoleName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(
    new Set(),
  );

  const filteredEntities = useMemo(
    () => filterEntitiesBySearch(entities, searchQuery),
    [entities, searchQuery],
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    setExpandedEntities(new Set(filteredEntities.map((e) => e.name)));
  }, [searchQuery, filteredEntities]);

  const seeded = useRef(false);
  const loadErrorNotified = useRef(false);

  useEffect(() => {
    if (!catalogQuery.data) return;
    if (!seeded.current) {
      seeded.current = true;
      setPermissions(
        buildInitialPermissions(
          catalogQuery.data.entities,
          catalogQuery.data.roles,
        ),
      );
      setSelectedRole(catalogQuery.data.roles[0]?.name ?? "");
    }
  }, [catalogQuery.data]);

  useEffect(() => {
    if (!catalogQuery.isError) {
      loadErrorNotified.current = false;
      return;
    }
    if (loadErrorNotified.current) return;
    loadErrorNotified.current = true;
    notifyError(
      getErrorMessage(
        catalogQuery.error,
        "Failed to load roles and permissions.",
      ),
    );
  }, [catalogQuery.isError, catalogQuery.error]);

  const selectedRoleObj = useMemo(
    () => roles.find((r) => r.name === selectedRole) ?? null,
    [roles, selectedRole],
  );

  const handleTogglePermission = useCallback(
    (entityName: string, actionName: string) => {
      setPermissions((prev) => {
        if (!prev || !selectedRole) return prev;
        return {
          ...prev,
          [entityName]: {
            ...prev[entityName],
            [selectedRole]: {
              ...prev[entityName][selectedRole],
              [actionName]: {
                ...prev[entityName][selectedRole][actionName],
                enabled: !prev[entityName][selectedRole][actionName].enabled,
              },
            },
          },
        };
      });
    },
    [selectedRole],
  );

  const handleSave = useCallback(async () => {
    const currentRoleObj = roles.find((r) => r.name === selectedRole);
    if (!currentRoleObj || !permissions) return;

    const newPermissionIds = collectEnabledPermissionIds(
      entities,
      permissions,
      selectedRole,
    );

    try {
      await updateMutation.mutateAsync({
        roleId: currentRoleObj.id,
        permissionIds: newPermissionIds,
      });
      notifySuccess("Permissions saved successfully");
    } catch {
      // mutation onError notified
    }
  }, [entities, permissions, roles, selectedRole, updateMutation]);

  const handleAddRole = useCallback(async () => {
    const trimmedName = newRoleName.trim();
    if (!trimmedName) {
      notifyError("Role name cannot be empty");
      return;
    }
    if (roles.some((r) => r.name.toLowerCase() === trimmedName.toLowerCase())) {
      notifyError("Role already exists");
      return;
    }

    try {
      const backendRole = await createMutation.mutateAsync(trimmedName);
      const defaultPermissionIds = getDefaultReadPermissionIds(entities);

      if (defaultPermissionIds.length > 0) {
        await updateMutation.mutateAsync({
          roleId: backendRole.id,
          permissionIds: defaultPermissionIds,
        });
      }

      setPermissions((prev) => {
        if (!prev) return prev;
        return appendRolePermissions(
          prev,
          entities,
          trimmedName,
          (actionName) => actionName.toLowerCase() === "read",
        );
      });

      setSelectedRole(trimmedName);
      setNewRoleName("");
      setShowAddRoleModal(false);
      notifySuccess("Role created successfully");
    } catch {
      // mutation onError notified
    }
  }, [createMutation, entities, newRoleName, roles, updateMutation]);

  const openRenameRoleModal = useCallback(() => {
    if (!selectedRole) {
      notifyError("Select a role to rename");
      return;
    }
    setRenameRoleName(selectedRole);
    setShowRenameRoleModal(true);
  }, [selectedRole]);

  const closeRenameRoleModal = useCallback(() => {
    setShowRenameRoleModal(false);
    setRenameRoleName("");
  }, []);

  const handleRenameRole = useCallback(async () => {
    const trimmedName = renameRoleName.trim();
    if (!trimmedName) {
      notifyError("Role name cannot be empty");
      return;
    }
    if (!selectedRoleObj) {
      notifyError("Select a role to rename");
      return;
    }
    if (trimmedName === selectedRole) {
      closeRenameRoleModal();
      return;
    }
    if (
      roles.some(
        (r) =>
          r.id !== selectedRoleObj.id &&
          r.name.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      notifyError("Role already exists");
      return;
    }

    const oldName = selectedRole;
    try {
      await renameMutation.mutateAsync({
        roleId: selectedRoleObj.id,
        name: trimmedName,
      });
      setPermissions((prev) =>
        prev ? renameRoleInPermissions(prev, oldName, trimmedName) : prev,
      );
      setSelectedRole(trimmedName);
      closeRenameRoleModal();
      notifySuccess("Role renamed successfully");
    } catch {
      // mutation onError notified
    }
  }, [
    closeRenameRoleModal,
    renameMutation,
    renameRoleName,
    roles,
    selectedRole,
    selectedRoleObj,
  ]);

  const toggleEntity = useCallback((entityName: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entityName)) next.delete(entityName);
      else next.add(entityName);
      return next;
    });
  }, []);

  const toggleAllEntities = useCallback(() => {
    setExpandedEntities((prev) => {
      const visibleNames = filteredEntities.map((e) => e.name);
      const allVisibleExpanded =
        visibleNames.length > 0 &&
        visibleNames.every((name) => prev.has(name));
      if (allVisibleExpanded) return new Set();
      return new Set(visibleNames);
    });
  }, [filteredEntities]);

  const closeAddRoleModal = useCallback(() => {
    setShowAddRoleModal(false);
    setNewRoleName("");
  }, []);

  return {
    loading,
    saving: updateMutation.isPending,
    creatingRole: createMutation.isPending,
    renamingRole: renameMutation.isPending,
    roles,
    filteredEntities,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    selectedRoleObj,
    permissions,
    showAddRoleModal,
    setShowAddRoleModal,
    showRenameRoleModal,
    newRoleName,
    setNewRoleName,
    renameRoleName,
    setRenameRoleName,
    expandedEntities,
    enabledCount: countEnabledPermissions(entities, permissions, selectedRole),
    totalCount: countTotalPermissions(entities),
    handleTogglePermission,
    handleSave,
    handleAddRole,
    openRenameRoleModal,
    closeRenameRoleModal,
    handleRenameRole,
    toggleEntity,
    toggleAllEntities,
    closeAddRoleModal,
  };
}
