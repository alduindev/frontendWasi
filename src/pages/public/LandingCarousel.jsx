import { Link } from "react-router-dom";
import Carousel from "../../components/molecules/Carousel";
import PublicLayout from "../../components/public/PublicLayout";

const slides = [
  {
    key: "overview",
    node: (
      <article className="home-slide grid h-full min-h-0 gap-8 rounded-none bg-primary p-7 text-white shadow-[0_18px_36px_rgba(70,78,112,0.16)] sm:px-16 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-20 lg:py-16">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-fixed">
            <span className="h-2 w-2 rounded-full bg-primary-fixed" />
            Gestión simple. Decisiones claras.
          </span>
          <h1 className="mt-7 max-w-2xl font-heading text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Tu negocio bajo control, desde cualquier lugar.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-primary-fixed sm:text-lg">
            Inventario, ventas, usuarios y supervisión conectados en una sola
            vista para decidir con calma.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-primary transition hover:bg-primary-fixed"
              to="/register"
            >
              Comenzar gratis
              <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/15"
              to="/pricing"
            >
              Ver planes
              <span aria-hidden="true" className="material-symbols-outlined text-lg">sell</span>
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-[1.35rem] bg-white/10 p-2">
          <img
            alt="Vista previa del panel de control de Wasita"
            className="h-auto w-full rounded-[1.05rem]"
            height="760"
            loading="eager"
            src="/wasita-dashboard-preview.svg"
            width="1200"
          />
        </div>
      </article>
    ),
  },
  {
    key: "inventory",
    node: (
      <article className="home-slide grid h-full min-h-0 gap-8 rounded-none border border-outline-variant bg-surface-container-lowest p-7 shadow-[0_12px_28px_rgba(70,78,112,0.08)] sm:px-16 sm:py-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-20 lg:py-16">
        <div>
          <span className="clay-badge px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
            <span className="material-symbols-outlined text-base text-primary">inventory_2</span>
            Operación diaria
          </span>
          <h2 className="mt-7 max-w-xl font-heading text-4xl font-extrabold leading-tight text-on-surface sm:text-5xl">
            Inventario al día, sin adivinar.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-on-surface-variant sm:text-lg">
            Stock, costos y alertas conectados para saber qué tienes y qué debes reponer.
          </p>
          <ul className="mt-7 grid gap-3 text-sm font-semibold text-on-surface-variant">
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span>Alertas de stock mínimo</li>
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span>Productos y costos en una vista</li>
            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">check_circle</span>Movimientos trazables</li>
          </ul>
        </div>
        <div className="overflow-hidden rounded-[1.35rem] bg-surface-container-low p-2">
          <img
            alt="Vista previa de inventario y operaciones de Wasita"
            className="h-auto w-full rounded-[1.05rem]"
            height="760"
            loading="lazy"
            src="/wasita-operations-preview.svg"
            width="1200"
          />
        </div>
      </article>
    ),
  },
  {
    key: "team",
    node: (
      <article className="home-slide grid h-full min-h-0 gap-8 rounded-none border border-primary-fixed-dim/70 bg-primary-fixed p-7 sm:px-16 sm:py-10 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:px-20 lg:py-16">
        <div>
          <span className="clay-badge px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
            <span className="material-symbols-outlined text-base text-primary">groups</span>
            Equipo conectado
          </span>
          <h2 className="mt-7 max-w-xl font-heading text-4xl font-extrabold leading-tight text-on-primary-fixed sm:text-5xl">
            Cada persona sabe qué hacer.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-on-primary-fixed/75 sm:text-lg">
            Define roles, accesos y responsabilidades sin perder la visión de toda la operación.
          </p>
          <Link className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary shadow-sm transition hover:bg-primary-fixed" to="/register">
            Crear mi equipo
            <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
        <div className="rounded-[1.5rem] bg-white/70 p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex -space-x-3">
              {['person', 'shield', 'store', 'support_agent'].map((icon) => (
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-primary-fixed bg-white text-primary" key={icon}>
                  <span aria-hidden="true" className="material-symbols-outlined">{icon}</span>
                </span>
              ))}
            </div>
            <span className="rounded-full bg-[#dcefe4] px-3 py-1 text-xs font-bold text-[#337354]">Operación activa</span>
          </div>
          <div className="mt-8 grid gap-3">
            {['Propietarios', 'Supervisores', 'Operarios'].map((role, index) => (
              <div className="flex items-center justify-between rounded-xl bg-white/75 px-4 py-3" key={role}>
                <span className="text-sm font-semibold text-on-surface">{role}</span>
                <span className="h-2 w-24 rounded-full bg-surface-container-high"><span className={`block h-full rounded-full bg-primary ${index === 0 ? 'w-full' : index === 1 ? 'w-3/4' : 'w-1/2'}`} /></span>
              </div>
            ))}
          </div>
        </div>
      </article>
    ),
  },
  {
    key: "decisions",
    node: (
      <article className="home-slide grid h-full min-h-0 gap-8 rounded-none border border-secondary-container bg-secondary-container p-7 sm:px-16 sm:py-10 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:px-20 lg:py-16">
        <div>
          <span className="clay-badge px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
            <span className="material-symbols-outlined text-base text-secondary">monitoring</span>
            Supervisión
          </span>
          <h2 className="mt-7 max-w-xl font-heading text-4xl font-extrabold leading-tight text-on-secondary-container sm:text-5xl">
            Decisiones más claras, cada semana.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-on-secondary-container/75 sm:text-lg">
            Comprende ventas, rendimiento y alertas sin perseguir datos en distintas pantallas.
          </p>
        </div>
        <div className="flex h-64 items-end gap-3 rounded-[1.5rem] bg-white/65 p-6" aria-label="Gráfico de crecimiento semanal" role="img">
          {[42, 58, 48, 72, 64, 88, 100].map((height, index) => (
            <span className={`flex-1 rounded-t-lg ${index === 6 ? 'bg-on-secondary-container' : 'bg-secondary/65'}`} key={height} style={{ height: `${height}%` }} />
          ))}
        </div>
      </article>
    ),
  },
];

export default function Landing({ embedded = false }) {
  const content = (
    <main className="flex min-h-0 flex-1 w-full flex-col overflow-hidden text-on-surface selection:bg-primary-fixed-dim selection:text-on-primary-fixed">
      <section className="flex min-h-0 flex-1 items-stretch px-0 py-0">
        <Carousel
          ariaLabel="Presentación de Wasita"
          autoPlay
          autoPlayInterval={6000}
          className="h-full w-full"
          forceMotion
          fullWidth
          itemClassName="h-full w-full"
          items={slides}
          loop
          showIndicators={false}
        />
      </section>

    </main>
  );

  return embedded ? content : <PublicLayout>{content}</PublicLayout>;
}