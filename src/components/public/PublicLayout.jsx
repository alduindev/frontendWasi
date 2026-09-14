import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authStore";
import WasitaMark from "../ui/WasitaMark";

const footerGroups = [
  [
    "Producto",
    [
      ["/features", "Características"],
      ["/pricing", "Planes"],
      ["/status", "Estado del sistema"],
    ],
  ],
  [
    "Empresa",
    [
      ["/about", "Nosotros"],
      ["/contact", "Contacto"],
      ["/help", "Centro de ayuda"],
    ],
  ],
  [
    "Legal",
    [
      ["/privacy", "Privacidad"],
      ["/terms", "Términos"],
      ["/complaints", "Libro de reclamaciones"],
      ["/api-docs", "Documentación API"],
    ],
  ],
];

function CompactFooter() {
  return (
    <footer className="public-compact-footer shrink-0 border-t border-outline-variant/70 bg-surface-container-lowest px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between gap-4 text-xs text-on-surface-variant">
        <span className="shrink-0">© {new Date().getFullYear()} Wasita</span>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children, compactFooter = false, homeShell = compactFooter }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [footerSection, setFooterSection] = useState("");
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerCloseButtonRef = useRef(null);
  const destination =
    user?.role === "super_admin"
      ? "/platform"
      : user?.role === "operator"
        ? "/pos"
        : "/dashboard";

  const closeMenu = () => {
    setOpen(false);
  };

  const closeMenuAndRestoreFocus = () => {
    setOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const exit = async () => {
    setOpen(false);
    await logout();
    navigate("/");
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const desktopViewport = window.matchMedia("(min-width: 1280px)");
    const focusFrame = window.requestAnimationFrame(() => {
      drawerCloseButtonRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        drawerRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        drawerRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const handleViewportChange = (event) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    desktopViewport.addEventListener("change", handleViewportChange);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      desktopViewport.removeEventListener("change", handleViewportChange);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className={`public-site flex min-h-svh min-w-0 w-full flex-col bg-background text-on-surface ${homeShell ? "public-home" : ""}`}>
      <header className={`${homeShell ? "absolute left-0 right-0" : "sticky"} top-0 z-50 shrink-0 px-3 pt-3 sm:px-4 sm:pt-4`}>
        <div className="clay-glass mx-auto max-w-7xl rounded-xl px-3 sm:px-4">
          <div className="flex min-h-16 items-center justify-between gap-3">
            <Link
              aria-label="Ir al inicio de Wasita"
              className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-2"
              onClick={closeMenu}
              to="/"
            >
              <WasitaMark className="h-11 w-11 shrink-0" />
            </Link>

            <div className="hidden items-center justify-self-end gap-2 xl:flex">
              {isAuthenticated ? (
                <>
                  <Link
                    className="clay-button-primary min-h-11 px-4 py-2.5 text-sm font-bold"
                    to={destination}
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-lg"
                    >
                      dashboard
                    </span>
                    Ir al panel
                  </Link>

                  <button
                    className="clay-button-secondary min-h-11 px-4 py-2.5 text-sm font-bold"
                    onClick={exit}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-lg"
                    >
                      logout
                    </span>
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link
                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary-fixed hover:text-on-primary-fixed"
                    to="/login"
                  >
                    Iniciar sesión
                  </Link>

                  <Link
                    className="clay-button-primary min-h-11 px-4 py-2.5 text-sm font-bold"
                    to="/register"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-lg"
                    >
                      rocket_launch
                    </span>
                    Comenzar gratis
                  </Link>
                </>
              )}
            </div>

            <div className="xl:hidden">
              <button
                aria-controls="public-mobile-menu"
                aria-expanded={open}
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                className="clay-button-secondary material-symbols-outlined min-h-11 min-w-11 p-2.5 text-xl"
                onClick={() => setOpen((value) => !value)}
                ref={menuButtonRef}
                type="button"
              >
                {open ? "close" : "menu"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[70] xl:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
            onClick={closeMenuAndRestoreFocus}
            type="button"
          />

          <aside
            aria-label="Menú principal"
            aria-modal="true"
            className="clay-card absolute inset-0 flex h-full w-full max-w-none flex-col overflow-y-auto rounded-none bg-surface-container-lowest"
            ref={drawerRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between gap-3 border-b border-outline-variant/60 px-4 py-3">
              <Link
                aria-label="Ir al inicio de Wasita"
                className="flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1"
                onClick={closeMenu}
                to="/"
              >
                <WasitaMark className="h-11 w-11 shrink-0" />
              </Link>

              <button
                aria-label="Cerrar menú"
                className="clay-button-secondary material-symbols-outlined min-h-11 min-w-11 shrink-0 p-2.5 text-xl"
                onClick={closeMenuAndRestoreFocus}
                ref={drawerCloseButtonRef}
                type="button"
              >
                close
              </button>
            </div>

            <nav
              aria-label="Navegación móvil"
              className="flex-1 px-6 py-8"
              id="public-mobile-menu"
            >
              <div className="flex min-h-[calc(100dvh-6rem)] flex-col justify-center border-t border-outline-variant/70 pt-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Acceso</p>
                <div className="mt-3 grid gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      className="clay-button-primary min-h-12 w-full px-4 py-3 text-center font-bold"
                      onClick={closeMenu}
                      to={destination}
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-xl"
                      >
                        dashboard
                      </span>
                      Ir al panel
                    </Link>

                    <button
                      className="clay-button-secondary min-h-12 w-full px-4 py-3 font-bold"
                      onClick={exit}
                      type="button"
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-xl"
                      >
                        logout
                      </span>
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      className="clay-button-secondary min-h-12 w-full px-4 py-3 text-center font-bold"
                      onClick={closeMenu}
                      to="/login"
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-xl"
                      >
                        login
                      </span>
                      Iniciar sesión
                    </Link>

                    <Link
                      className="clay-button-primary min-h-12 w-full px-4 py-3 text-center font-bold"
                      onClick={closeMenu}
                      to="/register"
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-xl"
                      >
                        rocket_launch
                      </span>
                      Comenzar gratis
                    </Link>
                  </>
                )}
                </div>
              </div>
            </nav>
          </aside>
        </div>
      ) : null}

      <div className={`min-w-0 w-full flex-1 ${homeShell ? "public-home-content" : ""}`}>{children}</div>

      {compactFooter ? <CompactFooter /> : <footer
        className="relative mt-10 overflow-hidden px-3 sm:px-4 xl:mt-16"
        style={{
          paddingBottom:
            "max(0.75rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary-fixed-dim/25 blur-3xl" />

        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-secondary-container/60 blur-3xl" />

        <div className="clay-card relative mx-auto max-w-7xl overflow-hidden">
          <div className="px-4 py-5 sm:px-6 sm:py-6 xl:hidden">
            <Link
              aria-label="Ir al inicio de Wasita"
              className="inline-flex min-h-11 items-center gap-3 rounded-2xl"
              to="/"
            >
              <WasitaMark className="h-10 w-10 shrink-0" />
            </Link>

            <p className="mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
              Inventario, ventas y operaciones conectadas para gestionar tu
              negocio desde cualquier lugar.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="clay-badge min-h-9 px-3 py-1.5 text-xs font-bold">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-base text-primary"
                >
                  verified
                </span>
                Gestión segura
              </span>

              <span className="clay-badge min-h-9 px-3 py-1.5 text-xs font-bold">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-base text-primary"
                >
                  cloud_done
                </span>
                Disponible en línea
              </span>
            </div>

            <div className="mt-5 grid gap-2">
              {footerGroups.map(([title, items]) => {
                const expanded = footerSection === title;
                const sectionId = `public-footer-${title.toLowerCase()}`;

                return (
                  <section
                    className="group overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-low/70"
                    key={title}
                  >
                    <h2>
                      <button
                        aria-controls={sectionId}
                        aria-expanded={expanded}
                        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left font-heading text-sm font-extrabold text-on-surface outline-none transition hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                        onClick={() =>
                          setFooterSection((current) =>
                            current === title ? "" : title,
                          )
                        }
                        type="button"
                      >
                        {title}

                        <span
                          aria-hidden="true"
                          className={`material-symbols-outlined text-xl text-primary transition-transform duration-200 ${
                            expanded ? "rotate-180" : ""
                          }`}
                        >
                          expand_more
                        </span>
                      </button>
                    </h2>

                    {expanded ? (
                      <div
                        className="grid border-t border-outline-variant/50 px-2 py-1"
                        id={sectionId}
                      >
                        {items.map(([to, label]) => (
                          <Link
                            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-white/75 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            key={to}
                            to={to}
                          >
                            {label}

                            <span
                              aria-hidden="true"
                              className="material-symbols-outlined text-lg"
                            >
                              chevron_right
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>

          <div className="hidden gap-10 px-12 py-14 xl:grid xl:grid-cols-[1.35fr_repeat(3,1fr)]">
            <div className="max-w-sm">
              <Link
                className="inline-flex items-center gap-3 rounded-2xl"
                to="/"
              >
                <WasitaMark className="h-12 w-12 shrink-0" />
              </Link>

              <p className="mt-5 text-sm leading-7 text-on-surface-variant">
                Inventario, ventas y operaciones para negocios que quieren
                crecer con procesos claros, información centralizada y un equipo
                mejor organizado.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="clay-badge px-3 py-2 text-xs font-bold">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-base text-primary"
                  >
                    verified
                  </span>
                  Gestión segura
                </span>

                <span className="clay-badge px-3 py-2 text-xs font-bold">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-base text-primary"
                  >
                    cloud_done
                  </span>
                  Disponible en línea
                </span>
              </div>
            </div>

            {footerGroups.map(([title, items]) => (
              <div key={title}>
                <h2 className="font-heading text-base font-extrabold text-on-surface">
                  {title}
                </h2>

                <div className="mt-4 grid gap-2">
                  {items.map(([to, label]) => (
                    <Link
                      className="group flex min-h-11 w-fit items-center gap-2 rounded-lg py-2.5 text-sm font-medium text-on-surface-variant transition hover:translate-x-1 hover:text-primary"
                      key={to}
                      to={to}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-outline-variant transition group-hover:bg-primary"
                      />

                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant/60 py-3 pl-4 pr-16 sm:pl-6 sm:pr-32 xl:py-5 xl:pl-12 xl:pr-36">
            <div className="flex flex-col gap-1.5 text-center text-xs font-medium leading-5 text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:text-left xl:gap-3">
              <p>
                © {new Date().getFullYear()} Wasita. Todos los derechos
                reservados.
              </p>

              <p className="flex items-center justify-center gap-1.5 sm:justify-end">
                Hecho para negocios que quieren crecer
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-base text-primary"
                >
                  favorite
                </span>
              </p>
            </div>
          </div>
        </div>
      </footer>}
    </div>
  );
}
