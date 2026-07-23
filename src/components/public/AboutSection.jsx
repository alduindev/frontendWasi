import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  aboutIntro,
  businessTypes,
  aboutFeatures,
  missionPoints,
  howWeWork,
  values,
  aboutCtas,
} from "../../data/aboutContent";

// Hook simple para animar al entrar en viewport (scroll reveal)
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

function Reveal({ children, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-8">
      <p className="text-sm font-bold uppercase tracking-widest text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-2xl font-extrabold sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function FeatureIcon({ id }) {
  const paths = {
    accesible: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z"
        />
      </>
    ),
    protegidos: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
    crecimiento: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2"
      />
    ),
  };
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {paths[id]}
    </svg>
  );
}

export default function AboutSection() {
  const [activeType, setActiveType] = useState(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      {/* 1. Sección principal */}
      <Reveal>
        <p className="text-sm font-bold uppercase tracking-widest text-primary">
          {aboutIntro.eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold sm:text-5xl">
          {aboutIntro.title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant">
          {aboutIntro.lead}
        </p>
        <div className="mt-4 grid gap-3">
          {aboutIntro.paragraphs.map((p) => (
            <p key={p} className="max-w-3xl text-sm leading-7 text-on-surface-variant">
              {p}
            </p>
          ))}
        </div>
      </Reveal>

      {/* 2. Propuesta de valor: adaptable por tipo de negocio */}
      <Reveal className="mt-16">
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
          <SectionHeading
            eyebrow="Propuesta de valor"
            title="Una plataforma que se adapta a tu rubro"
          />
          <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
            Wasita no es solo un sistema para registrar productos: habilita
            únicamente los módulos y formularios que corresponden al tipo de
            negocio que elijas.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {businessTypes.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveType(b)}
                className={`rounded-2xl border bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  activeType?.id === b.id
                    ? "border-primary shadow-md"
                    : "border-outline-variant hover:border-primary/40"
                }`}
              >
                <p className="font-bold">{b.label}</p>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                  {b.detail}
                </p>
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 3. Características principales */}
      <Reveal className="mt-16">
        <SectionHeading eyebrow="Características" title="Pensado para funcionar bien, todos los días" />
        <div className="grid gap-5 md:grid-cols-3">
          {aboutFeatures.map((f) => (
            <article
              key={f.id}
              className="flex flex-col rounded-3xl border border-outline-variant bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FeatureIcon id={f.id} />
              </span>
              <p className="mt-4 font-heading text-lg font-extrabold">{f.name}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{f.summary}</p>
              <ul className="mt-4 grid flex-1 gap-2.5">
                {f.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs leading-5 text-on-surface-variant"
                  >
                    <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Reveal>

      {/* 4. Nuestra misión */}
      <Reveal className="mt-16">
        <SectionHeading eyebrow="Nuestra misión" title="Por qué existe Wasita" />
        <div className="grid gap-5 sm:grid-cols-3">
          {missionPoints.map((m, i) => (
            <div
              key={m.title}
              className="rounded-3xl border border-outline-variant bg-white p-6"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="mt-4 font-bold">{m.title}</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{m.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 5. Cómo trabajamos */}
      <Reveal className="mt-16">
        <SectionHeading eyebrow="Proceso" title="Cómo trabajamos" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {howWeWork.map((s) => (
            <div
              key={s.step}
              className="relative rounded-2xl border border-outline-variant bg-white p-5"
            >
              <span className="font-heading text-3xl font-extrabold text-primary/20">
                {s.step}
              </span>
              <p className="mt-2 font-bold">{s.title}</p>
              <p className="mt-1.5 text-xs leading-5 text-on-surface-variant">{s.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 6. Valores */}
      <Reveal className="mt-16">
        <SectionHeading eyebrow="Nuestros valores" title="Lo que guía cada decisión" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div
              key={v.name}
              className="rounded-2xl border border-outline-variant bg-white p-4 transition hover:border-primary/40"
            >
              <p className="text-sm font-bold text-primary">{v.name}</p>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">{v.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 9. Llamadas a la acción */}
      <Reveal className="mt-16">
        <div className="rounded-3xl bg-primary p-8 text-center text-white sm:p-12">
          <h2 className="font-heading text-2xl font-extrabold sm:text-3xl">
            Encuentra la solución para tu negocio
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80">
            Elige el plan que se ajusta a tu operación y empieza a organizar
            tu negocio hoy mismo.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {aboutCtas.map((cta) => (
              <Link
                key={cta.label}
                to={cta.to}
                className={`flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-bold transition ${
                  cta.variant === "primary"
                    ? "bg-white text-primary hover:opacity-90"
                    : "border border-white/40 text-white hover:bg-white/10"
                }`}
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}