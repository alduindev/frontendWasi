import { useEffect, useState, useCallback } from "react";
import PublicLayout from "../../components/public/PublicLayout";
import AboutSection from "../../components/public/AboutSection";

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

const pageIcons = {
  features: (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h7"
      />
    </svg>
  ),
  contact: (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  help: (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

// Íconos + descripción real de cada highlight (antes eran solo texto plano)
const highlightIcons = {
  "Diseño accesible": (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
  "Datos protegidos": (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),
  "Soporte en crecimiento": (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2"
      />
    </svg>
  ),
};

const highlightDetails = {
  "Diseño accesible": {
    summary: "Interfaz clara y usable para todo tipo de negocio",
    detail:
      "Cada pantalla está pensada para reducir la curva de aprendizaje: navegación simple, atajos de teclado en el punto de venta y una experiencia totalmente responsive que funciona igual de bien en celular, tablet o escritorio.",
  },
  "Datos protegidos": {
    summary: "Seguridad y control sobre la información de tu negocio",
    detail:
      "Tus datos están cifrados en tránsito y en reposo, con respaldo periódico. El acceso se controla mediante roles y permisos, así que cada usuario solo ve y modifica lo que le corresponde.",
  },
  "Soporte en crecimiento": {
    summary: "Acompañamiento a medida que tu negocio se expande",
    detail:
      "Desde un solo local hasta múltiples sucursales y empresas, Wasita escala contigo. El soporte responde según el plan contratado, con prioridad para cuentas activas y en crecimiento.",
  },
};

// "about" ya no vive aquí: tiene su propia sección enriquecida en AboutSection.jsx
const content = {
  features: {
    title: "Características",
    text: "Inventario, POS, ventas, comprobantes, usuarios, supervisión, permisos, multiempresa, seguridad y experiencia responsive.",
    tabs: [
      {
        label: "Operación diaria",
        items: [
          "Punto de venta rápido con atajos de teclado",
          "Control de inventario en tiempo real",
          "Comprobantes electrónicos integrados",
        ],
      },
      {
        label: "Gestión y control",
        items: [
          "Roles y permisos por usuario",
          "Soporte multiempresa y multisucursal",
          "Panel de supervisión con métricas clave",
        ],
      },
    ],
  },
  contact: {
    title: "Contacto",
    text: "Escríbenos para consultas comerciales, soporte o alianzas. El formulario de contacto conectado será incorporado con el sistema de tickets.",
    tabs: [
      {
        label: "Canales disponibles",
        items: [
          "Soporte técnico para clientes activos",
          "Consultas comerciales y alianzas",
          "Reportes de errores o sugerencias",
        ],
      },
      {
        label: "Qué esperar",
        items: [
          "Respuesta dentro de los próximos días hábiles",
          "Seguimiento mediante sistema de tickets",
          "Atención personalizada según el tipo de consulta",
        ],
      },
    ],
  },
  help: {
    title: "Centro de ayuda",
    text: "Encuentra orientación sobre acceso, inventario, ventas, usuarios y planes. Dentro de la aplicación también dispones de tutoriales contextuales.",
    tabs: [
      {
        label: "Primeros pasos",
        items: [
          "Cómo crear tu cuenta y configurar tu negocio",
          "Agregar productos e inventario inicial",
          "Invitar usuarios y asignar permisos",
        ],
      },
      {
        label: "Uso avanzado",
        items: [
          "Gestión de múltiples sucursales",
          "Reportes de ventas y supervisión",
          "Actualización o cambio de plan",
        ],
      },
    ],
  },
};

function HighlightModal({ name, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!name) return null;
  const data = highlightDetails[name];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="highlight-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md animate-[modalIn_0.25s_ease-out] rounded-3xl bg-white p-7 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-1.5 text-on-surface-variant transition hover:bg-surface-variant hover:text-on-surface"
          aria-label="Cerrar"
        >
          <CloseIcon />
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {highlightIcons[name]}
        </span>

        <h2
          id="highlight-modal-title"
          className="mt-4 font-heading text-xl font-extrabold"
        >
          {name}
        </h2>
        <p className="mt-1 text-sm font-semibold text-primary">
          {data.summary}
        </p>
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
          {data.detail}
        </p>
      </div>
    </div>
  );
}

function GenericInfoPage({ type }) {
  const data = content[type];
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState(null);

  useEffect(() => {
    let id;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setVisible(false);
      setActiveTab(0);
      id = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      active = false;
      if (id) cancelAnimationFrame(id);
    };
  }, [type]);

  const closeHighlight = useCallback(() => setActiveHighlight(null), []);

  return (
    <>
      <main className="mx-auto min-h-[60svh] max-w-5xl px-4 py-20">
        <div
          className={`transition-all duration-500 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {pageIcons[type]}
            </span>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Wasita
            </p>
          </div>

          <h1 className="mt-4 font-heading text-4xl font-extrabold sm:text-5xl">
            {data.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-on-surface-variant">
            {data.text}
          </p>

          {/* Highlights: icono, descripción y modal de detalle al hacer click */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {Object.keys(highlightIcons).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveHighlight(name)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-outline-variant bg-white p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                  {highlightIcons[name]}
                </span>
                <div>
                  <p className="font-bold">{name}</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    {highlightDetails[name].summary}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Contenido en tabs */}
          <div className="mt-14">
            <div
              role="tablist"
              className="flex gap-1 rounded-full border border-outline-variant bg-white p-1 sm:inline-flex"
            >
              {data.tabs.map((tab, i) => (
                <button
                  key={tab.label}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === i}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition-colors duration-200 sm:flex-none ${
                    activeTab === i
                      ? "bg-primary text-white"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <article
              key={activeTab}
              className="mt-5 animate-[fadeIn_0.25s_ease-out] rounded-3xl border border-outline-variant bg-white p-6"
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.tabs[activeTab].items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-6 text-on-surface-variant"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          {type === "contact" ? (
            <div className="mt-10 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-sm text-on-surface-variant">
              <span className="font-bold text-primary">Próximamente: </span>
              formulario de contacto conectado a nuestro sistema de tickets para
              hacer seguimiento en tiempo real de tu consulta.
            </div>
          ) : null}
        </div>
      </main>

      {activeHighlight ? (
        <HighlightModal name={activeHighlight} onClose={closeHighlight} />
      ) : null}
    </>
  );
}

export default function PublicInfo({ type }) {
  return (
    <PublicLayout>
      {type === "about" ? <AboutSection /> : <GenericInfoPage type={type} />}
    </PublicLayout>
  );
}
