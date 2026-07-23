import { Link } from "react-router-dom";
import PublicLayout from "../../components/public/PublicLayout";

const features = [
  [
    "inventory_2",
    "Inventario",
    "Controla stock, costos, alertas y productos desde un solo lugar.",
  ],
  [
    "point_of_sale",
    "Punto de venta",
    "Atiende clientes con un POS rápido y conectado al inventario real.",
  ],
  [
    "monitoring",
    "Supervisión",
    "Comprende ventas y rendimiento sin perder trazabilidad.",
  ],
  [
    "admin_panel_settings",
    "Permisos",
    "Separa propietarios, administradores, supervisores y operarios.",
  ],
  [
    "receipt_long",
    "Comprobantes",
    "Emite boletas y facturas internas con control de anulaciones.",
  ],
  [
    "cloud",
    "Multiempresa",
    "Cada negocio mantiene sus usuarios y datos completamente aislados.",
  ],
];

export default function Landing() {
  return (
    <PublicLayout>
      <main className="overflow-hidden text-on-surface selection:bg-primary-fixed-dim selection:text-on-primary-fixed">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-primary-fixed-dim/35 blur-3xl" />

          <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-secondary-container/70 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-container/15 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-8 lg:py-28">
            <div className="relative z-10">
              <span className="clay-badge px-4 py-2 text-sm font-bold">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-primary"
                />

                Gestión simple. Decisiones claras.
              </span>

              <h1 className="mt-7 max-w-3xl font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
                Tu negocio bajo control, desde cualquier lugar.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-on-surface-variant sm:text-lg">
                Wasita reúne inventario, ventas, usuarios y supervisión en una
                plataforma SaaS preparada para acompañar tu crecimiento.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link
                  className="clay-button-primary min-h-14 px-7 py-4 text-center font-bold"
                  to="/register"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[1.25rem]"
                  >
                    rocket_launch
                  </span>

                  Comenzar gratis
                </Link>

                <Link
                  className="clay-button-secondary min-h-14 px-7 py-4 text-center font-bold"
                  to="/pricing"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[1.25rem]"
                  >
                    sell
                  </span>

                  Ver planes
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium text-on-surface-variant">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-lg text-primary"
                  >
                    check_circle
                  </span>

                  Sin tarjeta
                </span>

                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-lg text-primary"
                  >
                    check_circle
                  </span>

                  Plan FREE disponible
                </span>
              </div>
            </div>

            <div className="clay-highlight relative mx-auto w-full max-w-xl">
              <div className="clay-card p-3 sm:p-4">
                <div className="clay-inset overflow-hidden p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-error shadow-sm" />
                      <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm" />
                      <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />
                    </div>

                    <div className="h-3 w-20 rounded-full bg-outline-variant/60" />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="col-span-2 overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-primary-container to-primary p-5 text-on-primary shadow-lg shadow-primary/20">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="h-2.5 w-24 rounded-full bg-white/60" />
                          <div className="mt-4 h-7 w-36 rounded-lg bg-white/90" />
                        </div>

                        <span className="material-symbols-outlined rounded-xl bg-white/20 p-2 text-2xl">
                          monitoring
                        </span>
                      </div>

                      <div className="mt-6 flex gap-2">
                        <div className="h-2 flex-1 rounded-full bg-white/25">
                          <div className="h-full w-3/4 rounded-full bg-white/90" />
                        </div>

                        <span className="text-xs font-bold text-white/90">
                          75%
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-md shadow-outline-variant/20">
                      <div className="flex items-center justify-between gap-3">
                        <span className="material-symbols-outlined text-2xl text-primary">
                          inventory_2
                        </span>

                        <span className="rounded-full bg-primary-fixed px-2 py-1 text-[0.625rem] font-bold text-on-primary-fixed">
                          +12%
                        </span>
                      </div>

                      <div className="mt-5 h-3 w-20 rounded-full bg-outline-variant/60" />
                      <div className="mt-3 h-6 w-16 rounded-lg bg-on-surface/80" />
                    </div>

                    <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-md shadow-outline-variant/20">
                      <div className="flex items-center justify-between gap-3">
                        <span className="material-symbols-outlined text-2xl text-secondary">
                          point_of_sale
                        </span>

                        <span className="rounded-full bg-secondary-container px-2 py-1 text-[0.625rem] font-bold text-on-secondary-container">
                          Hoy
                        </span>
                      </div>

                      <div className="mt-5 h-3 w-20 rounded-full bg-outline-variant/60" />
                      <div className="mt-3 h-6 w-20 rounded-lg bg-on-surface/80" />
                    </div>

                    <div className="col-span-2 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-md shadow-outline-variant/20 sm:p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="h-3 w-28 rounded-full bg-on-surface/80" />
                          <div className="mt-2 h-2.5 w-40 max-w-full rounded-full bg-outline-variant/60" />
                        </div>

                        <span className="material-symbols-outlined rounded-xl bg-primary-fixed p-2 text-primary">
                          bar_chart
                        </span>
                      </div>

                      <div className="mt-6 flex h-24 items-end gap-2">
                        <div className="h-[38%] flex-1 rounded-t-lg bg-primary-fixed-dim" />
                        <div className="h-[62%] flex-1 rounded-t-lg bg-primary-container/65" />
                        <div className="h-[48%] flex-1 rounded-t-lg bg-secondary-container" />
                        <div className="h-[82%] flex-1 rounded-t-lg bg-primary" />
                        <div className="h-[68%] flex-1 rounded-t-lg bg-primary-container" />
                        <div className="h-full flex-1 rounded-t-lg bg-secondary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="clay-badge px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]">
              Todo conectado
            </span>

            <h2 className="mt-6 font-heading text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              Herramientas que trabajan contigo
            </h2>

            <p className="mt-4 text-base leading-7 text-on-surface-variant sm:text-lg">
              Centraliza las operaciones esenciales de tu negocio en una
              experiencia clara, rápida y fácil de supervisar.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([icon, title, text]) => (
              <article className="clay-card group p-6 sm:p-7" key={title}>
                <span className="clay-icon material-symbols-outlined h-14 w-14 text-[1.75rem]">
                  {icon}
                </span>

                <h3 className="mt-6 font-heading text-xl font-bold text-on-surface">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-on-surface-variant">{text}</p>

                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-primary opacity-80 transition group-hover:gap-3 group-hover:opacity-100">
                  Conocer más

                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-lg"
                  >
                    arrow_forward
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8 lg:pb-28">
          <div className="clay-card relative overflow-hidden p-8 sm:p-12 lg:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-fixed-dim/55 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-secondary-container/70 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="clay-badge px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
                  Comienza hoy
                </span>

                <h2 className="mt-6 font-heading text-3xl font-bold leading-tight text-on-surface sm:text-4xl">
                  Empieza con una operación más ordenada
                </h2>

                <p className="mt-4 text-base leading-7 text-on-surface-variant sm:text-lg">
                  Crea tu empresa, invita a tu equipo y comienza con el plan
                  FREE. Mantén toda tu operación organizada desde una sola
                  plataforma.
                </p>
              </div>

              <Link
                className="clay-button-primary min-h-14 shrink-0 px-7 py-4 text-center font-bold"
                to="/register"
              >
                Crear mi empresa

                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-xl"
                >
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}