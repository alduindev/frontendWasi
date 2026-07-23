import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getIndustryTemplates,
  getPlatformModules,
} from "../../services/platformService";
export default function PlatformModules() {
  const [modules, setModules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getPlatformModules(), getIndustryTemplates()])
      .then(([m, t]) => {
        setModules(m);
        setTemplates(t);
      })
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main className="min-h-svh bg-background p-4 text-on-surface sm:p-8">
      <div className="mx-auto max-w-7xl">
        <Link className="font-bold text-primary" to="/platform">
          ← Plataforma
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-primary">
          Motor modular
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">
          Modulos y plantillas industriales
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Configuracion real obtenida del backend.
        </p>
        {error ? (
          <p className="mt-5 rounded-xl bg-error-container p-4">{error}</p>
        ) : null}
        <section className="mt-8">
          <h2 className="text-xl font-bold">
            Catalogo de modulos ({modules.length})
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <article
                className="rounded-2xl border border-outline-variant bg-white p-4"
                key={m.id}
              >
                <span className="material-symbols-outlined text-3xl text-primary">
                  {m.icon}
                </span>
                <h3 className="mt-2 font-bold">{m.name}</h3>
                <code className="text-xs text-on-surface-variant">
                  {m.code}
                </code>
                <p className="mt-2 text-xs">
                  {m.category} · {m.route}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="text-xl font-bold">Plantillas ({templates.length})</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {templates.map((t) => (
              <article
                className="rounded-2xl border border-outline-variant bg-white p-5"
                key={t.id}
              >
                <div className="flex justify-between">
                  <h3 className="font-bold">{t.name}</h3>
                  <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold">
                    {t.dashboardKey}
                  </span>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">
                  {t.modules.join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
