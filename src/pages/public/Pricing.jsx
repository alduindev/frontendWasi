import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/public/PublicLayout";
import { getPlans } from "../../services/platformService";
import { getAddOns } from "../../services/billingService";

const money = (value, currency = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
    Number(value || 0),
  );
const priceOf = (plan, interval, currency = "PEN") =>
  plan.prices?.find(
    (x) =>
      x.billingInterval === interval && x.currency === currency && x.isActive,
  );
const Feature = ({ icon = "check_circle", children }) => (
  <li className="flex gap-2 text-sm text-on-surface-variant">
    <span className="material-symbols-outlined text-lg text-primary">
      {icon}
    </span>
    {children}
  </li>
);

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [interval, setInterval] = useState("monthly");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([getPlans(), getAddOns()])
      .then(([p, a]) => {
        setPlans(p);
        setAddons(a);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const savings = useMemo(
    () =>
      Object.fromEntries(
        plans.map((plan) => {
          const m = priceOf(plan, "monthly"),
            a = priceOf(plan, "annual");
          return [
            plan.id,
            m && a && Number(m.amount) > 0
              ? Math.max(
                  0,
                  Math.round(
                    (1 - Number(a.amount) / (Number(m.amount) * 12)) * 100,
                  ),
                )
              : 0,
          ];
        }),
      ),
    [plans],
  );
  return (
    <PublicLayout>
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-primary">
            Planes configurables
          </p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold sm:text-5xl">
            Paga por capacidad, no por tu rubro
          </h1>
          <p className="mt-4 leading-7 text-on-surface-variant">
            Tu tipo de negocio define los módulos compatibles. El plan define
            usuarios, locales, operación, almacenamiento y soporte.
          </p>
          <div className="mx-auto mt-7 grid max-w-sm grid-cols-2 rounded-2xl border border-outline-variant bg-white p-1">
            <button
              className={`min-h-11 rounded-xl font-bold ${interval === "monthly" ? "bg-primary text-white" : ""}`}
              onClick={() => setInterval("monthly")}
              type="button"
            >
              Mensual
            </button>
            <button
              className={`min-h-11 rounded-xl font-bold ${interval === "annual" ? "bg-primary text-white" : ""}`}
              onClick={() => setInterval("annual")}
              type="button"
            >
              Anual
            </button>
          </div>
        </header>
        {error ? (
          <p className="mt-8 rounded-2xl bg-error-container p-4 text-center text-on-error-container">
            {error}
          </p>
        ) : null}
        {loading ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((x) => (
              <div
                className="h-96 animate-pulse rounded-3xl bg-white"
                key={x}
              />
            ))}
          </div>
        ) : null}
        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const price = priceOf(plan, interval);
            const monthly =
              interval === "annual" && price
                ? Number(price.amount) / 12
                : Number(price?.amount || 0);
            return (
              <article
                className={`flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${plan.code === "BUSINESS" ? "border-primary ring-2 ring-primary/10" : "border-outline-variant"}`}
                key={plan.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      {plan.code}
                    </p>
                    <h2 className="mt-1 font-heading text-2xl font-bold">
                      {plan.name}
                    </h2>
                  </div>
                  {plan.isCustom ? (
                    <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold">
                      A medida
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-on-surface-variant">
                  {plan.description}
                </p>
                <div className="mt-5">
                  <p className="text-3xl font-extrabold text-primary">
                    {plan.isCustom
                      ? "Cotizar"
                      : money(monthly, price?.currency)}
                    <span className="text-sm font-normal text-on-surface-variant">
                      {plan.isCustom ? "" : " /mes"}
                    </span>
                  </p>
                  {interval === "annual" && !plan.isCustom ? (
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      {money(price?.amount, price?.currency)} al año · ahorra{" "}
                      {savings[plan.id]}%
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-on-surface-variant">
                    Prueba de {plan.trialDays} días · gracia {plan.graceDays}{" "}
                    días
                  </p>
                </div>
                <ul className="mt-6 grid flex-1 gap-3">
                  <Feature>
                    {plan.maxUsers} usuarios ({plan.maxOperators} operarios)
                  </Feature>
                  <Feature icon="storefront">
                    {plan.maxBranches} locales
                  </Feature>
                  <Feature icon="inventory_2">
                    {plan.maxProducts} productos
                  </Feature>
                  <Feature icon="sync_alt">
                    {plan.maxMonthlyOperations} operaciones/mes
                  </Feature>
                  <Feature icon="cloud">
                    {plan.maxStorageMb} MB de almacenamiento
                  </Feature>
                  {Object.entries(plan.features || {})
                    .filter(([, enabled]) => enabled)
                    .slice(0, 4)
                    .map(([feature]) => (
                      <Feature key={feature}>
                        {feature.replaceAll("_", " ")}
                      </Feature>
                    ))}
                </ul>
                <Link
                  className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-primary px-4 font-bold text-white"
                  to={
                    plan.isCustom
                      ? "/contact"
                      : `/register?plan=${plan.code}&billing=${interval}`
                  }
                >
                  {plan.isCustom ? "Hablar con ventas" : "Elegir plan"}
                </Link>
              </article>
            );
          })}
        </section>
        {addons.length ? (
          <section className="mt-16">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Complementos
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold">
                Amplía únicamente lo que necesitas
              </h2>
              <p className="mt-2 text-on-surface-variant">
                Catálogo administrado desde Wasita; la compatibilidad depende
                del plan y del tipo de negocio.
              </p>
            </div>
            <div className="mt-6 flex gap-4 overflow-x-auto pb-3 snap-x">
              {addons.map((addon) => {
                const price = addon.prices?.find(
                  (x) => x.billingInterval === interval && x.currency === "PEN",
                );
                return (
                  <article
                    className="min-w-[280px] snap-start rounded-2xl border border-outline-variant bg-white p-5"
                    key={addon.id}
                  >
                    <span className="material-symbols-outlined text-3xl text-primary">
                      extension
                    </span>
                    <h3 className="mt-3 font-bold">{addon.name}</h3>
                    <p className="mt-2 min-h-12 text-sm text-on-surface-variant">
                      {addon.description}
                    </p>
                    <p className="mt-4 text-xl font-bold text-primary">
                      {price
                        ? money(price.amount, price.currency)
                        : "Consultar"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {addon.billingType === "recurring"
                        ? "Cobro recurrente"
                        : "Pago único"}{" "}
                      · por {addon.unitKey}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </PublicLayout>
  );
}
