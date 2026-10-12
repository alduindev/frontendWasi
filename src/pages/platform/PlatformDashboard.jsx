/* eslint-disable react-hooks/static-components */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authStore";
import { formatCurrency } from "../../data/dashboard";
import {
  changeBusinessPlan,
  changeBusinessType,
  archiveBusiness,
  deleteBusiness,
  getPlans,
  getPlatformBusiness,
  getPlatformBusinesses,
  getPlatformDashboard,
  resetPlatformUserPassword,
  restoreBusiness,
  setBusinessStatus,
} from "../../services/platformService";
import { getPlatformBusinessTypes } from "../../services/businessTypeService";
import { getMedicalServiceTypes } from "../../services/medicalServiceTypeService";
import AdminPasswordResetModal from "../../components/credentials/AdminPasswordResetModal";
import SubscriptionDiagnostics from "../../components/platform/SubscriptionDiagnostics";
import Modal from "../../components/ui/Modal";

const nav = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard SaaS" },
  { id: "businesses", icon: "domain", label: "Empresas" },
  { id: "business-types", icon: "category", label: "Catálogo de negocios" },
  { id: "modules", icon: "extension", label: "Módulos e industrias" },
  { id: "plans", icon: "workspace_premium", label: "Suscripciones y planes" },
];
const statusTone = {
  active: "bg-emerald-100 text-emerald-800",
  trial: "bg-blue-100 text-blue-800",
  suspended: "bg-error-container text-on-error-container",
  expired: "bg-amber-100 text-amber-900",
  archived: "bg-surface-container-high text-on-surface-variant",
};
const statusLabel = {
  active: "Activa",
  trial: "En prueba",
  suspended: "Suspendida",
  expired: "Vencida",
  archived: "Archivada",
};
const metricTone = {
  violet: "from-primary/15 via-white to-white text-primary",
  sky: "from-sky-100 via-white to-white text-sky-700",
  amber: "from-amber-100 via-white to-white text-amber-700",
  emerald: "from-emerald-100 via-white to-white text-emerald-700",
  rose: "from-rose-100 via-white to-white text-rose-700",
  slate: "from-slate-100 via-white to-white text-slate-700",
};
function Metric({ icon, label, value, note, tone = "violet", compact = false }) {
  return (
    <article className={`group relative overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br ${metricTone[tone] || metricTone.violet} ${compact ? "p-3" : "p-4 sm:p-5"} shadow-[0_10px_30px_rgba(49,46,129,0.07)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(49,46,129,0.12)]`}>
      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-current opacity-[0.07]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-on-surface-variant">
            {label}
          </p>
          <p className={`${compact ? "mt-1 text-lg" : "mt-2 text-2xl sm:text-3xl"} truncate font-heading font-extrabold tracking-tight text-on-surface`}>
            {value}
          </p>
        </div>
        {icon ? (
          <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-xl shadow-sm">
            {icon}
          </span>
        ) : null}
      </div>
      {note ? (
        <p className="relative mt-2 text-xs font-medium text-on-surface-variant">{note}</p>
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
  const [medicalServices, setMedicalServices] = useState([]);
  const [medicalServiceIds, setMedicalServiceIds] = useState([]);
  const [value, setValue] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getPlatformBusinessTypes(), getMedicalServiceTypes()])
      .then(([businessTypes, services]) => {
        setTypes(businessTypes);
        setMedicalServices(Array.isArray(services) ? services : []);
      })
      .catch((requestError) => setError(requestError?.message || "No se pudieron cargar los rubros."));
  }, []);
  const visible = types.filter((x) =>
    `${x.name} ${x.slug} ${x.description || ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const currentType = types.find(
    (type) => type.id === business.businessTypeId,
  );
  const selectedType = types.find((type) => type.id === value);
  const isMedicalConsultory = selectedType?.slug === "consultorio-medico";
  const save = async () => {
    if (!value) return;
    if (isMedicalConsultory && !medicalServiceIds.length) {
      setError("Selecciona al menos un servicio médico para el consultorio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changeBusinessType(business.id, value, medicalServiceIds);
      await onChanged();
      setExpanded(false);
      setValue("");
      setMedicalServiceIds([]);
      setQuery("");
    } catch (requestError) {
      setError(requestError?.message || "No se pudo cambiar el rubro.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-outline-variant bg-white">
      <button
        aria-controls={`business-type-changer-${business.id}`}
        aria-expanded={expanded}
        className="flex min-h-16 w-full items-center gap-3 p-3 text-left transition hover:bg-surface-container-low sm:p-4"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary">
          category
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-wider text-primary">
            Tipo de negocio
          </span>
          <span className="block truncate text-sm font-bold text-on-surface">
            {currentType?.name ||
              business.businessType ||
              "Sin rubro identificado"}
          </span>
          <span className="block truncate text-xs text-on-surface-variant">
            Pulsa para cambiar la plantilla de {business.name}
          </span>
        </span>
        <span className="hidden rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-bold text-primary sm:inline">
          {types.length} rubros
        </span>
        <span
          className={`material-symbols-outlined text-on-surface-variant transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>

      {expanded ? (
        <div
          className="border-t border-outline-variant p-3 sm:p-4"
          id={`business-type-changer-${business.id}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="max-w-md text-sm text-on-surface-variant">
              Selecciona la nueva plantilla. Los datos existentes se conservan
              y los accesos se recalculan para el nuevo rubro.
            </p>
            <button
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-fixed"
              onClick={() => setExpanded(false)}
              type="button"
            >
              Minimizar
            </button>
          </div>
          <div className="relative mt-3">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              aria-label="Buscar tipo de negocio"
              className="min-h-11 w-full rounded-xl border border-outline-variant pl-10 pr-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar dental, hotel, farmacia..."
              value={query}
            />
          </div>
          <div
            aria-label="Tipos de negocio disponibles"
            className="mt-2 grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-low p-1.5 sm:grid-cols-2"
            role="listbox"
          >
            {visible.length ? (
              visible.map((type) => (
                <button
                  aria-selected={value === type.id}
                  className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    value === type.id
                      ? "bg-primary text-white shadow-sm"
                      : type.id === business.businessTypeId
                        ? "cursor-default bg-surface-container-high text-on-surface-variant"
                      : "bg-white hover:bg-primary-fixed"
                  }`}
                  disabled={type.id === business.businessTypeId}
                  key={type.id}
                  onClick={() => {
                    setValue(type.id);
                    if (type.slug !== "consultorio-medico") setMedicalServiceIds([]);
                  }}
                  role="option"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    {type.icon || "store"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{type.name}</span>
                    <span
                      className={`block truncate text-xs ${
                        value === type.id
                          ? "text-white/80"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {type.slug}
                      {type.id === business.businessTypeId ? " · Actual" : ""}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="col-span-full p-4 text-center text-sm text-on-surface-variant">
                No hay rubros que coincidan con la búsqueda.
              </p>
            )}
          </div>
          {isMedicalConsultory ? (
            <section className="mt-3 rounded-xl border border-primary/30 bg-primary-fixed/30 p-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary">medical_services</span>
                <div>
                  <h3 className="font-bold">Servicios del consultorio médico</h3>
                  <p className="text-xs text-on-surface-variant">
                    Esta selección define los roles y servicios que podrá usar la empresa después de la migración.
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {medicalServices.map((service) => {
                  const selected = medicalServiceIds.includes(service.id);
                  return (
                    <button
                      aria-pressed={selected}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-bold ${selected ? "border-primary bg-primary text-white" : "border-outline-variant bg-white hover:border-primary"}`}
                      key={service.id}
                      onClick={() => setMedicalServiceIds((current) => selected ? current.filter((id) => id !== service.id) : [...current, service.id])}
                      type="button"
                    >
                      {service.name}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
          {error ? (
            <p className="mt-2 rounded-xl bg-error-container p-2.5 text-sm text-on-error-container">
              {error}
            </p>
          ) : null}
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="truncate text-xs text-on-surface-variant">
              {selectedType
                ? `Seleccionado: ${selectedType.name}`
                : `${visible.length} de ${types.length} rubros`}
            </span>
            <div className="flex gap-2">
              <button
                className="min-h-11 flex-1 rounded-xl border border-outline-variant px-4 font-bold sm:flex-none"
                onClick={() => setExpanded(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="min-h-11 flex-1 rounded-xl bg-primary px-5 font-bold text-white disabled:opacity-50 sm:flex-none"
                disabled={!value || saving}
                onClick={save}
                type="button"
              >
                {saving ? "Cambiando..." : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ArchiveBusinessModal({ business, onClose, onConfirm, saving }) {
  if (!business) return null;

  return (
    <Modal onClose={onClose} overlayClassName="!z-[250]" title="Archivar empresa">
      <div className="p-5 sm:p-6">
        <p className="text-sm leading-6 text-on-surface-variant">
          {business.name} dejará de aparecer en la lista principal y sus usuarios no podrán iniciar sesión. Sus ventas, suscripciones e historial se conservarán y podrás restaurarla después.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-outline-variant px-4 text-sm font-bold text-on-surface-variant"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="min-h-11 rounded-xl bg-error px-4 text-sm font-bold text-white disabled:opacity-50"
            disabled={saving}
            onClick={onConfirm}
            type="button"
          >
            {saving ? "Archivando..." : "Archivar empresa"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteBusinessModal({ business, onClose, onConfirm, saving }) {
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation.trim() === business?.name?.trim();

  if (!business) return null;

  return (
    <Modal onClose={onClose} overlayClassName="!z-[250]" title="Eliminar empresa permanentemente">
      <div className="p-5 sm:p-6">
        <p className="text-sm leading-6 text-on-surface-variant">
          Esta acción eliminará de forma irreversible a <b>{business.name}</b>, sus usuarios, ventas, suscripción, historial y archivos adjuntos. No podrás restaurarla.
        </p>
        <label className="mt-5 grid gap-1 text-sm font-bold">
          Escribe el nombre exacto para confirmar
          <input
            autoFocus
            className="min-h-11 rounded-xl border border-outline-variant px-3"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={business.name}
            value={confirmation}
          />
        </label>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-outline-variant px-4 text-sm font-bold text-on-surface-variant"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="min-h-11 rounded-xl bg-error px-4 text-sm font-bold text-white disabled:opacity-50"
            disabled={!canDelete || saving}
            onClick={onConfirm}
            type="button"
          >
            {saving ? "Eliminando..." : "Eliminar permanentemente"}
          </button>
        </div>
      </div>
    </Modal>
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
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveSaving, setArchiveSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [menu, setMenu] = useState(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const [summary, list, availablePlans] = await Promise.all([
        getPlatformDashboard(),
        getPlatformBusinesses(showArchived),
        getPlans(),
      ]);
      setData(summary);
      setBusinesses(list.items);
      setPlans(availablePlans);
    } catch (e) {
      setError(e.message);
    }
  }, [showArchived]);
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
  const archive = async () => {
    if (!archiveTarget) return;
    setArchiveSaving(true);
    setError("");
    try {
      await archiveBusiness(archiveTarget.id);
      setArchiveTarget(null);
      setDetail(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setArchiveSaving(false);
    }
  };
  const restore = async (id) => {
    if (!id) return;
    try {
      await restoreBusiness(id);
      await load();
      if (detail?.business?.id === id) await open(id);
    } catch (e) {
      setError(e.message);
    }
  };
  const permanentlyDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    setError("");
    try {
      await deleteBusiness(deleteTarget.id);
      setDeleteTarget(null);
      setDetail(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteSaving(false);
    }
  };
  const plan = async (code) => {
    const businessId = detail?.business?.id;
    if (!businessId || !code) return;
    try {
      await changeBusinessPlan(businessId, code);
      await load();
      await open(businessId);
    } catch (e) {
      setError(e.message);
    }
  };
  const Sidebar = () => (
    <aside
      className={`fixed inset-y-0 left-0 z-[150] flex w-72 flex-col overflow-hidden border-r border-white/10 bg-[#17132c] p-4 text-white shadow-2xl transition-transform lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}
    >
      <p className="font-heading text-2xl font-extrabold">WASITA</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary-fixed">
        Administración SaaS
      </p>
      <div className="mt-6 px-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-white/45">Plataforma</p>
      </div>
      <nav className="mt-2 grid gap-1.5">
        {nav.map((item) => (
          <button
            className={`group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-left text-sm font-bold transition ${section === item.id ? "bg-white text-primary shadow-[0_8px_22px_rgba(0,0,0,0.18)]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            key={item.id}
            onClick={() => {
              setSection(item.id);
              setMenu(false);
            }}
            type="button"
          >
            <span className={`material-symbols-outlined text-xl ${section === item.id ? "text-primary" : "text-white/60 group-hover:text-primary-fixed"}`}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-black/15 p-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-heading text-sm font-extrabold text-primary">
            {user.name?.trim()?.charAt(0)?.toUpperCase() || "A"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-white/55">{user.email}</p>
          </div>
        </div>
        <button
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-white/85 transition hover:bg-white/10"
          onClick={exit}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-lg">logout</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
  return (
    <div className="min-h-svh overflow-x-hidden bg-[#f6f7fc] text-on-surface">
      <Sidebar />
      {menu ? (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-[140] bg-black/50 lg:hidden"
          onClick={() => setMenu(false)}
          type="button"
        />
      ) : null}
      <main className="relative min-w-0 p-3 sm:p-5 lg:ml-72 lg:p-7 xl:p-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-40 h-96 w-96 rounded-full bg-primary-fixed/45 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/3 top-52 h-64 w-64 rounded-full bg-secondary-container/40 blur-3xl" />
        <header className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/75 p-3.5 shadow-[0_8px_30px_rgba(49,46,129,0.06)] backdrop-blur-sm sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Abrir menú"
            className="material-symbols-outlined min-h-11 min-w-11 rounded-xl border border-outline-variant bg-white text-on-surface shadow-sm lg:hidden"
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
          </div>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-white px-3.5 text-sm font-bold text-on-surface transition hover:border-primary hover:text-primary"
            onClick={load}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">refresh</span>
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </header>
        {error ? (
          <div className="mt-5 rounded-xl bg-error-container p-4 text-on-error-container">
            {error}
          </div>
        ) : null}
        {section === "dashboard" ? (
          <>
            <section className="relative mt-5 overflow-hidden rounded-3xl bg-[#211b47] px-5 py-6 text-white shadow-[0_20px_42px_rgba(48,43,99,0.22)] sm:px-7 sm:py-8">
              <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-primary-fixed/20" />
              <div aria-hidden="true" className="absolute right-24 top-10 h-24 w-24 rounded-full bg-secondary/30 blur-2xl" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-primary-fixed">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.15)]" />
                    Operaci&oacute;n de plataforma
                  </span>
                  <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Todo el negocio, con una vista m&aacute;s clara.</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Supervisa empresas, suscripciones y actividad desde un solo centro de control.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-fixed"
                    onClick={() => navigate("/platform/billing?tab=requests")}
                    type="button"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">notifications_active</span>
                    Ver solicitudes
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15"
                    onClick={() => setSection("businesses")}
                    type="button"
                  >
                    Empresas
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>
            <section aria-label="Resumen de plataforma" className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                icon="domain"
                label="Empresas"
                value={data?.businesses ?? "—"}
                note={`${data?.trialBusinesses || 0} en prueba`}
                tone="violet"
              />
              <Metric
                icon="group"
                label="Usuarios"
                value={data?.users ?? "—"}
                note={`${data?.operators || 0} operadores`}
                tone="sky"
              />
              <Metric
                icon="payments"
                tone="amber"
                label="MRR"
                value={data ? formatCurrency(data.mrr) : "—"}
                note={`ARR ${data ? formatCurrency(data.arr) : "—"}`}
              />
              <Metric
                icon="shopping_cart"
                tone="emerald"
                label="Ventas globales"
                value={data ? formatCurrency(data.globalSales) : "—"}
              />
            </section>
            <section aria-label="Indicadores operativos" className="relative mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric
                icon="check_circle"
                label="Empresas activas"
                compact
                tone="emerald"
                value={data?.activeBusinesses ?? "—"}
              />
              <Metric
                icon="pause_circle"
                label="Suspendidas"
                compact
                tone={(data?.suspendedBusinesses || data?.expiredBusinesses) ? "rose" : "slate"}
                value={data?.suspendedBusinesses ?? "—"}
              />
              <Metric
                icon="inventory_2"
                label="Productos"
                compact
                tone="sky"
                value={data?.products ?? "—"}
              />
              <Metric
                icon="image"
                compact
                tone="violet"
                label="Imágenes"
                value={data?.images ?? "—"}
              />
            </section>
            <section className="relative mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)]">
              <div className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_12px_32px_rgba(49,46,129,0.07)] backdrop-blur-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
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
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[x.status] || statusTone.archived}`}
                    >
                      {statusLabel[x.status] || x.status}
                    </span>
                  </button>
                ))}
              </div>
              </div>
              <aside className="overflow-hidden rounded-3xl border border-primary-fixed-dim/60 bg-primary-fixed p-5 text-on-primary-fixed shadow-[0_12px_32px_rgba(49,46,129,0.08)] sm:p-6">
                <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 text-primary shadow-sm">monitoring</span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Estado operativo</p>
                <p className="mt-2 font-heading text-3xl font-extrabold">{(data?.suspendedBusinesses || 0) + (data?.expiredBusinesses || 0)}</p>
                <p className="mt-1 text-sm leading-6 text-on-primary-fixed/70">empresas requieren revisi&oacute;n por suspensi&oacute;n o vencimiento.</p>
                <div className="mt-6 grid gap-2">
                  <button className="inline-flex min-h-11 items-center justify-between rounded-xl bg-white px-3.5 text-sm font-bold text-primary transition hover:bg-primary-fixed-dim" onClick={() => setSection("businesses")} type="button">
                    Revisar empresas
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                  <button className="inline-flex min-h-11 items-center justify-between rounded-xl border border-primary/15 bg-white/45 px-3.5 text-sm font-bold text-on-primary-fixed transition hover:bg-white/70" onClick={() => navigate("/platform/billing?tab=requests")} type="button">
                    Suscripciones
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">workspace_premium</span>
                  </button>
                </div>
              </aside>
            </section>
          </>
        ) : null}
        {section === "businesses" ? (
          <section className="relative mt-5">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/80 p-3.5 shadow-[0_8px_26px_rgba(49,46,129,0.05)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-on-surface-variant">
                  {businesses.length} empresas visibles
                </p>
                <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant">
                  <input
                    checked={showArchived}
                    onChange={(event) => setShowArchived(event.target.checked)}
                    type="checkbox"
                  />
                  Mostrar archivadas
                </label>
              </div>
              <input
                className="min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none transition focus:border-primary sm:w-72"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar empresa o estado"
                value={query}
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((x) => (
                <button
                  className="group rounded-3xl border border-white/80 bg-white/85 p-4 text-left shadow-[0_8px_24px_rgba(49,46,129,0.05)] transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_16px_30px_rgba(49,46,129,0.12)]"
                  key={x.id}
                  onClick={() => open(x.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-fixed text-primary transition group-hover:scale-105">
                      store
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone[x.status] || statusTone.archived}`}
                    >
                      {statusLabel[x.status] || x.status}
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
                  {x.archivedAt ? (
                    <p className="mt-1 text-xs font-bold text-on-surface-variant">
                      Archivada {new Date(x.archivedAt).toLocaleDateString()}
                    </p>
                  ) : null}
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
            <BusinessTypeChanger
              business={detail.business}
              key={detail.business.id}
              onChanged={async () => {
                await load();
                await open(detail.business.id);
              }}
            />
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
                      {detail.subscription.diagnostics?.statusLabel || detail.subscription.status} ·{" "}
                      {formatCurrency(detail.subscription.plan.price)}/mes
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    {detail.subscription.status !== "active" ? (
                      <button
                        className="min-h-11 rounded-xl bg-primary px-3 text-sm font-bold text-white hover:bg-primary/90"
                        onClick={() => plan(detail.subscription.plan.code)}
                        type="button"
                      >
                        Reactivar acceso
                      </button>
                    ) : null}
                  </div>
                </div>
                <SubscriptionDiagnostics subscription={detail.subscription} />
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
                  {detail.business.archivedAt ? (
                    <button
                      className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
                      onClick={() => restore(detail.business.id)}
                      type="button"
                    >
                      Restaurar empresa
                    </button>
                  ) : (
                    <>
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
                      <button
                        className="rounded-xl border border-error px-3 py-2 text-sm font-bold text-error"
                        onClick={() => setArchiveTarget(detail.business)}
                        type="button"
                      >
                        Archivar empresa
                      </button>
                    </>
                  )}
                  <button
                    className="rounded-xl border border-error px-3 py-2 text-sm font-bold text-error"
                    onClick={() => setDeleteTarget(detail.business)}
                    type="button"
                  >
                    Eliminar permanentemente
                  </button>
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
                      <span className="flex flex-wrap justify-end gap-1">
                        {x.mustChangePassword ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">
                            Cambio pendiente
                          </span>
                        ) : null}
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                          {x.role}
                        </span>
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
                    {["admin_owner", "admin", "operator"].includes(x.role) ? (
                      <button
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 text-sm font-bold text-primary transition hover:border-primary hover:bg-primary-fixed disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!x.isActive}
                        onClick={() => setPasswordResetUser(x)}
                        title={
                          x.isActive
                            ? "Generar una contraseña temporal"
                            : "Reactiva al usuario antes de restablecer su contraseña"
                        }
                        type="button"
                      >
                        <span className="material-symbols-outlined text-lg">key</span>
                        Restablecer contraseña
                      </button>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : null}
      {detail && passwordResetUser ? (
        <AdminPasswordResetModal
          onClose={() => setPasswordResetUser(null)}
          onReset={async (reason) => {
            const result = await resetPlatformUserPassword(
              detail.business.id,
              passwordResetUser.id,
              reason,
            );
            setDetail((current) =>
              current
                ? {
                    ...current,
                    users: current.users.map((item) =>
                      item.id === passwordResetUser.id
                        ? { ...item, mustChangePassword: true }
                        : item,
                    ),
                  }
                : current,
            );
            return result;
          }}
          target={passwordResetUser}
        />
      ) : null}
      {archiveTarget ? (
        <ArchiveBusinessModal
          business={archiveTarget}
          onClose={() => setArchiveTarget(null)}
          onConfirm={archive}
          saving={archiveSaving}
        />
      ) : null}
      {deleteTarget ? (
        <DeleteBusinessModal
          business={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={permanentlyDelete}
          saving={deleteSaving}
        />
      ) : null}
    </div>
  );
}
