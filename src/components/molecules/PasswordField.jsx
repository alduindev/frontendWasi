import { useRef, useState } from "react";
import AuthField from "../auth/AuthField";
import Input from "../atoms/Input";

function Toggle({ inputRef, setVisible, visible }) {
  const toggle = () => {
    setVisible((value) => !value);
    requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true }),
    );
  };
  return (
    <button
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      aria-pressed={visible}
      className="absolute right-1 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-xl text-outline transition-colors hover:bg-primary-fixed hover:text-primary active:bg-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
      onClick={toggle}
      onPointerDown={(event) => event.preventDefault()}
      title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      type="button"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-xl">
        {visible ? "visibility_off" : "visibility"}
      </span>
    </button>
  );
}

export default function PasswordField({
  className = "",
  compareTo,
  defaultValue = "",
  enforcePolicy = true,
  helperText,
  id,
  label = "Contraseña",
  maxLength = 128,
  minLength = 8,
  name,
  onChange,
  required,
  showFeedback = false,
  value,
  variant = "default",
  ...props
}) {
  const inputRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const current = value ?? internalValue;
  const confirmation = compareTo !== undefined && current.length > 0;
  const matches = confirmation && current === compareTo;
  const handleChange = (event) => {
    if (value === undefined) setInternalValue(event.target.value);
    onChange?.(event);
  };
  const rules = [
    [`Al menos ${minLength} caracteres`, current.length >= Number(minLength)],
    ["Una letra mayúscula", /[A-ZÁÉÍÓÚÑ]/.test(current)],
    ["Un número", /\d/.test(current)],
    ["Un carácter especial", /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/.test(current)],
  ];
  const valid = rules.every(([, ok]) => ok);
  const feedback = confirmation ? (
    <p
      aria-live="polite"
      className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${matches && (!enforcePolicy || valid) ? "text-emerald-700" : "text-error"}`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-base">
        {matches && (!enforcePolicy || valid) ? "check_circle" : "error"}
      </span>
      {matches && (!enforcePolicy || valid)
        ? "Las contraseñas coinciden"
        : "Las contraseñas no coinciden o no cumplen los requisitos"}
    </p>
  ) : showFeedback && enforcePolicy ? (
    <div className="mt-2">
      {helperText ? (
        <p className="mb-2 text-xs text-on-surface-variant">{helperText}</p>
      ) : null}
      <ul aria-live="polite" className="grid gap-1 text-xs sm:grid-cols-2">
        {rules.map(([text, ok]) => (
          <li
            className={`flex items-center gap-1 font-semibold ${ok ? "text-emerald-700" : "text-on-surface-variant"}`}
            key={text}
          >
            <span className="material-symbols-outlined text-sm">
              {ok ? "check_circle" : "radio_button_unchecked"}
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  ) : helperText ? (
    <p className="mt-1.5 text-xs text-on-surface-variant">{helperText}</p>
  ) : null;
  const policyPattern =
    "(?=.*[A-ZÁÉÍÓÚÑ])(?=.*\\d)(?=.*[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\\s]).{8,128}";
  const common = {
    ...props,
    autoComplete: props.autoComplete || "new-password",
    defaultValue: value === undefined ? defaultValue : undefined,
    id,
    name: name || id,
    maxLength,
    minLength,
    pattern: enforcePolicy ? policyPattern : props.pattern,
    onChange: handleChange,
    ref: inputRef,
    required,
    title: enforcePolicy
      ? "Usa al menos 8 caracteres, una mayúscula, un número y un carácter especial"
      : props.title,
    type: visible ? "text" : "password",
    value,
  };
  if (variant === "auth")
    return (
      <div className={className}>
        <AuthField
          {...common}
          icon="lock"
          label={label}
          suffix={
            <Toggle
              inputRef={inputRef}
              setVisible={setVisible}
              visible={visible}
            />
          }
        />
        {feedback}
      </div>
    );
  return (
    <div className={className}>
      <Input
        {...common}
        label={label}
        suffix={
          <Toggle
            inputRef={inputRef}
            setVisible={setVisible}
            visible={visible}
          />
        }
      />
      {feedback}
    </div>
  );
}
