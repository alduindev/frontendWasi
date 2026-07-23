import { useEffect, useMemo, useRef, useState } from "react";

export default function HelpCenter({
  onClose,
  onReset,
  onStart,
  open,
  progress,
  tutorials,
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tutorials.filter(
      (tour) =>
        !q || `${tour.title} ${tour.keywords}`.toLowerCase().includes(q),
    );
  }, [query, tutorials]);
  const completed = tutorials.filter(
    (tour) => progress[tour.id]?.status === "completed",
  ).length;
  const percent = Math.round((completed / Math.max(tutorials.length, 1)) * 100);
  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 50);
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[190] bg-black/50"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        aria-label="Centro de ayuda"
        aria-modal="true"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"
        role="dialog"
      >
        <header className="border-b border-outline-variant p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Wasita
              </p>
              <h2 className="font-heading text-2xl font-bold">
                Centro de ayuda
              </h2>
            </div>
            <button
              aria-label="Cerrar centro de ayuda"
              className="material-symbols-outlined min-h-11 min-w-11 rounded-full hover:bg-surface-container-high"
              onClick={onClose}
              type="button"
            >
              close
            </button>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-sm font-bold">
              <span>Progreso de aprendizaje</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-on-surface-variant">
              {completed} de {tutorials.length} tutoriales completados
            </p>
          </div>
          <label className="relative mt-4 block">
            <span className="sr-only">Buscar ayuda</span>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="min-h-11 w-full rounded-xl border border-outline-variant pl-10 pr-3 outline-none focus:border-primary"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar ventas, inventario, usuarios..."
              ref={searchRef}
              value={query}
            />
          </label>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid gap-2">
            {filtered.map((tour) => {
              const status = progress[tour.id]?.status;
              return (
                <button
                  className="flex items-center gap-3 rounded-2xl border border-outline-variant p-3 text-left transition hover:border-primary hover:bg-surface-container-low"
                  key={tour.id}
                  onClick={() => onStart(tour)}
                  type="button"
                >
                  <span
                    className={`material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-primary-fixed text-on-primary-fixed"}`}
                  >
                    {status === "completed"
                      ? "check"
                      : status === "skipped"
                        ? "schedule"
                        : "play_arrow"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{tour.title}</span>
                    <span className="block text-xs text-on-surface-variant">
                      {status === "completed"
                        ? "Completado · repetir"
                        : status === "skipped"
                          ? "Omitido · continuar"
                          : "Pendiente"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <section className="mt-6 rounded-2xl bg-surface-container-low p-4">
            <h3 className="font-bold">Consejos rápidos</h3>
            <ul className="mt-2 grid gap-2 text-sm text-on-surface-variant">
              <li>• Revisa alertas de stock antes de iniciar ventas.</li>
              <li>• Usa una cuenta distinta para cada operador.</li>
              <li>• Verifica cliente y método de pago antes de emitir.</li>
            </ul>
          </section>
          <section className="mt-4 rounded-2xl border border-dashed border-outline-variant p-4">
            <h3 className="font-bold">Preguntas frecuentes</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Los datos operativos provienen de la API. Los tutoriales solo
              guardan tu progreso visual en este navegador.
            </p>
          </section>
        </div>
        <footer className="border-t border-outline-variant p-4">
          <button
            className="min-h-11 w-full rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:border-primary"
            onClick={onReset}
            type="button"
          >
            Reiniciar todo el onboarding
          </button>
        </footer>
      </aside>
    </div>
  );
}
