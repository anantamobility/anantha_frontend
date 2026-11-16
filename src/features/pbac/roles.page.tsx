import { LoadingSkeleton } from "@/features/shared/components/common";
import { useRbac } from "@/features/shared/hooks/useRbac";
import {
  AddRoleModal,
  PermissionsAccordion,
  RoleNameModal,
  RoleSelector,
  Toolbar,
} from "./components";
import { useRolesPermissions } from "./hooks/useRolesPermissions";

export default function RolesPage() {
  const { isAdmin } = useRbac();
  const roles = useRolesPermissions();

  if (roles.loading) {
    return <LoadingSkeleton rows={10} />;
  }

  const hasSelectedRole = Boolean(roles.selectedRoleObj);

  return (
    <div className="flex min-h-[70vh] flex-col">
      <Toolbar
        canWrite={isAdmin}
        saving={roles.saving}
        renameDisabled={!hasSelectedRole || roles.renamingRole}
        onAddRole={() => roles.setShowAddRoleModal(true)}
        onRenameRole={roles.openRenameRoleModal}
        onSave={roles.handleSave}
      />

      <AddRoleModal
        open={roles.showAddRoleModal}
        roleName={roles.newRoleName}
        creating={roles.creatingRole}
        onRoleNameChange={roles.setNewRoleName}
        onClose={roles.closeAddRoleModal}
        onSubmit={roles.handleAddRole}
      />

      <RoleNameModal
        open={roles.showRenameRoleModal}
        title="Rename Role"
        submitLabel="Rename"
        submittingLabel="Renaming..."
        roleName={roles.renameRoleName}
        submitting={roles.renamingRole}
        onRoleNameChange={roles.setRenameRoleName}
        onClose={roles.closeRenameRoleModal}
        onSubmit={roles.handleRenameRole}
      />

      <RoleSelector
        roles={roles.roles}
        selectedRole={roles.selectedRole}
        onSelectRole={roles.setSelectedRole}
      />

      <div className="flex flex-1 flex-col">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            {roles.selectedRole || "No role selected"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {roles.enabledCount} of {roles.totalCount} permissions enabled
          </p>
        </div>

        <PermissionsAccordion
          entities={roles.filteredEntities}
          permissions={roles.permissions}
          selectedRole={roles.selectedRole}
          expandedEntities={roles.expandedEntities}
          searchQuery={roles.searchQuery}
          readOnly={!isAdmin}
          onSearchChange={roles.setSearchQuery}
          onToggleEntity={roles.toggleEntity}
          onToggleAll={roles.toggleAllEntities}
          onTogglePermission={roles.handleTogglePermission}
        />
      </div>
    </div>
  );
}
