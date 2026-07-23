import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { I18nProvider } from "../context/I18nContext";
import { ToastProvider } from "../context/ToastContext";
import { OnboardingProvider } from "../context/OnboardingContext";
import { AppConfigProvider } from "../context/AppConfigContext";
import { useAuth } from "../context/authStore";
import RouterOut from "./out/RouterOut";

const AdminRoutes = lazy(() => import("./in/RouterIn"));
const OperatorRoutes = lazy(() => import("./operator/OperatorRoutes"));
const PlatformDashboard = lazy(
  () => import("../pages/platform/PlatformDashboard"),
);
const BusinessTypeCatalog = lazy(
  () => import("../pages/platform/BusinessTypeCatalog"),
);
const PlatformModules = lazy(() => import("../pages/platform/PlatformModules"));
const PlatformBilling = lazy(() => import("../pages/platform/PlatformBilling"));

function RouteLoading() {
  return (
    <div
      aria-live="polite"
      className="grid min-h-svh place-items-center bg-background text-primary"
    >
      Cargando espacio de trabajo...
    </div>
  );
}

function ProtectedRoute({ children, area }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading)
    return (
      <div className="grid min-h-svh place-items-center bg-background text-primary">
        Cargando sesion...
      </div>
    );

  if (!isAuthenticated) return <Navigate to="/" replace />;
  const operatorArea = user.role === "operator";
  const destination =
    user.role === "super_admin"
      ? "/platform"
      : operatorArea
        ? "/pos"
        : "/dashboard";
  if (
    (area === "platform" && user.role !== "super_admin") ||
    (area === "operator" && !operatorArea) ||
    (area === "business" && (operatorArea || user.role === "super_admin"))
  )
    return <Navigate to={destination} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/platform"
        element={
          <ProtectedRoute area="platform">
            <Suspense fallback={<RouteLoading />}>
              <PlatformDashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/platform/business-types"
        element={
          <ProtectedRoute area="platform">
            <Suspense fallback={<RouteLoading />}>
              <BusinessTypeCatalog />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/platform/modules"
        element={
          <ProtectedRoute area="platform">
            <Suspense fallback={<RouteLoading />}>
              <PlatformModules />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/platform/billing"
        element={
          <ProtectedRoute area="platform">
            <Suspense fallback={<RouteLoading />}>
              <PlatformBilling />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute area="business">
            <Suspense fallback={<RouteLoading />}>
              <AdminRoutes />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos/*"
        element={
          <ProtectedRoute area="operator">
            <Suspense fallback={<RouteLoading />}>
              <OperatorRoutes />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/*" element={<RouterOut />} />
    </Routes>
  );
}

export default function RouterMain() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppConfigProvider>
          <ToastProvider>
            <BrowserRouter>
              <OnboardingProvider>
                <AppRoutes />
              </OnboardingProvider>
            </BrowserRouter>
          </ToastProvider>
        </AppConfigProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
