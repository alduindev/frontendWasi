import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthButton from "../../components/molecules/AuthButton";
import AuthLayout from "../../components/organisms/AuthLayout";
import { useAuth } from "../../context/authStore";
import { respondQrLogin, scanQrLogin } from "../../services/authService";

const QR_RETURN_STORAGE_KEY = "wasi.qr.return";

function readQrPayload() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const sessionId = params.get("sid") || "";
  const qrSecret = params.get("qs") || "";
  return sessionId && qrSecret ? { qrSecret, sessionId } : null;
}

function rememberQrReturn() {
  try {
    sessionStorage.setItem(QR_RETURN_STORAGE_KEY, `${window.location.pathname}${window.location.hash}`);
    return true;
  } catch {
    return false;
  }
}

export default function ConfirmarQr() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [payload] = useState(readQrPayload);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(payload ? "loading" : "invalid");
  const [submitting, setSubmitting] = useState(false);
  const pageStatus = !payload
    ? "invalid"
    : !isLoading && !isAuthenticated
      ? "login"
      : status;

  useEffect(() => {
    if (isLoading) return undefined;
    if (!payload) {
      return undefined;
    }
    if (!isAuthenticated) {
      rememberQrReturn();
      return undefined;
    }

    let active = true;
    scanQrLogin(payload)
      .then((result) => {
        if (!active) return;
        setDetails(result);
        setStatus(result.status);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message);
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, payload, payload?.qrSecret, payload?.sessionId]);

  const handleResponse = async (approve) => {
    if (!payload) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await respondQrLogin({ ...payload, approve });
      setDetails(result);
      setStatus(result.status);
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      description="Confirma desde tu dispositivo el acceso a tu cuenta de Wasita."
      eyebrow="Autorización segura"
      title="Confirmar inicio de sesión"
    >
      <div aria-live="polite" className="text-center">
        {pageStatus === "loading" ? (
          <div className="flex flex-col items-center py-8">
            <span aria-hidden="true" className="material-symbols-outlined animate-pulse text-6xl text-primary">qr_code_scanner</span>
            <p className="mt-5 text-sm font-semibold text-on-surface-variant">Validando código...</p>
          </div>
        ) : null}

        {pageStatus === "login" ? (
          <div className="space-y-5">
            <span aria-hidden="true" className="material-symbols-outlined text-6xl text-primary">lock</span>
            <p className="text-sm leading-6 text-on-surface-variant">Inicia sesión en este dispositivo para confirmar el acceso.</p>
            <button
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-bold text-on-primary transition hover:bg-primary-container"
              onClick={() => navigate("/login")}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">login</span>
              Iniciar sesión
            </button>
          </div>
        ) : null}

        {pageStatus === "scanned" ? (
          <div className="space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-4xl">devices</span>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-on-surface">¿Eres tú?</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {details?.userName || "Tu cuenta"} está intentando entrar a Wasita
                {details?.businessName ? ` en ${details.businessName}.` : "."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AuthButton loading={submitting} loadingLabel="Confirmando..." onClick={() => handleResponse(true)} type="button">
                <span aria-hidden="true" className="material-symbols-outlined text-xl">check</span>
                Aprobar acceso
              </AuthButton>
              <button
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-outline-variant px-5 font-bold text-on-surface-variant transition hover:border-error hover:text-error"
                disabled={submitting}
                onClick={() => handleResponse(false)}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">close</span>
                Rechazar
              </button>
            </div>
          </div>
        ) : null}

        {pageStatus === "approved" ? (
          <div className="space-y-5">
            <span aria-hidden="true" className="material-symbols-outlined text-6xl text-primary">check_circle</span>
            <div>
              <h2 className="font-heading text-2xl font-bold text-on-surface">Acceso aprobado</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Ya puedes volver al dispositivo donde apareció el código.</p>
            </div>
          </div>
        ) : null}

        {pageStatus === "denied" ? (
          <div className="space-y-5">
            <span aria-hidden="true" className="material-symbols-outlined text-6xl text-error">block</span>
            <h2 className="font-heading text-2xl font-bold text-on-surface">Acceso rechazado</h2>
          </div>
        ) : null}

        {["invalid", "error"].includes(pageStatus) ? (
          <div className="space-y-5">
            <span aria-hidden="true" className="material-symbols-outlined text-6xl text-error">qr_code_2</span>
            <div>
              <h2 className="font-heading text-2xl font-bold text-on-surface">Código no disponible</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">{error || "Genera un código nuevo desde la pantalla de acceso."}</p>
            </div>
            <Link className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-primary px-5 font-bold text-on-primary transition hover:bg-primary-container" to="/login">Volver al inicio de sesión</Link>
          </div>
        ) : null}
      </div>
    </AuthLayout>
  );
}