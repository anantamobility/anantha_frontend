export type PermissionAction = {
  name: string;
  id: string;
};

export type EntityDefinition = {
  name: string;
  actions: PermissionAction[];
};

export type RoleDefinition = {
  id: string;
  name: string;
  permissions: { id: string }[];
};

export type PermissionState = {
  enabled: boolean;
  id: string;
};

export type EntityPermissions = {
  [entity: string]: {
    [role: string]: {
      [action: string]: PermissionState;
    };
  };
};
