import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import EntityAttachments from "../../components/attachments/EntityAttachments";
import { useAuth } from "../../context/authStore";
import { useAppConfig } from "../../context/appConfigStore";
import * as api from "../../services/healthService";
import DentalAttentionForm from "./DentalAttentionForm";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";
import { matchesEntitySearch } from "../../utils/entitySearch";

// Cuadrantes en orden de lectura clínica: superior derecha → superior izquierda
// luego inferior izquierda → inferior derecha (cruz odontológica estándar)
const QUADRANTS = [
  { key: "ur", label: "Superior derecha", teeth: [18, 17, 16, 15, 14, 13, 12, 11] },
  { key: "ul", label: "Superior izquierda", teeth: [21, 22, 23, 24, 25, 26, 27, 28] },
  { key: "ll", label: "Inferior izquierda", teeth: [38, 37, 36, 35, 34, 33, 32, 31] },
  { key: "lr", label: "Inferior derecha", teeth: [48, 47, 46, 45, 44, 43, 42, 41] },
];

const conditionLabels = {
  healthy: "Sano",
  caries: "Caries",
  filled: "Obturado",
  missing: "Ausente",
  crown: "Corona",
  implant: "Implante",
  fracture: "Fractura",
  root_canal: "Endodoncia",
  extraction: "Extracción",
};
const statusLabels = {
  planned: "Planificado",
  approved: "Aprobado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};
const statusStyles = {
  planned: "bg-slate-100 text-slate-700",
  approved: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-800",
  completed: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-rose-50 text-rose-700",
};
const conditionColors = {
  healthy: "#ffffff",
  caries: "#ef4444",
  filled: "#3b82f6",
  missing: "#f1f5f9",
  crown: "#f59e0b",
  implant: "#64748b",
  fracture: "#fb7185",
  root_canal: "#8b5cf6",
  extraction: "#dc2626",
};
const fieldClass =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-surface px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const currency = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

function initials(a = "", b = "") {
  return `${a[0] || ""}${b[0] || ""}`.toUpperCase() || "?";
}

function avatarTone(seed) {
  const tones = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-800",
    "bg-rose-100 text-rose-700",
  ];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % tones.length;
  return tones[h];
}

function ToothSvg({ condition = "healthy", number }) {
  const lower = number > 30,
    color = conditionColors[condition] || "#fff";
  return (
    <svg
      aria-hidden="true"
      className={`mx-auto h-10 w-8 drop-shadow-sm ${lower ? "rotate-180" : ""}`}
      viewBox="0 0 64 86"
    >
      <path
        d="M13 7C20 2 26 7 32 7S44 2 51 7c9 7 4 25-1 36-3 8-4 33-12 36-7 2-4-23-6-23s1 25-6 23c-8-3-9-28-12-36C9 32 4 14 13 7Z"
        fill={color}
        opacity={condition === "missing" ? 0.25 : 0.95}
        stroke={condition === "extraction" ? "#dc2626" : "#475569"}
        strokeDasharray={condition === "missing" ? "4 3" : "0"}
        strokeWidth="2"
      />
      {condition === "caries" ? (
        <circle cx="23" cy="25" fill="#7f1d1d" r="6" />
      ) : null}
      {condition === "filled" ? (
        <path d="M18 18h28v15H18z" fill="#1d4ed8" opacity=".75" />
      ) : null}
      {condition === "crown" ? (
        <path
          d="M13 8c10 8 28 8 38 0"
          fill="none"
          stroke="#92400e"
          strokeWidth="4"
        />
      ) : null}
      {condition === "fracture" ? (
        <path
          d="m17 16 12 12-8 9 16 13"
          fill="none"
          stroke="#9f1239"
          strokeWidth="3"
        />
      ) : null}
      {condition === "root_canal" ? (
        <path d="M27 35 24 72m13-37 3 37" stroke="#5b21b6" strokeWidth="3" />
      ) : null}
      {condition === "implant" ? (
        <path
          d="M26 36h12v35H26zm-4 8h20m-20 8h20m-20 8h20"
          fill="#475569"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
      ) : null}
      {condition === "extraction" ? (
        <path d="m13 14 38 52M51 14 13 66" stroke="#dc2626" strokeWidth="4" />
      ) : null}
    </svg>
  );
}

function ConditionLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-2xl bg-surface-container-low p-3 text-xs">
      {Object.entries(conditionLabels).map(([key, label]) => (
        <span className="flex items-center gap-1.5" key={key}>
          <span
            className="h-3 w-3 rounded-full border border-outline-variant"
            style={{ background: conditionColors[key] }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
        <span className="material-symbols-outlined text-base">check_circle</span>
        {message}
      </div>
    </div>
  );
}

export function ChartForm({ patientId, tooth, close, done }) {
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState("healthy");
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api.createDentalChartEntry({
        patientId,
        toothNumber: Number(f.get("toothNumber")),
        surface: f.get("surface"),
        condition: f.get("condition"),
        notes: f.get("notes"),
      });
      await done("Hallazgo registrado en el odontograma");
    } catch (requestError) {
      setError(requestError.message || "No se pudo guardar el odontograma");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={close} title="Registrar pieza dental">
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
        <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-3 sm:col-span-2">
          <ToothSvg condition={preview} number={tooth || 11} />
          <div>
            <p className="text-sm font-bold">Pieza {tooth || "—"}</p>
            <p className="text-xs text-on-surface-variant">
              Vista previa según el estado elegido
            </p>
          </div>
        </div>
        <label className="text-sm font-medium">
          Pieza
          <input
            className={`${fieldClass} mt-1`}
            defaultValue={tooth || ""}
            min="11"
            max="85"
            name="toothNumber"
            required
            type="number"
          />
        </label>
        <label className="text-sm font-medium">
          Superficie
          <select className={`${fieldClass} mt-1`} name="surface">
            <option value="whole">Pieza completa</option>
            <option value="occlusal">Oclusal</option>
            <option value="mesial">Mesial</option>
            <option value="distal">Distal</option>
            <option value="buccal">Vestibular</option>
            <option value="lingual">Lingual</option>
            <option value="palatal">Palatina</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Estado
          <select
            className={`${fieldClass} mt-1`}
            name="condition"
            onChange={(e) => setPreview(e.target.value)}
            defaultValue="healthy"
          >
            {Object.entries(conditionLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Observaciones
          <textarea
            className={`${fieldClass} mt-1 min-h-24 py-2`}
            name="notes"
            placeholder="Detalles clínicos relevantes para el seguimiento"
          />
        </label>
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2" role="alert">{error}</p> : null}
        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          <Button onClick={close} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} type="submit">
            {saving ? "Guardando…" : "Guardar odontograma"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function OdontogramModal({
  admin,
  attachmentEntityType = "dental_patient",
  chart,
  close,
  exporting,
  onExport,
  onAttention,
  onTooth,
  patient,
}) {
  const [record, setRecord] = useState({ appointments: [], clinical: [], consumptions: [], documents: [], prescriptions: [], treatments: [] });
  const [recordLoading, setRecordLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [odontogramView, setOdontogramView] = useState("teeth");
  const [quadrantIndex, setQuadrantIndex] = useState(0);
  const [exportPreview, setExportPreview] = useState(false);
  const [exportError, setExportError] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const download = async (format) => { setExportError(""); try { await onExport(format); } catch (error) { setExportError(error.message || "No se pudo generar el archivo"); } };
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.getHealthAppointments(),
      api.getDentalClinicalEntries(patient.id),
      api.getDentalDocuments(patient.id),
      api.getDentalPrescriptions(patient.id),
      api.getDentalTreatments(patient.id),
      api.getDentalConsumptions(patient.id),
    ]).then((results) => {
      if (!active) return;
      const value = (index) => results[index].status === "fulfilled" ? results[index].value : [];
      setRecord({
        appointments: value(0).filter((item) => item.patient?.id === patient.id),
        clinical: value(1), documents: value(2), prescriptions: value(3), treatments: value(4), consumptions: value(5),
      });
    }).finally(() => { if (active) setRecordLoading(false); });
    return () => { active = false; };
  }, [patient.id]);
  useEffect(() => {
    if (!admin || !exportPreview) return undefined;
    let active = true;
    let objectUrl = "";
    queueMicrotask(() => {
      if (active) {
        setPreviewLoading(true);
        setExportError("");
      }
    });
    api.previewDentalChartPdf(patient.id).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl(objectUrl);
    }).catch((error) => {
      if (active) setExportError(error.message || "No se pudo generar la vista previa");
    }).finally(() => {
      if (active) setPreviewLoading(false);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      queueMicrotask(() => setPdfPreviewUrl(""));
    };
  }, [admin, exportPreview, patient.id]);
  const summary = useMemo(() => {
    const counts = {};
    chart.forEach((x) => {
      counts[x.condition] = (counts[x.condition] || 0) + 1;
    });
    return counts;
  }, [chart]);

  return (
    <Modal
      contentClassName="min-h-0 flex-1 overflow-hidden"
      fixedHeight
      onClose={close}
      title={`Odontograma · ${patient.firstName} ${patient.lastName}`}
    >
      <div className="flex h-full min-h-0 flex-col p-3 sm:p-5">
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-container-low p-3 sm:mb-4 sm:gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${avatarTone(patient.document || patient.id)}`}
            >
              {initials(patient.firstName, patient.lastName)}
            </span>
            <div>
              <b>
                {patient.documentType} {patient.document}
              </b>
              <p className="text-sm text-on-surface-variant">
                {patient.phone || "Sin teléfono"} ·{" "}
                {chart.length
                  ? `${chart.length} hallazgo${chart.length === 1 ? "" : "s"}`
                  : "Sin hallazgos registrados"}
              </p>
            </div>
          </div>
          {admin ? (
            <div className="flex gap-2">
              <Button
                disabled={exporting}
                icon="preview"
                onClick={() => { setActiveTab("report"); setExportPreview(true); }}
                variant="secondary"
              >
                Vista previa del PDF
              </Button>
            </div>
          ) : null}
          {onAttention ? <Button icon="medical_services" onClick={onAttention}>Registrar atención</Button> : null}
        </div>

        <div aria-label="Secciones del expediente" className="mb-3 flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-outline-variant bg-white p-1.5 sm:mb-5" role="tablist">
          {[
            ["summary", "account_circle", "Resumen"],
            ["odontogram", "dentistry", "Odontograma"],
            ["history", "clinical_notes", "Historial"],
            ["files", "folder", "Archivos"],
            ...(admin ? [["report", "picture_as_pdf", "Reporte PDF"]] : []),
          ].map(([id, icon, label]) => <button aria-selected={activeTab===id} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${activeTab===id ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-primary-fixed hover:text-primary"}`} key={id} onClick={() => { setActiveTab(id); setExportPreview(id==="report"); }} role="tab" type="button"><span className="material-symbols-outlined text-lg">{icon}</span>{label}</button>)}
        </div>

        {admin && exportPreview ? <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white"><div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low p-3 sm:gap-3 sm:p-4"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-widest text-primary sm:text-xs">Vista previa del informe clínico integral</p><h3 className="truncate text-base font-bold sm:text-lg">Expediente de {patient.firstName} {patient.lastName}</h3><p className="truncate text-[10px] text-on-surface-variant sm:text-xs">{patient.documentType} {patient.document} · Odontograma, historia, atenciones, productos y pagos</p></div><Button disabled={exporting||previewLoading} icon="picture_as_pdf" onClick={() => download("pdf")} variant="secondary">{exporting ? "Generando…" : "Descargar PDF"}</Button></div>{exportError?<p className="m-3 shrink-0 rounded-xl bg-error-container p-3 text-sm text-error">{exportError}</p>:null}{previewLoading?<div className="grid min-h-0 flex-1 place-items-center bg-surface-container-low"><span className="text-sm text-on-surface-variant">Generando vista previa…</span></div>:pdfPreviewUrl?<iframe className="min-h-0 flex-1 w-full bg-surface-container-low" src={pdfPreviewUrl} title={`Vista previa del expediente clínico de ${patient.firstName} ${patient.lastName}`}/>:null}</section>:null}

        <section className={`${activeTab === "summary" ? "grid" : "hidden"} min-h-0 flex-1 gap-3 overflow-y-auto pb-2 lg:grid-cols-3`}>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Ficha del paciente</p>
            <dl className="mt-3 grid gap-2 text-sm">
              <div><dt className="text-xs text-on-surface-variant">Contacto</dt><dd>{patient.phone || "Sin teléfono"} · {patient.email || "Sin correo"}</dd></div>
              <div><dt className="text-xs text-on-surface-variant">Fecha de nacimiento</dt><dd>{patient.birthDate ? new Date(`${patient.birthDate}T00:00:00`).toLocaleDateString("es-PE") : "No registrada"}</dd></div>
              <div><dt className="text-xs text-on-surface-variant">Dirección</dt><dd>{patient.address || "No registrada"}</dd></div>
            </dl>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Alertas clínicas</p>
            <div className="mt-3 grid gap-2 text-sm">
              <p className={patient.allergies ? "rounded-xl bg-error-container p-2" : "text-on-surface-variant"}><b>Alergias:</b> {patient.allergies || "Sin alergias registradas"}</p>
              <p><b>Condiciones:</b> {patient.chronicConditions || "Sin condiciones crónicas registradas"}</p>
              <p><b>Tipo de sangre:</b> {patient.bloodType || "No registrado"}</p>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Resumen conectado</p>
            {recordLoading ? <div className="mt-3 h-20 animate-pulse rounded-xl bg-surface-container-low" /> : <div className="mt-3 grid grid-cols-2 gap-2 text-center"><div className="rounded-xl bg-primary-fixed p-2"><b className="block text-xl">{record.appointments.length}</b><span className="text-xs">Citas</span></div><div className="rounded-xl bg-primary-fixed p-2"><b className="block text-xl">{record.treatments.length}</b><span className="text-xs">Tratamientos</span></div><div className="rounded-xl bg-surface-container-low p-2"><b className="block text-xl">{record.clinical.length}</b><span className="text-xs">Evoluciones</span></div><div className="rounded-xl bg-surface-container-low p-2"><b className="block text-xl">{record.documents.length + record.prescriptions.length}</b><span className="text-xs">Docs./recetas</span></div></div>}
          </Card>
        </section>

        {activeTab === "history" && !recordLoading && (record.appointments.length || record.clinical.length || record.treatments.length || record.prescriptions.length || record.documents.length) ? <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-outline-variant p-4"><h3 className="font-bold">Historial clínico integrado</h3><p className="mb-3 text-sm text-on-surface-variant">Citas, evoluciones, tratamientos, recetas y documentos en una sola ficha.</p><div className="grid gap-2 pr-1 sm:grid-cols-2">{[
          ...record.appointments.map((x) => ({ id: `a-${x.id}`, icon: "event", title: x.reason, detail: `${new Date(x.startsAt).toLocaleString("es-PE")} · ${x.professionalName || "Sin asignar"}` })),
          ...record.clinical.map((x) => ({ id: `c-${x.id}`, icon: "clinical_notes", title: x.title, detail: x.content })),
          ...record.treatments.map((x) => ({ id: `t-${x.id}`, icon: "medical_services", title: x.procedure, detail: `${statusLabels[x.status] || x.status}${x.toothNumber ? ` · Pieza ${x.toothNumber}` : ""}` })),
          ...record.prescriptions.map((x) => ({ id: `p-${x.id}`, icon: "medication", title: x.medication, detail: `${x.dose || ""} ${x.frequency || ""}`.trim() || "Sin indicaciones" })),
          ...record.documents.map((x) => ({ id: `d-${x.id}`, icon: "description", title: x.name, detail: x.documentType })),
          ...record.consumptions.map((x) => ({ id: `s-${x.id}`, icon: "vaccines", title: `${x.quantity} × ${x.product.name}`, detail: `Insumo utilizado · ${x.recordedBy}` })),
        ].map((item) => <article className="flex gap-3 rounded-xl bg-surface-container-low p-3" key={item.id}><span className="material-symbols-outlined text-primary">{item.icon}</span><div className="min-w-0"><b className="block truncate text-sm">{item.title}</b><p className="line-clamp-2 text-xs text-on-surface-variant">{item.detail}</p></div></article>)}</div></section> : null}

        {activeTab === "files" ? <div className="min-h-0 flex-1 overflow-y-auto pb-2"><EntityAttachments entityId={patient.id} entityType={attachmentEntityType} legacyItems={attachmentEntityType === "dental_patient" ? record.documents : []} title="Archivos del paciente" /></div> : null}

        <div className={activeTab === "odontogram" ? "min-h-0 flex-1 overflow-y-auto pb-2" : "hidden"}>
        <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-bold">Odontograma actual</h3><div className="grid grid-cols-2 rounded-xl border border-outline-variant bg-white p-1"><button className={`rounded-lg px-3 py-1.5 text-xs font-bold ${odontogramView==="teeth"?"bg-primary text-white":"text-on-surface-variant"}`} onClick={()=>setOdontogramView("teeth")} type="button">Piezas</button><button className={`rounded-lg px-3 py-1.5 text-xs font-bold ${odontogramView==="findings"?"bg-primary text-white":"text-on-surface-variant"}`} onClick={()=>setOdontogramView("findings")} type="button">Hallazgos ({chart.length})</button></div></div>

        {Object.keys(summary).length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(summary).map(([cond, count]) => (
              <span
                className="flex items-center gap-1.5 rounded-full border border-outline-variant px-2.5 py-1 text-xs font-medium"
                key={cond}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: conditionColors[cond] }}
                />
                {conditionLabels[cond]} · {count}
              </span>
            ))}
          </div>
        ) : null}

        {odontogramView==="teeth"?<><div className="mb-2 flex items-center justify-between rounded-xl bg-surface-container-low p-2"><button aria-label="Cuadrante anterior" className="material-symbols-outlined grid size-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-30" disabled={quadrantIndex===0} onClick={()=>setQuadrantIndex(index=>Math.max(0,index-1))} type="button">chevron_left</button><div className="flex min-w-0 flex-1 justify-center gap-1">{QUADRANTS.map((quadrant,index)=><button aria-label={quadrant.label} className={`h-2.5 rounded-full transition-all ${index===quadrantIndex?'w-8 bg-primary':'w-2.5 bg-outline-variant'}`} key={quadrant.key} onClick={()=>setQuadrantIndex(index)} type="button"/>)}</div><span className="min-w-20 text-center text-xs font-bold">{quadrantIndex+1} / {QUADRANTS.length}</span><button aria-label="Cuadrante siguiente" className="material-symbols-outlined grid size-9 place-items-center rounded-full bg-white shadow-sm disabled:opacity-30" disabled={quadrantIndex===QUADRANTS.length-1} onClick={()=>setQuadrantIndex(index=>Math.min(QUADRANTS.length-1,index+1))} type="button">chevron_right</button></div><div className="mb-3 rounded-2xl border border-outline-variant p-3 sm:p-4">
          {[QUADRANTS[quadrantIndex]].map((q) => (
            <div key={q.key}>
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-primary">
                {q.label}
              </p>
              <div className="grid grid-cols-8 gap-1.5">
                {q.teeth.map((tooth) => {
                  const entry = chart.find((x) => x.toothNumber === tooth);
                  return (
                    <button
                      className={`group relative rounded-xl border p-1.5 transition disabled:cursor-default ${onTooth ? "hover:border-primary hover:shadow-sm" : ""} ${
                        entry
                          ? "border-primary/60 bg-primary-fixed"
                          : "border-outline-variant bg-white"
                      }`}
                      key={tooth}
                      disabled={!onTooth}
                      onClick={() => onTooth?.(tooth)}
                      title={
                        entry
                          ? `Pieza ${tooth} · ${conditionLabels[entry.condition]}`
                          : `Pieza ${tooth} · Sano`
                      }
                      type="button"
                    >
                      <ToothSvg condition={entry?.condition} number={tooth} />
                      <b className="mt-1 block text-[11px] leading-none">
                        {tooth}
                      </b>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div><ConditionLegend /></>:null}

        {odontogramView==="findings"?<div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-outline-variant">
          <div className="grid gap-2 p-2 sm:hidden">
            {chart
              .slice()
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .map((x) => (
                <button
                  className={`rounded-2xl border border-outline-variant p-3 text-left ${onTooth ? "hover:border-primary hover:bg-primary-fixed/30" : ""}`}
                  disabled={!onTooth}
                  key={x.id}
                  onClick={() => onTooth?.(x.toothNumber)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 font-bold">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: conditionColors[x.condition] }}
                      />
                      Pieza {x.toothNumber}
                    </span>
                    <span className="rounded-full bg-surface-container-low px-2 py-1 text-xs font-bold">
                      {conditionLabels[x.condition]}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="font-bold uppercase text-on-surface-variant">Superficie</dt>
                      <dd className="mt-0.5">{x.surface}</dd>
                    </div>
                    <div>
                      <dt className="font-bold uppercase text-on-surface-variant">Actualizado</dt>
                      <dd className="mt-0.5">{new Date(x.updatedAt).toLocaleDateString("es-PE")}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-bold uppercase text-on-surface-variant">Odontólogo</dt>
                      <dd className="mt-0.5">{x.recordedBy || "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-bold uppercase text-on-surface-variant">Observaciones</dt>
                      <dd className="mt-0.5 break-words">{x.notes || "—"}</dd>
                    </div>
                  </dl>
                </button>
              ))}
            {!chart.length ? (
              <p className="p-5 text-center text-sm text-on-surface-variant">
                Sin hallazgos. Pulsa una pieza del odontograma para registrar el primer estado.
              </p>
            ) : null}
          </div>
          <div className="hidden sm:block">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-surface-container-low">
              <tr>
                {[
                  "Pieza",
                  "Superficie",
                  "Estado",
                  "Odontólogo",
                  "Observaciones",
                  "Actualizado",
                ].map((x) => (
                  <th className="border-b border-r p-3" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart
                .slice()
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map((x) => (
                  <tr
                    className={onTooth ? "cursor-pointer hover:bg-primary-fixed/30" : ""}
                    key={x.id}
                    onClick={() => onTooth?.(x.toothNumber)}
                  >
                    <td className="border-r p-3 font-bold">{x.toothNumber}</td>
                    <td className="border-r p-3">{x.surface}</td>
                    <td className="border-r p-3">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: conditionColors[x.condition] }}
                        />
                        {conditionLabels[x.condition]}
                      </span>
                    </td>
                    <td className="border-r p-3">{x.recordedBy || "—"}</td>
                    <td className="border-r p-3">{x.notes || "—"}</td>
                    <td className="p-3">
                      {new Date(x.updatedAt).toLocaleDateString("es-PE")}
                    </td>
                  </tr>
                ))}
              {!chart.length ? (
                <tr>
                  <td
                    className="p-6 text-center text-on-surface-variant"
                    colSpan="6"
                  >
                    Sin hallazgos. Pulsa una pieza del odontograma para
                    registrar el primer estado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>:null}
        </div>
      </div>
    </Modal>
  );
}

function PatientRowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td className="border-b border-r p-3" key={i}>
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-surface-container-low" />
        </td>
      ))}
    </tr>
  );
}

function PatientTable({ loading, onOpen, patients }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      patients.filter((x) =>
        matchesEntitySearch(x, query, (item) => [
          item.firstName,
          item.lastName,
          `${item.firstName} ${item.lastName}`,
          item.document,
          item.phone,
          item.email,
        ]),
      ),
    [patients, query],
  );
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-lg font-bold">Pacientes y odontogramas</h2>
          <p className="text-sm text-on-surface-variant">
            Selecciona un paciente para abrir su expediente visual.
          </p>
        </div>
        <label className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant">
            search
          </span>
          <input
            className={`${fieldClass} pl-10`}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI o celular"
            value={query}
          />
        </label>
      </div>

      {/* Mobile: tarjetas */}
      <div className="grid gap-2 p-3 sm:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                className="h-16 animate-pulse rounded-2xl bg-surface-container-low"
                key={i}
              />
            ))
          : rows.map((x) => (
              <button
                className="flex items-center gap-3 rounded-2xl border border-outline-variant p-3 text-left transition hover:border-primary"
                key={x.id}
                onClick={() => onOpen(x)}
                type="button"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarTone(x.document || x.id)}`}
                >
                  {initials(x.firstName, x.lastName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {x.lastName}, {x.firstName}
                  </span>
                  <span className="block truncate text-xs text-on-surface-variant">
                    {x.documentType} {x.document} · {x.phone || "Sin teléfono"}
                  </span>
                </span>
                <span className="material-symbols-outlined text-on-surface-variant">
                  chevron_right
                </span>
              </button>
            ))}
        {!loading && !rows.length ? (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            No hay pacientes que coincidan con la búsqueda.
          </p>
        ) : null}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-surface-container-low">
            <tr>
              {[
                "Paciente",
                "Documento",
                "Teléfono",
                "Correo",
                "Estado",
                "Odontograma",
              ].map((x) => (
                <th
                  className="border-b border-r border-outline-variant p-3"
                  key={x}
                >
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <PatientRowSkeleton key={i} />
                ))
              : rows.map((x) => (
                  <tr
                    className="cursor-pointer hover:bg-primary-fixed/40"
                    key={x.id}
                    onClick={() => onOpen(x)}
                  >
                    <td className="border-b border-r p-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarTone(x.document || x.id)}`}
                        >
                          {initials(x.firstName, x.lastName)}
                        </span>
                        <b>
                          {x.lastName}, {x.firstName}
                        </b>
                      </span>
                    </td>
                    <td className="border-b border-r p-3">
                      {x.documentType} {x.document}
                    </td>
                    <td className="border-b border-r p-3">
                      {x.phone || "—"}
                    </td>
                    <td className="border-b border-r p-3">
                      {x.email || "—"}
                    </td>
                    <td className="border-b border-r p-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                        {x.status === "active" ? "Activo" : x.status}
                      </span>
                    </td>
                    <td className="border-b p-3">
                      <span className="inline-flex items-center gap-1 font-bold text-primary">
                        Ver odontograma
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && !rows.length ? (
          <div className="p-8 text-center text-on-surface-variant">
            No hay pacientes que coincidan con la búsqueda.
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function TreatmentForm({ patientId, close, done }) {
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const f = new FormData(e.currentTarget);
    try {
      await api.createDentalTreatment({
        patientId,
        toothNumber: f.get("toothNumber")
          ? Number(f.get("toothNumber"))
          : null,
        procedure: f.get("procedure"),
        diagnosis: f.get("diagnosis"),
        professionalName: f.get("professionalName"),
        estimatedCost: Number(f.get("estimatedCost") || 0),
        scheduledAt: f.get("scheduledAt") || null,
        notes: f.get("notes"),
      });
      done("Tratamiento agregado al plan");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={close} title="Nuevo tratamiento">
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-sm font-medium sm:col-span-2">
          Procedimiento
          <input
            className={`${fieldClass} mt-1`}
            name="procedure"
            placeholder="Ej. Extracción de pieza 38"
            required
          />
        </label>
        <label className="text-sm font-medium">
          Pieza dental
          <input
            className={`${fieldClass} mt-1`}
            min="11"
            max="85"
            name="toothNumber"
            placeholder="Opcional"
            type="number"
          />
        </label>
        <label className="text-sm font-medium">
          Diagnóstico
          <input className={`${fieldClass} mt-1`} name="diagnosis" />
        </label>
        <label className="text-sm font-medium">
          Odontólogo
          <input className={`${fieldClass} mt-1`} name="professionalName" />
        </label>
        <label className="text-sm font-medium">
          Costo estimado
          <div className="relative mt-1">
            <span className="absolute left-3 top-2.5 text-sm text-on-surface-variant">
              S/
            </span>
            <input
              className={`${fieldClass} pl-9`}
              min="0"
              name="estimatedCost"
              step="0.01"
              type="number"
            />
          </div>
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Fecha programada
          <input
            className={`${fieldClass} mt-1`}
            name="scheduledAt"
            type="datetime-local"
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Notas
          <textarea
            className={`${fieldClass} mt-1 min-h-24 py-2`}
            name="notes"
          />
        </label>
        <div className="flex items-center justify-end gap-2 sm:col-span-2">
          <Button onClick={close} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} type="submit">
            {saving ? "Guardando…" : "Agregar al plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function TreatmentSummary({ treatments }) {
  const stats = useMemo(() => {
    const total = treatments.reduce(
      (sum, x) => sum + (Number(x.estimatedCost) || 0),
      0,
    );
    const pending = treatments.filter(
      (x) => x.status === "planned" || x.status === "approved",
    ).length;
    const completed = treatments.filter((x) => x.status === "completed").length;
    return { total, pending, completed };
  }, [treatments]);

  if (!treatments.length) return null;
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <Card className="p-4">
        <p className="text-xs font-medium text-on-surface-variant">
          Costo estimado total
        </p>
        <p className="text-xl font-bold">{currency.format(stats.total)}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs font-medium text-on-surface-variant">
          Pendientes
        </p>
        <p className="text-xl font-bold">{stats.pending}</p>
      </Card>
      <Card className="p-4">
        <p className="text-xs font-medium text-on-surface-variant">
          Completados
        </p>
        <p className="text-xl font-bold">{stats.completed}</p>
      </Card>
    </div>
  );
}

export default function DentalWorkspace({ operator = false }) {
  const { moduleKey } = useParams();
  const { user } = useAuth();
  const { config } = useAppConfig();
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [dentalLoading, setDentalLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [chart, setChart] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [modal, setModal] = useState("");
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState("");
  const [attentionId, setAttentionId] = useState("");
  const isChart = moduleKey === "odontogram",
    admin = ["admin", "admin_owner"].includes(user.role),
    patient = patients.find((x) => x.id === patientId),
    canAttention = admin || config?.capabilities?.includes("dental.records.edit");

  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      setError("");
      setPatients(await api.getPatients());
    } catch (e) {
      setError(e.message);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  const loadDental = useCallback(async () => {
    if (!patientId) return;
    setDentalLoading(true);
    try {
      setError("");
      if (isChart) setChart(await api.getDentalChart(patientId));
      else setTreatments(await api.getDentalTreatments(patientId));
    } catch (e) {
      setError(e.message);
    } finally {
      setDentalLoading(false);
    }
  }, [isChart, patientId]);

  useEffect(() => {
    queueMicrotask(loadPatients);
  }, [loadPatients]);
  useEffect(() => {
    queueMicrotask(loadDental);
  }, [loadDental]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const openPatient = (x) => {
    setPatientId(x.id);
    setModal("odontogram");
  };

  const beginAttention = async () => {
    try {
      const attention = await api.startDentalAttention({ patientId, reason: "Atención clínica" });
      setAttentionId(attention.id);
      setModal("attention");
    } catch (e) {
      setError(e.message);
    }
  };

  const done = (message) => {
    setModal(isChart ? "odontogram" : "");
    setSelectedTooth(null);
    loadDental();
    if (message) setToast(message);
  };

  const Shell = operator ? OperatorShell : DashboardShell;

  if (isChart)
    return (
      <Shell
        title="Odontogramas"
        subtitle="Matriz de pacientes con expediente dental visual y exportación administrativa."
      >
        <Toast message={toast} />
        {error && !patients.length ? (
          <EmptyState
            action={
              <Button onClick={loadPatients} variant="secondary">
                Reintentar
              </Button>
            }
            description={error}
            icon="cloud_off"
            title="No se pudo cargar la lista de pacientes"
          />
        ) : (
          <PatientTable
            loading={patientsLoading}
            onOpen={openPatient}
            patients={patients}
          />
        )}
        {modal === "odontogram" && patient ? (
          <OdontogramModal
            admin={admin}
            chart={chart}
            close={() => setModal("")}
            exporting={exporting}
            onExport={async (format) => {
              setExporting(true);
              try {
                await api.exportDentalChart(patientId, format);
                setToast(
                  format === "pdf" ? "PDF exportado" : "Excel exportado",
                );
              } finally {
                setExporting(false);
              }
            }}
            onAttention={canAttention ? beginAttention : null}
            onTooth={(tooth) => {
              setSelectedTooth(tooth);
              setModal("chart");
            }}
            patient={patient}
          />
        ) : null}
        {modal === "chart" ? (
          <ChartForm
            close={() => setModal("odontogram")}
            done={done}
            patientId={patientId}
            tooth={selectedTooth}
          />
        ) : null}
        {modal === "attention" && patient ? <DentalAttentionForm attentionId={attentionId} onClose={() => setModal("odontogram")} onSaved={() => { setAttentionId(""); setModal("odontogram"); loadDental(); setToast("Atención registrada"); }} patient={patient}/> : null}
      </Shell>
    );

  return (
    <Shell
      title="Planes de tratamiento"
      subtitle="Expediente odontológico conectado con pacientes y agenda."
      action={
        <Button
          disabled={!patientId}
          icon="add"
          onClick={() => setModal("treatment")}
        >
          Nuevo tratamiento
        </Button>
      }
    >
      <Toast message={toast} />
      <Card className="mb-5 p-4">
        <EntitySearchSelect
          getLabel={(x) => `${x.lastName}, ${x.firstName}`}
          getMeta={(x) => [x.document, x.phone].filter(Boolean).join(" · ")}
          getSearchValues={(x) => [
            x.firstName,
            x.lastName,
            `${x.firstName} ${x.lastName}`,
            x.document,
            x.phone,
            x.email,
          ]}
          items={patients}
          label="Paciente"
          onChange={setPatientId}
          placeholder="Buscar por nombre, DNI o celular"
          value={patientId}
        />
      </Card>

      {!patientId ? (
        <EmptyState
          description="Selecciona un paciente para consultar sus tratamientos."
          icon="person_search"
          title="Sin paciente seleccionado"
        />
      ) : error ? (
        <EmptyState
          action={
            <Button onClick={loadDental} variant="secondary">
              Reintentar
            </Button>
          }
          description={error}
          icon="cloud_off"
          title="No se pudo cargar el plan de tratamiento"
        />
      ) : dentalLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              className="h-20 animate-pulse rounded-2xl bg-surface-container-low"
              key={i}
            />
          ))}
        </div>
      ) : (
        <>
          <TreatmentSummary treatments={treatments} />
          <div className="grid gap-3">
            {treatments.map((x) => (
              <Card className="p-4" key={x.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{x.procedure}</b>
                      {x.toothNumber ? (
                        <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-xs font-medium">
                          Pieza {x.toothNumber}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {x.diagnosis || "Sin diagnóstico"}
                      {x.professionalName ? ` · ${x.professionalName}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {currency.format(Number(x.estimatedCost) || 0)}
                      {x.scheduledAt
                        ? ` · ${new Date(x.scheduledAt).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}`
                        : ""}
                    </p>
                  </div>
                  <select
                    className={`${fieldClass} w-auto ${statusStyles[x.status] || ""}`}
                    value={x.status}
                    onChange={async (e) => {
                      await api.updateDentalTreatment(x.id, {
                        status: e.target.value,
                      });
                      setToast("Estado actualizado");
                      loadDental();
                    }}
                  >
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            ))}
            {!treatments.length ? (
              <EmptyState
                description="Agrega procedimientos y costos previstos para este paciente."
                icon="clinical_notes"
                title="Sin tratamientos"
              />
            ) : null}
          </div>
        </>
      )}

      {modal === "treatment" ? (
        <TreatmentForm
          close={() => setModal("")}
          done={done}
          patientId={patientId}
        />
      ) : null}
    </Shell>
  );
}
