import { useState } from "react";
import Button from "../../components/atoms/Button";
import Input from "../../components/atoms/Input";
import CatalogSelect from "./CatalogSelect";

function validationMessage(detail) {
  if (detail.type === "missing") return "Este campo es obligatorio.";
  if (detail.type === "string_too_long") {
    return detail.ctx?.max_length
      ? `Máximo ${detail.ctx.max_length} caracteres.`
      : "El texto es demasiado largo.";
  }
  if (detail.type === "string_too_short") {
    return detail.ctx?.min_length
      ? `Mínimo ${detail.ctx.min_length} caracteres.`
      : "El texto es demasiado corto.";
  }
  if (detail.type === "string_pattern_mismatch") {
    return "El formato no es válido.";
  }
  if (detail.type === "extra_forbidden") {
    return "Este dato no está permitido.";
  }
  if (detail.type?.startsWith("date_")) return "Ingresa una fecha válida.";
  return detail.msg || "El valor no es válido.";
}

function toCamelCase(value) {
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function validationErrors(requestError, template) {
  const details = requestError?.details?.detail;
  if (!Array.isArray(details)) return {};
  const fieldNames = new Set(
    template.sections.flatMap((section) =>
      section.fields.map((field) => field.name),
    ),
  );
  return details.reduce((errors, detail) => {
    const location = detail.loc?.[detail.loc.length - 1];
    if (typeof location !== "string") return errors;
    const fieldName = fieldNames.has(location)
      ? location
      : toCamelCase(location);
    if (!fieldNames.has(fieldName)) return errors;
    const message = validationMessage(detail);
    errors[fieldName] = errors[fieldName]
      ? `${errors[fieldName]} ${message}`
      : message;
    return errors;
  }, {});
}

function Field({ field, fieldError, setValue, value, values }) {
  if (field.type === "heading")
    return (
      <div className="border-b border-outline-variant pb-2">
        <h3 className="font-heading text-base font-bold text-on-surface">
          {field.title}
        </h3>
        {field.description ? (
          <p className="mt-1 text-sm font-normal text-on-surface-variant">
            {field.description}
          </p>
        ) : null}
      </div>
    );
  const numeric =
    field.numeric ||
    (field.numericWhen &&
      field.numericWhen.values.includes(values[field.numericWhen.field]));
  const errorId = fieldError ? `${field.name}-error` : undefined;
  const common = {
    "aria-describedby": errorId,
    "aria-invalid": fieldError ? true : undefined,
    name: field.name,
    required: field.required,
    value: value ?? "",
    onChange: (event) => {
      const raw = numeric
        ? event.target.value.replace(/\D/g, "").slice(0, field.maxLength || 99)
        : event.target.value;
      setValue(
        field.name,
        field.type === "number"
          ? raw === ""
            ? ""
            : Number(raw)
          : field.type === "checkbox"
            ? event.target.checked
            : raw,
      );
    },
  };
  if (field.type === "catalog")
    return (
      <CatalogSelect
        {...common}
        catalog={field.catalog}
        label={field.label}
        searchable={field.searchable}
        validationError={fieldError}
      />
    );
  if (field.type === "select")
    return (
      <label className="grid gap-1.5 text-sm font-bold text-on-surface-variant">
        {field.label}
        <select
          {...common}
          className={`min-h-11 rounded-xl border bg-white px-3 font-normal outline-none focus:ring-2 ${fieldError ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant focus:border-primary focus:ring-primary/20"}`}
        >
          {field.options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldError ? (
          <small className="font-normal text-error" id={errorId} role="alert">
            {fieldError}
          </small>
        ) : null}
      </label>
    );
  if (field.type === "radio")
    return (
      <fieldset className="grid gap-1.5 text-sm font-bold text-on-surface-variant">
        <legend>
          {field.label}
          {field.required ? " *" : ""}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {field.options.map((option) => (
            <label
              className={`flex min-h-11 items-center gap-3 rounded-xl border p-3 font-normal ${fieldError ? "border-error" : "border-outline-variant"}`}
              key={option.value}
            >
              <input
                aria-describedby={errorId}
                aria-invalid={fieldError ? true : undefined}
                checked={value === option.value}
                name={field.name}
                onChange={() => setValue(field.name, option.value)}
                required={field.required}
                type="radio"
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
        {fieldError ? (
          <small className="font-normal text-error" id={errorId} role="alert">
            {fieldError}
          </small>
        ) : null}
      </fieldset>
    );
  if (field.type === "textarea")
    return (
      <label className="grid gap-1.5 text-sm font-bold text-on-surface-variant">
        {field.label}
        {field.required ? " *" : ""}
        <textarea
          {...common}
          className={`min-h-24 rounded-xl border p-3 font-normal outline-none focus:ring-2 ${fieldError ? "border-error focus:border-error focus:ring-error/20" : "border-outline-variant focus:border-primary focus:ring-primary/20"}`}
          maxLength={field.nonNumericMaxLength}
          placeholder={field.placeholder}
        />
        {fieldError ? (
          <small className="font-normal text-error" id={errorId} role="alert">
            {fieldError}
          </small>
        ) : null}
        {field.help ? <small>{field.help}</small> : null}
      </label>
    );
  if (field.type === "checkbox")
    return (
      <div className="grid gap-1.5">
        <label
          className={`flex min-h-11 items-center gap-3 rounded-xl border p-3 text-sm font-bold ${fieldError ? "border-error" : "border-outline-variant"}`}
        >
          <input {...common} checked={Boolean(value)} type="checkbox" />
          {field.label}
        </label>
        {fieldError ? (
          <small className="font-normal text-error" id={errorId} role="alert">
            {fieldError}
          </small>
        ) : null}
      </div>
    );
  return (
    <Input
      {...common}
      error={fieldError}
      help={field.help}
      inputMode={numeric ? "numeric" : field.inputMode}
      label={`${field.label}${field.required ? " *" : ""}`}
      max={field.max}
      maxLength={numeric ? field.maxLength : field.nonNumericMaxLength}
      min={field.min}
      minLength={numeric ? field.minLength : field.nonNumericMinLength}
      pattern={numeric ? field.pattern || "\\d+" : field.nonNumericPattern}
      placeholder={field.placeholder}
      step={field.step}
      type={field.type || "text"}
    />
  );
}

export default function DynamicForm({
  initialValues = {},
  onCancel,
  onSubmit,
  submitLabel = "Guardar",
  template,
}) {
  const [values, setValues] = useState(() => ({
    ...template.defaults,
    ...(template.fromInitialValues
      ? template.fromInitialValues(initialValues)
      : initialValues),
  }));
  const [sectionIndex, setSectionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const section = template.sections[sectionIndex];
  const last = sectionIndex === template.sections.length - 1;
  const setValue = (key, value) => {
    setError("");
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setValues((current) => {
      const next = { ...current, [key]: value };
      const derived = template.deriveValues?.(key, value, next) || {};
      return { ...next, ...derived };
    });
  };
  const validateSection = () => {
    const missing = section.fields.find(
      (field) => {
        const value = values[field.name];
        const emptyString = typeof value === "string" && value.trim() === "";
        return (
          field.required &&
          (emptyString ||
            value == null ||
            field.invalidValues?.includes(value))
        );
      },
    );
    if (missing) {
        setFieldErrors((current) => ({
          ...current,
          [missing.name]: "Este campo es obligatorio.",
        }));
      setError(`Completa el campo “${missing.label}” para continuar.`);
      return false;
    }
    return true;
  };
  const next = (event) => {
    event?.preventDefault();
    if (!validateSection()) return;
    setError("");
    setSectionIndex((current) =>
      Math.min(current + 1, template.sections.length - 1),
    );
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!last) {
      next(event);
      return;
    }
    if (!validateSection()) return;
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      await onSubmit(template.toPayload ? template.toPayload(values) : values);
    } catch (requestError) {
      const nextFieldErrors = validationErrors(requestError, template);
      if (Object.keys(nextFieldErrors).length) {
        setFieldErrors(nextFieldErrors);
        const invalidSectionIndex = template.sections.findIndex((item) =>
          item.fields.some((field) => nextFieldErrors[field.name]),
        );
        if (invalidSectionIndex !== -1) setSectionIndex(invalidSectionIndex);
        setError("Revisa los campos marcados.");
      } else {
        setError(requestError.message);
      }
    } finally {
      setSaving(false);
    }
  };
  return (
    <form className="grid gap-5 p-4 sm:p-6" onSubmit={submit}>
      {template.sections.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto rounded-2xl bg-surface-container-low p-2">
          {template.sections.map((item, index) => (
            <button
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold ${index === sectionIndex ? "bg-primary text-white shadow-md" : index < sectionIndex ? "bg-primary-fixed text-primary" : "text-on-surface-variant"}`}
              key={item.id}
              onClick={() => {
                if (index < sectionIndex || validateSection()) {
                  setError("");
                  setSectionIndex(index);
                }
              }}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {index < sectionIndex ? "check_circle" : item.icon || "edit"}
              </span>
              {item.title}
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <div className="flex gap-2 rounded-xl bg-error-container p-3 text-sm text-on-error-container">
          <span className="material-symbols-outlined text-lg">error</span>
          <p>{error}</p>
        </div>
      ) : null}
      <fieldset className="grid gap-4 rounded-2xl border border-outline-variant p-4">
        <legend className="px-2 text-lg font-bold">
          <span className="material-symbols-outlined mr-2 align-middle text-primary">
            {section.icon || "edit"}
          </span>
          {section.title}
        </legend>
        {section.help ? (
          <p className="text-sm text-on-surface-variant">{section.help}</p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.fields.map((field) => (
            <div
              className={field.fullWidth ? "sm:col-span-2 lg:col-span-3" : ""}
              key={field.name}
            >
              <Field
                field={field}
                fieldError={fieldErrors[field.name]}
                setValue={setValue}
                value={values[field.name]}
                values={values}
              />
            </div>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row">
        <div>
          {sectionIndex === 0 ? (
            onCancel ? (
              <Button onClick={onCancel} type="button" variant="secondary">
                Cancelar
              </Button>
            ) : null
          ) : (
            <Button
              onClick={() => {
                setError("");
                setSectionIndex((current) => current - 1);
              }}
              type="button"
              variant="secondary"
            >
              Anterior
            </Button>
          )}
        </div>
        {last ? (
          <Button disabled={saving} type="submit">
            {saving ? "Guardando..." : submitLabel}
          </Button>
        ) : (
          <Button onClick={next} type="button">
            Continuar
          </Button>
        )}
      </div>
    </form>
  );
}
