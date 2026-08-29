import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Modal from "../../components/molecules/Modal";
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

function QRDialog({ onClose, onRenew, onReplace, qr }) {
  const [image, setImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [status, setStatus] = useState("pending");
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
            <h3 className="mt-2 text-lg font-bold">Consentimiento firmado</h3>
            <p className="mt-1 text-sm">La firma y el PDF ya se registraron en el expediente.</p>
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

export default function DentalConsentPanel({ canAdminister = false, canManage, patient, preparedByName = "" }) {
  const patientId = patient?.id || "";
  const [templates, setTemplates] = useState([]);
  const [consents, setConsents] = useState([]);
  const [templateKey, setTemplateKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [qr, setQr] = useState(null);
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
            const state = statusInfo[consent.status] || statusInfo.expired;
            return (
              <Card className="min-w-0 p-3" key={consent.id}>
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className={`material-symbols-outlined grid size-10 shrink-0 place-items-center rounded-xl ${state.tone}`}>{state.icon}</span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-sm">{consent.templateName}</b>
                    <p className="text-xs text-on-surface-variant">Solicitado {dateLabel(consent.createdAt)}{consent.signedAt ? ` · firmado ${dateLabel(consent.signedAt)}` : ""}</p>
                    {consent.signedByName ? <p className="truncate text-[11px] text-on-surface-variant">Firmante: {consent.signedByName}</p> : null}
                    <a className="text-[11px] font-bold text-primary hover:underline" href={consent.templateSourceUrl} rel="noreferrer" target="_blank">Ver modelo oficial</a>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${state.tone}`}>{state.label}</span>
                  {consent.status !== "pending" && consent.status !== "expired" && consent.documentReady ? <Button disabled={workingId === consent.id} icon="download" onClick={() => download(consent)} size="small" type="button" variant="secondary">PDF firmado</Button> : null}
                  {canManage && (consent.status === "pending" || consent.status === "expired") ? <Button disabled={workingId === consent.id} icon="qr_code_2" loading={workingId === consent.id} loadingLabel="Generando..." onClick={async () => { const renewed = await renew(consent.id); if (renewed) setQr(renewed); }} size="small" type="button" variant="secondary">QR</Button> : null}
                  {canAdminister && (consent.status === "pending" || consent.status === "expired") ? <Button disabled={workingId === consent.id} icon="delete" onClick={() => askAction("delete", consent)} size="small" type="button" variant="danger">Eliminar</Button> : null}
                  {canAdminister && (consent.status === "signed" || consent.status === "voided") ? <Button disabled={workingId === consent.id} icon="delete" onClick={() => askAction("delete", consent)} size="small" type="button" variant="danger">Eliminar de la lista</Button> : null}
                  {canAdminister && consent.status === "signed" ? <Button disabled={workingId === consent.id} icon="block" onClick={() => askAction("void", consent)} size="small" type="button" variant="danger">Anular</Button> : null}
                  {consent.status === "voided" && consent.voidReason ? <p className="basis-full text-xs text-rose-900">Motivo de anulación: {consent.voidReason}</p> : null}
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
    </section>
  );
}
