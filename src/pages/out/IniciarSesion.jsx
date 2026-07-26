import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthButton from "../../components/molecules/AuthButton";
import AuthField from "../../components/molecules/AuthField";
import PasswordField from "../../components/molecules/PasswordField";
import AuthLayout from "../../components/organisms/AuthLayout";
import { useAuth } from "../../context/authStore";
import { useI18n } from "../../hooks/useI18n";

export default function IniciarSesion() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ phone: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const submissionRef = useRef(false);
  const phoneIsValid = /^9\d{8}$/.test(phone);
  const passwordIsValid = password.length >= 8 && password.length <= 128;
  const phoneError =
    touched.phone && !phoneIsValid
      ? "Ingresa un celular peruano válido de 9 dígitos."
      : "";
  const passwordError =
    touched.password && !passwordIsValid
      ? "La contraseña debe tener entre 8 y 128 caracteres."
      : "";
  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ phone: true, password: true });
    if (!phoneIsValid || !passwordIsValid) return;
    if (submissionRef.current) return;
    submissionRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const user = await login({ password, phone });
      navigate(
        user.role === "super_admin"
          ? "/platform"
          : user.role === "operator"
            ? "/pos"
            : "/dashboard",
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      submissionRef.current = false;
      setSubmitting(false);
    }
  };
  return (
    <AuthLayout>
      <div className="mb-7 sm:mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-primary-container">
          {t("auth.login.eyebrow")}
        </p>
        <h1 className="font-heading text-3xl font-bold text-on-surface sm:text-4xl">
          {t("auth.login.title")}
        </h1>
        <p className="mt-3 text-base leading-7 text-on-surface-variant">
          Ingresa con la cuenta registrada en Wasita.
        </p>
      </div>
      {error ? (
        <div
          aria-live="assertive"
          className="mb-5 rounded-2xl border border-error-container bg-error-container/60 p-4 text-sm font-semibold text-on-error-container"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      <form
        autoComplete="off"
        aria-busy={submitting}
        className="space-y-5"
        noValidate
        onSubmit={handleSubmit}
      >
        <AuthField
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          disabled={submitting}
          error={phoneError}
          helperText="Usa los 9 dígitos de tu número celular, sin espacios."
          id="phone"
          inputMode="numeric"
          icon="person"
          label="Número de celular"
          maxLength={9}
          minLength={9}
          numericOnly
          onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
          onChange={(event) => {
            setPhone(event.target.value);
            setError("");
          }}
          pattern="9[0-9]{8}"
          placeholder="999999999"
          required
          type="tel"
          value={phone}
        />
        <PasswordField
          action={
            <Link
              className="text-sm font-bold text-primary hover:underline"
              to="/recover-password"
            >
              {t("auth.forgotPassword")}
            </Link>
          }
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          disabled={submitting}
          enforcePolicy={false}
          error={passwordError}
          id="password"
          label={t("auth.password")}
          maxLength="128"
          onBlur={() =>
            setTouched((current) => ({ ...current, password: true }))
          }
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
          placeholder={t("forms.placeholder.password")}
          required
          value={password}
          variant="auth"
        />
        <AuthButton
          loading={submitting}
          loadingLabel="Verificando acceso..."
          type="submit"
        >
          {t("auth.login.submit")}
        </AuthButton>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-outline">
        <span className="h-px flex-1 bg-outline-variant" />
        ¿Primera vez?
        <span className="h-px flex-1 bg-outline-variant" />
      </div>
      <Link
        className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border-2 border-primary bg-white px-5 font-bold text-primary transition hover:bg-primary-fixed"
        to="/register"
      >
        {t("auth.createAccount")}
      </Link>
    </AuthLayout>
  );
}
