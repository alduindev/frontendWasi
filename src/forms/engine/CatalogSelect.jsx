import { useEffect, useState } from "react";
import { getCatalog } from "../../services/catalogService";

export default function CatalogSelect({
  catalog,
  label,
  name,
  onChange,
  required,
  searchable = false,
  value,
}) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timer = setTimeout(
      () => {
        if (active) setLoading(true);
        getCatalog(catalog, { search: searchable ? search : "" })
          .then((response) => {
            if (active) {
              setItems(response.items);
              setError("");
            }
          })
          .catch((requestError) => {
            if (active) setError(requestError.message);
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
        className="min-h-11 rounded-xl border border-outline-variant bg-white px-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        name={name}
        onChange={onChange}
        required={required}
        value={value || ""}
      >
        <option value="">
          {loading
            ? "Cargando opciones..."
            : error || `Seleccionar ${label.toLowerCase()}`}
        </option>
        {items.map((item) => (
          <option key={item.id} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
      {error ? <small className="font-normal text-error">{error}</small> : null}
    </label>
  );
}
