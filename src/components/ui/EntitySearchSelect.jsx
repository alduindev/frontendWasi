import { useEffect, useId, useMemo, useRef, useState } from "react";
import { matchesEntitySearch } from "../../utils/entitySearch";

const defaultGetId = (item) => item.id;
const defaultGetLabel = (item) => item.name || item.label || "";
const defaultGetMeta = () => "";
const defaultGetSearchValues = (item) => Object.values(item);

export default function EntitySearchSelect({
  className = "",
  emptyMessage = "No encontramos coincidencias.",
  getId = defaultGetId,
  getLabel = defaultGetLabel,
  getMeta = defaultGetMeta,
  getSearchValues = defaultGetSearchValues,
  items = [],
  label,
  name,
  onChange,
  placeholder = "Buscar por nombre, DNI o celular",
  required = false,
  value = "",
}) {
  const listboxId = useId();
  const labelId = useId();
  const rootRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => items.find((item) => String(getId(item)) === String(value)),
    [getId, items, value],
  );
  const visible = useMemo(
    () =>
      items
        .filter((item) => matchesEntitySearch(item, query, getSearchValues))
        .slice(0, 40),
    [getSearchValues, items, query],
  );

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const choose = (item) => {
    onChange?.(String(getId(item)), item);
    setQuery("");
    setOpen(false);
  };
  const clear = () => {
    onChange?.("", null);
    setQuery("");
    setOpen(true);
  };
  const keyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        Math.min(current + 1, Math.max(visible.length - 1, 0)),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter" && open && visible[activeIndex]) {
      event.preventDefault();
      choose(visible[activeIndex]);
    }
  };

  return (
    <div className={`grid min-w-0 gap-1 text-sm font-medium ${className}`}>
      {label ? <span id={labelId}>{label}</span> : null}
      <span className="relative" ref={rootRef}>
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
          person_search
        </span>
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={label ? labelId : undefined}
          aria-required={required}
          autoComplete="off"
          className="min-h-11 w-full rounded-xl border border-outline-variant bg-white py-2 pl-11 pr-11 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={keyDown}
          pattern={required && !value ? "(?!)" : undefined}
          placeholder={
            selected ? `Seleccionado: ${getLabel(selected)}` : placeholder
          }
          role="combobox"
          required={required && !value}
          value={query}
        />
        {selected ? (
          <button
            aria-label="Quitar selección"
            className="material-symbols-outlined absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            onClick={clear}
            type="button"
          >
            close
          </button>
        ) : (
          <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
        )}

        {open ? (
          <span
            className="absolute left-0 right-0 top-[calc(100%+.35rem)] z-[90] grid max-h-64 gap-1 overflow-y-auto rounded-2xl border border-outline-variant bg-white p-2 shadow-2xl shadow-primary/15"
            id={listboxId}
            role="listbox"
          >
            {visible.map((item, index) => {
              const id = String(getId(item));
              const active = index === activeIndex;
              const checked = id === String(value);
              const meta = getMeta(item);
              return (
                <button
                  aria-selected={checked}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                    active || checked
                      ? "bg-primary-fixed text-primary"
                      : "hover:bg-surface-container-low"
                  }`}
                  key={id}
                  onClick={() => choose(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  type="button"
                >
                  <span className="material-symbols-outlined shrink-0 text-xl">
                    {checked ? "check_circle" : "person"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">{getLabel(item)}</b>
                    {meta ? (
                      <small className="block truncate text-on-surface-variant">
                        {meta}
                      </small>
                    ) : null}
                  </span>
                </button>
              );
            })}
            {!visible.length ? (
              <span className="p-4 text-center text-sm text-on-surface-variant">
                {emptyMessage}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
      {selected ? (
        <span className="flex min-w-0 items-center gap-2 rounded-xl bg-primary-fixed px-3 py-2 text-primary">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span className="min-w-0">
            <b className="block truncate">{getLabel(selected)}</b>
            {getMeta(selected) ? (
              <small className="block truncate text-on-surface-variant">
                {getMeta(selected)}
              </small>
            ) : null}
          </span>
        </span>
      ) : null}
      {name ? (
        <input name={name} readOnly type="hidden" value={value} />
      ) : null}
    </div>
  );
}
