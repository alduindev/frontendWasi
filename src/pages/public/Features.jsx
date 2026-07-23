import { useEffect, useMemo, useRef, useState } from "react";
import PublicLayout from "../../components/public/PublicLayout";

const features = [
  {
    group: "Operación diaria",
    icon: "inventory_2",
    title: "Inventario",
    text: "Controla productos, stock, costos y alertas desde un solo lugar.",
    description:
      "Centraliza el catálogo de productos de tu negocio y mantén el stock actualizado con información clara sobre costos, precios, movimientos y disponibilidad.",
    characteristics: [
      "Gestión de productos, categorías y SKU.",
      "Stock mínimo y alertas de reposición.",
      "Importación y exportación de información.",
      "Control de costos, precios y márgenes.",
      "Filtros y búsquedas avanzadas.",
    ],
    benefits: [
      "Reduce pérdidas por falta de stock.",
      "Evita registros duplicados o desactualizados.",
      "Obtén información rápida para tomar decisiones.",
      "Mantén toda la operación sincronizada.",
    ],
    plan: "Disponible según el plan contratado.",
    planDetail:
      "Las funciones principales están disponibles desde el plan inicial. Los límites de productos, imágenes y almacenamiento dependen del plan.",
    previews: [
      ["inventory", "Catálogo centralizado"],
      ["warning", "Alertas de stock"],
      ["analytics", "Costos y márgenes"],
    ],
    available: true,
  },
  {
    group: "Operación diaria",
    icon: "point_of_sale",
    title: "Punto de venta",
    text: "Atiende clientes con un flujo de venta rápido y conectado al stock.",
    description:
      "Procesa ventas desde una interfaz rápida, registra métodos de pago y actualiza automáticamente la disponibilidad de productos.",
    characteristics: [
      "Búsqueda rápida de productos.",
      "Carrito de compra dinámico.",
      "Registro de diferentes métodos de pago.",
      "Actualización automática de inventario.",
      "Historial de ventas por operario.",
    ],
    benefits: [
      "Reduce el tiempo de atención.",
      "Disminuye errores durante el cobro.",
      "Mantiene el inventario actualizado.",
      "Facilita el seguimiento de ventas.",
    ],
    plan: "Incluido en planes comerciales.",
    planDetail:
      "El acceso puede configurarse según el rol del usuario y los límites definidos para cada empresa.",
    previews: [
      ["shopping_cart", "Carrito rápido"],
      ["payments", "Métodos de pago"],
      ["sync", "Stock sincronizado"],
    ],
    available: true,
  },
  {
    group: "Operación diaria",
    icon: "receipt_long",
    title: "Comprobantes",
    text: "Administra boletas y facturas internas con trazabilidad completa.",
    description:
      "Genera comprobantes internos vinculados a cada venta, consulta su historial y controla anulaciones sin perder trazabilidad.",
    characteristics: [
      "Generación de boletas internas.",
      "Generación de facturas internas.",
      "Impresión y descarga de comprobantes.",
      "Control de anulaciones.",
      "Historial relacionado con cada venta.",
    ],
    benefits: [
      "Organiza mejor la documentación comercial.",
      "Mantiene evidencia de cada operación.",
      "Facilita revisiones y auditorías.",
      "Reduce errores administrativos.",
    ],
    plan: "Disponible según configuración.",
    planDetail:
      "La emisión electrónica oficial con SUNAT corresponde a una integración posterior.",
    previews: [
      ["description", "Vista del comprobante"],
      ["print", "Impresión rápida"],
      ["history", "Historial completo"],
    ],
    available: true,
  },
  {
    group: "Equipo y control",
    icon: "group",
    title: "Usuarios y roles",
    text: "Organiza propietarios, administradores, supervisores y operarios.",
    description:
      "Administra a los integrantes de la empresa y asigna responsabilidades diferentes según sus tareas dentro del negocio.",
    characteristics: [
      "Registro y edición de usuarios.",
      "Roles por responsabilidad.",
      "Asignación de múltiples funciones.",
      "Estados activos e inactivos.",
      "Acceso separado por negocio.",
    ],
    benefits: [
      "Cada usuario visualiza solo lo necesario.",
      "Mejora la organización del equipo.",
      "Facilita la delegación de tareas.",
      "Reduce accesos innecesarios.",
    ],
    plan: "El límite depende del plan.",
    planDetail:
      "Cada suscripción define la cantidad máxima de usuarios que puede registrar una empresa.",
    previews: [
      ["badge", "Perfiles de usuario"],
      ["manage_accounts", "Asignación de roles"],
      ["groups", "Organización del equipo"],
    ],
    available: true,
  },
  {
    group: "Equipo y control",
    icon: "monitoring",
    title: "Rendimiento",
    text: "Analiza ventas, productos y actividad individual del equipo.",
    description:
      "Consulta métricas importantes de la operación y comprende cómo está funcionando el negocio durante cada período.",
    characteristics: [
      "Ventas por día, semana o mes.",
      "Ticket promedio.",
      "Productos más vendidos.",
      "Actividad por operario.",
      "Timeline de acciones importantes.",
    ],
    benefits: [
      "Detecta oportunidades de mejora.",
      "Comprende el rendimiento del negocio.",
      "Identifica productos destacados.",
      "Supervisa sin intervenir constantemente.",
    ],
    plan: "Disponible en planes de gestión.",
    planDetail:
      "Los reportes avanzados y períodos históricos pueden depender del nivel de suscripción.",
    previews: [
      ["bar_chart", "Panel de métricas"],
      ["trending_up", "Evolución de ventas"],
      ["person_search", "Actividad por usuario"],
    ],
    available: true,
  },
  {
    group: "Equipo y control",
    icon: "admin_panel_settings",
    title: "Permisos",
    text: "Protege acciones sensibles con autorización real desde el backend.",
    description:
      "Controla qué puede consultar, crear, editar o eliminar cada usuario según sus responsabilidades dentro de la empresa.",
    characteristics: [
      "Autorización validada desde el backend.",
      "Rutas protegidas por rol.",
      "Acciones separadas por responsabilidad.",
      "Permisos para tareas sensibles.",
      "Experiencias diferentes por usuario.",
    ],
    benefits: [
      "Protege información importante.",
      "Evita cambios no autorizados.",
      "Simplifica la experiencia de cada rol.",
      "Mejora el control administrativo.",
    ],
    plan: "Incluido como función de seguridad.",
    planDetail:
      "Las capacidades disponibles pueden variar según los módulos habilitados para cada empresa.",
    previews: [
      ["lock", "Acceso protegido"],
      ["verified_user", "Validación backend"],
      ["rule", "Reglas por rol"],
    ],
    available: true,
  },
  {
    group: "Plataforma SaaS",
    icon: "domain",
    title: "Multiempresa",
    text: "Mantén los datos de cada negocio completamente separados.",
    description:
      "Wasita permite gestionar múltiples empresas sin mezclar usuarios, productos, ventas ni información operativa.",
    characteristics: [
      "Aislamiento mediante business_id.",
      "Usuarios relacionados con una empresa.",
      "Información independiente por negocio.",
      "Administración global de la plataforma.",
      "Configuración particular por empresa.",
    ],
    benefits: [
      "Evita cruces de información.",
      "Permite escalar a nuevos negocios.",
      "Simplifica la administración SaaS.",
      "Ofrece mayor privacidad y control.",
    ],
    plan: "Base de la arquitectura SaaS.",
    planDetail:
      "Cada empresa utiliza su propia suscripción, usuarios, configuración y límites de consumo.",
    previews: [
      ["apartment", "Empresas independientes"],
      ["database", "Datos aislados"],
      ["hub", "Control centralizado"],
    ],
    available: true,
  },
  {
    group: "Plataforma SaaS",
    icon: "workspace_premium",
    title: "Planes y consumo",
    text: "Controla suscripciones, límites y recursos utilizados por cada empresa.",
    description:
      "Administra los planes disponibles y verifica cómo utiliza cada negocio sus usuarios, productos, imágenes y almacenamiento.",
    characteristics: [
      "Planes configurables.",
      "Límites de usuarios y productos.",
      "Control de imágenes y almacenamiento.",
      "Estado de la suscripción.",
      "Registro del consumo empresarial.",
    ],
    benefits: [
      "Facilita la monetización del sistema.",
      "Evita superar recursos contratados.",
      "Permite crear diferentes niveles de servicio.",
      "Mejora el control de la plataforma.",
    ],
    plan: "La disponibilidad depende del plan.",
    planDetail:
      "Wasita puede ofrecer planes FREE, básicos, profesionales o empresariales con límites diferentes.",
    previews: [
      ["sell", "Planes configurables"],
      ["data_usage", "Control de consumo"],
      ["upgrade", "Cambio de plan"],
    ],
    available: true,
  },
  {
    group: "Plataforma SaaS",
    icon: "security",
    title: "Seguridad",
    text: "Protege accesos, contraseñas, sesiones y acciones importantes.",
    description:
      "La plataforma utiliza mecanismos modernos de autenticación y protección para resguardar la información de cada negocio.",
    characteristics: [
      "JWT almacenado en cookie HTTP-only.",
      "Contraseñas correctamente hasheadas.",
      "Auditoría de acciones relevantes.",
      "Cierre de sesión idempotente.",
      "Separación de información por empresa.",
    ],
    benefits: [
      "Reduce la exposición de credenciales.",
      "Protege sesiones de usuario.",
      "Facilita investigaciones de actividad.",
      "Mejora la confianza en la plataforma.",
    ],
    plan: "Incluido en todos los planes.",
    planDetail:
      "Las funciones esenciales de seguridad forman parte de la base de Wasita y no son opcionales.",
    previews: [
      ["shield_lock", "Sesiones protegidas"],
      ["password", "Credenciales seguras"],
      ["policy", "Auditoría de acciones"],
    ],
    available: true,
  },
  {
    group: "Preparado para crecer",
    icon: "qr_code_scanner",
    title: "Login QR",
    text: "Acceso rápido mediante escaneo de QR desde un dispositivo autorizado.",
    description:
      "La arquitectura contempla un flujo de autenticación mediante QR para simplificar el ingreso de operarios en dispositivos compartidos.",
    characteristics: [
      "Código QR temporal.",
      "Sesiones vinculadas a dispositivos.",
      "Validación desde un equipo autorizado.",
      "Caducidad automática del código.",
      "Registro de accesos.",
    ],
    benefits: [
      "Reduce el tiempo de inicio de sesión.",
      "Evita escribir credenciales repetidamente.",
      "Facilita el uso en puntos de venta.",
      "Mantiene control sobre los accesos.",
    ],
    plan: "Próximamente.",
    planDetail:
      "Esta función está considerada para una etapa posterior del desarrollo.",
    previews: [
      ["qr_code_2", "Código temporal"],
      ["mobile_friendly", "Validación móvil"],
      ["login", "Acceso rápido"],
    ],
    available: false,
  },
  {
    group: "Preparado para crecer",
    icon: "account_balance",
    title: "SUNAT",
    text: "Integración futura para emitir comprobantes electrónicos oficiales.",
    description:
      "Wasita está preparada para incorporar una integración con facturación electrónica y los procesos requeridos por SUNAT.",
    characteristics: [
      "Emisión electrónica futura.",
      "Comunicación con proveedor autorizado.",
      "Estados de aceptación y rechazo.",
      "Almacenamiento de XML y representaciones.",
      "Consulta del historial tributario.",
    ],
    benefits: [
      "Centraliza la emisión de comprobantes.",
      "Reduce procesos externos.",
      "Facilita el seguimiento tributario.",
      "Conecta ventas con facturación oficial.",
    ],
    plan: "Integración futura.",
    planDetail:
      "Puede requerir un plan adicional o costos relacionados con un proveedor de facturación electrónica.",
    previews: [
      ["receipt", "Emisión electrónica"],
      ["cloud_sync", "Envío y validación"],
      ["fact_check", "Estados tributarios"],
    ],
    available: false,
  },
  {
    group: "Preparado para crecer",
    icon: "api",
    title: "API",
    text: "Conecta Wasita con aplicaciones web, móviles y servicios externos.",
    description:
      "La API construida con FastAPI facilita la integración con nuevos clientes, aplicaciones móviles y servicios empresariales.",
    characteristics: [
      "Documentación mediante Swagger.",
      "Endpoints protegidos.",
      "Arquitectura REST.",
      "Validación de solicitudes.",
      "Preparación para integraciones externas.",
    ],
    benefits: [
      "Facilita nuevas aplicaciones.",
      "Permite integrar servicios externos.",
      "Reduce la duplicación de lógica.",
      "Mejora la escalabilidad técnica.",
    ],
    plan: "Acceso según el tipo de integración.",
    planDetail:
      "El acceso público o empresarial a la API puede habilitarse en planes avanzados.",
    previews: [
      ["code", "Documentación Swagger"],
      ["lan", "Endpoints REST"],
      ["integration_instructions", "Integraciones"],
    ],
    available: false,
  },
];

const groupInformation = {
  Todos: {
    icon: "apps",
    description: "Explora todas las herramientas disponibles en Wasita.",
  },
  "Operación diaria": {
    icon: "storefront",
    description:
      "Herramientas esenciales para gestionar las operaciones principales.",
  },
  "Equipo y control": {
    icon: "groups",
    description:
      "Controla responsabilidades, permisos y rendimiento del equipo.",
  },
  "Plataforma SaaS": {
    icon: "cloud",
    description:
      "Arquitectura segura y escalable para gestionar múltiples empresas.",
  },
  "Preparado para crecer": {
    icon: "rocket_launch",
    description:
      "Integraciones y funcionalidades previstas para próximas etapas.",
  },
};

const groups = ["Todos", ...new Set(features.map((feature) => feature.group))];

const modalTabs = [
  {
    id: "description",
    label: "Descripción",
    icon: "description",
  },
  {
    id: "characteristics",
    label: "Características",
    icon: "checklist",
  },
  {
    id: "benefits",
    label: "Beneficios",
    icon: "workspace_premium",
  },
  {
    id: "plan",
    label: "Planes",
    icon: "sell",
  },
];

export default function Features() {
  const carouselRef = useRef(null);

  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
    moved: false,
    captured: false,
  });

  const suppressClickRef = useRef(false);

  const [activeGroup, setActiveGroup] = useState("Todos");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("description");

  const visibleFeatures = useMemo(() => {
    if (activeGroup === "Todos") {
      return features;
    }

    return features.filter((feature) => feature.group === activeGroup);
  }, [activeGroup]);

  const activeGroupInformation = groupInformation[activeGroup];

  const changeGroup = (group) => {
    setActiveGroup(group);

    requestAnimationFrame(() => {
      carouselRef.current?.scrollTo({
        left: 0,
        behavior: "smooth",
      });
    });
  };

  const moveCarousel = (direction) => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    const distance = Math.min(carousel.clientWidth * 0.85, 440);

    carousel.scrollBy({
      left: direction === "next" ? distance : -distance,
      behavior: "smooth",
    });
  };

  const openFeature = (feature) => {
    setSelectedFeature(feature);
    setActiveModalTab("description");
  };

  const closeFeature = () => {
    setSelectedFeature(null);
    setActiveModalTab("description");
  };

  const handlePointerDown = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      moved: false,
      captured: false,
    };

    suppressClickRef.current = false;
  };

  const handlePointerMove = (event) => {
    const dragState = dragStateRef.current;

    if (
      !dragState.active ||
      dragState.pointerId !== event.pointerId ||
      event.pointerType !== "mouse"
    ) {
      return;
    }

    const carousel = event.currentTarget;
    const distance = event.clientX - dragState.startX;

    if (!dragState.moved && Math.abs(distance) > 6) {
      dragState.moved = true;
      dragState.captured = true;
      suppressClickRef.current = true;

      carousel.style.scrollBehavior = "auto";
      carousel.style.scrollSnapType = "none";

      carousel.setPointerCapture?.(event.pointerId);
    }

    if (!dragState.moved) {
      return;
    }

    event.preventDefault();

    carousel.scrollLeft = dragState.scrollLeft - distance;
  };

  const handlePointerEnd = (event) => {
    const dragState = dragStateRef.current;

    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    const carousel = event.currentTarget;
    const didMove = dragState.moved;
    const wasCaptured = dragState.captured;

    if (wasCaptured && carousel.hasPointerCapture?.(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }

    carousel.style.scrollBehavior = "";
    carousel.style.scrollSnapType = "";

    dragStateRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      scrollLeft: carousel.scrollLeft,
      moved: false,
      captured: false,
    };

    if (!didMove) {
      suppressClickRef.current = false;
    }
  };

  const handleFeatureClick = (event, feature) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }

    openFeature(feature);
  };

  useEffect(() => {
    if (!selectedFeature) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        closeFeature();
      }
    };

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [selectedFeature]);

  return (
    <PublicLayout>
      <main className="relative overflow-hidden text-on-surface">
        <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-primary-fixed-dim/30 blur-3xl" />

        <div className="pointer-events-none absolute -right-32 top-72 h-96 w-96 rounded-full bg-secondary-container/50 blur-3xl" />

        <div className="pointer-events-none absolute bottom-40 left-1/3 h-80 w-80 rounded-full bg-primary-container/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <section className="clay-card relative overflow-hidden p-7 sm:p-10 lg:p-14">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-fixed-dim/55 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-secondary-container/55 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              <span className="clay-badge px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em]">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-base text-primary"
                >
                  widgets
                </span>
                Características
              </span>

              <h1 className="mt-7 font-heading text-4xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
                Una plataforma para operar y crecer
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-on-surface-variant sm:text-lg">
                Descubre cada módulo sin sobrecargar la pantalla. Filtra por
                categoría, desliza las tarjetas y consulta todos los detalles
                dentro de una ventana organizada.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="clay-badge px-4 py-2.5 text-sm font-bold">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-lg text-primary"
                  >
                    swipe
                  </span>
                  Carrusel deslizable
                </span>

                <span className="clay-badge px-4 py-2.5 text-sm font-bold">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-lg text-primary"
                  >
                    tab
                  </span>
                  Contenido organizado
                </span>

                <span className="clay-badge px-4 py-2.5 text-sm font-bold">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-lg text-primary"
                  >
                    open_in_new
                  </span>
                  Detalles por módulo
                </span>
              </div>
            </div>
          </section>

          <section aria-labelledby="services-title" className="mt-16">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="clay-icon material-symbols-outlined h-14 w-14 shrink-0 text-[1.65rem]">
                  {activeGroupInformation.icon}
                </span>

                <div>
                  <h2
                    className="font-heading text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl"
                    id="services-title"
                  >
                    {activeGroup}
                  </h2>

                  <p className="mt-2 max-w-2xl leading-7 text-on-surface-variant">
                    {activeGroupInformation.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-auto">
                <button
                  aria-label="Ver módulos anteriores"
                  className="clay-button-secondary material-symbols-outlined h-12 w-12 p-0 text-xl"
                  onClick={() => moveCarousel("previous")}
                  type="button"
                >
                  arrow_back
                </button>

                <button
                  aria-label="Ver módulos siguientes"
                  className="clay-button-primary material-symbols-outlined h-12 w-12 p-0 text-xl"
                  onClick={() => moveCarousel("next")}
                  type="button"
                >
                  arrow_forward
                </button>
              </div>
            </div>

            <div
              aria-label="Categorías de características"
              className="interactive-scroll mt-8 flex gap-3 overflow-x-auto pb-5 pt-2"
              role="tablist"
            >
              {groups.map((group) => {
                const isActive = activeGroup === group;
                const groupData = groupInformation[group];

                return (
                  <button
                    aria-selected={isActive}
                    className={[
                      "flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "clay-button-secondary text-on-surface-variant",
                    ].join(" ")}
                    key={group}
                    onClick={() => changeGroup(group)}
                    role="tab"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-lg"
                    >
                      {groupData.icon}
                    </span>

                    {group}
                  </button>
                );
              })}
            </div>

            <div className="relative mt-3">
              <div
                aria-label="Carrusel de características"
                className="interactive-scroll flex cursor-grab snap-x snap-mandatory select-none gap-6 overflow-x-auto px-1 pb-10 pt-4 scroll-smooth touch-pan-x active:cursor-grabbing"
                onDragStart={(event) => event.preventDefault()}
                onPointerCancel={handlePointerEnd}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                ref={carouselRef}
              >
                {visibleFeatures.map((feature) => (
                  <button
                    aria-label={`Ver detalles de ${feature.title}`}
                    className="clay-card group flex min-h-[25rem] min-w-[88%] snap-start flex-col p-6 text-left sm:min-w-[25rem] sm:p-7 lg:min-w-[calc((100%_-_3rem)/3)]"
                    key={feature.title}
                    onClick={(event) => handleFeatureClick(event, feature)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="clay-icon material-symbols-outlined h-14 w-14 shrink-0 text-[1.75rem]">
                        {feature.icon}
                      </span>

                      {feature.available ? (
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-50 px-3 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-emerald-700">
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                          />
                          Disponible
                        </span>
                      ) : (
                        <span className="rounded-full border border-secondary/15 bg-secondary-container px-3 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-wider text-on-secondary-container">
                          Próximamente
                        </span>
                      )}
                    </div>

                    <div className="mt-7">
                      <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                        {feature.group}
                      </span>

                      <h3 className="mt-2 font-heading text-2xl font-extrabold text-on-surface">
                        {feature.title}
                      </h3>

                      <p className="mt-4 line-clamp-3 leading-7 text-on-surface-variant">
                        {feature.text}
                      </p>
                    </div>

                    <div className="mt-7 grid grid-cols-3 gap-2">
                      {feature.previews.map(([icon, label]) => (
                        <div
                          className="clay-inset flex min-h-24 flex-col items-center justify-center p-3 text-center"
                          key={label}
                        >
                          <span className="material-symbols-outlined text-2xl text-primary">
                            {icon}
                          </span>

                          <span className="mt-2 text-[0.6875rem] font-bold leading-4 text-on-surface-variant">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-7">
                      <div className="flex items-center justify-between gap-4 border-t border-outline-variant/60 pt-5">
                        <span className="text-sm font-extrabold text-primary">
                          Ver información completa
                        </span>

                        <span
                          aria-hidden="true"
                          className="material-symbols-outlined text-xl text-primary transition-transform duration-200 group-hover:translate-x-1"
                        >
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pointer-events-none absolute bottom-10 right-0 top-4 hidden w-20 bg-gradient-to-l from-background to-transparent lg:block" />
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 text-center text-sm font-semibold text-on-surface-variant">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-lg text-primary"
              >
                swipe
              </span>
              Desliza con el dedo o mantén presionado el clic izquierdo y
              arrastra para explorar
            </div>
          </section>

          <section className="mt-20">
            <div className="clay-card relative overflow-hidden p-8 sm:p-10 lg:p-12">
              <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary-fixed-dim/50 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <span className="clay-badge px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em]">
                    Plataforma modular
                  </span>

                  <h2 className="mt-6 font-heading text-3xl font-extrabold leading-tight text-on-surface sm:text-4xl">
                    Usa solamente las herramientas que necesita tu negocio
                  </h2>

                  <p className="mt-4 text-base leading-7 text-on-surface-variant sm:text-lg">
                    Wasita adapta sus módulos, permisos y flujos de trabajo al
                    tipo de empresa y a las responsabilidades de cada usuario.
                  </p>
                </div>

                <div className="clay-inset grid shrink-0 grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                  {[
                    ["inventory_2", "Inventario"],
                    ["point_of_sale", "Ventas"],
                    ["groups", "Equipo"],
                    ["monitoring", "Control"],
                  ].map(([icon, label]) => (
                    <div
                      className="flex min-w-24 flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/70 p-4 text-center shadow-sm"
                      key={label}
                    >
                      <span className="material-symbols-outlined text-2xl text-primary">
                        {icon}
                      </span>

                      <span className="mt-2 text-xs font-bold text-on-surface-variant">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {selectedFeature ? (
        <div
          aria-labelledby="feature-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end justify-center bg-on-surface/45 p-0 backdrop-blur-md sm:items-center sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeFeature();
            }
          }}
          role="dialog"
        >
          <div className="clay-card flex max-h-[94svh] w-full max-w-5xl flex-col overflow-hidden rounded-b-none sm:max-h-[90svh] sm:rounded-[2rem]">
            <div className="relative overflow-hidden border-b border-outline-variant/60 px-5 py-5 sm:px-8 sm:py-7">
              <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-primary-fixed-dim/60 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="clay-icon material-symbols-outlined hidden h-14 w-14 shrink-0 text-[1.75rem] sm:inline-flex">
                    {selectedFeature.icon}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                        {selectedFeature.group}
                      </span>

                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[0.625rem] font-extrabold uppercase tracking-wider",
                          selectedFeature.available
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-secondary-container text-on-secondary-container",
                        ].join(" ")}
                      >
                        {selectedFeature.available
                          ? "Disponible"
                          : "Próximamente"}
                      </span>
                    </div>

                    <h2
                      className="mt-2 font-heading text-2xl font-extrabold text-on-surface sm:text-3xl"
                      id="feature-modal-title"
                    >
                      {selectedFeature.title}
                    </h2>

                    <p className="mt-2 hidden max-w-2xl leading-6 text-on-surface-variant sm:block">
                      {selectedFeature.text}
                    </p>
                  </div>
                </div>

                <button
                  aria-label="Cerrar detalle"
                  className="clay-button-secondary material-symbols-outlined h-11 w-11 shrink-0 p-0 text-xl"
                  onClick={closeFeature}
                  type="button"
                >
                  close
                </button>
              </div>
            </div>

            <div
              aria-label="Secciones del detalle"
              className="interactive-scroll flex shrink-0 gap-2 overflow-x-auto border-b border-outline-variant/60 px-4 py-3 sm:px-8"
              role="tablist"
            >
              {modalTabs.map((tab) => {
                const isActive = activeModalTab === tab.id;

                return (
                  <button
                    aria-selected={isActive}
                    className={[
                      "flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition",
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-on-surface-variant hover:bg-primary-fixed hover:text-primary",
                    ].join(" ")}
                    key={tab.id}
                    onClick={() => setActiveModalTab(tab.id)}
                    role="tab"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-lg"
                    >
                      {tab.icon}
                    </span>

                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
              {activeModalTab === "description" ? (
                <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
                  <div>
                    <span className="clay-badge px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em]">
                      Información general
                    </span>

                    <h3 className="mt-5 font-heading text-2xl font-extrabold text-on-surface">
                      ¿Qué ofrece este módulo?
                    </h3>

                    <p className="mt-4 text-base leading-8 text-on-surface-variant">
                      {selectedFeature.description}
                    </p>

                    <div className="mt-7 rounded-2xl border border-primary/15 bg-primary-fixed/60 p-5">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-2xl text-primary">
                          info
                        </span>

                        <div>
                          <h4 className="font-bold text-on-surface">
                            Integración con Wasita
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                            Este módulo comparte información con las demás áreas
                            de la plataforma para evitar registros repetidos y
                            mantener los datos sincronizados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="clay-inset p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                          Vista previa
                        </p>

                        <h3 className="mt-1 font-heading text-lg font-extrabold text-on-surface">
                          Funciones principales
                        </h3>
                      </div>

                      <span className="material-symbols-outlined text-3xl text-primary">
                        preview
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {selectedFeature.previews.map(([icon, label], index) => (
                        <div
                          className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm"
                          key={label}
                        >
                          <span className="clay-icon material-symbols-outlined h-11 w-11 shrink-0 text-xl">
                            {icon}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-on-surface">{label}</p>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${75 + index * 8}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeModalTab === "characteristics" ? (
                <div>
                  <span className="clay-badge px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em]">
                    Capacidades
                  </span>

                  <h3 className="mt-5 font-heading text-2xl font-extrabold text-on-surface">
                    Características principales
                  </h3>

                  <p className="mt-3 max-w-3xl leading-7 text-on-surface-variant">
                    Estas son las funciones más importantes incluidas o
                    consideradas para este módulo.
                  </p>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    {selectedFeature.characteristics.map(
                      (characteristic, index) => (
                        <div
                          className="clay-inset flex items-start gap-4 p-5"
                          key={characteristic}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-white shadow-md shadow-primary/20">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <p className="pt-1 font-semibold leading-6 text-on-surface">
                            {characteristic}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {activeModalTab === "benefits" ? (
                <div>
                  <span className="clay-badge px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em]">
                    Valor para el negocio
                  </span>

                  <h3 className="mt-5 font-heading text-2xl font-extrabold text-on-surface">
                    Beneficios del módulo
                  </h3>

                  <p className="mt-3 max-w-3xl leading-7 text-on-surface-variant">
                    Diseñado para simplificar procesos, mejorar el control y
                    facilitar el crecimiento de la operación.
                  </p>

                  <div className="mt-7 grid gap-4 md:grid-cols-2">
                    {selectedFeature.benefits.map((benefit) => (
                      <div
                        className="clay-card flex items-start gap-4 p-5"
                        key={benefit}
                      >
                        <span className="material-symbols-outlined rounded-xl bg-emerald-50 p-2 text-xl text-emerald-700">
                          check_circle
                        </span>

                        <p className="font-semibold leading-7 text-on-surface">
                          {benefit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeModalTab === "plan" ? (
                <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                  <div className="clay-card p-6 sm:p-8">
                    <span className="clay-icon material-symbols-outlined h-14 w-14 text-[1.75rem]">
                      {selectedFeature.available ? "verified" : "schedule"}
                    </span>

                    <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                      Disponibilidad
                    </p>

                    <h3 className="mt-2 font-heading text-2xl font-extrabold text-on-surface">
                      {selectedFeature.plan}
                    </h3>

                    <p className="mt-4 leading-7 text-on-surface-variant">
                      {selectedFeature.planDetail}
                    </p>
                  </div>

                  <div className="clay-inset p-6">
                    <h3 className="font-heading text-xl font-extrabold text-on-surface">
                      Estado del módulo
                    </h3>

                    <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/80 bg-white/75 p-4">
                      <span
                        className={[
                          "material-symbols-outlined rounded-xl p-3 text-2xl",
                          selectedFeature.available
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-secondary-container text-on-secondary-container",
                        ].join(" ")}
                      >
                        {selectedFeature.available
                          ? "check_circle"
                          : "pending_actions"}
                      </span>

                      <div>
                        <p className="font-extrabold text-on-surface">
                          {selectedFeature.available
                            ? "Función disponible"
                            : "Función planificada"}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                          {selectedFeature.available
                            ? "Puede habilitarse según los permisos y la suscripción de la empresa."
                            : "Se encuentra contemplada para una futura etapa de Wasita."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-primary/15 bg-primary-fixed/60 p-4">
                      <div className="flex gap-3">
                        <span className="material-symbols-outlined text-xl text-primary">
                          support_agent
                        </span>

                        <p className="text-sm leading-6 text-on-surface-variant">
                          Los límites y condiciones finales pueden configurarse
                          desde la administración general de la plataforma.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-outline-variant/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p className="text-center text-xs font-semibold text-on-surface-variant sm:text-left">
                Presiona Escape o selecciona fuera de la ventana para cerrar.
              </p>

              <button
                className="clay-button-primary min-h-11 px-5 py-2.5 text-sm font-extrabold"
                onClick={closeFeature}
                type="button"
              >
                Entendido
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-lg"
                >
                  check
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PublicLayout>
  );
}
