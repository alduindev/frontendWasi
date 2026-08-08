import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Avatar from "../atoms/Avatar";
import BrandLogo from "../molecules/BrandLogo";
import ConfirmDialog from "../molecules/ConfirmDialog";
import AttendanceWidget from "./AttendanceWidget";
import { useAuth } from "../../context/authStore";
import { useResponsiveSidebar } from "../../hooks/useResponsiveSidebar";
import { useAppConfig } from "../../context/appConfigStore";
import {
  getHospitalityNotifications,
  readAllHospitalityNotifications,
  readHospitalityNotification,
} from "../../services/hospitalityService";
import {
  getDentalNotifications,
  readAllDentalNotifications,
  readDentalNotification,
} from "../../services/healthService";
import { getVeterinaryAlerts } from "../../services/veterinaryService";

const NOTIFICATION_REFRESH_INTERVAL_MS = 30_000;

const navigation = [
  { icon: "home", label: "Inicio", key: "dashboard", to: "/pos" },
  {
    capability: "hospitality.reservations.manage",
    functionCode: "reception",
    requiredCapabilities: [
      "hospitality.rooms.read",
      "hospitality.guests.manage",
      "hospitality.reservations.manage",
      "hospitality.checkin",
      "hospitality.checkout",
    ],
    icon: "concierge",
    label: "Recepción",
    key: "reception",
    to: "/pos/reception",
  },
  {
    capability: "hospitality.staff.read",
    functionCode: "hospitality-supervisor",
    requiredCapabilities: ["hospitality.staff.read", "hospitality.rooms.read"],
    icon: "manage_accounts",
    label: "Supervisión",
    key: "supervision",
    to: "/pos/supervision",
  },
  {
    capability: "hospitality.housekeeping.read_assigned",
    functionCode: "housekeeping",
    icon: "cleaning_services",
    label: "Mis habitaciones",
    key: "housekeeping",
    to: "/pos/housekeeping",
  },
  {
    capability: "inventory.read",
    alternate: "inventory.read_safe",
    functionCode: "inventory",
    icon: "inventory_2",
    label: "Productos",
    key: "inventory",
    to: "/pos/products",
  },
  {
    capability: "sales.create",
    functionCode: "cashier",
    icon: "point_of_sale",
    label: "Nueva venta",
    key: "sales",
    to: "/pos/sale",
  },
  {
    capability: "sales.read_own",
    functionCode: "cashier",
    icon: "receipt_long",
    label: "Mis comprobantes",
    key: "invoices",
    to: "/pos/invoices",
  },
  {
    capability: "sales.read_own",
    functionCode: "cashier",
    icon: "history",
    label: "Mi historial",
    key: "history",
    to: "/pos/history",
  },
];
const allNavigation = [...navigation];
allNavigation.splice(1, 0, {
  icon: "forum",
  label: "Chat del negocio",
  key: "chat",
  to: "/pos/chat",
});
const departmentNavigation = {
  maintenance: ["home_repair_service", "Mantenimiento"],
  security: ["security", "Seguridad"],
  laundry: ["local_laundry_service", "Lavandería"],
  kitchen: ["skillet", "Cocina"],
  purchasing: ["shopping_cart", "Compras"],
  "customer-service": ["support_agent", "Atención al cliente"],
  "room-service": ["room_service", "Room service"],
};
const dentalNavigation = [
  {
    capability: "patients.read",
    icon: "personal_injury",
    label: "Pacientes",
    key: "patients",
    to: "/pos/dental/patients",
  },
  {
    capability: "appointments.read",
    icon: "calendar_month",
    label: "Agenda",
    key: "appointments",
    to: "/pos/dental/appointments",
  },
  {
    capability: "appointments.read",
    icon: "notifications_active",
    label: "Alertas",
    key: "alerts",
    to: "/pos/alerts",
  },
  {
    capability: "dental.catalog.read",
    icon: "medical_services",
    label: "Servicios",
    key: "dental-catalog",
    to: "/pos/dental/dental-catalog",
  },
  {
    capability: "dental.billing.read",
    icon: "payments",
    label: "Cobros",
    key: "dental-billing",
    to: "/pos/dental/dental-billing",
  },
];
const medicalNavigation = [
  {
    capability: "health.patients.read",
    icon: "personal_injury",
    label: "Pacientes",
    key: "medical-patients",
    to: "/pos/medical/patients",
  },
  {
    capability: "health.appointments.read",
    icon: "calendar_month",
    label: "Agenda",
    key: "medical-appointments",
    to: "/pos/medical/appointments",
  },
];
const veterinaryNavigation = [
  {
    capability: "pets.read",
    icon: "pets",
    label: "Mascotas",
    key: "veterinary-pets",
    to: "/pos/veterinary/pets",
  },
  {
    capability: "pets.read",
    icon: "calendar_month",
    label: "Agenda",
    key: "veterinary-appointments",
    to: "/pos/veterinary/appointments",
  },
  {
    capability: "pets.read",
    icon: "notifications_active",
    label: "Alertas",
    key: "alerts",
    to: "/pos/alerts",
  },
  {
    capability: "pets.read",
    icon: "medical_services",
    label: "Servicios",
    key: "veterinary-services",
    to: "/pos/veterinary/services",
  },
  {
    capability: "pets.edit",
    functionCode: "veterinary-reception",
    icon: "payments",
    label: "Caja veterinaria",
    key: "veterinary-billing",
    to: "/pos/veterinary/billing",
  },
  {
    alternate: "inventory.read_safe",
    capability: "inventory.read",
    icon: "inventory_2",
    label: "Inventario",
    key: "veterinary-inventory",
    to: "/pos/products",
  },
];

function OperatorNavigation({ collapsed = false, onNavigate }) {
  const { config } = useAppConfig();
  const capabilities = new Set(config?.capabilities || []);
  const functions = new Set(
    config?.user?.functions?.map((item) => item.code) || [],
  );
  const hospitality = config?.template?.dashboardKey === "hospitality";
  const dental = config?.template?.dashboardKey === "dental";
  const veterinary = config?.template?.dashboardKey === "veterinary";
  const medical = config?.template?.dashboardKey === "health";
  const dynamicItems = hospitality
    ? Object.entries(departmentNavigation)
        .filter(([code]) => functions.has(code))
        .map(([code, [icon, label]]) => ({
          icon,
          label,
          key: code,
          to: `/pos/functions/${code}`,
        }))
    : [];
  const baseItems = dental
    ? [allNavigation[0], allNavigation[1], ...dentalNavigation]
    : medical
      ? [allNavigation[0], allNavigation[1], ...medicalNavigation]
    : veterinary
      ? [allNavigation[0], allNavigation[1], ...veterinaryNavigation]
    : hospitality
      ? allNavigation.map((item) =>
          item.key === "sales"
            ? {
                ...item,
                capability: "hospitality.cash.manage",
                label: "Caja hotelera",
                icon: "payments",
                to: "/pos/hotel-cashier",
              }
            : item,
        )
      : allNavigation;
  const visibleNavigation = [
    ...baseItems.filter(
      (item) =>
        (!item.capability ||
          capabilities.has(item.capability) ||
          (item.alternate && capabilities.has(item.alternate))) &&
        (!item.requiredCapabilities ||
          item.requiredCapabilities.every((capability) =>
            capabilities.has(capability),
          )) &&
        (!hospitality ||
          !item.functionCode ||
          functions.has(item.functionCode)) &&
        (!veterinary ||
          !item.functionCode ||
          functions.has(item.functionCode)),
    ),
    ...dynamicItems,
  ];
  return (
    <nav aria-label="Navegacion del operador" className="mt-5 grid gap-1">
      {visibleNavigation.map((item) => (
        <NavLink
          aria-label={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            `${item.key === "chat" ? "flex lg:hidden" : "flex"} min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-bold transition-colors ${isActive ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-primary-fixed hover:text-primary"}`
          }
          data-onboarding={`nav-${item.key}`}
          end={item.to === "/pos"}
          key={item.to}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          to={item.to}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined w-6 shrink-0 text-center"
          >
            {item.icon}
          </span>
          <span
            className={`whitespace-nowrap transition-[max-width,opacity] duration-200 ${collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100"}`}
          >
            {item.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function OperatorShell({ action, children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [now, setNow] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const { config } = useAppConfig();
  const hospitality = config?.template?.dashboardKey === "hospitality";
  const dental = config?.template?.dashboardKey === "dental";
  const veterinary = config?.template?.dashboardKey === "veterinary";
  const unread = veterinary
    ? notifications.length
    : notifications.filter((item) => !item.readAt).length;
  const { closeMobile, collapsed, mobileOpen, openMobile, toggleCollapsed } =
    useResponsiveSidebar(`wasita:sidebar:operator:${user?.id || "user"}`);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (mobileOpen) panelRef.current?.focus();
  }, [mobileOpen]);
  useEffect(() => {
    if (!hospitality && !dental && !veterinary) return undefined;
    let active = true;
    let request = null;
    const refresh = () => {
      if (document.visibilityState === "hidden" || request) return request;
      request = (dental
        ? getDentalNotifications()
        : veterinary
          ? getVeterinaryAlerts()
          : getHospitalityNotifications())
        .then((data) => {
          if (active) setNotifications(data);
        })
        .catch(() => {})
        .finally(() => {
          request = null;
        });
      return request;
    };
    const refreshForChange = (event) => {
      const path = event.detail?.path || "";
      const relevant = dental
        ? path.startsWith("/health/appointments") ||
          path.startsWith("/health/dental")
        : veterinary
          ? path.startsWith("/veterinary")
          : path.startsWith("/hospitality");
      if (relevant) refresh();
    };
    refresh();
    const timer = window.setInterval(refresh, NOTIFICATION_REFRESH_INTERVAL_MS);
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("wasi:data-changed", refreshForChange);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("wasi:data-changed", refreshForChange);
    };
  }, [dental, hospitality, veterinary]);
  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const close = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      )
        setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [notificationsOpen]);
  useEffect(() => {
    if (!accountOpen) return undefined;
    const close = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target))
        setAccountOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);
  const readOne = (item) => {
    if (veterinary) return;
    setNotifications((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row,
      ),
    );
    (dental
      ? readDentalNotification(item.id)
      : readHospitalityNotification(item.id)
    ).catch(() => {});
  };
  const readAll = () => {
    if (veterinary) return;
    setNotifications((current) =>
      current.map((row) => ({
        ...row,
        readAt: row.readAt || new Date().toISOString(),
      })),
    );
    (dental
      ? readAllDentalNotifications()
      : readAllHospitalityNotifications()
    ).catch(() => {});
  };
  const signOut = async () => {
    await logout();
    navigate("/");
  };
  const sidebarBody = (mobile = false) => (
    <>
      <div className="flex h-12 items-center gap-2 overflow-hidden">
        <div className="min-w-0 flex-1">
          <BrandLogo compact />
        </div>
        {mobile ? (
          <button
            aria-label="Cerrar menu"
            className="material-symbols-outlined min-h-11 min-w-11 rounded-xl hover:bg-surface-container-high"
            onClick={closeMobile}
            type="button"
          >
            close
          </button>
        ) : (
          <button
            aria-label={collapsed ? "Expandir menu" : "Contraer menu"}
            className="material-symbols-outlined min-h-10 min-w-10 shrink-0 rounded-xl text-primary hover:bg-primary-fixed"
            onClick={toggleCollapsed}
            type="button"
          >
            {collapsed ? "chevron_right" : "chevron_left"}
          </button>
        )}
      </div>
      {!collapsed || mobile ? (
        <div className="mt-7 overflow-hidden rounded-2xl bg-primary-fixed p-3 text-on-primary-fixed">
          <p className="text-xs font-bold uppercase tracking-wider">
            {dental || veterinary ? "Área clínica" : "Punto de venta"}
          </p>
          <p className="mt-1 truncate font-bold">{user.name}</p>
          <p className="truncate text-xs">{user.site}</p>
        </div>
      ) : (
        <div className="mt-7 flex justify-center">
          <Avatar name={user.name} />
        </div>
      )}
      <OperatorNavigation
        collapsed={!mobile && collapsed}
        onNavigate={mobile ? closeMobile : undefined}
      />
      <button
        className={`absolute bottom-4 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary ${!mobile && collapsed ? "left-3 right-3" : "left-4 right-4"}`}
        onClick={() => setConfirmLogout(true)}
        title="Cerrar sesion"
        type="button"
      >
        <span className="material-symbols-outlined">logout</span>
        {!collapsed || mobile ? (
          <span className="whitespace-nowrap">Cerrar sesion</span>
        ) : null}
      </button>
    </>
  );

  return (
    <div className="min-h-svh overflow-x-hidden bg-[#f7f4ef] text-on-surface">
      <aside
        className={`fixed inset-y-0 left-0 z-50 hidden border-r border-outline-variant bg-white p-4 transition-[width] duration-200 ease-out lg:block ${collapsed ? "w-[84px]" : "w-64"}`}
        data-onboarding="sidebar"
      >
        {sidebarBody()}
      </aside>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[80] bg-black/50 lg:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) closeMobile();
            }}
          >
            <motion.aside
              animate={{ x: 0 }}
              aria-label="Navegacion del operador"
              aria-modal="true"
              className="relative h-full w-[min(320px,86vw)] bg-white p-4 shadow-2xl"
              exit={{ x: "-100%" }}
              id="operator-mobile-navigation"
              initial={{ x: "-100%" }}
              ref={panelRef}
              role="dialog"
              tabIndex={-1}
              transition={{ duration: 0.22, ease: "easeOut" }}
              data-onboarding="sidebar"
            >
              {sidebarBody(true)}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div
        className={`transition-[padding] duration-200 ease-out ${collapsed ? "lg:pl-[84px]" : "lg:pl-64"}`}
      >
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-outline-variant bg-white/95 px-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-controls="operator-mobile-navigation"
              aria-expanded={mobileOpen}
              aria-label="Abrir menu"
              className="material-symbols-outlined min-h-11 min-w-11 rounded-xl border border-outline-variant hover:border-primary lg:hidden"
              onClick={openMobile}
              type="button"
            >
              menu
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {now.toLocaleDateString("es-PE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p className="text-xs text-on-surface-variant">
                {now.toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationsRef}>
              <button
                aria-label="Notificaciones"
                className="relative min-h-11 min-w-11 rounded-full hover:bg-surface-container-high"
                onClick={() => setNotificationsOpen((value) => !value)}
                type="button"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unread ? (
                  <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                ) : null}
              </button>
              {notificationsOpen ? (
                <div className="absolute right-0 top-12 z-[90] w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-3">
                    <div>
                      <p className="font-bold">Notificaciones</p>
                      <p className="text-xs text-on-surface-variant">
                        {veterinary
                          ? "Alertas clínicas y de agenda"
                          : "Asignaciones y cambios importantes"}
                      </p>
                    </div>
                    {!veterinary && unread ? (
                      <button
                        className="text-xs font-bold text-primary"
                        onClick={readAll}
                        type="button"
                      >
                        Marcar leídas
                      </button>
                    ) : null}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length ? (
                      notifications.slice(0, 20).map((item) => (
                        <Link
                          className={`block rounded-xl p-3 hover:bg-surface-container-low ${item.readAt ? "opacity-70" : "bg-primary-fixed/40"}`}
                          key={item.id}
                          onClick={() => {
                            if (!veterinary) readOne(item);
                            setNotificationsOpen(false);
                          }}
                          to={item.route || "/pos"}
                        >
                          <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-xl text-primary">
                              {veterinary && item.context === "Vacunación"
                                ? "vaccines"
                                : veterinary && item.context === "Agenda"
                                  ? "calendar_month"
                                  : item.notificationType?.includes(
                                "functions_added",
                              )
                                ? "verified_user"
                                : item.notificationType?.includes(
                                      "functions_removed",
                                    )
                                  ? "lock"
                                  : item.notificationType?.includes("cancelled")
                                    ? "cancel"
                                    : item.notificationType?.includes(
                                          "completed",
                                        )
                                      ? "task_alt"
                                      : "notifications_active"}
                            </span>
                            <div>
                              <p className="text-sm font-bold">{item.title}</p>
                              <p className="mt-1 text-sm text-on-surface-variant">
                                {item.message}
                              </p>
                              {item.createdAt || item.dueAt ? (
                                <p className="mt-1 text-xs text-on-surface-variant">
                                  {new Date(
                                    item.createdAt || item.dueAt,
                                  ).toLocaleString("es-PE")}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-on-surface-variant">
                        No tienes notificaciones.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="relative" ref={accountRef}>
              <button
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label="Abrir menú de perfil"
                className="flex min-h-11 items-center gap-1 rounded-full border border-transparent px-1 transition hover:border-outline-variant hover:bg-surface-container-low"
                onClick={() => {
                  setAccountOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
                type="button"
              >
                <Avatar name={user.name} />
                <span className="material-symbols-outlined text-lg text-on-surface-variant">
                  {accountOpen ? "expand_less" : "expand_more"}
                </span>
              </button>
              {accountOpen ? (
                <div
                  className="absolute right-0 top-12 z-[90] w-72 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
                  role="menu"
                >
                  <div className="border-b border-outline-variant bg-surface-container-low p-4">
                    <p className="truncate font-bold">{user.name}</p>
                    <p className="mt-1 truncate text-xs text-on-surface-variant">
                      {user.email}
                    </p>
                    <p className="mt-1 truncate text-xs text-on-surface-variant">
                      {user.site}
                    </p>
                  </div>
                  <div className="grid gap-1 p-2">
                    <Link
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-on-surface-variant hover:bg-primary-fixed hover:text-primary"
                      onClick={() => setAccountOpen(false)}
                      role="menuitem"
                      to="/pos/profile"
                    >
                      <span className="material-symbols-outlined">person</span>
                      Mi perfil
                    </Link>
                    <button
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-error hover:bg-error-container"
                      onClick={() => {
                        setAccountOpen(false);
                        setConfirmLogout(true);
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <span className="material-symbols-outlined">logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-3 sm:p-5">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Operaciones
              </p>
              <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-on-surface-variant">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
          <AttendanceWidget />
          <div data-onboarding="page-content">{children}</div>
        </main>
      </div>
      <ConfirmDialog
        description="Se cerrara tu sesion de trabajo."
        onCancel={() => setConfirmLogout(false)}
        onConfirm={signOut}
        open={confirmLogout}
        title="Cerrar sesion"
      />
    </div>
  );
}
