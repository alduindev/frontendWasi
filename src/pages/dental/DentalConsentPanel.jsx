import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Modal from "../../components/molecules/Modal";
import Tooltip from "../../components/ui/Tooltip";
import { environment } from "../../config/environment";
import * as api from "../../services/healthService";

const fieldClass = "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

const statusInfo = {
  pending: { label: "Pendiente de firma", tone: "bg-amber-100 text-amber-900", icon: "pending_actions" },
  signed: { label: "Firmado", tone: "bg-emerald-100 text-emerald-900", icon: "verified" },
  expired: { label: "QR vencido", tone: "bg-slate-100 text-slate-700", icon: "timer_off" },
  voided: { label: "Anulado", tone: "bg-rose-100 text-rose-900", icon: "block" },
};

function dateLabel(value) {
  return value ? new Date(value).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }) : "";
}

function ConsentIconButton({ className = "", disabled = false, icon, label, loading = false, onClick, variant = "secondary" }) {
  const variants = {
    primary: "bg-primary text-white shadow-sm hover:brightness-110",
    secondary: "border border-outline-variant bg-white text-on-surface hover:border-primary hover:bg-surface-container-low",
    danger: "bg-error text-white shadow-sm hover:brightness-110",
  };
  return (
    <Tooltip label={label} placement="top-end">
      <button
        aria-busy={loading || undefined}
        aria-label={label}
        className={`grid size-10 shrink-0 place-items-center rounded-xl transition focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
        disabled={disabled || loading}
        onClick={onClick}
        type="button"
      >
        <span aria-hidden="true" className={`material-symbols-outlined text-xl ${loading ? "animate-spin" : ""}`}>{loading ? "progress_activity" : icon}</span>
      </button>
    </Tooltip>
  );
}

function DentistSignatureDialog({ consent, error, onClose, onSubmit, saving }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const prepareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const context = canvas.getContext("2d");
    context.scale(ratio, ratio);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "#172554";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    contextRef.current = context;
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(prepareCanvas);
    const onResize = () => {
      prepareCanvas();
      setHasSignature(false);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const point = event => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = event => {
    if (saving || !contextRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const next = point(event);
    contextRef.current.beginPath();
    contextRef.current.moveTo(next.x, next.y);
    drawingRef.current = true;
  };

  const draw = event => {
    if (!drawingRef.current || !contextRef.current) return;
    event.preventDefault();
    const next = point(event);
    contextRef.current.lineTo(next.x, next.y);
    contextRef.current.stroke();
    setHasSignature(true);
  };

  const stopDrawing = event => {
    if (!drawingRef.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    drawingRef.current = false;
  };

  const clearSignature = () => {
    prepareCanvas();
    setHasSignature(false);
  };

  return (
    <Modal onClose={onClose} title="Firma del odontólogo">
      <div className="grid gap-4 p-4 sm:p-6">
        <div className="rounded-2xl bg-primary-fixed/60 p-3 text-sm text-on-surface-variant">
          <b className="block text-on-surface">{consent.templateName}</b>
          <span>Paciente: {consent.patientName}</span>
        </div>
        <p className="text-sm leading-6 text-on-surface-variant">La firma del paciente ya fue registrada. Agrega tu firma clínica para completar el consentimiento.</p>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-bold" htmlFor="dental-dentist-signature">Firma manuscrita</label>
            <button className="min-h-10 rounded-xl px-3 text-sm font-bold text-primary hover:bg-primary-fixed disabled:opacity-50" disabled={saving || !hasSignature} onClick={clearSignature} type="button">Borrar firma</button>
          </div>
          <canvas aria-label="Área para la firma del odontólogo" className="mt-2 h-40 w-full touch-none rounded-2xl border-2 border-dashed border-primary/45 bg-white" id="dental-dentist-signature" onPointerCancel={stopDrawing} onPointerDown={startDrawing} onPointerLeave={stopDrawing} onPointerMove={draw} onPointerUp={stopDrawing} ref={canvasRef} />
        </div>
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error" role="alert">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">Cancelar</Button>
          <Button disabled={!hasSignature || saving} icon="draw" loading={saving} loadingLabel="Guardando..." onClick={() => onSubmit(canvasRef.current.toDataURL("image/png"))} type="button">Firmar consentimiento</Button>
        </div>
      </div>
    </Modal>
  );
}

function QRDialog({ onClose, onRenew, onReplace, qr }) {
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [status, setStatus] = useState("pending");
  const [dentistSigned, setDentistSigned] = useState(false);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    let active = true;
    const url = new URL("/firmar-consentimiento", environment.qrAppUrl || window.location.origin);
    url.hash = new URLSearchParams({ cid: qr.consent.id, cs: qr.qrSecret }).toString();
    QRCode.toDataURL(url.toString(), {
      color: { dark: "#172554", light: "#ffffff" },
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
    }).then(data => {
      if (active) setImage(data);
    }).catch(error => {
      if (active) setImageError(error.message || "No se pudo crear el QR.");
    });
    return () => { active = false; };
  }, [qr.consent.id, qr.qrSecret]);

  useEffect(() => {
    let active = true;
    let timeoutId;
    const refresh = async () => {
      try {
        const rows = await api.getDentalConsents(qr.consent.patientId);
        const current = rows.find(item => item.id === qr.consent.id);
        if (!active || !current) return;
        if (current.status !== "pending") {
          setStatus(current.status);
          setDentistSigned(Boolean(current.dentistSignatureReady));
          return;
        }
      } catch {
        // A transient staff-side refresh failure must not invalidate the QR.
      }
      if (active) timeoutId = window.setTimeout(refresh, 3000);
    };
    refresh();
    return () => window.clearTimeout(timeoutId);
  }, [qr.consent.id, qr.consent.patientId, qr.qrSecret]);

  const renew = async () => {
    setRenewing(true);
    try {
      const next = await onRenew(qr.consent.id);
      if (next) {
        setStatus("pending");
        onReplace(next);
      }
    } finally {
      setRenewing(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Firma desde el celular">
      <div className="space-y-5 p-4 sm:p-6">
        {status === "signed" ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-center text-emerald-900">
            <span className="material-symbols-outlined text-5xl">verified</span>
            <h3 className="mt-2 text-lg font-bold">{dentistSigned ? "Consentimiento completo" : "Paciente firmado"}</h3>
            <p className="mt-1 text-sm">{dentistSigned ? "Las dos firmas y el PDF ya se registraron en el expediente." : "El odontólogo debe agregar su firma clínica desde el expediente."}</p>
          </div>
        ) : status === "expired" ? (
          <div className="rounded-2xl bg-slate-100 p-5 text-center text-slate-700">
            <span className="material-symbols-outlined text-5xl">timer_off</span>
            <h3 className="mt-2 text-lg font-bold">El QR venció</h3>
            <p className="mt-1 text-sm">Genera otro código para continuar.</p>
          </div>
        ) : status === "voided" ? (
          <div className="rounded-2xl bg-rose-50 p-5 text-center text-rose-900">
            <span className="material-symbols-outlined text-5xl">block</span>
            <h3 className="mt-2 text-lg font-bold">Consentimiento anulado</h3>
            <p className="mt-1 text-sm">Este QR ya no puede utilizarse.</p>
          </div>
        ) : (
          <>
            <p className="text-sm leading-6 text-on-surface-variant">
              El paciente escanea este código con la cámara de su celular. Se abrirá una página segura para leer el modelo y firmar sin iniciar sesión.
            </p>
            <div className="mx-auto grid w-fit place-items-center rounded-3xl border border-outline-variant bg-white p-3 shadow-sm">
              {image ? <img alt="Código QR para firmar el consentimiento" className="size-64 max-w-full" src={image} /> : <span className="material-symbols-outlined animate-pulse p-28 text-4xl text-primary">qr_code_2</span>}
            </div>
            <p className="text-center text-xs text-on-surface-variant">Vence: {dateLabel(qr.consent.expiresAt)}</p>
            {imageError ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{imageError}</p> : null}
          </>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {status === "pending" || status === "expired" ? <Button icon="refresh" loading={renewing} loadingLabel="Generando..." onClick={renew} type="button" variant="secondary">Generar otro QR</Button> : null}
          <Button onClick={onClose} type="button">Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function DentalConsentPanel({ canAdminister = false, canManage, canSignDentist = false, patient, preparedByName = "" }) {
  const patientId = patient?.id || "";
  const [templates, setTemplates] = useState([]);
  const [consents, setConsents] = useState([]);
  const [templateKey, setTemplateKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [qr, setQr] = useState(null);
  const [previewConsent, setPreviewConsent] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [dentistSignatureConsent, setDentistSignatureConsent] = useState(null);
  const [dentistSigning, setDentistSigning] = useState(false);
  const [dentistSignatureError, setDentistSignatureError] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [dentistName, setDentistName] = useState(() => preparedByName || "");
  const [dentistCop, setDentistCop] = useState("");
  const [treatmentDetail, setTreatmentDetail] = useState("");

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError("");
    try {
      const [available, rows] = await Promise.all([
        api.getDentalConsentTemplates(),
        api.getDentalConsents(patientId),
      ]);
      setTemplates(available);
      setConsents(rows);
      setTemplateKey(current => current || available[0]?.key || "");
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar los consentimientos.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  useEffect(() => {
    if (!previewConsent) return undefined;
    let active = true;
    let objectUrl = "";
    api.previewDentalConsent(previewConsent.id)
      .then(blob => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(requestError => {
        if (active) setPreviewError(requestError.message || "No se pudo visualizar el PDF firmado.");
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewConsent]);

  const openPreview = consent => {
    setPreviewError("");
    setPreviewUrl("");
    setPreviewLoading(true);
    setPreviewConsent(consent);
  };

  const closePreview = () => {
    setPreviewConsent(null);
    setPreviewUrl("");
    setPreviewError("");
    setPreviewLoading(false);
  };

  const openDentistSignature = consent => {
    setDentistSignatureError("");
    setDentistSignatureConsent(consent);
  };

  const signAsDentist = async signatureDataUrl => {
    if (!dentistSignatureConsent) return;
    setDentistSigning(true);
    setDentistSignatureError("");
    try {
      const updated = await api.signDentalConsent({ id: dentistSignatureConsent.id, signatureDataUrl });
      setConsents(current => current.map(item => item.id === updated.id ? updated : item));
      setDentistSignatureConsent(null);
    } catch (requestError) {
      setDentistSignatureError(requestError.message || "No se pudo registrar la firma del odontólogo.");
    } finally {
      setDentistSigning(false);
    }
  };

  const start = async () => {
    if (!templateKey) return;
    setSaving(true);
    setError("");
    try {
      const started = await api.startDentalConsent({
        patientId,
        templateKey,
        dentistName: dentistName.trim(),
        dentistCop: dentistCop.trim(),
        treatmentDetail: treatmentDetail.trim(),
      });
      setConsents(current => [started.consent, ...current.filter(item => item.id !== started.consent.id)]);
      setQr(started);
    } catch (requestError) {
      setError(requestError.message || "No se pudo preparar el consentimiento.");
    } finally {
      setSaving(false);
    }
  };

  const renew = async consentId => {
    setWorkingId(consentId);
    setError("");
    try {
      const renewed = await api.renewDentalConsentQr(consentId);
      setConsents(current => current.map(item => item.id === consentId ? renewed.consent : item));
      return renewed;
    } catch (requestError) {
      setError(requestError.message || "No se pudo generar un nuevo QR.");
      return null;
    } finally {
      setWorkingId("");
    }
  };

  const download = async consent => {
    setWorkingId(consent.id);
    setError("");
    try {
      await api.downloadDentalConsent(consent.id);
    } catch (requestError) {
      setError(requestError.message || "No se pudo descargar el documento firmado.");
    } finally {
      setWorkingId("");
    }
  };

  const askAction = (type, consent) => {
    setError("");
    setVoidReason("");
    setPendingAction({ type, consent });
  };

  const closeAction = () => {
    if (!workingId) setPendingAction(null);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    const { consent, type } = pendingAction;
    const reason = voidReason.trim();
    if (type === "void" && reason.length < 3) {
      setError("Indica el motivo de anulación.");
      return;
    }
    setWorkingId(consent.id);
    setError("");
    try {
      if (type === "delete") {
        await api.deleteDentalConsent(consent.id);
        setConsents(current => current.filter(item => item.id !== consent.id));
      } else {
        const updated = await api.voidDentalConsent(consent.id, reason);
        setConsents(current => current.map(item => item.id === consent.id ? updated : item));
      }
      setPendingAction(null);
    } catch (requestError) {
      setError(requestError.message || (type === "delete" ? "No se pudo eliminar el consentimiento." : "No se pudo anular el consentimiento."));
    } finally {
      setWorkingId("");
    }
  };

  return (
    <section className="mt-3 rounded-2xl border border-outline-variant bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">Consentimientos informados</h3>
          <p className="text-xs leading-5 text-on-surface-variant">Opcional: selecciona el modelo requerido, muestra el QR al paciente y conserva el PDF firmado en su expediente.</p>
        </div>
        <button aria-label="Actualizar consentimientos" className="material-symbols-outlined grid min-h-10 min-w-10 place-items-center rounded-xl border border-outline-variant hover:bg-surface-container-low" onClick={load} type="button">refresh</button>
      </div>

      {canManage ? (
        <div className="mt-3 grid gap-3 rounded-2xl bg-surface-container-low p-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold">Modelo oficial del Colegio Cirujano Dentista del Perú
            <select className={fieldClass} disabled={saving || !templates.length} onChange={event => setTemplateKey(event.target.value)} value={templateKey}>
              {templates.map(template => <option key={template.key} value={template.key}>{template.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold">Odontólogo tratante
            <input className={fieldClass} disabled={saving} maxLength={160} onChange={event => setDentistName(event.target.value)} placeholder="Nombre y apellidos" value={dentistName} />
          </label>
          <label className="grid gap-1 text-xs font-bold">Número COP
            <input className={fieldClass} disabled={saving} maxLength={60} onChange={event => setDentistCop(event.target.value)} placeholder="Ej. 12345" value={dentistCop} />
          </label>
          <label className="grid gap-1 text-xs font-bold sm:col-span-2">Detalle del procedimiento o pieza <span className="font-normal text-on-surface-variant">(opcional, aparecerá donde el modelo lo solicite)</span>
            <input className={fieldClass} disabled={saving} maxLength={300} onChange={event => setTreatmentDetail(event.target.value)} placeholder="Ej. pieza 3.8 incluida" value={treatmentDetail} />
          </label>
          <div className="flex items-end sm:col-span-2">
            <Button disabled={saving || !templateKey || dentistName.trim().length < 2 || dentistCop.trim().length < 2} icon="qr_code_2" loading={saving} loadingLabel="Preparando PDF..." onClick={start} type="button">Generar QR para completar y firmar</Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 rounded-xl bg-error-container p-3 text-sm text-error" role="alert">{error}</p> : null}
      {loading ? <div className="mt-3 h-28 animate-pulse rounded-2xl bg-surface-container-low" /> : (
        <div className="mt-3 grid gap-2">
          {consents.map(consent => {
            const state = consent.status === "signed" && !consent.dentistSignatureReady
              ? { label: "Falta firma del odontólogo", tone: "bg-amber-100 text-amber-900", icon: "draw" }
              : consent.status === "signed" && consent.dentistSignatureReady
                ? { label: "Firmado completo", tone: "bg-emerald-100 text-emerald-900", icon: "verified" }
                : statusInfo[consent.status] || statusInfo.expired;
            return (
              <Card className="min-w-0 p-3 sm:p-4" key={consent.id}>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)] lg:items-start">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`material-symbols-outlined grid size-10 shrink-0 place-items-center rounded-xl ${state.tone}`}>{state.icon}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="break-words text-sm">{consent.templateName}</b>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${state.tone}`}>{state.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">Solicitado {dateLabel(consent.createdAt)}{consent.signedAt ? ` · paciente firmado ${dateLabel(consent.signedAt)}` : ""}</p>
                      {consent.signedByName ? <p className="truncate text-[11px] text-on-surface-variant">Firmante: {consent.signedByName}</p> : null}
                      {consent.dentistSignatureReady ? <p className="truncate text-[11px] text-emerald-800">Odontólogo: {consent.dentistSignedByName || "firma registrada"}</p> : consent.status === "signed" ? <p className="text-[11px] text-amber-800">Pendiente de firma del odontólogo</p> : null}
                      {consent.status === "voided" && consent.voidReason ? <p className="mt-1 text-[11px] text-rose-900">Motivo: {consent.voidReason}</p> : null}
                      <a className="mt-1 inline-block text-[11px] font-bold text-primary hover:underline" href={consent.templateSourceUrl} rel="noreferrer" target="_blank">Ver modelo oficial</a>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 lg:max-w-[38rem] lg:justify-end">
                    {consent.status !== "pending" && consent.status !== "expired" && consent.documentReady ? <ConsentIconButton disabled={workingId === consent.id} icon="visibility" label="Visualizar PDF" onClick={() => openPreview(consent)} /> : null}
                    {consent.status !== "pending" && consent.status !== "expired" && consent.documentReady ? <ConsentIconButton disabled={workingId === consent.id} icon="download" label="Descargar PDF" onClick={() => download(consent)} /> : null}
                    {canSignDentist && consent.status === "signed" && !consent.dentistSignatureReady ? <ConsentIconButton icon="draw" label="Firmar como odontólogo" onClick={() => openDentistSignature(consent)} variant="primary" /> : null}
                    {canManage && (consent.status === "pending" || consent.status === "expired") ? <ConsentIconButton icon="qr_code_2" label="Generar QR" loading={workingId === consent.id} onClick={async () => { const renewed = await renew(consent.id); if (renewed) setQr(renewed); }} /> : null}
                    {canAdminister && (consent.status === "pending" || consent.status === "expired") ? <ConsentIconButton icon="delete" label="Eliminar solicitud" onClick={() => askAction("delete", consent)} variant="danger" /> : null}
                    {canAdminister && (consent.status === "signed" || consent.status === "voided") ? <ConsentIconButton icon="delete" label="Eliminar de la lista" onClick={() => askAction("delete", consent)} variant="danger" /> : null}
                    {canAdminister && consent.status === "signed" ? <ConsentIconButton icon="block" label="Anular consentimiento" onClick={() => askAction("void", consent)} variant="danger" /> : null}
                  </div>
                </div>
              </Card>
            );
          })}
          {!consents.length ? <div className="rounded-2xl border border-dashed border-outline-variant p-4 text-center text-sm text-on-surface-variant">Aún no se ha solicitado un consentimiento para este paciente.</div> : null}
        </div>
      )}
      {qr ? <QRDialog onClose={() => { setQr(null); load(); }} onRenew={renew} onReplace={setQr} qr={qr} /> : null}
      {pendingAction ? (
        <Modal onClose={closeAction} title={pendingAction.type === "delete" ? "Eliminar consentimiento" : "Anular consentimiento firmado"}>
          <div className="grid gap-4 p-5">
            {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error" role="alert">{error}</p> : null}
            {pendingAction.type === "delete" ? (
              <p className="text-sm leading-6 text-on-surface-variant">{pendingAction.consent.status === "signed" || pendingAction.consent.status === "voided" ? <>Se retirará de esta lista <b>{pendingAction.consent.templateName}</b>. El PDF firmado y la auditoría se conservarán.</> : <>Se eliminará la solicitud de <b>{pendingAction.consent.templateName}</b>. Como todavía no está firmada, no se conservará un PDF.</>}</p>
            ) : (
              <>
                <p className="text-sm leading-6 text-on-surface-variant">El consentimiento quedará anulado, pero el PDF firmado seguirá disponible para auditoría clínica.</p>
                <label className="grid gap-1 text-xs font-bold" htmlFor="dental-consent-void-reason">Motivo de anulación
                  <textarea className={`${fieldClass} min-h-28 py-3`} id="dental-consent-void-reason" maxLength={1000} onChange={event => setVoidReason(event.target.value)} placeholder="Ej. Se corrigió el procedimiento indicado" value={voidReason} />
                </label>
              </>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={Boolean(workingId)} onClick={closeAction} type="button" variant="secondary">Cancelar</Button>
              <Button disabled={Boolean(workingId) || (pendingAction.type === "void" && voidReason.trim().length < 3)} icon={pendingAction.type === "delete" ? "delete" : "block"} loading={Boolean(workingId)} loadingLabel={pendingAction.type === "delete" ? "Eliminando..." : "Anulando..."} onClick={confirmAction} type="button" variant="danger">{pendingAction.type === "delete" && (pendingAction.consent.status === "signed" || pendingAction.consent.status === "voided") ? "Eliminar de la lista" : pendingAction.type === "delete" ? "Eliminar" : "Anular consentimiento"}</Button>
            </div>
          </div>
        </Modal>
      ) : null}
      {dentistSignatureConsent ? <DentistSignatureDialog consent={dentistSignatureConsent} error={dentistSignatureError} onClose={() => !dentistSigning && setDentistSignatureConsent(null)} onSubmit={signAsDentist} saving={dentistSigning} /> : null}
      {previewConsent ? (
        <Modal onClose={closePreview} title={`PDF firmado · ${previewConsent.templateName}`}>
          <div className="flex h-[min(78svh,52rem)] min-h-0 flex-col gap-3 p-3 sm:p-4">
            {previewError ? <p className="rounded-xl bg-error-container p-3 text-sm text-error" role="alert">{previewError}</p> : null}
            {previewLoading ? <div className="grid min-h-0 flex-1 place-items-center rounded-xl bg-surface-container-low text-sm text-on-surface-variant">Cargando PDF...</div> : previewUrl ? <iframe className="min-h-0 flex-1 w-full rounded-xl border border-outline-variant bg-surface-container-low" src={previewUrl} title={`Vista previa del consentimiento ${previewConsent.templateName}`} /> : null}
            <div className="flex justify-end">
              <Button onClick={closePreview} type="button">Cerrar</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
