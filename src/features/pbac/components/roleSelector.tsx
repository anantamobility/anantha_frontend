import type { RoleDefinition } from "../types";

type RoleSelectorProps = {
  roles: RoleDefinition[];
  selectedRole: string;
  onSelectRole: (roleName: string) => void;
};

export default function RoleSelector({
  roles,
  selectedRole,
  onSelectRole,
}: RoleSelectorProps) {
  return (
    <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onSelectRole(role.name)}
          className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            selectedRole === role.name
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {role.name}
        </button>
      ))}
    </div>
  );
}
