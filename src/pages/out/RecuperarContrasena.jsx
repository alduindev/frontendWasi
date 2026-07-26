import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthButton from "../../components/molecules/AuthButton";
import AuthField from "../../components/molecules/AuthField";
import PasswordField from "../../components/molecules/PasswordField";
import AuthLayout from "../../components/organisms/AuthLayout";
import {
  confirmPasswordRecovery,
  requestPasswordRecovery,
} from "../../services/authService";

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [step, setStep] = useState("identify");
  const [identifier, setIdentifier] = useState("");
  const [recoveryId, setRecoveryId] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionRef = useRef(false);

  const requestCode = async (event) => {
    event.preventDefault();
    if (submissionRef.current) return;
    submissionRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const result = await requestPasswordRecovery(identifier);
      setRecoveryId(result.recoveryId || "");
      setDevelopmentCode(result.developmentCode || "");
      setMessage(result.message);
      setStep("confirm");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      submissionRef.current = false;
      setSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    if (password !== data.get("passwordConfirmation")) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!recoveryId) {
      setError(
        "No encontramos una solicitud activa. Vuelve a solicitar el código",
      );
      return;
    }
    if (submissionRef.current) return;
    submissionRef.current = true;
    setSubmitting(true);
    try {
      await confirmPasswordRecovery({
        recoveryId,
        code: data.get("code"),
        password,
      });
      setStep("done");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      submissionRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="Recupera el acceso sin perder la información de tu empresa."
      eyebrow="Acceso seguro"
      title="Vuelve a trabajar en Wasita"
    >
      <div className="mb-7">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary-container">
          Recuperación
        </p>
        <h1 className="font-heading text-3xl font-bold">
          {step === "done"
            ? "Contraseña actualizada"
            : "Recupera tu contraseña"}
        </h1>
        <p className="mt-3 leading-7 text-on-surface-variant">
          {step === "identify"
            ? "Escribe el correo o celular asociado a tu cuenta."
            : step === "confirm"
              ? "Ingresa el código de 6 dígitos y crea una contraseña nueva."
              : "Tu acceso quedó restablecido correctamente."}
        </p>
      </div>
      {error ? (
        <div
          aria-live="assertive"
          className="mb-5 rounded-2xl bg-error-container p-4 text-sm font-semibold text-on-error-container"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {step === "identify" ? (
        <form
          aria-busy={submitting}
          autoComplete="off"
          className="space-y-5"
          onSubmit={requestCode}
        >
          <AuthField
            autoComplete="off"
            disabled={submitting}
            icon="person"
            id="identifier"
            label="Correo o celular"
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="nombre@empresa.com o 999 999 999"
            required
            value={identifier}
          />
          <AuthButton
            loading={submitting}
            loadingLabel="Solicitando código..."
          >
            Enviar código
          </AuthButton>
        </form>
      ) : null}
      {step === "confirm" ? (
        <form
          aria-busy={submitting}
          autoComplete="off"
          className="space-y-5"
          onSubmit={resetPassword}
        >
          <div className="rounded-2xl bg-primary-fixed p-4 text-sm text-on-primary-fixed-variant">
            <b>{message}</b>
            {developmentCode ? (
              <p className="mt-2">
                Entorno local: usa el código{" "}
                <strong className="text-base tracking-[0.2em]">
                  {developmentCode}
                </strong>
              </p>
            ) : null}
          </div>
          <AuthField
            autoComplete="off"
            disabled={submitting}
            icon="pin"
            id="code"
            inputMode="numeric"
            label="Código de verificación"
            maxLength="6"
            numericOnly
            pattern="[0-9]{6}"
            placeholder="000000"
            required
          />
          <PasswordField
            autoComplete="off"
            disabled={submitting}
            id="password"
            label="Nueva contraseña"
            onChange={(event) => setPassword(event.target.value)}
            required
            showFeedback
            value={password}
            variant="auth"
          />
          <PasswordField
            autoComplete="off"
            compareTo={password}
            disabled={submitting}
            id="passwordConfirmation"
            label="Confirmar contraseña"
            required
            variant="auth"
          />
          <AuthButton
            loading={submitting}
            loadingLabel="Actualizando contraseña..."
          >
            Guardar nueva contraseña
          </AuthButton>
          <button
            className="w-full text-sm font-bold text-primary hover:underline"
            disabled={submitting}
            onClick={() => {
              setStep("identify");
              setError("");
            }}
            type="button"
          >
            Solicitar otro código
          </button>
        </form>
      ) : null}
      {step === "done" ? (
        <AuthButton onClick={() => navigate("/login")} type="button">
          Ir a iniciar sesión
        </AuthButton>
      ) : null}
      <Link
        className="mt-5 flex min-h-11 items-center justify-center font-bold text-primary hover:underline"
        to="/login"
      >
        Volver al inicio de sesión
      </Link>
    </AuthLayout>
  );
}
