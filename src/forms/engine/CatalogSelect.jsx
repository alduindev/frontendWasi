import { useEffect, useState } from "react";
import { getCatalog } from "../../services/catalogService";

export default function CatalogSelect({
  catalog,
  label,
  name,
  onChange,
  required,
  searchable = false,
  validationError,
  value,
}) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const errorId = validationError ? `${name}-error` : undefined;
  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      () => {
        if (active) setLoading(true);
        getCatalog(catalog, { search: searchable ? search : "" })
          .then((response) => {
            if (active) {
              setItems(response.items);
              setLoadError("");
            }
          })
          .catch((requestError) => {
            if (active) setLoadError(requestError.message);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      },
      searchable ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [catalog, search, searchable]);
  return (
    <label className="grid gap-1.5 text-sm font-bold text-on-surface-variant">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      {searchable ? (
        <input
          aria-label={`Buscar ${label}`}
          className="min-h-10 rounded-xl border border-outline-variant px-3 text-sm font-normal"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Buscar ${label.toLowerCase()}...`}
          value={search}
        />
      ) : null}
      <select
        aria-describedby={errorId}
        aria-invalid={validationError ? true : undefined}
        className={`min-h-11 rounded-xl border bg-white px-3 font-normal outline-none transition focus:ring-2 ${validationError ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant focus:border-primary focus:ring-primary/20"}`}
        name={name}
        onChange={onChange}
        required={required}
        value={value || ""}
      >
        <option value="">
          {loading
            ? "Cargando opciones..."
            : loadError || `Seleccionar ${label.toLowerCase()}`}
        </option>
        {items.map((item) => (
          <option key={item.id} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
      {loadError ? <small className="font-normal text-error">{loadError}</small> : null}
      {validationError ? <small className="font-normal text-error" id={errorId} role="alert">{validationError}</small> : null}
    </label>
  );
}
