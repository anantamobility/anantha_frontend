import RoleNameModal from "./roleNameModal";

type AddRoleModalProps = {
  open: boolean;
  roleName: string;
  creating: boolean;
  onRoleNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function AddRoleModal({
  open,
  roleName,
  creating,
  onRoleNameChange,
  onClose,
  onSubmit,
}: AddRoleModalProps) {
  return (
    <RoleNameModal
      open={open}
      title="Add New Role"
      submitLabel="Add Role"
      submittingLabel="Creating..."
      roleName={roleName}
      submitting={creating}
      onRoleNameChange={onRoleNameChange}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
