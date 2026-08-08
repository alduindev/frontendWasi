import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/atoms/Card";
import Skeleton from "../../components/atoms/Skeleton";
import OperatorShell from "../../components/operator/OperatorShell";
import { useAuth } from "../../context/authStore";
import { useAppConfig } from "../../context/appConfigStore";
import { formatCurrency } from "../../data/dashboard";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { getHousekeepingTasks } from "../../services/hospitalityService";
import { getOperatorInvoices, getOperatorSummary } from "../../services/operatorService";
import MedicalDashboard from "../health/MedicalDashboard";
import DentalOperatorDashboard from "./DentalOperatorDashboard";
import VeterinaryOperatorDashboard from "./VeterinaryOperatorDashboard";

const hospitalityShortcuts = [
  {
    functionCode: "reception",
    icon: "concierge",
    label: "Recepción",
    note: "Llegadas, huéspedes y salidas",
    requiredCapabilities: [
      "hospitality.rooms.read",
      "hospitality.guests.manage",
      "hospitality.reservations.manage",
      "hospitality.checkin",
      "hospitality.checkout",
    ],
    to: "/pos/reception",
    primary: true,
  },
  {
    functionCode: "hospitality-supervisor",
    icon: "manage_accounts",
    label: "Supervisión",
    note: "Monitorear toda la operación",
    requiredCapabilities: ["hospitality.staff.read", "hospitality.rooms.read"],
    to: "/pos/supervision",
    primary: true,
  },
  {
    functionCode: "cashier",
    icon: "payments",
    label: "Caja hotelera",
    note: "Cobrar estancias y consumos",
    requiredCapabilities: ["hospitality.cash.manage"],
    to: "/pos/hotel-cashier",
    primary: true,
  },
  {
    alternateCapability: "inventory.read_safe",
    capability: "inventory.read",
    functionCode: "inventory",
    icon: "inventory_2",
    label: "Productos",
    note: "Consultar precio y stock",
    to: "/pos/products",
  },
  {
    capability: "hospitality.housekeeping.read_assigned",
    functionCode: "housekeeping",
    icon: "cleaning_services",
    label: "Mis habitaciones",
    note: "Revisar limpiezas asignadas",
    to: "/pos/housekeeping",
    primary: true,
  },
];

const commerceShortcuts = [
  {
    capability: "sales.create",
    icon: "point_of_sale",
    label: "Nueva venta",
    note: "Abrir carrito y atender",
    to: "/pos/sale",
    primary: true,
  },
  {
    alternateCapability: "inventory.read_safe",
    capability: "inventory.read",
    icon: "inventory_2",
    label: "Productos",
    note: "Consultar precio y stock",
    to: "/pos/products",
  },
  {
    capability: "sales.read_own",
    icon: "receipt_long",
    label: "Mis comprobantes",
    note: "Revisar ventas emitidas",
    to: "/pos/invoices",
  },
  {
    capability: "sales.read_own",
    icon: "history",
    label: "Mi historial",
    note: "Ver mi actividad de ventas",
    to: "/pos/history",
  },
];

const departments = {
  maintenance: ["home_repair_service", "Mantenimiento"],
  security: ["security", "Seguridad"],
  laundry: ["local_laundry_service", "Lavandería"],
  kitchen: ["skillet", "Cocina"],
  purchasing: ["shopping_cart", "Compras"],
  "customer-service": ["support_agent", "Atención al cliente"],
  "room-service": ["room_service", "Room service"],
};

function hasCapability(capabilities, item) {
  return (
    !item.capability ||
    capabilities.has(item.capability) ||
    (item.alternateCapability && capabilities.has(item.alternateCapability))
  );
}

function hasAllCapabilities(capabilities, items = []) {
  return items.every((capability) => capabilities.has(capability));
}

export default function OperatorDashboard() {
  const { user } = useAuth();
  const { config, isLoading } = useAppConfig();
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const capabilities = useMemo(
    () => new Set(config?.capabilities || []),
    [config?.capabilities],
  );
  const functions = useMemo(
    () => new Set(config?.user?.functions?.map((item) => item.code) || []),
    [config?.user?.functions],
  );
  const hospitality = config?.template?.dashboardKey === "hospitality";
  const canCommerceSale = !hospitality && capabilities.has("sales.create");
  const canHotelCash =
    hospitality &&
    functions.has("cashier") &&
    capabilities.has("hospitality.cash.manage");
  const canInventory = hospitality
    ? functions.has("inventory") &&
      (capabilities.has("inventory.read") || capabilities.has("inventory.read_safe"))
    : capabilities.has("inventory.read") || capabilities.has("inventory.read_safe");
  const canClean =
    hospitality &&
    functions.has("housekeeping") &&
    capabilities.has("hospitality.housekeeping.read_assigned");
  const visibleShortcuts = useMemo(() => {
    const base = hospitality ? hospitalityShortcuts : commerceShortcuts;
    const visible = base.filter(
      (item) =>
        hasCapability(capabilities, item) &&
        hasAllCapabilities(capabilities, item.requiredCapabilities) &&
        (!hospitality || !item.functionCode || functions.has(item.functionCode)),
    );
    const departmentItems = hospitality
      ? Object.entries(departments)
          .filter(([code]) => functions.has(code))
          .map(([code, [icon, label]]) => ({
            icon,
            key: code,
            label,
            note: "Ver órdenes asignadas",
            to: `/pos/functions/${code}`,
          }))
      : [];
    return [...visible, ...departmentItems];
  }, [capabilities, functions, hospitality]);

  useEffect(() => {
    let active = true;
    if (canCommerceSale) {
      Promise.all([getOperatorSummary(), getOperatorInvoices()])
        .then(([data, invoices]) => {
          if (!active) return;
          setSummary(data);
          setSales(invoices.slice(0, 3));
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        });
    } else if (!hospitality && canInventory) {
      getOperatorSummary()
        .then((data) => {
          if (active) setSummary(data);
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        });
    }
    if (canClean) {
      getHousekeepingTasks()
        .then((data) => {
          if (active) setTasks(data);
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        });
    }
    return () => {
      active = false;
    };
  }, [canClean, canCommerceSale, canInventory, hospitality]);

  useEffect(() => {
    if (!canClean) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        getHousekeepingTasks().then(setTasks).catch(() => {});
      }
    }, 3000);
    return () => clearInterval(id);
  }, [canClean]);

  useLiveRefresh(() => {
    if (canCommerceSale) {
      Promise.all([getOperatorSummary(), getOperatorInvoices()])
        .then(([data, invoices]) => {
          setSummary(data);
          setSales(invoices.slice(0, 3));
        })
        .catch(() => {});
    } else if (!hospitality && canInventory) {
      getOperatorSummary().then(setSummary).catch(() => {});
    }
    if (canClean) getHousekeepingTasks().then(setTasks).catch(() => {});
  }, ["/operator", "/hospitality", "/products"]);

  if (config?.template?.dashboardKey === "dental") {
    return <DentalOperatorDashboard />;
  }
  if (config?.template?.dashboardKey === "health") {
    return <MedicalDashboard operator />;
  }
  if (config?.template?.dashboardKey === "veterinary") {
    return <VeterinaryOperatorDashboard />;
  }

  if (!isLoading && config && !functions.size && hospitality) {
    return (
      <OperatorShell
        subtitle="Tu cuenta está activa, pero todavía no tienes funciones operativas asignadas."
        title={`Hola, ${user.name}`}
      >
        <Card className="p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-primary">
            lock_person
          </span>
          <h2 className="mt-3 text-xl font-bold">Sin accesos asignados</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Solicita al administrador que te asigne una función.
          </p>
          <Link className="mt-4 inline-block font-bold text-primary" to="/pos/profile">
            Ver mi perfil
          </Link>
        </Card>
      </OperatorShell>
    );
  }

  const activeTasks = tasks.filter((task) =>
    ["pending", "assigned", "in_progress"].includes(task.status),
  );
  const primary = canClean
    ? {
        eyebrow: "Housekeeping",
        icon: "cleaning_services",
        note: `${activeTasks.length} tarea(s) activa(s)`,
        title: "Mis habitaciones",
        to: "/pos/housekeeping",
      }
    : canHotelCash
      ? {
          eyebrow: "Caja",
          icon: "payments",
          note: "Cobrar estancias y consumos",
          title: "Cuentas hoteleras",
          to: "/pos/hotel-cashier",
        }
      : canCommerceSale
        ? {
            eyebrow: "Caja",
            icon: "point_of_sale",
            note: "Buscar productos y cobrar",
            title: "Nueva venta",
            to: "/pos/sale",
          }
        : canInventory
          ? {
              eyebrow: "Inventario",
              icon: "inventory_2",
              note: "Precios y existencias",
              title: "Consultar productos",
              to: "/pos/products",
            }
          : null;

  return (
    <OperatorShell
      subtitle="Herramientas habilitadas según tus funciones y permisos asignados."
      title={`Hola, ${user.name}`}
    >
      {primary ? (
        <Link
          className="group flex min-h-32 items-center justify-between rounded-3xl bg-primary p-5 text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 sm:p-7"
          to={primary.to}
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary-fixed">
              {primary.eyebrow}
            </p>
            <p className="mt-2 font-heading text-3xl font-bold">{primary.title}</p>
            <p className="mt-1 text-sm text-primary-fixed">{primary.note}</p>
          </div>
          <span className="material-symbols-outlined text-5xl transition group-hover:scale-110">
            {primary.icon}
          </span>
        </Link>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-2xl border border-error-container bg-error-container p-4 text-sm">
          {error}
        </div>
      ) : null}
      {canClean ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <span className="material-symbols-outlined text-primary">pending_actions</span>
            <p className="mt-3 text-3xl font-bold">
              {tasks.filter((task) => ["pending", "assigned"].includes(task.status)).length}
            </p>
            <p className="text-sm text-on-surface-variant">Por iniciar</p>
          </Card>
          <Card className="p-4">
            <span className="material-symbols-outlined text-amber-600">cleaning_services</span>
            <p className="mt-3 text-3xl font-bold">
              {tasks.filter((task) => task.status === "in_progress").length}
            </p>
            <p className="text-sm text-on-surface-variant">En progreso</p>
          </Card>
          <Card className="p-4">
            <span className="material-symbols-outlined text-emerald-600">task_alt</span>
            <p className="mt-3 text-3xl font-bold">
              {tasks.filter((task) => task.status === "completed").length}
            </p>
            <p className="text-sm text-on-surface-variant">Completadas</p>
          </Card>
        </div>
      ) : null}
      {!hospitality && !canClean && (canCommerceSale || canInventory) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {summary ? (
            <>
              <Card className="p-4">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                <p className="mt-3 text-3xl font-bold">{summary.availableProducts}</p>
                <p className="text-sm text-on-surface-variant">Productos disponibles</p>
              </Card>
              <Card className="p-4">
                <span className="material-symbols-outlined text-amber-600">warning</span>
                <p className="mt-3 text-3xl font-bold">{summary.lowStockProducts}</p>
                <p className="text-sm text-on-surface-variant">Stock bajo</p>
              </Card>
              {canCommerceSale ? (
                <Card className="p-4">
                  <span className="material-symbols-outlined text-emerald-600">shopping_bag</span>
                  <p className="mt-3 text-3xl font-bold">{summary.salesToday}</p>
                  <p className="text-sm text-on-surface-variant">Ventas hoy</p>
                </Card>
              ) : null}
            </>
          ) : (
            [1, 2, 3].map((item) => <Skeleton className="h-32" key={item} />)
          )}
        </div>
      ) : null}
      <h2 className="mt-7 font-heading text-xl font-bold">Accesos habilitados</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visibleShortcuts.map((item) => (
          <Link
            className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${item.primary ? "border-primary bg-primary/5" : "border-outline-variant bg-white"}`}
            key={item.to}
            to={item.to}
          >
            <span className="material-symbols-outlined text-2xl text-primary">{item.icon}</span>
            <p className="mt-3 font-bold">{item.label}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{item.note}</p>
          </Link>
        ))}
      </div>
      {canCommerceSale ? (
        <>
          <div className="mt-7 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">Mis últimas ventas</h2>
            <Link className="text-sm font-bold text-primary" to="/pos/history">
              Ver historial
            </Link>
          </div>
          <div className="mt-3 grid gap-3">
            {sales.length ? (
              sales.map((sale) => (
                <Card className="flex items-center justify-between gap-3 p-4" key={sale.id}>
                  <div>
                    <p className="font-bold">
                      {sale.series}-{String(sale.number).padStart(8, "0")}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(sale.issuedAt).toLocaleString("es-PE")} · {sale.customerName}
                    </p>
                  </div>
                  <b className="text-primary">{formatCurrency(sale.total)}</b>
                </Card>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
                Aún no registraste ventas.
              </p>
            )}
          </div>
        </>
      ) : null}
    </OperatorShell>
  );
}
