import type {
  EntityDefinition,
  EntityPermissions,
  PermissionState,
  RoleDefinition,
} from "./types";

export function getPermissionDescription(entity: string, action: string): string {
  const entityName = entity.replace(/([A-Z])/g, " $1").trim().toLowerCase();
  const actionLabels: Record<string, string> = {
    read: "viewing",
    create: "creating new",
    update: "editing",
    delete: "removing",
    edit: "editing",
    assign_perm: "assigning permissions for",
    resetPassword: "resetting passwords for",
  };
  const label = actionLabels[action] || action.replace(/[_:]/g, " ").toLowerCase();
  return `Allow ${label} ${entityName}`;
}

export function buildInitialPermissions(
  entities: EntityDefinition[],
  roles: RoleDefinition[],
): EntityPermissions {
  const initialPerms: EntityPermissions = {};

  entities.forEach((entity) => {
    initialPerms[entity.name] = {};
    roles.forEach((role) => {
      initialPerms[entity.name][role.name] = {};
      entity.actions.forEach((action) => {
        const isAssigned = role.permissions.some((p) => p.id === action.id);
        initialPerms[entity.name][role.name][action.name] = {
          enabled: isAssigned,
          id: action.id,
        };
      });
    });
  });

  return initialPerms;
}

export function collectEnabledPermissionIds(
  entities: EntityDefinition[],
  permissions: EntityPermissions,
  roleName: string,
): string[] {
  const ids: string[] = [];
  entities.forEach((entity) => {
    entity.actions.forEach((action) => {
      const state = permissions[entity.name]?.[roleName]?.[action.name];
      if (state?.enabled) ids.push(state.id);
    });
  });
  return ids;
}

export function getDefaultReadPermissionIds(entities: EntityDefinition[]): string[] {
  const ids: string[] = [];
  entities.forEach((entity) => {
    entity.actions.forEach((action) => {
      if (action.name.toLowerCase() === "read") ids.push(action.id);
    });
  });
  return ids;
}

export function appendRolePermissions(
  permissions: EntityPermissions,
  entities: EntityDefinition[],
  roleName: string,
  enabledByDefault: (actionName: string) => boolean,
): EntityPermissions {
  const updated = { ...permissions };
  entities.forEach((entity) => {
    updated[entity.name] = {
      ...updated[entity.name],
      [roleName]: {},
    };
    entity.actions.forEach((action) => {
      updated[entity.name][roleName][action.name] = {
        enabled: enabledByDefault(action.name),
        id: action.id,
      };
    });
  });
  return updated;
}

export function renameRoleInPermissions(
  permissions: EntityPermissions,
  oldName: string,
  newName: string,
): EntityPermissions {
  if (oldName === newName) return permissions;
  const updated: EntityPermissions = {};
  for (const [entityName, roleMap] of Object.entries(permissions)) {
    const nextRoleMap = { ...roleMap };
    if (oldName in nextRoleMap) {
      nextRoleMap[newName] = nextRoleMap[oldName];
      delete nextRoleMap[oldName];
    }
    updated[entityName] = nextRoleMap;
  }
  return updated;
}

export function countEnabledPermissions(
  entities: EntityDefinition[],
  permissions: EntityPermissions | undefined,
  roleName: string,
): number {
  if (!permissions || !entities.length) return 0;
  let count = 0;
  entities.forEach(({ name: entity }) => {
    const rolePerms = permissions[entity]?.[roleName];
    if (rolePerms) {
      Object.values(rolePerms).forEach((p: PermissionState) => {
        if (p.enabled) count++;
      });
    }
  });
  return count;
}

export function countTotalPermissions(entities: EntityDefinition[]): number {
  return entities.reduce((acc, curr) => acc + curr.actions.length, 0);
}

export function filterEntitiesBySearch(
  entities: EntityDefinition[],
  searchQuery: string,
): EntityDefinition[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return entities;

  return entities
    .map((entity) => {
      const entityLabel = entity.name
        .replace(/([A-Z])/g, " $1")
        .trim()
        .toLowerCase();
      const entityMatches =
        entity.name.toLowerCase().includes(q) || entityLabel.includes(q);

      if (entityMatches) return entity;

      const matchingActions = entity.actions.filter((action) => {
        const actionLabel = action.name.replace(/[_:]/g, " ").toLowerCase();
        const description = getPermissionDescription(
          entity.name,
          action.name,
        ).toLowerCase();
        return (
          action.name.toLowerCase().includes(q) ||
          actionLabel.includes(q) ||
          description.includes(q)
        );
      });

      if (matchingActions.length === 0) return null;
      return { ...entity, actions: matchingActions };
    })
    .filter((entity): entity is EntityDefinition => entity !== null);
}
