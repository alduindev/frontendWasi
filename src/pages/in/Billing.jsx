import { useCallback, useEffect, useState } from "react";
import Card from "../../components/atoms/Card";
import Button from "../../components/atoms/Button";
import DashboardShell from "../../components/organisms/DashboardShell";
import Modal from "../../components/ui/Modal";
import { getPlans } from "../../services/platformService";
import {
  cancelSubscription,
  createSubscriptionCheckout,
  getSubscription,
  getUsage,
  reactivateSubscription,
} from "../../services/billingService";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";

const money = (value, currency = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
    Number(value || 0),
  );
const date = (value) =>
  value ? new Date(value).toLocaleDateString("es-PE") : "Sin fecha";
const stateLabel = {
  trialing: "Prueba activa",
  active: "Activa",
  past_due: "Pago vencido",
  grace_period: "Periodo de gracia",
  suspended: "Suspendida",
  canceled: "Cancelada",
  expired: "Vencida",
  pending_payment: "Pago pendiente",
  incomplete: "Incompleta",
};
function Meter({ label, value, max }) {
  const percentage = Math.min(
    100,
    Math.round((Number(value) / Math.max(Number(max), 1)) * 100),
  );
  const warning = percentage >= 80;
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <b className={warning ? "text-amber-700" : ""}>
          {value} / {max}
        </b>
      </div>
      <div className="mt-2 h-2 rounded-full bg-surface-container-high">
        <div
          className={`h-full rounded-full ${warning ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {warning ? (
        <p className="mt-1 text-xs font-bold text-amber-700">
          Consumo alto. Revisa opciones antes de alcanzar el límite.
        </p>
      ) : null}
    </div>
  );
}
function ChoosePlan({ current, onClose, onCreated, plans }) {
  const [interval, setInterval] = useState(current.billingInterval);
  const [planCode, setPlanCode] = useState(current.plan.code);
  const [coupon, setCoupon] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = plans.find((x) => x.code === planCode);
  const price = selected?.prices?.find(
    (x) => x.currency === "PEN" && x.billingInterval === interval,
  );
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const order = await createSubscriptionCheckout({
        planCode,
        billingInterval: interval,
        provider: "manual",
        couponCode: coupon,
      });
      onCreated(order);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={onClose} title="Cambiar plan o periodicidad">
      <div className="grid gap-4 p-5">
        {error ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-2 rounded-xl bg-surface-container p-1">
          <button
            className={`min-h-10 rounded-lg font-bold ${interval === "monthly" ? "bg-white text-primary" : ""}`}
            onClick={() => setInterval("monthly")}
            type="button"
          >
            Mensual
          </button>
          <button
            className={`min-h-10 rounded-lg font-bold ${interval === "annual" ? "bg-white text-primary" : ""}`}
            onClick={() => setInterval("annual")}
            type="button"
          >
            Anual
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {plans
            .filter((x) => !x.isCustom)
            .map((plan) => (
              <button
                className={`min-w-52 rounded-2xl border p-4 text-left ${planCode === plan.code ? "border-primary bg-primary-fixed" : "border-outline-variant"}`}
                key={plan.id}
                onClick={() => setPlanCode(plan.code)}
                type="button"
              >
                <b>{plan.name}</b>
                <p className="mt-2 text-xl font-bold text-primary">
                  {money(
                    plan.prices?.find(
                      (x) =>
                        x.currency === "PEN" && x.billingInterval === interval,
                    )?.amount,
                  )}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {plan.maxUsers} usuarios · {plan.maxBranches} locales
                </p>
              </button>
            ))}
        </div>
        <label className="grid gap-1 text-sm font-bold">
          Cupón (opcional)
          <input
            className="min-h-11 rounded-xl border border-outline-variant px-3 uppercase"
            onChange={(e) => setCoupon(e.target.value)}
            value={coupon}
          />
        </label>
        <Card className="p-4">
          <p className="flex justify-between">
            <span>{selected?.name}</span>
            <b>{money(price?.amount, price?.currency)}</b>
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">
            Se crea una orden; el cambio se activa únicamente después de que el
            backend confirme el pago.
          </p>
        </Card>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cerrar
          </Button>
          <Button disabled={saving} onClick={submit} type="button">
            {saving ? "Creando orden..." : "Crear orden de cambio"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Billing() {
  const [sub, setSub] = useState(null);
  const [usage, setUsage] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("summary");
  const [choose, setChoose] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, p] = await Promise.all([
        getSubscription(),
        getUsage(),
        getPlans(),
      ]);
      setSub(s);
      setUsage(u);
      setPlans(p);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(load, ["/subscription", "/billing"]);
  const cancel = async () => {
    if (
      !confirm(
        `La cancelación será efectiva al terminar tu periodo (${date(sub.currentPeriodEnd || sub.trialEndsAt)}). ¿Continuar?`,
      )
    )
      return;
    await cancelSubscription();
    load();
  };
  const reactivate = async () => {
    await reactivateSubscription();
    load();
  };
  const tabs = [
    ["summary", "Resumen"],
    ["usage", "Consumo"],
    ["payments", "Pagos"],
    ["history", "Historial"],
  ];
  return (
    <DashboardShell
      title="Suscripción y facturación"
      subtitle="Plan, consumo, renovaciones y pagos en un solo lugar."
    >
      {error ? (
        <Card className="border-error p-4 text-error">{error}</Card>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl bg-primary-fixed p-3 text-sm font-bold text-on-primary-fixed">
          {message}
        </p>
      ) : null}
      {loading ? <Card className="h-44 animate-pulse" /> : null}
      {sub && usage ? (
        <>
          <Card className="mb-4 overflow-hidden">
            <div
              className={`p-5 ${["past_due", "grace_period", "suspended"].includes(sub.status) ? "bg-amber-100" : "bg-primary"} ${["past_due", "grace_period", "suspended"].includes(sub.status) ? "text-amber-950" : "text-white"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest">
                    {stateLabel[sub.status] || sub.status}
                  </p>
                  <h2 className="mt-1 font-heading text-3xl font-bold">
                    {sub.plan.name}
                  </h2>
                  <p className="mt-1 text-sm opacity-80">
                    {sub.billingInterval === "annual"
                      ? "Facturación anual"
                      : "Facturación mensual"}{" "}
                    · próxima fecha {date(sub.nextBillingAt || sub.trialEndsAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setChoose(true)}
                    type="button"
                    variant="secondary"
                  >
                    Mejorar o cambiar
                  </Button>
                  {sub.cancelAtPeriodEnd ? (
                    <Button
                      onClick={reactivate}
                      type="button"
                      variant="secondary"
                    >
                      Conservar suscripción
                    </Button>
                  ) : (
                    <Button onClick={cancel} type="button" variant="ghost">
                      Cancelar al finalizar
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto border-t border-outline-variant p-2">
              {tabs.map(([id, label]) => (
                <button
                  className={`min-h-10 whitespace-nowrap rounded-lg px-4 text-sm font-bold ${tab === id ? "bg-primary-fixed text-primary" : "text-on-surface-variant"}`}
                  key={id}
                  onClick={() => setTab(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </nav>
          </Card>
          {tab === "summary" ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <Card className="p-5">
                <h3 className="font-heading text-xl font-bold">
                  Incluido en tu plan
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <p className="rounded-xl bg-surface-container p-3">
                    <b>{sub.plan.maxUsers}</b>
                    <span className="block text-xs">usuarios</span>
                  </p>
                  <p className="rounded-xl bg-surface-container p-3">
                    <b>{sub.plan.maxBranches}</b>
                    <span className="block text-xs">locales</span>
                  </p>
                  <p className="rounded-xl bg-surface-container p-3">
                    <b>{sub.plan.maxMonthlyOperations}</b>
                    <span className="block text-xs">operaciones/mes</span>
                  </p>
                  <p className="rounded-xl bg-surface-container p-3">
                    <b>{sub.plan.maxStorageMb} MB</b>
                    <span className="block text-xs">almacenamiento</span>
                  </p>
                </div>
                <h3 className="mt-6 font-bold">Módulos y complementos</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sub.plan.includedModules?.length ? (
                    sub.plan.includedModules.map((x) => (
                      <span
                        className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold"
                        key={x}
                      >
                        {x}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-on-surface-variant">
                      Módulos del rubro disponibles según configuración.
                    </span>
                  )}
                  {sub.items.map((x) => (
                    <span
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold"
                      key={x.id}
                    >
                      {x.code} × {x.quantity}
                    </span>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <span className="material-symbols-outlined text-4xl text-primary">
                  event
                </span>
                <h3 className="mt-3 text-lg font-bold">Ciclo actual</h3>
                <p className="mt-3 text-sm text-on-surface-variant">
                  Inicio: {date(sub.currentPeriodStart)}
                </p>
                <p className="text-sm text-on-surface-variant">
                  Fin: {date(sub.currentPeriodEnd || sub.trialEndsAt)}
                </p>
                {sub.cancelAtPeriodEnd ? (
                  <p className="mt-4 rounded-xl bg-amber-100 p-3 text-sm font-bold text-amber-900">
                    Cancelación programada. Mantienes acceso hasta la fecha
                    indicada.
                  </p>
                ) : null}
              </Card>
            </div>
          ) : null}
          {tab === "usage" ? (
            <Card className="grid gap-5 p-5 sm:grid-cols-2">
              <Meter
                label="Usuarios"
                max={usage.maxUsers}
                value={usage.users}
              />
              <Meter
                label="Operarios"
                max={usage.maxOperators}
                value={usage.operators}
              />
              <Meter
                label="Locales"
                max={usage.maxBranches}
                value={usage.locations}
              />
              <Meter
                label="Operaciones del mes"
                max={usage.maxMonthlyOperations}
                value={usage.operations}
              />
              <Meter
                label="Productos"
                max={usage.maxProducts}
                value={usage.products}
              />
              <Meter
                label="Imágenes"
                max={usage.maxImages}
                value={usage.images}
              />
              <Meter
                label="Almacenamiento MB"
                max={usage.maxStorageMb}
                value={usage.storageMb}
              />
            </Card>
          ) : null}
          {tab === "payments" ? (
            <div className="grid gap-3">
              {sub.payments.length ? (
                sub.payments.map((x) => (
                  <Card
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                    key={x.id}
                  >
                    <div>
                      <b>
                        {x.provider} · {x.status}
                      </b>
                      <p className="text-xs text-on-surface-variant">
                        {new Date(x.createdAt).toLocaleString("es-PE")} ·{" "}
                        {x.externalReference}
                      </p>
                    </div>
                    <b className="text-primary">
                      {money(x.amount, x.currency)}
                    </b>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center text-on-surface-variant">
                  Todavía no hay intentos de pago.
                </Card>
              )}
              {sub.invoices.map((x) => (
                <Card className="flex justify-between p-4" key={x.id}>
                  <span>
                    Comprobante {x.number} · {x.status}
                  </span>
                  <b>{money(x.total, x.currency)}</b>
                </Card>
              ))}
            </div>
          ) : null}
          {tab === "history" ? (
            <div className="grid gap-3">
              {sub.events.length ? (
                sub.events.map((x) => (
                  <Card className="p-4" key={x.id}>
                    <div className="flex justify-between gap-3">
                      <b>{x.eventType.replaceAll("_", " ")}</b>
                      <time className="text-xs text-on-surface-variant">
                        {new Date(x.createdAt).toLocaleString("es-PE")}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {x.fromStatus && `${x.fromStatus} → `}
                      {x.toStatus}
                    </p>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  Sin eventos registrados.
                </Card>
              )}
            </div>
          ) : null}
        </>
      ) : null}
      {choose && sub ? (
        <ChoosePlan
          current={sub}
          onClose={() => setChoose(false)}
          onCreated={(order) => {
            setChoose(false);
            setMessage(
              `Orden ${order.externalReference} creada por ${money(order.amount, order.currency)}. Pendiente de confirmación.`,
            );
            load();
          }}
          plans={plans}
        />
      ) : null}
    </DashboardShell>
  );
}
