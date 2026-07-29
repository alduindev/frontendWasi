import { useEffect, useRef, useState } from "react";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Modal from "../molecules/Modal";

const MIN_REASON_LENGTH = 5;

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temporary = document.createElement("textarea");
  temporary.value = value;
  temporary.setAttribute("readonly", "");
  temporary.style.position = "fixed";
  temporary.style.opacity = "0";
  document.body.appendChild(temporary);
  temporary.select();
  const copied = document.execCommand("copy");
  temporary.remove();
  if (!copied) throw new Error("No se pudo copiar automáticamente.");
}

function expirationLabel(value) {
  if (!value) return "según la política de seguridad";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "según la política de seguridad";
  return date.toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminPasswordResetModal({
  onClose,
  onReset,
  target,
}) {
  const [reason, setReason] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const submissionRef = useRef(false);
  const copyTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const close = () => {
    if (submitting) return;
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    setResult(null);
    setReason("");
    setError("");
    setCopied(false);
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    const normalizedReason = reason.trim();
    if (normalizedReason.length < MIN_REASON_LENGTH) {
      setError(`Describe el motivo en al menos ${MIN_REASON_LENGTH} caracteres.`);
      return;
    }
    if (submissionRef.current) return;
    submissionRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const response = await onReset(normalizedReason);
      if (!response?.temporaryPassword) {
        throw new Error("El servidor no entregó la contraseña temporal.");
      }
      setResult(response);
    } catch (requestError) {
      setError(requestError?.message || "No se pudo restablecer la contraseña.");
    } finally {
      submissionRef.current = false;
      setSubmitting(false);
    }
  };

  const copyPassword = async () => {
    try {
      await copyText(result.temporaryPassword);
      setCopied(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2500);
    } catch (copyError) {
      setError(copyError?.message || "No se pudo copiar la contraseña.");
    }
  };

  return (
    <Modal
      dialogClassName="sm:max-w-xl"
      onClose={close}
      overlayClassName="!z-[260]"
      title={result ? "Contraseña temporal creada" : "Restablecer contraseña"}
    >
      {result ? (
        <section className="p-4 sm:p-5">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <span className="material-symbols-outlined mt-0.5">visibility_lock</span>
            <div>
              <h3 className="font-bold">Guárdala antes de cerrar</h3>
              <p className="mt-1 text-sm leading-6">
                Esta contraseña se muestra una sola vez. Wasita no puede volver a
                enseñarla y nunca almacena su texto.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary-fixed/30 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Acceso temporal de {result.targetUserName || target.name}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                aria-label="Contraseña temporal"
                autoComplete="off"
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-outline-variant bg-white px-3 font-mono text-base font-bold tracking-wide text-on-surface"
                data-1p-ignore="true"
                data-lpignore="true"
                readOnly
                value={result.temporaryPassword}
              />
              <Button
                icon={copied ? "check" : "content_copy"}
                onClick={copyPassword}
                type="button"
                variant="secondary"
              >
                {copied ? "Copiada" : "Copiar"}
              </Button>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              Vence: <b>{expirationLabel(result.expiresAt)}</b>. Al iniciar sesión,
              la persona deberá crear una contraseña definitiva.
            </p>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl bg-error-container p-3 text-sm font-semibold text-on-error-container" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button onClick={close} type="button">
              Ya la guardé y cerrar
            </Button>
          </div>
        </section>
      ) : (
        <form aria-busy={submitting} className="p-4 sm:p-5" onSubmit={submit}>
          <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4">
            <span className="material-symbols-outlined mt-0.5 text-primary">
              shield_lock
            </span>
            <div>
              <h3 className="font-bold">{target.name}</h3>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Se cerrarán sus sesiones actuales y deberá cambiar la contraseña
                temporal en el siguiente inicio de sesión.
              </p>
            </div>
          </div>

          <Input
            autoComplete="off"
            className="mt-4"
            disabled={submitting}
            label="Motivo del restablecimiento"
            maxLength="300"
            minLength={MIN_REASON_LENGTH}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
            placeholder="Ej. El usuario perdió el acceso a su cuenta"
            required
            value={reason}
          />
          <p className="mt-2 text-xs text-on-surface-variant">
            El motivo quedará registrado en la auditoría. No incluyas contraseñas
            ni datos clínicos.
          </p>

          {error ? (
            <p className="mt-4 rounded-xl bg-error-container p-3 text-sm font-semibold text-on-error-container" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 grid gap-2 sm:flex sm:justify-end">
            <Button
              disabled={submitting}
              onClick={close}
              type="button"
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button
              disabled={reason.trim().length < MIN_REASON_LENGTH}
              icon="key"
              loading={submitting}
              loadingLabel="Generando acceso..."
              type="submit"
            >
              Generar contraseña temporal
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
