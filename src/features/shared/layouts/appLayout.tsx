import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/features/shared/context/authContext";
import { useRbac } from "@/features/shared/hooks/useRbac";
import { APP_NAV, type NavLeaf } from "@/features/shared/config/routeConfig";
import { BrandLogo } from "@/features/shared/components/common";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { getErrorMessage } from "@/features/shared/api/client";
import { cn } from "@/features/shared/utils/cn";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "block rounded-lg px-3 py-2 text-sm transition",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-white/80 hover:bg-white/10 hover:text-white",
  );
}

export default function AppLayout() {
  const { user, clearSession } = useAuth();
  const { canAccessModule } = useRbac();
  const location = useLocation();

  const databasePaths = useMemo(
    () =>
      APP_NAV.flatMap((entry) =>
        entry.type === "group" && entry.label === "Database"
          ? entry.children.map((child) => child.path)
          : [],
      ),
    [],
  );

  const isDatabaseRoute = databasePaths.some((path) =>
    location.pathname.startsWith(path),
  );

  const [databaseOpen, setDatabaseOpen] = useState(isDatabaseRoute);

  useEffect(() => {
    if (isDatabaseRoute) setDatabaseOpen(true);
  }, [isDatabaseRoute]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
      notifySuccess("Signed out");
    } catch (error) {
      notifyError(getErrorMessage(error, "Logout failed"));
    } finally {
      clearSession();
    }
  };

  const renderLeaf = (item: NavLeaf, indented = false) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) =>
        cn(navLinkClass({ isActive }), indented && "pl-6")
      }
    >
      {item.label}
    </NavLink>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="border-b border-white/10 px-5 py-5">
          <BrandLogo variant="full" className="w-40" />
          <p className="mt-2 text-xs text-white/60">Ops Desk</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {APP_NAV.map((entry) => {
            if (entry.type === "link") {
              if (!canAccessModule(entry.resource)) return null;
              return renderLeaf(entry);
            }

            const visibleChildren = entry.children.filter((child) =>
              canAccessModule(child.resource),
            );
            if (visibleChildren.length === 0) return null;

            const open = entry.label === "Database" ? databaseOpen : false;

            return (
              <div key={entry.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (entry.label === "Database") {
                      setDatabaseOpen((prev) => !prev);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                    isDatabaseRoute && entry.label === "Database"
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                  aria-expanded={open}
                >
                  <span>{entry.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>
                {open ? (
                  <div className="space-y-1">
                    {visibleChildren.map((child) => renderLeaf(child, true))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-4 py-4 text-xs text-white/70">
          <p className="truncate font-medium text-white">{user?.name}</p>
          <p className="truncate">{user?.role}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-md border border-white/20 px-2 py-1.5 text-left hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
