import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthButton from "../../components/molecules/AuthButton";
import PasswordField from "../../components/molecules/PasswordField";
import AuthLayout from "../../components/organisms/AuthLayout";
import { useAuth } from "../../context/authStore";

function validPassword(value) {
  return (
    value.length >= 8 &&
    value.length <= 128 &&
    /[A-ZÁÉÍÓÚÑ]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]/.test(value)
  );
}

function destinationFor(user) {
  if (user?.role === "super_admin") return "/platform";
  if (user?.role === "operator") return "/pos";
  return "/dashboard";
}

export default function CambiarContrasenaTemporal() {
  const navigate = useNavigate();
  const { changePassword, logout, user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionRef = useRef(false);
  const ready = useMemo(
    () =>
      currentPassword.length >= 8 &&
      validPassword(newPassword) &&
      newPassword === confirmation &&
      newPassword !== currentPassword,
    [confirmation, currentPassword, newPassword],
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!ready || submissionRef.current) return;
    submissionRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });
      navigate(destinationFor(result.user), { replace: true });
    } catch (requestError) {
      setError(
        requestError?.message ||
          "No se pudo reemplazar la contraseña temporal.",
      );
    } finally {
      submissionRef.current = false;
      setSubmitting(false);
    }
  };

  const exit = async () => {
    if (submitting) return;
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout
      benefits={[
        {
          icon: "key",
          title: "Acceso temporal",
          text: "La clave entregada por administración deja de servir cuando completes este paso.",
        },
        {
          icon: "devices",
          title: "Sesiones protegidas",
          text: "Los accesos anteriores ya fueron cerrados para proteger tu cuenta.",
        },
      ]}
      description="Crea una contraseña que solo tú conozcas antes de continuar a tu espacio de trabajo."
      eyebrow="Cambio obligatorio"
      title="Protege tu cuenta"
    >
      <div className="mb-7">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary-container">
          Primer acceso seguro
        </p>
        <h1 className="font-heading text-3xl font-bold text-on-surface">
          Crea tu contraseña definitiva
        </h1>
        <p className="mt-3 leading-7 text-on-surface-variant">
          Hola, <b>{user?.name}</b>. Confirma la contraseña temporal y elige una
          nueva para ingresar.
        </p>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-2xl bg-primary-fixed p-4 text-on-primary-fixed-variant">
        <span className="material-symbols-outlined mt-0.5 text-primary">
          shield_lock
        </span>
        <p className="text-sm leading-6">
          No podrás acceder a otros módulos hasta completar este cambio.
        </p>
      </div>

      {error ? (
        <p
          aria-live="assertive"
          className="mb-5 rounded-2xl bg-error-container p-4 text-sm font-semibold text-on-error-container"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form
        aria-busy={submitting}
        autoComplete="off"
        className="space-y-5"
        onSubmit={submit}
      >
        <PasswordField
          autoComplete="current-password"
          disabled={submitting}
          enforcePolicy={false}
          id="temporaryPassword"
          label="Contraseña temporal"
          onChange={(event) => {
            setCurrentPassword(event.target.value);
            setError("");
          }}
          required
          value={currentPassword}
          variant="auth"
        />
        <PasswordField
          autoComplete="new-password"
          disabled={submitting}
          id="newPassword"
          label="Nueva contraseña"
          onChange={(event) => {
            setNewPassword(event.target.value);
            setError("");
          }}
          required
          showFeedback
          value={newPassword}
          variant="auth"
        />
        <PasswordField
          autoComplete="new-password"
          compareTo={newPassword}
          disabled={submitting}
          id="passwordConfirmation"
          label="Confirmar nueva contraseña"
          onChange={(event) => {
            setConfirmation(event.target.value);
            setError("");
          }}
          required
          value={confirmation}
          variant="auth"
        />
        {newPassword && newPassword === currentPassword ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-error">
            <span className="material-symbols-outlined text-base">error</span>
            La nueva contraseña debe ser diferente de la temporal.
          </p>
        ) : null}
        <AuthButton
          disabled={!ready}
          loading={submitting}
          loadingLabel="Protegiendo tu cuenta..."
          type="submit"
        >
          Guardar y continuar
        </AuthButton>
      </form>

      <button
        className="mt-4 flex min-h-11 w-full items-center justify-center text-sm font-bold text-primary hover:underline"
        disabled={submitting}
        onClick={exit}
        type="button"
      >
        Cerrar sesión
      </button>
    </AuthLayout>
  );
}
