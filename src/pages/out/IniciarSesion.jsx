import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthButton from "../../components/molecules/AuthButton";
import AuthField from "../../components/molecules/AuthField";
import PasswordField from "../../components/molecules/PasswordField";
import AuthLayout from "../../components/organisms/AuthLayout";
import { environment } from "../../config/environment";
import { useAuth } from "../../context/authStore";
import { useI18n } from "../../hooks/useI18n";
import { pollQrLogin, startQrLogin } from "../../services/authService";

const QR_RETURN_STORAGE_KEY = "wasi.qr.return";

function destinationForUser(user) {
  return user.mustChangePassword
    ? "/change-password-required"
    : user.role === "super_admin"
      ? "/platform"
      : user.role === "operator"
        ? "/pos"
        : "/dashboard";
}

function qrStatusLabel(status) {
  return {
    loading: "Generando un código seguro...",
    pending: "Esperando que lo escanees desde tu teléfono.",
    scanned: "Código escaneado. Confirma el acceso desde tu teléfono.",
    expired: "Este código venció.",
    denied: "El acceso fue rechazado desde tu teléfono.",
    consumed: "Este código ya fue utilizado.",
    error: "No se pudo actualizar el código.",
  }[status] || "Esperando confirmación.";
}

export default function IniciarSesion() {
  const navigate = useNavigate();
  const { adoptSession, login } = useAuth();
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState("password");
  const [qrCode, setQrCode] = useState("");
  const [qrError, setQrError] = useState("");
  const [qrStatus, setQrStatus] = useState("loading");
  const [qrRefresh, setQrRefresh] = useState(0);
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

  useEffect(() => {
    if (loginMode !== "qr") return undefined;
    let active = true;
    let timeoutId;

    const initializeQr = async () => {
      setQrCode("");
      setQrError("");
      setQrStatus("loading");
      try {
        const started = await startQrLogin();
        const qrUrl = new URL("/qr-login", environment.qrAppUrl || window.location.origin);
        qrUrl.hash = new URLSearchParams({
          sid: started.sessionId,
          qs: started.qrSecret,
        }).toString();
        const dataUrl = await QRCode.toDataURL(qrUrl.toString(), {
          color: { dark: "#1f1b16", light: "#ffffff" },
          errorCorrectionLevel: "M",
          margin: 2,
          width: 256,
        });
        if (!active) return;
        setQrCode(dataUrl);
        setQrStatus("pending");
        const expiresAt = Date.now() + started.expiresIn * 1000;

        const poll = async () => {
          if (!active) return;
          if (Date.now() >= expiresAt) {
            setQrStatus("expired");
            return;
          }
          try {
            const result = await pollQrLogin({
              clientSecret: started.clientSecret,
              sessionId: started.sessionId,
            });
            if (!active) return;
            if (result.status === "approved" && result.session) {
              const nextUser = await adoptSession(result.session);
              if (active) navigate(destinationForUser(nextUser), { replace: true });
              return;
            }
            setQrStatus(result.status);
            if (!["denied", "expired", "consumed"].includes(result.status)) {
              timeoutId = window.setTimeout(poll, started.pollIntervalMs);
            }
          } catch (error) {
            if (!active) return;
            setQrError(error.message);
            setQrStatus("error");
          }
        };
        poll();
      } catch (error) {
        if (!active) return;
        setQrError(error.message);
        setQrStatus("error");
      }
    };

    initializeQr();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [adoptSession, loginMode, navigate, qrRefresh]);

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
      let qrReturn = "";
      try {
        qrReturn = sessionStorage.getItem(QR_RETURN_STORAGE_KEY) || "";
        sessionStorage.removeItem(QR_RETURN_STORAGE_KEY);
      } catch {
        qrReturn = "";
      }
      navigate(qrReturn.startsWith("/qr-login#") ? qrReturn : destinationForUser(user));
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
      <div
        aria-label="Método de inicio de sesión"
        className="mb-6 grid grid-cols-2 rounded-2xl border border-outline-variant bg-surface-container-low p-1"
        role="tablist"
      >
        <button
          aria-selected={loginMode === "password"}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${loginMode === "password" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
          onClick={() => setLoginMode("password")}
          role="tab"
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">password</span>
          Contraseña
        </button>
        <button
          aria-selected={loginMode === "qr"}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${loginMode === "qr" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
          onClick={() => setLoginMode("qr")}
          role="tab"
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">qr_code_2</span>
          Código QR
        </button>
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
      {loginMode === "password" ? <form
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
      </form> : <section aria-live="polite" className="flex flex-col items-center text-center">
        {qrCode ? (
          <div className="rounded-3xl border border-outline-variant bg-white p-4 shadow-sm">
            <img alt="Código QR temporal para iniciar sesión" className="block h-64 w-64" src={qrCode} />
          </div>
        ) : (
          <div className="flex h-72 w-72 items-center justify-center rounded-3xl border border-outline-variant bg-surface-container-low">
            <span aria-hidden="true" className="material-symbols-outlined animate-pulse text-5xl text-primary">qr_code_2</span>
          </div>
        )}
        <p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-on-surface-variant">{qrStatusLabel(qrStatus)}</p>
        {qrError ? <p className="mt-2 max-w-sm text-sm font-semibold text-error" role="alert">{qrError}</p> : null}
        {(["expired", "denied", "consumed", "error"].includes(qrStatus)) ? <button
          className="mt-5 flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-primary transition hover:bg-primary-fixed"
          onClick={() => setQrRefresh((current) => current + 1)}
          type="button"
        ><span aria-hidden="true" className="material-symbols-outlined text-xl">refresh</span>Generar otro código</button> : null}
      </section>}
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
