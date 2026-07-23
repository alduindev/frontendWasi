/* eslint-disable react-hooks/static-components */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authStore";
import { formatCurrency } from "../../data/dashboard";
import {
  changeBusinessPlan,
  changeBusinessType,
  getPlans,
  getPlatformBusiness,
  getPlatformBusinesses,
  getPlatformDashboard,
  setBusinessStatus,
} from "../../services/platformService";
import { getPlatformBusinessTypes } from "../../services/businessTypeService";

const nav = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard SaaS" },
  { id: "businesses", icon: "domain", label: "Empresas" },
  { id: "business-types", icon: "category", label: "Catálogo de negocios" },
  { id: "modules", icon: "extension", label: "Módulos e industrias" },
  { id: "plans", icon: "workspace_premium", label: "Planes" },
];
const statusTone = {
  active: "bg-emerald-100 text-emerald-800",
  trial: "bg-blue-100 text-blue-800",
  suspended: "bg-error-container text-on-error-container",
  expired: "bg-amber-100 text-amber-900",
};
function Metric({ icon, label, value, note }) {
  return (
    <article className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold text-on-surface">
        {value}
      </p>
      {note ? (
        <p className="mt-1 text-xs text-on-surface-variant">{note}</p>
      ) : null}
    </article>
  );
}
function Progress({ current, max }) {
  const value = Math.min(100, Math.round((current / Math.max(max, 1)) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{current} usados</span>
        <b>{max}</b>
      </div>
      <div className="mt-1 h-2 rounded-full bg-surface-container-high">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
function BusinessTypeChanger({ business, onChanged }) {
  const [types, setTypes] = useState([]);
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getPlatformBusinessTypes()
      .then(setTypes)
      .catch(() => {});
  }, []);
  const visible = types.filter((x) =>
    `${x.name} ${x.slug}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const save = async () => {
    if (!value) return;
    setSaving(true);
    try {
      await changeBusinessType(business.id, value);
      await onChanged();
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="fixed bottom-4 right-4 z-[260] w-[min(calc(100vw-2rem),38rem)] rounded-2xl border border-primary/30 bg-white p-4 shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-primary">
          Tipo de negocio
        </p>
        <span className="rounded-full bg-primary-fixed px-2 py-1 text-xs font-bold text-primary">
          {types.length} rubros
        </span>
      </div>
      <p className="mb-3 text-sm text-on-surface-variant">
        Busca y selecciona la nueva plantilla de {business.name}. Los datos
        existentes se conservan.
      </p>
      <input
        className="mb-2 min-h-11 w-full rounded-xl border border-outline-variant px-3 outline-none focus:border-primary"
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar: dental, hotel, farmacia..."
        value={query}
      />
      <select
        className="h-36 w-full rounded-xl border border-outline-variant bg-white p-2"
        onChange={(e) => setValue(e.target.value)}
        size="6"
        value={value}
      >
        {visible.map((x) => (
          <option className="rounded-lg px-2 py-1" key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-xs text-on-surface-variant">
          Mostrando {visible.length} de {types.length}
        </span>
        <button
          className="min-h-11 rounded-xl bg-primary px-5 font-bold text-white disabled:opacity-50"
          disabled={!value || saving}
          onClick={save}
          type="button"
        >
          {saving ? "Cambiando..." : "Cambiar rubro"}
        </button>
      </div>
    </section>
  );
}

export default function PlatformDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState("dashboard");
  const [data, setData] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const [summary, list, availablePlans] = await Promise.all([
        getPlatformDashboard(),
        getPlatformBusinesses(),
        getPlans(),
      ]);
      setData(summary);
      setBusinesses(list.items);
      setPlans(availablePlans);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const exit = async () => {
    await logout();
    navigate("/");
  };
  useEffect(() => {
    if (section === "business-types") navigate("/platform/business-types");
    if (section === "modules") navigate("/platform/modules");
    if (section === "plans") navigate("/platform/billing");
  }, [navigate, section]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter(
      (x) =>
        !q || `${x.name} ${x.status} ${x.country}`.toLowerCase().includes(q),
    );
  }, [businesses, query]);
  const open = async (id) => {
    if (!id) return;
    try {
      const response = await getPlatformBusiness(id);
      setDetail(response?.business ? response : null);
    } catch (e) {
      setError(e.message);
      setDetail(null);
    }
  };
  const status = async (id, value) => {
    if (!id) return;
    await setBusinessStatus(id, value);
    await load();
    if (detail?.business?.id === id) await open(id);
  };
  const plan = async (code) => {
    const businessId = detail?.business?.id;
    if (!businessId || !code) return;
    await changeBusinessPlan(businessId, code);
    await load();
    await open(businessId);
  };
  const Sidebar = () => (
    <aside
      className={`fixed inset-y-0 left-0 z-[150] w-64 border-r border-white/10 bg-[#1d1020] p-5 text-white transition-transform lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}
    >
      <p className="font-heading text-2xl font-extrabold">WASITA</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary-fixed">
        Administración SaaS
      </p>
      <nav className="mt-8 grid gap-2">
        {nav.map((item) => (
          <button
            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-sm font-bold ${section === item.id ? "bg-white text-primary" : "text-white/80 hover:bg-white/10"}`}
            key={item.id}
            onClick={() => {
              setSection(item.id);
              setMenu(false);
            }}
            type="button"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="absolute bottom-5 left-5 right-5">
        <p className="truncate text-sm font-bold">{user.name}</p>
        <p className="truncate text-xs text-white/60">{user.email}</p>
        <button
          className="mt-3 min-h-11 w-full rounded-xl border border-white/30 text-sm font-bold"
          onClick={exit}
          type="button"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-on-surface">
      <Sidebar />
      {menu ? (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-[140] bg-black/50 lg:hidden"
          onClick={() => setMenu(false)}
          type="button"
        />
      ) : null}
      <main className="min-w-0 p-3 sm:p-5 lg:ml-64 lg:p-7">
        <header className="flex items-center gap-3">
          <button
            aria-label="Abrir menú"
            className="material-symbols-outlined min-h-11 min-w-11 rounded-xl border border-outline-variant lg:hidden"
            onClick={() => setMenu(true)}
            type="button"
          >
            menu
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              SUPER ADMIN
            </p>
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">
              {nav.find((x) => x.id === section)?.label}
            </h1>
          </div>
        </header>
        {error ? (
          <div className="mt-5 rounded-xl bg-error-container p-4 text-on-error-container">
            {error}
          </div>
        ) : null}
        {section === "dashboard" ? (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric
                icon="domain"
                label="Empresas"
                value={data?.businesses ?? "—"}
                note={`${data?.trialBusinesses || 0} en prueba`}
              />
              <Metric
                icon="group"
                label="Usuarios"
                value={data?.users ?? "—"}
                note={`${data?.operators || 0} operadores`}
              />
              <Metric
                icon="payments"
                label="MRR"
                value={data ? formatCurrency(data.mrr) : "—"}
                note={`ARR ${data ? formatCurrency(data.arr) : "—"}`}
              />
              <Metric
                icon="shopping_cart"
                label="Ventas globales"
                value={data ? formatCurrency(data.globalSales) : "—"}
              />
              <Metric
                icon="check_circle"
                label="Empresas activas"
                value={data?.activeBusinesses ?? "—"}
              />
              <Metric
                icon="pause_circle"
                label="Suspendidas"
                value={data?.suspendedBusinesses ?? "—"}
              />
              <Metric
                icon="inventory_2"
                label="Productos"
                value={data?.products ?? "—"}
              />
              <Metric
                icon="image"
                label="Imágenes"
                value={data?.images ?? "—"}
              />
            </section>
            <section className="mt-6 rounded-2xl border border-outline-variant bg-white p-5">
              <div className="flex justify-between">
                <div>
                  <h2 className="font-heading text-xl font-bold">
                    Empresas recientes
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    Acceso rápido a tenants y suscripciones.
                  </p>
                </div>
                <button
                  className="text-sm font-bold text-primary"
                  onClick={() => setSection("businesses")}
                  type="button"
                >
                  Ver todas
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {businesses.slice(0, 5).map((x) => (
                  <button
                    className="flex items-center justify-between rounded-xl border border-outline-variant p-3 text-left hover:border-primary"
                    key={x.id}
                    onClick={() => open(x.id)}
                    type="button"
                  >
                    <span>
                      <b>{x.name}</b>
                      <span className="block text-xs text-on-surface-variant">
                        {x.country} ·{" "}
                        {new Date(x.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[x.status]}`}
                    >
                      {x.status}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}
        {section === "businesses" ? (
          <section className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-on-surface-variant">
                {businesses.length} empresas registradas
              </p>
              <input
                className="min-h-11 rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar empresa o estado"
                value={query}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((x) => (
                <button
                  className="rounded-2xl border border-outline-variant bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
                  key={x.id}
                  onClick={() => open(x.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-xl bg-primary-fixed text-primary">
                      store
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[x.status]}`}
                    >
                      {x.status}
                    </span>
                  </div>
                  <h2 className="mt-4 font-heading text-lg font-bold">
                    {x.name}
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {x.country} · {x.currency}
                  </p>
                  <p className="mt-3 text-xs text-on-surface-variant">
                    Registrada {new Date(x.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {section === "plans" ? (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((x) => (
              <article
                className="rounded-3xl border border-outline-variant bg-white p-5"
                key={x.id}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {x.code}
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  {x.name}
                </h2>
                <p className="mt-3 text-3xl font-bold text-primary">
                  {formatCurrency(x.price)}
                  <span className="text-sm font-normal text-on-surface-variant">
                    {" "}
                    / mes
                  </span>
                </p>
                <ul className="mt-5 grid gap-2 text-sm text-on-surface-variant">
                  <li>{x.maxUsers} usuarios</li>
                  <li>{x.maxProducts} productos</li>
                  <li>{x.maxBranches} sucursales</li>
                  <li>{x.maxImages} imágenes</li>
                  <li>{x.maxStorageMb} MB almacenamiento</li>
                </ul>
              </article>
            ))}
          </section>
        ) : null}
      </main>
      {detail ? (
        <BusinessTypeChanger
          business={detail.business}
          onChanged={async () => {
            await load();
            await open(detail.business.id);
          }}
        />
      ) : null}
      {detail ? (
        <div
          className="fixed inset-0 z-[200] bg-black/50"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setDetail(null);
          }}
        >
          <aside
            aria-modal="true"
            className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-primary">
                  Empresa
                </p>
                <h2 className="font-heading text-2xl font-bold">
                  {detail.business.name}
                </h2>
                <p className="text-sm text-on-surface-variant">
                  {detail.business.country} · {detail.business.timezone}
                </p>
              </div>
              <button
                aria-label="Cerrar"
                className="material-symbols-outlined min-h-11 min-w-11 rounded-full hover:bg-surface-container"
                onClick={() => setDetail(null)}
                type="button"
              >
                close
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Usuarios" value={detail.usage.users} />
              <Metric label="Productos" value={detail.usage.products} />
              <Metric label="Ventas" value={detail.usage.sales} />
              <Metric
                label="Facturación"
                value={formatCurrency(detail.usage.salesTotal)}
              />
            </div>
            {detail.subscription ? (
              <section className="mt-5 rounded-2xl border border-outline-variant p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-on-surface-variant">
                      Suscripción actual
                    </p>
                    <h3 className="text-xl font-bold text-primary">
                      {detail.subscription.plan.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      {detail.subscription.status} ·{" "}
                      {formatCurrency(detail.subscription.plan.price)}/mes
                    </p>
                  </div>
                  <select
                    className="min-h-11 rounded-xl border border-outline-variant px-3"
                    onChange={(e) => plan(e.target.value)}
                    value={detail.subscription.plan.code}
                  >
                    {plans.map((x) => (
                      <option key={x.id} value={x.code}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Progress
                    current={detail.usage.users}
                    max={detail.subscription.plan.maxUsers}
                  />
                  <Progress
                    current={detail.usage.products}
                    max={detail.subscription.plan.maxProducts}
                  />
                  <Progress
                    current={detail.usage.images}
                    max={detail.subscription.plan.maxImages}
                  />
                </div>
              </section>
            ) : null}
            <section className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-heading text-xl font-bold">
                  Usuarios y accesos
                </h3>
                <div className="flex gap-2">
                  {detail.business.status === "suspended" ? (
                    <button
                      className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
                      onClick={() => status(detail.business.id, "active")}
                      type="button"
                    >
                      Restaurar
                    </button>
                  ) : (
                    <button
                      className="rounded-xl border border-error px-3 py-2 text-sm font-bold text-error"
                      onClick={() => status(detail.business.id, "suspended")}
                      type="button"
                    >
                      Suspender
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {detail.users.map((x) => (
                  <article
                    className="rounded-xl bg-surface-container-low p-3"
                    key={x.id}
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <b>{x.name}</b>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                        {x.role}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {x.email} · {x.phone} · {x.site}
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Último acceso:{" "}
                      {x.lastLoginAt
                        ? new Date(x.lastLoginAt).toLocaleString()
                        : "Nunca"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
