import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import DemandsPage from "./pages/DemandsPage";
import NegotiationsPage from "./pages/NegotiationsPage";
import MappingPage from "./pages/MappingPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import ProcurementAnalysisPage from "./pages/ProcurementAnalysisPage";
import ManageAccountsPage from "./pages/ManageAccountsPage";
import { getUser, getDefaultRoute } from "./lib/auth";
import { ToastProvider } from "./contexts/ToastContext";

function HomeRedirect() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultRoute(user.role)} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["CC", "OC"]}>
                <InventoryPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/demands"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["CC", "CATEGORY"]}>
                <DemandsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/negotiations"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["CC"]}>
                <NegotiationsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/mapping"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["CC"]}>
                <MappingPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/deliveries"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["CC", "CATEGORY"]}>
                <DeliveriesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["CC"]}>
                <ProcurementAnalysisPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["CC"]}>
                <ManageAccountsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
