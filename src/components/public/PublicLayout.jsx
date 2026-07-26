import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authStore";
import WasitaMark from "../ui/WasitaMark";

const links = [
  ["/", "Inicio"],
  ["/features", "Características"],
  ["/pricing", "Planes"],
  ["/about", "Nosotros"],
  ["/contact", "Contacto"],
  ["/help", "Ayuda"],
];

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

export default function PublicLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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
    const desktopViewport = window.matchMedia("(min-width: 1024px)");
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
    <div className="flex min-h-svh flex-col bg-background text-on-surface">
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="clay-glass mx-auto max-w-7xl rounded-[1.5rem] px-3 sm:px-4">
          <div className="flex min-h-16 items-center justify-between gap-3">
            <Link
              aria-label="Ir al inicio de Wasita"
              className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-2"
              onClick={closeMenu}
              to="/"
            >
              <WasitaMark className="h-11 w-11 shrink-0" />

              <span className="min-w-0">
                <span className="block truncate font-heading text-xl font-extrabold tracking-tight text-primary sm:text-2xl">
                  WASITA
                </span>

                <span className="hidden text-[0.625rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant sm:block">
                  Gestión inteligente
                </span>
              </span>
            </Link>

            <nav
              aria-label="Navegación principal"
              className="hidden items-center gap-1 rounded-2xl border border-white/70 bg-surface-container-low/75 p-1.5 shadow-inner lg:flex"
            >
              {links.map(([to, label]) => (
                <NavLink
                  className={({ isActive }) =>
                    [
                      "rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-on-surface-variant hover:bg-white/80 hover:text-primary",
                    ].join(" ")
                  }
                  end={to === "/"}
                  key={to}
                  to={to}
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
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

            <div className="lg:hidden">
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
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm"
            onClick={closeMenuAndRestoreFocus}
            type="button"
          />

          <aside
            aria-label="Menú principal"
            aria-modal="true"
            className="clay-card absolute inset-y-2 right-2 flex h-[calc(100dvh-1rem)] w-[min(24rem,calc(100vw-1rem))] max-w-full flex-col overflow-hidden rounded-[1.75rem]"
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

                <span className="min-w-0">
                  <span className="block truncate font-heading text-xl font-extrabold tracking-tight text-primary">
                    WASITA
                  </span>

                  <span className="block truncate text-[0.625rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Gestión inteligente
                  </span>
                </span>
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
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
              id="public-mobile-menu"
            >
              <div className="clay-inset grid gap-1.5 p-2">
                {links.map(([to, label]) => (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        "flex min-h-12 items-center justify-between rounded-xl px-4 py-3 font-bold transition",
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/25"
                          : "text-on-surface-variant hover:bg-white/75 hover:text-primary",
                      ].join(" ")
                    }
                    end={to === "/"}
                    key={to}
                    onClick={closeMenu}
                    to={to}
                  >
                    {label}

                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined text-lg"
                    >
                      chevron_right
                    </span>
                  </NavLink>
                ))}
              </div>

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
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="flex-1">{children}</div>

      <footer className="relative mt-16 overflow-hidden px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary-fixed-dim/25 blur-3xl" />

        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-secondary-container/60 blur-3xl" />

        <div className="clay-card relative mx-auto max-w-7xl overflow-hidden">
          <div className="grid gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1.35fr_repeat(3,1fr)] lg:px-12 lg:py-14">
            <div className="max-w-sm">
              <Link
                className="inline-flex items-center gap-3 rounded-2xl"
                to="/"
              >
                <span className="clay-icon material-symbols-outlined h-12 w-12 text-[1.55rem]">
                  storefront
                </span>

                <span className="font-heading text-2xl font-extrabold tracking-tight text-primary">
                  WASITA
                </span>
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
                      className="group flex w-fit items-center gap-2 rounded-lg py-1.5 text-sm font-medium text-on-surface-variant transition hover:translate-x-1 hover:text-primary"
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

          <div className="border-t border-outline-variant/60 px-6 py-5 sm:px-8 lg:px-12">
            <div className="flex flex-col gap-3 text-center text-xs font-medium text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:text-left">
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
      </footer>
    </div>
  );
}
