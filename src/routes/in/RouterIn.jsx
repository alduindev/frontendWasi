import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "../../context/authStore";
import Alerts from "../../pages/in/Alerts";
import History from "../../pages/in/History";
import HomeIn from "../../pages/in/HomeIn";
import Inventory from "../../pages/in/Inventory";
import Invoices from "../../pages/in/Invoices";
import ProductDetail from "../../pages/in/product/ProductDetail";
import Profile from "../../pages/in/Profile";
import Settings from "../../pages/in/Settings";
import Team from "../../pages/in/Team";
import Billing from "../../pages/in/Billing";
import OperatorPerformance from "../../pages/in/OperatorPerformance";
import { canAccessRoute } from "../../services/permissionService";
import { useAppConfig } from "../../context/appConfigStore";
import IndustryDashboard from "../../pages/in/IndustryDashboard";
import ModulePlaceholder from "../../pages/in/ModulePlaceholder";
import HospitalityWorkspace from "../../pages/hospitality/HospitalityWorkspace";
import HospitalityDashboard from "../../pages/hospitality/HospitalityDashboard";
import HousekeepingAdmin from "../../pages/hospitality/HousekeepingAdmin";
import HospitalityCalendar from "../../pages/hospitality/HospitalityCalendar";
import HospitalityOperations from "../../pages/hospitality/HospitalityOperations";
import HealthWorkspace from "../../pages/health/HealthWorkspace";
import DentalWorkspace from "../../pages/dental/DentalWorkspace";
import DentalOperations from "../../pages/dental/DentalOperations";
import DentalCalendar from "../../pages/dental/DentalCalendar";
import DentalDashboard from "../../pages/dental/DentalDashboard";
import BusinessChat from "../../pages/chat/BusinessChat";
import DentalBillingQueue from "../../pages/dental/DentalBillingQueue";
import VeterinaryWorkspace from "../../pages/veterinary/VeterinaryWorkspace";
import VeterinaryCalendar from "../../pages/veterinary/VeterinaryCalendar";
import VeterinaryDashboard from "../../pages/veterinary/VeterinaryDashboard";

function RoleRoute({ children, routeKey }) {
  const { user } = useAuth();
  const { config, isLoading } = useAppConfig();

  if (isLoading)
    return (
      <div className="grid min-h-[50vh] place-items-center text-primary">
        Cargando modulos...
      </div>
    );
  if (
    config &&
    !config.navigation.some((item) => item.frontendKey === routeKey) &&
    routeKey !== "product"
  )
    return <Navigate to="/dashboard" replace />;

  if (!canAccessRoute(user, routeKey === "dashboard" ? "overview" : routeKey)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function DynamicHome() {
  const { config } = useAppConfig();
  if (config?.template?.dashboardKey === "hospitality")
    return <HospitalityDashboard />;
  if (config?.template?.dashboardKey === "dental") return <DentalDashboard />;
  if (config?.template?.dashboardKey === "veterinary") return <VeterinaryDashboard />;
  return config?.template?.dashboardKey &&
    config.template.dashboardKey !== "commerce" ? (
    <IndustryDashboard />
  ) : (
    <HomeIn />
  );
}

export default function RouterIn() {
  return (
    <Routes>
      <Route
        index
        element={
          <RoleRoute routeKey="dashboard">
            <DynamicHome />
          </RoleRoute>
        }
      />
      <Route
        path="overview"
        element={
          <RoleRoute routeKey="dashboard">
            <DynamicHome />
          </RoleRoute>
        }
      />
      <Route
        path="inventory"
        element={
          <RoleRoute routeKey="inventory">
            <Inventory />
          </RoleRoute>
        }
      />
      <Route
        path="alerts"
        element={
          <RoleRoute routeKey="alerts">
            <Alerts />
          </RoleRoute>
        }
      />
      <Route
        path="history"
        element={
          <RoleRoute routeKey="history">
            <History />
          </RoleRoute>
        }
      />
      <Route
        path="invoices"
        element={
          <RoleRoute routeKey="invoices">
            <Invoices />
          </RoleRoute>
        }
      />
      <Route
        path="team"
        element={
          <RoleRoute routeKey="team">
            <Team />
          </RoleRoute>
        }
      />
      <Route
        path="team/:operatorId"
        element={
          <RoleRoute routeKey="team">
            <OperatorPerformance />
          </RoleRoute>
        }
      />
      <Route
        path="product/:productId"
        element={
          <RoleRoute routeKey="product">
            <ProductDetail />
          </RoleRoute>
        }
      />
      <Route
        path="profile"
        element={
          <RoleRoute routeKey="profile">
            <Profile />
          </RoleRoute>
        }
      />
      <Route
        path="settings"
        element={
          <RoleRoute routeKey="settings">
            <Settings />
          </RoleRoute>
        }
      />
      <Route
        path="billing"
        element={
          <RoleRoute routeKey="subscription">
            <Billing />
          </RoleRoute>
        }
      />
      <Route path="chat" element={<BusinessChat />} />
      <Route path="calendar" element={<HospitalityOnly><HospitalityCalendar /></HospitalityOnly>} />
      <Route path="hotel-operations" element={<HospitalityOnly><HospitalityOperations /></HospitalityOnly>} />
      <Route path="reservations" element={<HospitalityOnly><HospitalityWorkspace /></HospitalityOnly>} />
      <Route path="guests" element={<HospitalityOnly><HospitalityWorkspace /></HospitalityOnly>} />
      <Route path="checkin" element={<HospitalityOnly><HospitalityWorkspace /></HospitalityOnly>} />
      <Route path=":moduleKey" element={<DynamicModule />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function HospitalityOnly({ children }) {
  const { config, isLoading } = useAppConfig();
  if (isLoading) return <div className="grid min-h-[50vh] place-items-center text-primary">Cargando calendario...</div>;
  return config?.template?.dashboardKey === "hospitality" ? children : <Navigate to="/dashboard" replace />;
}

function DynamicModule() {
  const { config } = useAppConfig();
  const { moduleKey } = useParams();
  const module = config?.modules?.find((x) => x.frontendKey === moduleKey);
  if (!module || !config?.navigation?.some((x) => x.frontendKey === moduleKey))
    return <Navigate to="/dashboard" replace />;
  if (moduleKey === "housekeeping") return <HousekeepingAdmin />;
  if (moduleKey === "appointments" && config?.template?.dashboardKey === "dental") return <DentalCalendar />;
  if (moduleKey === "dental-billing" && config?.template?.dashboardKey === "dental") return <DentalBillingQueue />;
  if (moduleKey === "appointments" && config?.template?.dashboardKey === "veterinary") return <VeterinaryCalendar />;
  if (config?.template?.dashboardKey === "veterinary" && ["pets","invoices"].includes(moduleKey)) return <VeterinaryWorkspace />;
  if (module?.code?.startsWith("hospitality.")) return <HospitalityWorkspace />;
  if (module?.code?.startsWith("health.")) return <HealthWorkspace />;
  if (module?.code?.startsWith("dental.")) return ["odontogram","treatments"].includes(moduleKey) ? <DentalWorkspace /> : <DentalOperations />;
  return <ModulePlaceholder />;
}
