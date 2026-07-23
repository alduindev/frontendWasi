import { useState } from "react";
import PublicLayout from "../../components/public/PublicLayout";
import { createSupportTicket } from "../../services/supportService";

const fieldIcons = {
  name: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  email: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  phone: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.98.8l1.11 5.55a1 1 0 01-.54 1.11l-2.1 1.05a11.04 11.04 0 005.52 5.52l1.05-2.1a1 1 0 011.11-.54l5.55 1.11a1 1 0 01.8.98V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z"
      />
    </svg>
  ),
  businessName: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 12v.01M9 15v.01"
      />
    </svg>
  ),
  document: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  subject: (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 8h10M7 12h6m-6 8l-3-3H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-6l-3 3z"
      />
    </svg>
  ),
};

const baseInput =
  "peer min-h-12 w-full rounded-xl border bg-white pl-10 pr-3 outline-none transition-colors duration-150 focus:border-primary";
const baseTextarea =
  "peer w-full rounded-xl border bg-white px-3 py-3 outline-none transition-colors duration-150 focus:border-primary";

const validators = {
  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? ""
      : "Ingresa un correo válido, ej: nombre@dominio.com",
  phone: (value) =>
    value === "" || /^[+]?[\d\s-]{6,15}$/.test(value)
      ? ""
      : "Ingresa un teléfono válido (solo números, espacios o guiones)",
};

function ErrorIcon() {
  return (
    <svg
      className="h-4 w-4 flex-none"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
  className = "",
  fieldError,
  onBlur,
  onChange,
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-bold ${className}`}>
      {label}
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
            fieldError
              ? "text-error"
              : "text-on-surface-variant peer-focus:text-primary"
          }`}
        >
          {fieldIcons[name]}
        </span>
        <input
          className={`${baseInput} ${
            fieldError
              ? "border-error focus:border-error"
              : "border-outline-variant"
          }`}
          name={name}
          required={required}
          type={type}
          onBlur={onBlur}
          onChange={onChange}
          aria-invalid={Boolean(fieldError)}
        />
      </div>
      {fieldError ? (
        <span className="flex items-center gap-1 text-xs font-normal text-error">
          <ErrorIcon />
          {fieldError}
        </span>
      ) : null}
    </label>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      className="h-16 w-16 text-emerald-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75l2.25 2.25L15 10.5m6 1.5a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function Contact({ complaint = false }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [messageLength, setMessageLength] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (name, value) => {
    const validator = validators[name];
    if (!validator) return;
    setFieldErrors((prev) => ({ ...prev, [name]: validator(value) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const f = new FormData(e.currentTarget);
    const emailError = validators.email(f.get("email") || "");
    const phoneError = validators.phone(f.get("phone") || "");
    const nextFieldErrors = { email: emailError, phone: phoneError };
    setFieldErrors(nextFieldErrors);

    if (emailError || phoneError) {
      setError("Revisa los campos marcados antes de enviar.");
      return;
    }

    setSending(true);
    try {
      setResult(
        await createSupportTicket({
          ticketType: complaint ? "complaint" : "contact",
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone"),
          businessName: f.get("businessName"),
          document: f.get("document") || "",
          subject: f.get("subject"),
          message: f.get("message"),
          requestedAction: f.get("requestedAction") || "",
        }),
      );
    } catch (x) {
      setError(x.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-[.8fr_1.2fr]">
        <div className="animate-[fadeIn_0.4s_ease-out]">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">
            {complaint ? "Libro de reclamaciones" : "Contacto"}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold">
            {complaint ? "Registra un reclamo" : "Hablemos de tu negocio"}
          </h1>
          <p className="mt-5 text-lg leading-8 text-on-surface-variant">
            {complaint
              ? "Tu solicitud quedará registrada con un número único para seguimiento."
              : "Envíanos una consulta comercial, solicitud de soporte o pregunta sobre Wasita."}
          </p>

          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-primary-fixed p-5 text-on-primary-fixed">
            <svg
              className="mt-0.5 h-5 w-5 flex-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
              />
            </svg>
            <div>
              <b>Atención digital</b>
              <p className="mt-2 text-sm">
                Respondemos usando el correo proporcionado. No incluyas
                contraseñas ni datos de tarjetas.
              </p>
            </div>
          </div>

          {complaint ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-sm text-on-surface-variant">
              <svg
                className="mt-0.5 h-5 w-5 flex-none text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>
                Este es tu Libro de Reclamaciones virtual. Guarda el código que
                recibirás al enviar tu solicitud para dar seguimiento.
              </p>
            </div>
          ) : null}
        </div>

        <section className="rounded-3xl border border-outline-variant bg-white p-5 shadow-xl sm:p-8">
          {result ? (
            <div className="flex flex-col items-center py-12 text-center animate-[modalIn_0.3s_ease-out]">
              <CheckCircleIcon />
              <h2 className="mt-4 text-2xl font-bold">Solicitud registrada</h2>
              <p className="mt-2 text-on-surface-variant">
                Te contactaremos usando los datos proporcionados.
              </p>
              <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-variant/40 px-6 py-3">
                <p className="text-xs uppercase tracking-wide text-on-surface-variant">
                  Código de seguimiento
                </p>
                <p className="mt-1 font-heading text-xl font-extrabold text-primary">
                  {result.ticketNumber}
                </p>
              </div>
            </div>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={submit}
              noValidate
            >
              {error ? (
                <div className="flex items-start gap-2.5 rounded-xl bg-error-container p-3 text-sm text-on-error-container sm:col-span-2">
                  <ErrorIcon />
                  {error}
                </div>
              ) : null}

              <Field name="name" label="Nombre completo" />
              <Field
                name="email"
                label="Correo"
                type="email"
                fieldError={fieldErrors.email}
                onBlur={(e) => validateField("email", e.target.value)}
                onChange={() =>
                  fieldErrors.email &&
                  setFieldErrors((p) => ({ ...p, email: "" }))
                }
              />
              <Field
                name="phone"
                label="Teléfono"
                type="tel"
                required={false}
                fieldError={fieldErrors.phone}
                onBlur={(e) => validateField("phone", e.target.value)}
                onChange={() =>
                  fieldErrors.phone &&
                  setFieldErrors((p) => ({ ...p, phone: "" }))
                }
              />
              <Field name="businessName" label="Empresa" required={false} />

              {complaint ? (
                <Field
                  name="document"
                  label="DNI o documento"
                  className="sm:col-span-2"
                />
              ) : null}

              <Field name="subject" label="Asunto" className="sm:col-span-2" />

              <label className="grid gap-1.5 text-sm font-bold sm:col-span-2">
                <div className="flex items-baseline justify-between">
                  <span>Detalle</span>
                  <span className="text-xs font-normal text-on-surface-variant">
                    {messageLength}/4000
                  </span>
                </div>
                <textarea
                  className={`${baseTextarea} min-h-36 border-outline-variant`}
                  maxLength="4000"
                  name="message"
                  onChange={(e) => setMessageLength(e.target.value.length)}
                  required
                />
              </label>

              {complaint ? (
                <label className="grid gap-1.5 text-sm font-bold sm:col-span-2">
                  Solución solicitada
                  <textarea
                    className={`${baseTextarea} min-h-24 border-outline-variant`}
                    name="requestedAction"
                    required
                  />
                </label>
              ) : null}

              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                disabled={sending}
                type="submit"
              >
                {sending ? (
                  <>
                    <SpinnerIcon />
                    Enviando...
                  </>
                ) : complaint ? (
                  "Registrar reclamo"
                ) : (
                  "Enviar mensaje"
                )}
              </button>

              <p className="text-center text-xs text-on-surface-variant sm:col-span-2">
                Al enviar aceptas ser contactado por los medios indicados.
              </p>
            </form>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
