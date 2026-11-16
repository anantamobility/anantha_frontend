import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth";
import { HubsPage } from "@/features/hubs";
import { VehiclesPage } from "@/features/vehicles";
import { RidersPage } from "@/features/riders";
import { RateCardsPage } from "@/features/ratecards";
import { UsersPage } from "@/features/users";
import { StaffPage } from "@/features/staff";
import { RolesPage } from "@/features/pbac";
import { AuditLogsPage } from "@/features/audit-logs";
import AppLayout from "@/features/shared/layouts/appLayout";
import AuthLayout from "@/features/shared/layouts/authLayout";
import ProtectedRoute from "@/features/shared/routes/protectedRoute";
import PublicRoute from "@/features/shared/routes/publicRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/hubs" replace />} />
          <Route path="/hubs" element={<HubsPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/riders" element={<RidersPage />} />
          <Route path="/ratecards" element={<RateCardsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/hubs" replace />} />
    </Routes>
  );
}
