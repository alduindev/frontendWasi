import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import {
  createPlatformAddOn,
  createPlatformCoupon,
  createPlatformPlan,
  getPlatformAddOns,
  getPlatformCoupons,
  getPlatformModules,
  getPlatformPayments,
  getPlatformPlans,
  getPlatformSubscriptions,
  updatePlatformBusinessSubscription,
  updatePlatformPlan,
} from "../../services/platformService";
import SubscriptionDiagnostics from "../../components/platform/SubscriptionDiagnostics";

const field = "min-h-11 rounded-xl border border-outline-variant bg-white px-3";
const money = (value, currency = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
    Number(value || 0),
  );
const blank = {
  code: "",
  name: "",
  description: "",
  maxUsers: 2,
  maxOperators: 1,
  maxProducts: 100,
  maxBranches: 1,
  maxStorageMb: 100,
  maxImages: 100,
  maxMonthlyOperations: 500,
  trialDays: 14,
  graceDays: 5,
  includedModules: [],
  isCustom: false,
  isActive: true,
  sortOrder: 0,
  monthly: "0",
  annual: "0",
};
function PlanModal({ item, modules, onClose, onSaved }) {
  const [v, setV] = useState(
    item
      ? {
          ...blank,
          ...item,
          includedModules: item.includedModules || [],
          monthly:
            item.prices.find(
              (x) => x.currency === "PEN" && x.billingInterval === "monthly",
            )?.amount || 0,
          annual:
            item.prices.find(
              (x) => x.currency === "PEN" && x.billingInterval === "annual",
            )?.amount || 0,
        }
      : blank,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const change = (e) =>
    setV((x) => ({
      ...x,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const toggleModule = (code) =>
    setV((current) => ({
      ...current,
      includedModules: current.includedModules.includes(code)
        ? current.includedModules.filter((itemCode) => itemCode !== code)
        : [...current.includedModules, code],
    }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      code: v.code.toUpperCase(),
      name: v.name,
      description: v.description,
      maxUsers: Number(v.maxUsers),
      maxOperators: Number(v.maxOperators),
      maxProducts: Number(v.maxProducts),
      maxBranches: Number(v.maxBranches),
      maxStorageMb: Number(v.maxStorageMb),
      maxImages: Number(v.maxImages),
      maxMonthlyOperations: Number(v.maxMonthlyOperations),
      trialDays: Number(v.trialDays),
      graceDays: Number(v.graceDays),
      includedModules: v.includedModules || [],
      features: v.features || {},
      isCustom: v.isCustom,
      isActive: v.isActive,
      sortOrder: Number(v.sortOrder),
      prices: [
        {
          currency: "PEN",
          billingInterval: "monthly",
          amount: Number(v.monthly),
        },
        {
          currency: "PEN",
          billingInterval: "annual",
          amount: Number(v.annual),
        },
      ],
    };
    try {
      item
        ? await updatePlatformPlan(item.id, payload)
        : await createPlatformPlan(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={onClose} title={item ? "Editar plan" : "Crear plan"}>
      <form
        className="grid max-h-[80vh] gap-3 overflow-y-auto p-5 sm:grid-cols-2"
        onSubmit={submit}
      >
        {error ? (
          <p className="rounded-xl bg-error-container p-3 text-error sm:col-span-2">
            {error}
          </p>
        ) : null}
        <label className="grid gap-1 text-sm font-bold">
          Código
          <input
            className={field}
            disabled={Boolean(item)}
            name="code"
            onChange={change}
            required
            value={v.code}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Nombre
          <input
            className={field}
            name="name"
            onChange={change}
            required
            value={v.name}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold sm:col-span-2">
          Descripción
          <textarea
            className="min-h-20 rounded-xl border border-outline-variant p-3"
            name="description"
            onChange={change}
            value={v.description}
          />
        </label>
        <fieldset className="rounded-2xl border border-outline-variant p-4 sm:col-span-2">
          <legend className="px-1 text-sm font-bold">Módulos incluidos</legend>
          <p className="mb-3 text-xs text-on-surface-variant">
            Selecciona los módulos que este plan puede usar. Sin selecciones, el plan no restringe módulos y conserva todos los habilitados para el negocio.
          </p>
          {modules.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {modules
                .filter((module) => module.status === "active")
                .map((module) => (
                  <label className="flex gap-2 rounded-xl border border-outline-variant p-3 text-sm" key={module.id}>
                    <input
                      checked={v.includedModules.includes(module.code)}
                      onChange={() => toggleModule(module.code)}
                      type="checkbox"
                    />
                    <span>
                      <b className="block">{module.name}</b>
                      <code className="text-xs text-on-surface-variant">{module.code}</code>
                    </span>
                  </label>
                ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">No hay módulos activos disponibles para asignar.</p>
          )}
        </fieldset>
        {[
          ["maxUsers", "Usuarios"],
          ["maxOperators", "Operarios"],
          ["maxBranches", "Locales"],
          ["maxProducts", "Productos"],
          ["maxMonthlyOperations", "Operaciones/mes"],
          ["maxStorageMb", "Almacenamiento MB"],
          ["trialDays", "Días de prueba"],
          ["graceDays", "Días de gracia"],
        ].map(([name, label]) => (
          <label className="grid gap-1 text-sm font-bold" key={name}>
            {label}
            <input
              className={field}
              min="0"
              name={name}
              onChange={change}
              required
              type="number"
              value={v[name]}
            />
          </label>
        ))}
        <label className="grid gap-1 text-sm font-bold">
          Precio mensual PEN
          <input
            className={field}
            min="0"
            name="monthly"
            onChange={change}
            step="0.01"
            type="number"
            value={v.monthly}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Precio anual PEN
          <input
            className={field}
            min="0"
            name="annual"
            onChange={change}
            step="0.01"
            type="number"
            value={v.annual}
          />
        </label>
        <label className="flex gap-2 text-sm font-bold">
          <input
            checked={v.isActive}
            name="isActive"
            onChange={change}
            type="checkbox"
          />
          Plan activo
        </label>
        <label className="flex gap-2 text-sm font-bold">
          <input
            checked={v.isCustom}
            name="isCustom"
            onChange={change}
            type="checkbox"
          />
          Cotización personalizada
        </label>
        <div className="sticky bottom-0 flex justify-end gap-2 bg-white py-3 sm:col-span-2">
          <button
            className="min-h-11 rounded-xl border px-4 font-bold"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="min-h-11 rounded-xl bg-primary px-5 font-bold text-white"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar plan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const toDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};
const toApiDate = (value) => (value ? new Date(value).toISOString() : null);
const futureDateInput = (days) =>
  toDateTimeInput(new Date(Date.now() + days * 86_400_000).toISOString());
const subscriptionStatuses = [
  ["active", "Activa, sin prueba"],
  ["trialing", "En prueba"],
  ["grace_period", "Período de gracia"],
  ["past_due", "Pago vencido"],
  ["pending_payment", "Pago pendiente"],
  ["incomplete", "Incompleta"],
  ["suspended", "Suspendida"],
  ["canceled", "Cancelada"],
  ["expired", "Vencida"],
];

function SubscriptionEditorModal({ subscription, plans, onClose, onSaved }) {
  const currentPlan = plans.find((plan) => plan.code === subscription.plan.code);
  const initialStatus = subscription.status === "trial" ? "trialing" : subscription.status;
  const [v, setV] = useState({
    planCode: subscription.plan.code,
    status: initialStatus,
    billingInterval: subscription.billingInterval || "monthly",
    currentPeriodStart:
      toDateTimeInput(subscription.currentPeriodStart) || toDateTimeInput(new Date()),
    currentPeriodEnd:
      toDateTimeInput(subscription.currentPeriodEnd) || futureDateInput(30),
    nextBillingAt:
      toDateTimeInput(subscription.nextBillingAt) || futureDateInput(30),
    trialEndsAt:
      toDateTimeInput(subscription.trialEndsAt) ||
      futureDateInput(Math.max(currentPlan?.trialDays || 0, 1)),
    graceEndsAt:
      toDateTimeInput(subscription.graceEndsAt) ||
      futureDateInput(Math.max(currentPlan?.graceDays || 0, 1)),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedPlan = plans.find((plan) => plan.code === v.planCode) || currentPlan;
  const update = (event) =>
    setV((current) => ({ ...current, [event.target.name]: event.target.value }));
  const activateWithoutTrial = () => {
    const periodDays = v.billingInterval === "annual" ? 365 : 30;
    setV((current) => ({
      ...current,
      status: "active",
      currentPeriodStart: toDateTimeInput(new Date()),
      currentPeriodEnd: futureDateInput(periodDays),
      nextBillingAt: futureDateInput(periodDays),
      trialEndsAt: "",
      graceEndsAt: "",
    }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updatePlatformBusinessSubscription(subscription.business.id, {
        planCode: v.planCode,
        status: v.status,
        billingInterval: v.billingInterval,
        currentPeriodStart: toApiDate(v.currentPeriodStart),
        currentPeriodEnd: toApiDate(v.currentPeriodEnd),
        nextBillingAt: toApiDate(v.nextBillingAt),
        trialEndsAt: toApiDate(v.trialEndsAt),
        graceEndsAt: toApiDate(v.graceEndsAt),
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const includedModules = selectedPlan?.includedModules || [];
  const statusMessage =
    v.status === "active"
      ? "Al guardar se elimina la prueba y la empresa queda operativa con los límites y módulos del plan elegido."
      : v.status === "trialing"
        ? "La prueba se usa solo si la eliges expresamente. Define su fecha de fin."
        : "El estado seleccionado se aplicará de inmediato y quedará registrado en el historial.";
  return (
    <Modal onClose={onClose} title={`Editar suscripción · ${subscription.business.name}`}>
      <form className="grid max-h-[80vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2" onSubmit={submit}>
        {error ? <p className="rounded-xl bg-error-container p-3 text-error sm:col-span-2">{error}</p> : null}
        <div className="rounded-2xl bg-primary-fixed p-4 text-sm sm:col-span-2">
          <b className="block text-primary">Control administrativo</b>
          <p className="mt-1">{statusMessage}</p>
          <button className="mt-3 min-h-10 rounded-xl bg-primary px-4 font-bold text-white" onClick={activateWithoutTrial} type="button">
            Activar sin prueba desde hoy
          </button>
        </div>
        <label className="grid gap-1 text-sm font-bold">
          Plan
          <select className={field} name="planCode" onChange={update} value={v.planCode}>
            {plans
              .filter((plan) => plan.isActive || plan.code === subscription.plan.code)
              .map((plan) => <option key={plan.id} value={plan.code}>{plan.name} · {plan.code}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Estado de suscripción
          <select className={field} name="status" onChange={update} value={v.status}>
            {subscriptionStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Ciclo de cobro
          <select className={field} name="billingInterval" onChange={update} value={v.billingInterval}>
            <option value="monthly">Mensual</option>
            <option value="annual">Anual</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Inicio del período
          <input className={field} name="currentPeriodStart" onChange={update} required type="datetime-local" value={v.currentPeriodStart} />
        </label>
        {v.status === "trialing" ? (
          <label className="grid gap-1 text-sm font-bold">
            Fin de prueba
            <input className={field} name="trialEndsAt" onChange={update} required type="datetime-local" value={v.trialEndsAt} />
          </label>
        ) : (
          <label className="grid gap-1 text-sm font-bold">
            Fin del período
            <input className={field} name="currentPeriodEnd" onChange={update} required type="datetime-local" value={v.currentPeriodEnd} />
          </label>
        )}
        {v.status !== "trialing" ? (
          <label className="grid gap-1 text-sm font-bold">
            Próximo cobro
            <input className={field} name="nextBillingAt" onChange={update} type="datetime-local" value={v.nextBillingAt} />
          </label>
        ) : null}
        {v.status === "grace_period" ? (
          <label className="grid gap-1 text-sm font-bold">
            Fin de gracia
            <input className={field} name="graceEndsAt" onChange={update} required type="datetime-local" value={v.graceEndsAt} />
          </label>
        ) : null}
        <aside className="rounded-2xl border border-outline-variant p-4 text-sm sm:col-span-2">
          <b>Accesos y límites que se aplicarán</b>
          <p className="mt-1 text-on-surface-variant">
            {includedModules.length
              ? `Módulos: ${includedModules.join(", ")}`
              : "Módulos: todos los habilitados para este tipo de negocio."}
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">
            {selectedPlan?.maxUsers ?? 0} usuarios · {selectedPlan?.maxOperators ?? 0} operarios · {selectedPlan?.maxBranches ?? 0} locales · {selectedPlan?.maxProducts ?? 0} productos · {selectedPlan?.maxMonthlyOperations ?? 0} operaciones/mes
          </p>
        </aside>
        <div className="sticky bottom-0 flex justify-end gap-2 bg-white py-3 sm:col-span-2">
          <button className="min-h-11 rounded-xl border px-4 font-bold" onClick={onClose} type="button">Cancelar</button>
          <button className="min-h-11 rounded-xl bg-primary px-5 font-bold text-white disabled:opacity-50" disabled={saving}>
            {saving ? "Guardando..." : "Guardar suscripción"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function QuickCreate({ type, onClose, onSaved }) {
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      if (type === "addon")
        await createPlatformAddOn({
          code: f.get("code"),
          name: f.get("name"),
          description: f.get("description"),
          kind: "capacity",
          billingType: "recurring",
          unitKey: "unidad",
          limits: { [f.get("metric")]: Number(f.get("quantity")) },
          compatiblePlanCodes: [],
          compatibleBusinessTypeIds: [],
          status: "active",
          prices: [
            {
              currency: "PEN",
              billingInterval: "monthly",
              amount: Number(f.get("monthly")),
            },
            {
              currency: "PEN",
              billingInterval: "annual",
              amount: Number(f.get("annual")),
            },
          ],
        });
      else
        await createPlatformCoupon({
          code: f.get("code").toUpperCase(),
          name: f.get("name"),
          discountType: f.get("discountType"),
          discountValue: Number(f.get("value")),
          currency: "PEN",
          compatiblePlanCodes: [],
          status: "active",
        });
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Modal
      onClose={onClose}
      title={type === "addon" ? "Nuevo complemento" : "Nuevo cupón"}
    >
      <form className="grid gap-3 p-5" onSubmit={submit}>
        {error ? (
          <p className="rounded-xl bg-error-container p-3 text-error">
            {error}
          </p>
        ) : null}
        <input className={field} name="code" placeholder="Código" required />
        <input className={field} name="name" placeholder="Nombre" required />
        {type === "addon" ? (
          <>
            <textarea
              className="rounded-xl border p-3"
              name="description"
              placeholder="Descripción"
            />
            <select className={field} name="metric">
              <option value="users">Usuarios adicionales</option>
              <option value="operators">Operarios adicionales</option>
              <option value="locations">Locales adicionales</option>
              <option value="storage_mb">Almacenamiento adicional</option>
              <option value="operations">Operaciones adicionales</option>
            </select>
            <input
              className={field}
              min="1"
              name="quantity"
              placeholder="Cantidad incluida"
              required
              type="number"
            />
            <input
              className={field}
              min="0"
              name="monthly"
              placeholder="Precio mensual PEN"
              step=".01"
              type="number"
            />
            <input
              className={field}
              min="0"
              name="annual"
              placeholder="Precio anual PEN"
              step=".01"
              type="number"
            />
          </>
        ) : (
          <>
            <select className={field} name="discountType">
              <option value="percent">Porcentaje</option>
              <option value="fixed">Monto fijo</option>
            </select>
            <input
              className={field}
              min="0.01"
              name="value"
              placeholder="Valor del descuento"
              step=".01"
              type="number"
            />
          </>
        )}
        <button className="min-h-11 rounded-xl bg-primary px-4 font-bold text-white">
          Crear
        </button>
      </form>
    </Modal>
  );
}
export default function PlatformBilling() {
  const [tab, setTab] = useState("subscriptions");
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [modules, setModules] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [subscriptionQuery, setSubscriptionQuery] = useState("");
  const load = useCallback(async () => {
    try {
      const [p, a, c, s, pay, m] = await Promise.all([
        getPlatformPlans(),
        getPlatformAddOns(),
        getPlatformCoupons(),
        getPlatformSubscriptions(),
        getPlatformPayments(),
        getPlatformModules(),
      ]);
      setPlans(p);
      setAddons(a);
      setCoupons(c);
      setSubscriptions(s);
      setPayments(pay);
      setModules(m);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const done = () => {
    setModal(null);
    load();
  };
  const normalizedSubscriptionQuery = subscriptionQuery.trim().toLowerCase();
  const visibleSubscriptions = subscriptions.filter((subscription) =>
    !normalizedSubscriptionQuery ||
    `${subscription.business.name} ${subscription.plan.name} ${subscription.status} ${subscription.diagnostics?.reasonCode || ""}`
      .toLowerCase()
      .includes(normalizedSubscriptionQuery),
  );
  const tabs = [
    ["plans", "Planes"],
    ["addons", "Complementos"],
    ["coupons", "Cupones"],
    ["subscriptions", "Suscripciones"],
    ["payments", "Pagos"],
  ];
  return (
    <main className="min-h-svh bg-background p-4 sm:p-7">
      <div className="mx-auto max-w-7xl">
        <Link className="font-bold text-primary" to="/platform">
          ← Plataforma
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              SUPER ADMIN
            </p>
            <h1 className="font-heading text-3xl font-bold">
              Monetización y suscripciones
            </h1>
            <p className="mt-1 text-on-surface-variant">
              Catálogo, capacidad, promociones, cobros y trazabilidad.
            </p>
          </div>
          {tab === "plans" ? (
            <button
              className="rounded-xl bg-primary px-4 py-3 font-bold text-white"
              onClick={() => setModal({ type: "plan" })}
            >
              + Crear plan
            </button>
          ) : tab === "addons" ? (
            <button
              className="rounded-xl bg-primary px-4 py-3 font-bold text-white"
              onClick={() => setModal({ type: "addon" })}
            >
              + Complemento
            </button>
          ) : tab === "coupons" ? (
            <button
              className="rounded-xl bg-primary px-4 py-3 font-bold text-white"
              onClick={() => setModal({ type: "coupon" })}
            >
              + Cupón
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="mt-5 rounded-xl bg-error-container p-4 text-error">
            {error}
          </p>
        ) : null}
        <nav className="mt-6 flex gap-2 overflow-x-auto">
          {tabs.map(([id, label]) => (
            <button
              className={`min-h-11 whitespace-nowrap rounded-xl px-4 font-bold ${tab === id ? "bg-primary text-white" : "border border-outline-variant bg-white"}`}
              key={id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "plans" ? (
          <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((x) => (
              <article
                className="rounded-2xl border border-outline-variant bg-white p-5"
                key={x.id}
              >
                <div className="flex justify-between">
                  <b>{x.code}</b>
                  <span className="text-xs">
                    {x.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold">{x.name}</h2>
                <p className="mt-2 min-h-12 text-sm text-on-surface-variant">
                  {x.description}
                </p>
                <div className="mt-3 grid gap-1 text-sm">
                  {x.prices.map((p) => (
                    <p className="flex justify-between" key={p.id}>
                      <span>{p.billingInterval}</span>
                      <b>{money(p.amount, p.currency)}</b>
                    </p>
                  ))}
                </div>
                <p className="mt-4 text-xs">
                  {x.maxUsers} usuarios · {x.maxBranches} locales ·{" "}
                  {x.maxMonthlyOperations} operaciones
                </p>
                <button
                  className="mt-4 min-h-10 w-full rounded-xl border font-bold text-primary"
                  onClick={() => setModal({ type: "plan", item: x })}
                >
                  Editar
                </button>
              </article>
            ))}
          </section>
        ) : null}
        {tab === "addons" ? (
          <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {addons.map((x) => (
              <article className="rounded-2xl border bg-white p-5" key={x.id}>
                <b>{x.name}</b>
                <p className="text-xs text-primary">{x.code}</p>
                <p className="mt-2 text-sm">{x.description}</p>
                <pre className="mt-3 overflow-auto rounded-xl bg-surface-container p-2 text-xs">
                  {JSON.stringify(x.limits)}
                </pre>
              </article>
            ))}
          </section>
        ) : null}
        {tab === "coupons" ? (
          <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {coupons.map((x) => (
              <article className="rounded-2xl border bg-white p-5" key={x.id}>
                <b>
                  {x.code} · {x.name}
                </b>
                <p className="mt-2 text-primary">
                  {x.discountType === "percent"
                    ? `${x.discountValue}%`
                    : money(x.discountValue, x.currency)}
                </p>
                <p className="text-xs">
                  Usado {x.redeemedCount}
                  {x.maxRedemptions ? ` / ${x.maxRedemptions}` : ""}
                </p>
              </article>
            ))}
          </section>
        ) : null}
        {tab === "subscriptions" ? (
          <section className="mt-5 grid gap-3">
            <header className="rounded-2xl border border-outline-variant bg-white p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-bold">
                    Diagnóstico global de suscripciones
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Revisa fechas, causa de bloqueo, eventos, pagos y aplica o reactiva un plan sin salir de Plataforma.
                  </p>
                </div>
                <label className="grid gap-1 text-sm font-bold">
                  Buscar empresa o estado
                  <input
                    className={field}
                    onChange={(event) => setSubscriptionQuery(event.target.value)}
                    placeholder="Hotel, STARTER, pago vencido..."
                    value={subscriptionQuery}
                  />
                </label>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">
                Mostrando {visibleSubscriptions.length} de {subscriptions.length} suscripciones.
              </p>
            </header>
            {visibleSubscriptions.map((x) => (
                <article className="rounded-2xl border bg-white p-4" key={x.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <b>{x.business.name}</b>
                      <p className="text-sm text-on-surface-variant">
                        {x.plan.name} · {x.billingInterval}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                      {x.diagnostics?.statusLabel || x.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <button
                      className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white"
                      onClick={() => setModal({ type: "subscription", item: x })}
                      type="button"
                    >
                      Editar suscripción
                    </button>
                  </div>
                  <SubscriptionDiagnostics subscription={x} />
                </article>
              ))}
            {!visibleSubscriptions.length ? (
              <p className="rounded-2xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
                No hay suscripciones que coincidan con la búsqueda.
              </p>
            ) : null}
          </section>
        ) : null}
        {tab === "payments" ? (
          <section className="mt-5 grid gap-3">
            {payments.map((x) => (
              <article
                className="flex flex-wrap justify-between gap-3 rounded-2xl border bg-white p-4"
                key={x.id}
              >
                <div>
                  <b>{x.externalReference || x.id}</b>
                  <p className="text-xs">
                    {x.provider} · {x.status} ·{" "}
                    {new Date(x.createdAt).toLocaleString()}
                  </p>
                </div>
                <b>{money(x.amount, x.currency)}</b>
              </article>
            ))}
          </section>
        ) : null}
      </div>
      {modal?.type === "plan" ? (
        <PlanModal
          item={modal.item}
          modules={modules}
          onClose={() => setModal(null)}
          onSaved={done}
        />
      ) : null}
      {modal?.type === "subscription" ? (
        <SubscriptionEditorModal
          onClose={() => setModal(null)}
          onSaved={done}
          plans={plans}
          subscription={modal.item}
        />
      ) : null}
      {["addon", "coupon"].includes(modal?.type) ? (
        <QuickCreate
          onClose={() => setModal(null)}
          onSaved={done}
          type={modal.type}
        />
      ) : null}
    </main>
  );
}
