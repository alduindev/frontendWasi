import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Carousel from "../../components/molecules/Carousel";
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
const Feature = ({ children, icon = "check_circle" }) => (
  <li className="flex gap-2 text-sm text-white/70">
    <span className="material-symbols-outlined text-lg text-primary-fixed">
      {icon}
    </span>
    {children}
  </li>
);

function PlanCard({ interval, plan, savings }) {
  const price = priceOf(plan, interval);
  const monthly =
    interval === "annual" && price
      ? Number(price.amount) / 12
      : Number(price?.amount || 0);

  return (
    <article
      className={`flex h-full min-h-[34rem] flex-col rounded-[1.5rem] border p-6 shadow-[0_18px_42px_rgba(0,0,0,0.16)] backdrop-blur-sm ${plan.code === "BUSINESS" ? "border-primary-fixed bg-primary/75 ring-2 ring-primary-fixed/40" : "border-white/15 bg-white/10"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary-fixed">{plan.code}</p>
          <h2 className="mt-1 font-heading text-2xl font-bold text-white">{plan.name}</h2>
        </div>
        {plan.isCustom ? <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">A medida</span> : null}
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-white/70">{plan.description}</p>
      <div className="mt-5">
        <p className="text-3xl font-extrabold text-white">
          {plan.isCustom ? "Cotizar" : money(monthly, price?.currency)}
          <span className="text-sm font-normal text-white/60">{plan.isCustom ? "" : " /mes"}</span>
        </p>
        {interval === "annual" && !plan.isCustom ? <p className="mt-1 text-xs font-bold text-emerald-700">{money(price?.amount, price?.currency)} al año · ahorra {savings[plan.id]}%</p> : null}
        <p className="mt-2 text-xs text-white/60">Prueba de {plan.trialDays} días · gracia {plan.graceDays} días</p>
      </div>
      <ul className="mt-6 grid flex-1 gap-3">
        <Feature>{plan.maxUsers} usuarios ({plan.maxOperators} operarios)</Feature>
        <Feature icon="storefront">{plan.maxBranches} locales</Feature>
        <Feature icon="inventory_2">{plan.maxProducts} productos</Feature>
        <Feature icon="sync_alt">{plan.maxMonthlyOperations} operaciones/mes</Feature>
        <Feature icon="cloud">{plan.maxStorageMb} MB de almacenamiento</Feature>
        {Object.entries(plan.features || {}).filter(([, enabled]) => enabled).slice(0, 4).map(([feature]) => <Feature key={feature}>{feature.replaceAll("_", " ")}</Feature>)}
      </ul>
      <Link className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-white px-4 font-bold text-primary transition hover:bg-primary-fixed" to={plan.isCustom ? "/contact" : `/register?plan=${plan.code}&billing=${interval}`}>
        {plan.isCustom ? "Hablar con ventas" : "Elegir plan"}
      </Link>
    </article>
  );
}

export default function Pricing({ embedded = false }) {
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const interval = "monthly";
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
  const content = (
      <main className="min-h-[calc(100svh-5rem)] bg-[#252b4a] px-4 py-10 text-white sm:px-6 lg:py-14">
        <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-fixed">Planes Wasita</p>
            <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Elige el ritmo de tu negocio.</h1>
            <p className="mt-4 max-w-xl leading-7 text-white/70">Una capacidad clara para cada etapa, sin pagar por funciones que todavía no necesitas.</p>
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
                className="h-96 animate-pulse rounded-3xl bg-white/10"
                key={x}
              />
            ))}
          </div>
        ) : null}
          <Carousel
          ariaLabel="Planes de suscripción"
          className="mt-10"
            controlsOnly
          gridClassName="sm:auto-cols-[minmax(280px,1fr)] lg:auto-cols-[minmax(290px,1fr)]"
          items={plans.map((plan) => ({
            key: plan.id,
            node: <PlanCard interval={interval} plan={plan} savings={savings} />,
          }))}
          loop
          showIndicators={false}
        />
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
                    className="min-w-[280px] snap-start rounded-2xl border border-white/15 bg-white/10 p-5"
                    key={addon.id}
                  >
                    <span className="material-symbols-outlined text-3xl text-primary">
                      extension
                    </span>
                    <h3 className="mt-3 font-bold text-white">{addon.name}</h3>
                    <p className="mt-2 min-h-12 text-sm text-white/70">
                      {addon.description}
                    </p>
                    <p className="mt-4 text-xl font-bold text-primary">
                      {price
                        ? money(price.amount, price.currency)
                        : "Consultar"}
                    </p>
                    <p className="text-xs text-white/60">
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
      </div>
      </main>
  );

  return embedded ? content : <PublicLayout>{content}</PublicLayout>;
}
