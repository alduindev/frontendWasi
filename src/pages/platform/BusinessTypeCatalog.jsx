import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createBusinessType,
  getPlatformBusinessTypes,
  getPlatformIndustryCategories,
  updateBusinessType,
  updateIndustryCategory,
} from "../../services/businessTypeService";

const field =
  "min-h-11 rounded-xl border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
export default function BusinessTypeCatalog() {
  const [types, setTypes] = useState([]),
    [categories, setCategories] = useState([]),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [category, setCategory] = useState("all"),
    [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    industryCategoryId: "",
    description: "",
    icon: "store",
    color: "#59006a",
    sortOrder: 0,
    status: "active",
    modules: [],
  });
  const load = useCallback(
    () =>
      Promise.all([getPlatformBusinessTypes(), getPlatformIndustryCategories()])
        .then(([t, c]) => {
          setTypes(t);
          setCategories(c);
          setForm((v) => ({
            ...v,
            industryCategoryId: v.industryCategoryId || c[0]?.id || "",
          }));
        })
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const visible = useMemo(
    () =>
      types.filter(
        (x) =>
          (filter === "all" || x.status === filter) &&
          (category === "all" || x.industryCategoryId === category) &&
          `${x.name} ${x.description} ${x.slug}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [types, query, filter, category],
  );
  const counts = {
    total: types.length,
    active: types.filter((x) => x.status === "active").length,
    inactive: types.filter((x) => x.status === "inactive").length,
    categories: categories.filter((x) => x.status === "active").length,
  };
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createBusinessType(form);
      setForm((v) => ({ ...v, name: "", slug: "", description: "" }));
      await load();
    } catch (x) {
      setError(x.message);
    }
  };
  const toggleType = async (item) => {
    try {
      await updateBusinessType(item.id, {
        status: item.status === "active" ? "inactive" : "active",
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const toggleCategory = async (item) => {
    try {
      await updateIndustryCategory(item.id, {
        status: item.status === "active" ? "inactive" : "active",
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="min-h-svh bg-background p-4 text-on-surface sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              SUPER ADMIN · ESTRUCTURA INDUSTRIAL
            </p>
            <h1 className="font-heading text-3xl font-bold">
              Categorías y tipos de negocio
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Controla qué rubros están disponibles para nuevas empresas.
            </p>
          </div>
          <Link
            className="rounded-xl border border-outline-variant bg-white px-4 py-3 font-bold"
            to="/platform"
          >
            Volver a plataforma
          </Link>
        </header>
        {error ? (
          <div className="mt-4 rounded-xl bg-error-container p-3 text-on-error-container">
            {error}
          </div>
        ) : null}
        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Categorías activas", counts.categories, "category"],
            ["Tipos totales", counts.total, "account_tree"],
            ["Tipos activos", counts.active, "check_circle"],
            ["Tipos inactivos", counts.inactive, "pause_circle"],
          ].map(([label, value, icon]) => (
            <article
              className="rounded-2xl border border-outline-variant bg-white p-4"
              key={label}
            >
              <span className="material-symbols-outlined text-primary">
                {icon}
              </span>
              <p className="mt-2 text-2xl font-extrabold">{value}</p>
              <p className="text-xs font-semibold text-on-surface-variant">
                {label}
              </p>
            </article>
          ))}
        </section>
        <section className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Categorías industriales</h2>
              <p className="text-sm text-on-surface-variant">
                Una categoría inactiva oculta todos sus rubros en el registro.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {categories.map((c) => (
              <article
                className={`min-w-64 rounded-2xl border bg-white p-4 ${c.status === "active" ? "border-outline-variant" : "border-dashed border-outline opacity-75"}`}
                key={c.id}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ color: c.color }}
                  >
                    {c.icon}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${c.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}
                  >
                    {c.status === "active" ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <h3 className="mt-2 font-bold">{c.name}</h3>
                <p className="mt-1 min-h-10 text-xs text-on-surface-variant">
                  {c.description}
                </p>
                <p className="mt-3 text-xs font-semibold">
                  {c.activeBusinessTypesCount} activos de {c.businessTypesCount}{" "}
                  tipos
                </p>
                <button
                  className="mt-3 rounded-xl border border-outline-variant px-3 py-2 text-xs font-bold"
                  onClick={() => toggleCategory(c)}
                  type="button"
                >
                  {c.status === "active"
                    ? "Desactivar categoría"
                    : "Activar categoría"}
                </button>
              </article>
            ))}
          </div>
        </section>
        <div className="mt-6 grid gap-5 xl:grid-cols-[340px_1fr]">
          <form
            className="grid h-max gap-3 rounded-3xl border border-outline-variant bg-white p-5"
            onSubmit={submit}
          >
            <h2 className="text-xl font-bold">Nuevo tipo de negocio</h2>
            <input
              className={field}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                  slug: e.target.value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, ""),
                })
              }
              placeholder="Nombre"
              required
              value={form.name}
            />
            <select
              className={field}
              onChange={(e) =>
                setForm({ ...form, industryCategoryId: e.target.value })
              }
              required
              value={form.industryCategoryId}
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.status === "active" ? "activa" : "inactiva"}
                </option>
              ))}
            </select>
            <input
              className={field}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="slug"
              required
              value={form.slug}
            />
            <textarea
              className={`${field} min-h-24 py-3`}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Descripción"
              value={form.description}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className={field}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="Icono Material"
                value={form.icon}
              />
              <input
                className="h-11 w-full rounded-xl"
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                type="color"
                value={form.color}
              />
            </div>
            <button
              className="min-h-11 rounded-xl bg-primary font-bold text-white"
              type="submit"
            >
              Crear tipo
            </button>
          </form>
          <section>
            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <input
                className={`${field} w-full`}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, slug o descripción"
                value={query}
              />
              <select
                className={field}
                onChange={(e) => setCategory(e.target.value)}
                value={category}
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                className={field}
                onChange={(e) => setFilter(e.target.value)}
                value={filter}
              >
                <option value="all">Activos e inactivos</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>
            <p className="mt-3 text-sm font-semibold text-on-surface-variant">
              Mostrando {visible.length} de {types.length} tipos
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => {
                const cat = categories.find(
                  (c) => c.id === item.industryCategoryId,
                );
                return (
                  <article
                    className="rounded-2xl border border-outline-variant bg-white p-4"
                    key={item.id}
                  >
                    <div className="flex justify-between">
                      <span
                        className="material-symbols-outlined text-3xl"
                        style={{ color: item.color }}
                      >
                        {item.icon}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}
                      >
                        {item.status === "active" ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-wide text-primary">
                      {cat?.name || "Sin categoría"}
                    </p>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="mt-1 min-h-10 text-xs leading-5 text-on-surface-variant">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-outline">
                      {item.slug} · orden {item.sortOrder}
                    </p>
                    <button
                      className="mt-3 rounded-xl border border-outline-variant px-3 py-2 text-sm font-bold"
                      onClick={() => toggleType(item)}
                      type="button"
                    >
                      {item.status === "active" ? "Desactivar" : "Activar"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
