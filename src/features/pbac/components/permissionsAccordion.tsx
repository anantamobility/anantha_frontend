import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { SearchBar } from "@/features/shared/components/common";
import type { EntityDefinition, EntityPermissions } from "../types";
import { getPermissionDescription } from "../utils";

type PermissionsAccordionProps = {
  entities: EntityDefinition[];
  permissions: EntityPermissions | undefined;
  selectedRole: string;
  expandedEntities: Set<string>;
  searchQuery: string;
  readOnly?: boolean;
  onSearchChange: (value: string) => void;
  onToggleEntity: (entityName: string) => void;
  onToggleAll: () => void;
  onTogglePermission: (entityName: string, actionName: string) => void;
};

export default function PermissionsAccordion({
  entities,
  permissions,
  selectedRole,
  expandedEntities,
  searchQuery,
  readOnly = false,
  onSearchChange,
  onToggleEntity,
  onToggleAll,
  onTogglePermission,
}: PermissionsAccordionProps) {
  if (!permissions) return null;

  const sortedEntities = [...entities].sort(
    (a, b) => b.actions.length - a.actions.length,
  );
  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 max-md:flex-col max-md:items-stretch">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search permissions by resource, action, or description..."
          className="max-w-md max-md:max-w-none"
        />
        <button
          type="button"
          onClick={onToggleAll}
          disabled={sortedEntities.length === 0}
          className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 transition hover:text-foreground disabled:no-underline disabled:opacity-50"
        >
          {sortedEntities.length > 0 &&
          sortedEntities.every((e) => expandedEntities.has(e.name))
            ? "Collapse All"
            : "Expand All"}
        </button>
      </div>

      {sortedEntities.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {hasActiveSearch
            ? "No permissions match your search."
            : "No permissions available."}
        </p>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {sortedEntities.map(({ name: entityName, actions }) => {
            const rolePerms = permissions[entityName]?.[selectedRole] || {};
            const enabledCount = actions.filter(
              (action) => rolePerms[action.name]?.enabled,
            ).length;
            const isExpanded = expandedEntities.has(entityName);

            return (
              <div
                key={entityName}
                className="overflow-hidden rounded-lg border border-border"
              >
                <button
                  type="button"
                  onClick={() => onToggleEntity(entityName)}
                  className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 transition hover:bg-muted/60"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground" />
                    )}
                    <Folder size={16} className="text-muted-foreground" />
                    <span className="text-sm font-semibold capitalize text-foreground">
                      {entityName.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      enabledCount === actions.length
                        ? "bg-green-500/15 text-green-600"
                        : enabledCount === 0
                          ? "bg-red-500/15 text-red-500"
                          : "bg-yellow-500/15 text-yellow-600"
                    }`}
                  >
                    {enabledCount}/{actions.length}
                  </span>
                </button>

                {isExpanded ? (
                  <div className="divide-y divide-border/50 bg-background px-4 py-2">
                    {actions.map((action) => {
                      const isEnabled =
                        permissions[entityName]?.[selectedRole]?.[action.name]
                          ?.enabled || false;
                      const actionDesc = getPermissionDescription(
                        entityName,
                        action.name,
                      );

                      return (
                        <div
                          key={`${entityName}-${action.name}`}
                          role={readOnly ? undefined : "button"}
                          tabIndex={readOnly ? undefined : 0}
                          className={`flex items-center gap-3 rounded-md px-2 py-2.5 transition ${
                            readOnly
                              ? ""
                              : "cursor-pointer hover:bg-muted/30"
                          }`}
                          onClick={() => {
                            if (!readOnly) {
                              onTogglePermission(entityName, action.name);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (readOnly) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onTogglePermission(entityName, action.name);
                            }
                          }}
                        >
                          <div className="relative h-5 w-8 shrink-0">
                            <div
                              className={`h-full w-full rounded-full transition-all ${
                                isEnabled
                                  ? "bg-green-500"
                                  : "bg-muted-foreground/20"
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                                  isEnabled
                                    ? "translate-x-3.5"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium capitalize text-foreground">
                              {action.name.replace(/[_:]/g, " ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {actionDesc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
