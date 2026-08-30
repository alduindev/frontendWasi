import { useEffect, useRef, useState } from "react";
import Button from "../../components/atoms/Button";
import { environment } from "../../config/environment";
import { lookupPublicDentalConsent, signPublicDentalConsent } from "../../services/healthService";

const documentTypes = ["DNI", "CE", "Pasaporte", "Otro"];

function readQrPayload() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const consentId = params.get("cid") || "";
  const qrSecret = params.get("cs") || "";
  return consentId && qrSecret ? { consentId, qrSecret } : null;
}

function dateLabel(value) {
  return value ? new Date(value).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" }) : "";
}

function personFromConsent(consent) {
  return {
    name: consent.patientName || "",
    documentType: consent.patientDocumentType || "DNI",
    document: consent.patientDocument || "",
    address: consent.patientAddress || "",
  };
}

function isComplete(person) {
  return person.name.trim().length >= 2
    && person.documentType.trim().length >= 1
    && person.document.trim().length >= 3
    && person.address.trim().length >= 3;
}

function PersonFields({ legend, onChange, person, submitting }) {
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-1 text-sm font-bold">{legend}</legend>
      <label className="grid gap-1 text-sm font-bold sm:col-span-2">Nombre completo
        <input autoComplete="name" className="min-h-12 rounded-xl border border-outline-variant bg-white px-3 text-base font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={submitting} maxLength={180} onChange={event => onChange("name", event.target.value)} placeholder="Nombres y apellidos" required value={person.name} />
      </label>
      <label className="grid gap-1 text-sm font-bold">Tipo de documento
        <select className="min-h-12 rounded-xl border border-outline-variant bg-white px-3 text-base font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={submitting} onChange={event => onChange("documentType", event.target.value)} value={person.documentType}>
          {documentTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">Número de documento
        <input autoComplete="off" className="min-h-12 rounded-xl border border-outline-variant bg-white px-3 text-base font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={submitting} maxLength={24} onChange={event => onChange("document", event.target.value)} placeholder="Documento" required value={person.document} />
      </label>
      <label className="grid gap-1 text-sm font-bold sm:col-span-2">Domicilio
        <input autoComplete="street-address" className="min-h-12 rounded-xl border border-outline-variant bg-white px-3 text-base font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" disabled={submitting} maxLength={240} onChange={event => onChange("address", event.target.value)} placeholder="Dirección completa" required value={person.address} />
      </label>
    </fieldset>
  );
}

export default function FirmarConsentimiento() {
  const [payload] = useState(readQrPayload);
  const [consent, setConsent] = useState(null);
  const [pageStatus, setPageStatus] = useState(payload ? "loading" : "invalid");
  const [patient, setPatient] = useState({ name: "", documentType: "DNI", document: "", address: "" });
  const [representative, setRepresentative] = useState({ name: "", documentType: "DNI", document: "", address: "" });
  const [signerRole, setSignerRole] = useState("patient");
  const [accepted, setAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const drawingRef = useRef(false);

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
    if (pageStatus !== "ready") return undefined;
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
  }, [pageStatus]);

  useEffect(() => {
    if (!payload) return undefined;
    let active = true;
    lookupPublicDentalConsent(payload)
      .then(result => {
        if (!active) return;
        setConsent(result);
        setPatient(personFromConsent(result));
        setSignerRole(result.patientRequiresRepresentative ? "representative" : "patient");
        setPageStatus("ready");
      })
      .catch(requestError => {
        if (!active) return;
        setError(requestError.message || "No se pudo validar el código.");
        setPageStatus("invalid");
      });
    return () => { active = false; };
  }, [payload]);

  const point = event => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = event => {
    if (submitting || !contextRef.current) return;
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

  const updatePatient = (key, value) => setPatient(current => ({ ...current, [key]: value }));
  const updateRepresentative = (key, value) => setRepresentative(current => ({ ...current, [key]: value }));
  const requiresRepresentative = Boolean(consent?.patientRequiresRepresentative);
  const signer = signerRole === "representative" ? representative : patient;
  const detailsComplete = isComplete(patient) && isComplete(signer);

  const sign = async event => {
    event.preventDefault();
    if (!payload || !hasSignature || !accepted || !detailsComplete) return;
    setSubmitting(true);
    setError("");
    try {
      await signPublicDentalConsent({
        ...payload,
        accepted: true,
        patientName: patient.name.trim(),
        patientDocumentType: patient.documentType.trim(),
        patientDocument: patient.document.trim(),
        patientAddress: patient.address.trim(),
        signerRole,
        signerName: signer.name.trim(),
        signerDocumentType: signer.documentType.trim(),
        signerDocument: signer.document.trim(),
        signerAddress: signer.address.trim(),
        signatureDataUrl: canvasRef.current.toDataURL("image/png"),
      });
      setPageStatus("success");
    } catch (requestError) {
      setError(requestError.message || "No se pudo registrar la firma.");
    } finally {
      setSubmitting(false);
    }
  };

  const invalid = pageStatus === "invalid";
  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 text-on-surface sm:px-6 sm:py-10">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-xl shadow-slate-900/10">
        <header className="bg-primary px-5 py-6 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-fixed">{environment.appName}</p>
          <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">Firma de consentimiento informado</h1>
          <p className="mt-2 text-sm leading-6 text-primary-fixed">Revisa los datos y el documento antes de firmar.</p>
        </header>

        <div className="p-5 sm:p-8">
          {pageStatus === "loading" ? <div className="grid min-h-64 place-items-center text-center"><span className="material-symbols-outlined animate-pulse text-5xl text-primary">qr_code_scanner</span><p className="mt-3 text-sm text-on-surface-variant">Validando el código seguro…</p></div> : null}

          {invalid ? <div className="space-y-4 text-center"><span className="material-symbols-outlined text-6xl text-error">qr_code_2</span><h2 className="text-xl font-bold">Código no disponible</h2><p className="mx-auto max-w-md text-sm leading-6 text-on-surface-variant">{error || "Escanea un nuevo QR desde el consultorio. Los códigos tienen un tiempo limitado y solo se pueden usar una vez."}</p></div> : null}

          {pageStatus === "success" ? <div className="space-y-4 py-8 text-center"><span className="material-symbols-outlined text-6xl text-emerald-600">verified</span><h2 className="text-2xl font-bold">Firma del paciente registrada</h2><p className="mx-auto max-w-md text-sm leading-6 text-on-surface-variant">Tus datos y tu firma ya están guardados. El odontólogo agregará su firma clínica desde el expediente para completar el consentimiento.</p></div> : null}

          {pageStatus === "ready" && consent ? (
            <form className="space-y-5" onSubmit={sign}>
              <section className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Documento seleccionado</p>
                <h2 className="mt-1 text-xl font-bold">{consent.templateName}</h2>
                <p className="mt-2 text-sm text-on-surface-variant">Odontólogo: {consent.dentistName || "No registrado"}{consent.dentistCop ? ` · COP ${consent.dentistCop}` : ""}</p>
                {consent.treatmentDetail ? <p className="mt-1 text-sm text-on-surface-variant">Procedimiento: {consent.treatmentDetail}</p> : null}
                <p className="mt-1 text-xs text-on-surface-variant">Solicitado por {consent.clinicName || "el consultorio"} · vence {dateLabel(consent.expiresAt)}</p>
                <a className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-primary-fixed" href={consent.templateSourceUrl} rel="noreferrer" target="_blank"><span className="material-symbols-outlined">picture_as_pdf</span>Leer el modelo oficial</a>
              </section>

              <section className="space-y-3 rounded-2xl border border-outline-variant p-4">
                <div>
                  <h2 className="font-bold">Datos que aparecerán en el PDF</h2>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">Revísalos o corrígelos: se insertarán en las líneas punteadas del consentimiento. La corrección queda en este documento y no modifica automáticamente tu ficha clínica.</p>
                </div>
                <PersonFields legend="Datos del paciente" onChange={updatePatient} person={patient} submitting={submitting} />
              </section>

              <fieldset className="rounded-2xl border border-outline-variant p-4">
                <legend className="px-1 text-sm font-bold">¿Quién firma?</legend>
                {requiresRepresentative ? <p className="mb-3 text-xs leading-5 text-amber-900">Según la fecha de nacimiento registrada, este consentimiento debe firmarlo un representante legal.</p> : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className={`flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm ${requiresRepresentative ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                    <input checked={signerRole === "patient"} disabled={requiresRepresentative || submitting} name="signer-role" onChange={() => setSignerRole("patient")} type="radio" />
                    Firma el paciente
                  </label>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm">
                    <input checked={signerRole === "representative"} disabled={submitting} name="signer-role" onChange={() => setSignerRole("representative")} type="radio" />
                    Firma representante legal
                  </label>
                </div>
              </fieldset>

              {signerRole === "representative" ? <section className="rounded-2xl border border-outline-variant p-4"><PersonFields legend="Datos del representante legal" onChange={updateRepresentative} person={representative} submitting={submitting} /></section> : null}

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2"><label className="text-sm font-bold">Firma manuscrita</label><button className="min-h-11 rounded-xl px-3 text-sm font-bold text-primary hover:bg-primary-fixed disabled:opacity-50" disabled={submitting || !hasSignature} onClick={clearSignature} type="button">Borrar firma</button></div>
                <canvas aria-label="Área para firmar con el dedo" className="mt-2 h-44 w-full touch-none rounded-2xl border-2 border-dashed border-primary/45 bg-white" onPointerCancel={stopDrawing} onPointerDown={startDrawing} onPointerLeave={stopDrawing} onPointerMove={draw} onPointerUp={stopDrawing} ref={canvasRef} />
                <p className="mt-1 text-xs text-on-surface-variant">Firma con el dedo o un lápiz táctil dentro del recuadro.</p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-outline-variant p-4 text-sm leading-6">
                <input checked={accepted} className="mt-1 size-4 accent-primary" disabled={submitting} onChange={event => setAccepted(event.target.checked)} required type="checkbox" />
                <span>Declaro que revisé el consentimiento indicado, confirmé los datos que se incorporarán al PDF, comprendí la información y acepto firmarlo electrónicamente.</span>
              </label>
              {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error" role="alert">{error}</p> : null}
              <Button disabled={!hasSignature || !accepted || !detailsComplete} icon="draw" loading={submitting} loadingLabel="Guardando firma…" type="submit">Completar y firmar consentimiento</Button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
