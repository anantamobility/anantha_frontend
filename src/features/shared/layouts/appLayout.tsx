import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/features/shared/context/authContext";
import { useRbac } from "@/features/shared/hooks/useRbac";
import { APP_NAV } from "@/features/shared/config/routeConfig";
import { BrandLogo } from "@/features/shared/components/common";
import { logoutRequest } from "@/features/auth/api/auth.api";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { getErrorMessage } from "@/features/shared/api/client";

export default function AppLayout() {
  const { user, clearSession } = useAuth();
  const { canAccessModule } = useRbac();

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

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="border-b border-white/10 px-5 py-5">
          <BrandLogo variant="full" className="w-40" />
          <p className="mt-2 text-xs text-white/60">Ops Desk</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {APP_NAV.filter((item) => canAccessModule(item.resource)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
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
