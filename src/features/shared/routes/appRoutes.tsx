import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth";
import { DashboardPage } from "@/features/dashboard";
import { HubsPage } from "@/features/hubs";
import { VehiclesPage } from "@/features/vehicles";
import { RidersPage } from "@/features/riders";
import { ClientsPage } from "@/features/clients";
import { RateCardsPage } from "@/features/ratecards";
import { RentalsPage } from "@/features/rentals";
import { CollectionsPage } from "@/features/collections";
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/hubs" element={<HubsPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/riders" element={<RidersPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/ratecards" element={<RateCardsPage />} />
          <Route path="/rentals" element={<RentalsPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
