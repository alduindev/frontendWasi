import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import {
  createPlatformAddOn,
  createPlatformCoupon,
  createPlatformPlan,
  getPlatformAddOns,
  getPlatformCoupons,
  getPlatformPayments,
  getPlatformPlans,
  getPlatformSubscriptions,
  updatePlatformPlan,
} from "../../services/platformService";

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
  isCustom: false,
  isActive: true,
  sortOrder: 0,
  monthly: "0",
  annual: "0",
};
function PlanModal({ item, onClose, onSaved }) {
  const [v, setV] = useState(
    item
      ? {
          ...blank,
          ...item,
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
  const [tab, setTab] = useState("plans");
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [p, a, c, s, pay] = await Promise.all([
        getPlatformPlans(),
        getPlatformAddOns(),
        getPlatformCoupons(),
        getPlatformSubscriptions(),
        getPlatformPayments(),
      ]);
      setPlans(p);
      setAddons(a);
      setCoupons(c);
      setSubscriptions(s);
      setPayments(pay);
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
            {subscriptions.map((x) => (
              <article
                className="flex flex-wrap justify-between gap-3 rounded-2xl border bg-white p-4"
                key={x.id}
              >
                <div>
                  <b>{x.business.name}</b>
                  <p className="text-sm">
                    {x.plan.name} · {x.billingInterval}
                  </p>
                </div>
                <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold">
                  {x.status}
                </span>
              </article>
            ))}
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
          onClose={() => setModal(null)}
          onSaved={done}
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
