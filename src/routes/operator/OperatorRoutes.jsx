import { Navigate, Route, Routes, useParams } from "react-router-dom";
import OperatorDashboard from "../../pages/operator/OperatorDashboard";
import Alerts from "../../pages/in/Alerts";
import OperatorHistory from "../../pages/operator/OperatorHistory";
import OperatorInventory from "../../pages/operator/OperatorInventory";
import OperatorInvoices from "../../pages/operator/OperatorInvoices";
import OperatorProfile from "../../pages/operator/OperatorProfile";
import OperatorHousekeeping from "../../pages/operator/OperatorHousekeeping";
import OperatorSale from "../../pages/operator/OperatorSale";
import OperatorFunctionWorkspace from "../../pages/operator/OperatorFunctionWorkspace";
import RoomServiceWorkspace from "../../pages/operator/RoomServiceWorkspace";
import DentalCalendar from "../../pages/dental/DentalCalendar";
import DentalWorkspace from "../../pages/dental/DentalWorkspace";
import DentalOperations from "../../pages/dental/DentalOperations";
import HealthWorkspace from "../../pages/health/HealthWorkspace";
import MedicalWorkspace from "../../pages/health/MedicalWorkspace";
import MedicalCalendar from "../../pages/health/MedicalCalendar";
import { useAppConfig } from "../../context/appConfigStore";
import BusinessChat from "../../pages/chat/BusinessChat";
import DentalBillingQueue from "../../pages/dental/DentalBillingQueue";
import HospitalityReceptionWorkspace from "../../pages/operator/HospitalityReceptionWorkspace";
import HospitalitySupervisorWorkspace from "../../pages/operator/HospitalitySupervisorWorkspace";
import HospitalityCashierWorkspace from "../../pages/operator/HospitalityCashierWorkspace";
import VeterinaryOperatorDashboard from "../../pages/operator/VeterinaryOperatorDashboard";
import VeterinaryCalendar from "../../pages/veterinary/VeterinaryCalendar";
import VeterinaryBillingQueue from "../../pages/operator/VeterinaryBillingQueue";
import VeterinaryServices from "../../pages/veterinary/VeterinaryServices";

function OperatorAccess({
  alternateCapability,
  capability,
  children,
  functionCode,
  moduleCode,
  frontendKey,
}) {
  const { config, isLoading } = useAppConfig();
  if (isLoading)
    return (
      <div className="grid min-h-[50vh] place-items-center text-primary">
        Actualizando permisos...
      </div>
    );
  const functions = config?.user?.functions || [];
  const modules = config?.modules || [];
  const capabilities = config?.capabilities || [];
  const allowedCapability =
    !capability ||
    capabilities.includes(capability) ||
    (alternateCapability && capabilities.includes(alternateCapability));
  const allowedFunction =
    !functionCode || functions.some((item) => item.code === functionCode);
  const allowedModule =
    !moduleCode || modules.some((item) => item.code === moduleCode);
  const allowedFrontend =
    !frontendKey || modules.some((item) => item.frontendKey === frontendKey);
  return allowedCapability &&
    allowedFunction &&
    allowedModule &&
    allowedFrontend ? (
    children
  ) : (
    <Navigate replace to="/pos" />
  );
}

export default function OperatorRoutes() {
  return (
    <Routes>
      <Route index element={<OperatorDashboard />} />
      <Route
        path="products"
        element={
          <OperatorAccess
            alternateCapability="inventory.read_safe"
            capability="inventory.read"
            frontendKey="inventory"
          >
            <OperatorInventory />
          </OperatorAccess>
        }
      />
      <Route
        path="sale"
        element={
          <OperatorAccess capability="sales.create" moduleCode="commerce.pos">
            <OperatorSale />
          </OperatorAccess>
        }
      />
      <Route
        path="invoices"
        element={
          <OperatorAccess capability="sales.read_own" frontendKey="invoices">
            <OperatorInvoices />
          </OperatorAccess>
        }
      />
      <Route
        path="history"
        element={
          <OperatorAccess capability="sales.read_own">
            <OperatorHistory />
          </OperatorAccess>
        }
      />
      <Route
        path="housekeeping"
        element={
          <OperatorAccess functionCode="housekeeping">
            <OperatorHousekeeping />
          </OperatorAccess>
        }
      />
      <Route
        path="reception"
        element={
          <OperatorAccess functionCode="reception">
            <HospitalityReceptionWorkspace />
          </OperatorAccess>
        }
      />
      <Route
        path="supervision"
        element={
          <OperatorAccess functionCode="hospitality-supervisor">
            <HospitalitySupervisorWorkspace />
          </OperatorAccess>
        }
      />
      <Route
        path="hotel-cashier"
        element={
          <OperatorAccess functionCode="cashier">
            <HospitalityCashierWorkspace />
          </OperatorAccess>
        }
      />
      <Route
        path="functions/room-service"
        element={
          <OperatorAccess functionCode="room-service">
            <RoomServiceWorkspace />
          </OperatorAccess>
        }
      />
      <Route
        path="functions/:functionCode/tasks"
        element={
          <FunctionAccess>
            <OperatorFunctionWorkspace />
          </FunctionAccess>
        }
      />
      <Route
        path="functions/:functionCode"
        element={
          <FunctionAccess>
            <OperatorFunctionWorkspace />
          </FunctionAccess>
        }
      />
      <Route
        path="dental/appointments"
        element={
          <OperatorAccess capability="appointments.read" frontendKey="appointments">
            <DentalCalendar operator />
          </OperatorAccess>
        }
      />
      <Route path="dental/:moduleKey" element={<DentalModuleAccess />} />
      <Route path="medical/:moduleKey" element={<MedicalModuleAccess />} />
      <Route
        path="veterinary/pets"
        element={
          <OperatorAccess capability="pets.read">
            <VeterinaryOperatorDashboard />
          </OperatorAccess>
        }
      />
      <Route
        path="veterinary/appointments"
        element={
          <OperatorAccess capability="pets.read">
            <VeterinaryCalendar operator />
          </OperatorAccess>
        }
      />
      <Route path="alerts" element={<ClinicalAlertsAccess />} />
      <Route
        path="veterinary/services"
        element={
          <OperatorAccess capability="pets.read">
            <VeterinaryServices operator />
          </OperatorAccess>
        }
      />
      <Route
        path="veterinary/billing"
        element={
          <OperatorAccess
            capability="pets.edit"
            functionCode="veterinary-reception"
          >
            <VeterinaryBillingQueue operator />
          </OperatorAccess>
        }
      />
      <Route path="profile" element={<OperatorProfile />} />
      <Route path="chat" element={<BusinessChat operator />} />
      <Route path="*" element={<Navigate replace to="/pos" />} />
    </Routes>
  );
}

function DentalModuleAccess() {
  const { moduleKey } = useParams();
  const { config } = useAppConfig();
  const module = config?.modules?.find(
    (item) => item.frontendKey === moduleKey,
  );
  if (
    !module ||
    (!module.code.startsWith("dental.") && module.code !== "health.patients")
  )
    return <Navigate replace to="/pos" />;
  const page =
    moduleKey === "patients" ? (
      <HealthWorkspace operator />
    ) : moduleKey === "dental-billing" ? (
      <DentalBillingQueue operator />
    ) : ["odontogram", "treatments"].includes(moduleKey) ? (
      <DentalWorkspace operator />
    ) : (
      <DentalOperations operator />
    );
  return <OperatorAccess frontendKey={moduleKey}>{page}</OperatorAccess>;
}

function ClinicalAlertsAccess() {
  const { config, isLoading } = useAppConfig();
  if (isLoading)
    return (
      <div className="grid min-h-[50vh] place-items-center text-primary">
        Actualizando alertas...
      </div>
    );
  const dental = config?.template?.dashboardKey === "dental";
  const veterinary = config?.template?.dashboardKey === "veterinary";
  if (dental)
    return (
      <OperatorAccess capability="appointments.read">
        <Alerts operator />
      </OperatorAccess>
    );
  if (veterinary)
    return (
      <OperatorAccess capability="pets.read">
        <Alerts operator />
      </OperatorAccess>
    );
  return <Navigate replace to="/pos" />;
}

function MedicalModuleAccess() {
  const { moduleKey } = useParams();
  const { config } = useAppConfig();
  const module = config?.modules?.find(
    (item) => item.frontendKey === moduleKey,
  );
  if (
    config?.template?.dashboardKey !== "health" ||
    !module ||
    !module.code.startsWith("health.")
  )
    return <Navigate replace to="/pos" />;
  return (
    <OperatorAccess frontendKey={moduleKey}>
      {moduleKey === "appointments" ? <MedicalCalendar operator /> : <MedicalWorkspace operator />}
    </OperatorAccess>
  );
}

function FunctionAccess({ children }) {
  const { functionCode } = useParams();
  return (
    <OperatorAccess functionCode={functionCode}>{children}</OperatorAccess>
  );
}
