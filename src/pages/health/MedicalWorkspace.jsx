import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EntityAttachments from "../../components/attachments/EntityAttachments";
import PatientDirectoryList, {
  PatientDirectoryPagination,
} from "../../components/patients/PatientDirectoryList";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";
import Tooltip from "../../components/ui/Tooltip";
import { useAuth } from "../../context/authStore";
import { useAppConfig } from "../../context/appConfigStore";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import useResponsivePatientPageSize from "../../hooks/useResponsivePatientPageSize";
import {
  createMedicalAppointment,
  createMedicalDiagnosis,
  createMedicalOrder,
  createMedicalPatient,
  createMedicalPrescription,
  createMedicalRecord,
  createMedicalResult,
  deleteMedicalDiagnosis,
  deleteMedicalOrder,
  deleteMedicalPrescription,
  deleteMedicalRecord,
  deleteMedicalResult,
  deactivateMedicalPatient,
  getBusinessMedicalServices,
  getMedicalAppointments,
  getMedicalClinicalRecord,
  getMedicalPatientDuplicates,
  getMedicalPatients,
  getMedicalPatientsPage,
  getMedicalProfessionals,
  mergeMedicalPatient,
  exportMedicalClinicalRecord,
  permanentlyDeleteMedicalPatient,
  previewMedicalClinicalRecordPdf,
  restoreMedicalPatient,
  updateMedicalAppointment,
  updateMedicalDiagnosis,
  updateMedicalOrder,
  updateMedicalPatient,
  updateMedicalPrescription,
  updateMedicalRecord,
  updateMedicalResult,
} from "../../services/medicalService";

const statusLabels = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  in_attention: "En atención",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "Inasistencia",
};

const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function PatientActionsMenu({
  canEdit,
  canManageLifecycle,
  isOpen,
  onDeactivate,
  onDelete,
  onEdit,
  onOpenChange,
  onRestore,
  patient,
}) {
  if (!canEdit && !canManageLifecycle) return null;
  const closeAndRun = (action) => () => {
    onOpenChange(null);
    action(patient);
  };

  return (
    <div
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onOpenChange(null);
      }}
    >
      <Tooltip label="Más acciones" placement="top-end">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Más acciones para ${patient.firstName} ${patient.lastName}`}
          className="grid size-9 place-items-center rounded-lg border border-outline-variant bg-white text-on-surface-variant shadow-sm transition hover:border-primary hover:bg-primary-fixed hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          onClick={() => onOpenChange(isOpen ? null : patient.id)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">more_vert</span>
        </button>
      </Tooltip>
      {isOpen ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-outline-variant bg-white p-1.5 shadow-xl" role="menu">
          {canEdit ? <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onEdit)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>Editar ficha</button> : null}
          {canManageLifecycle ? (
            <>
              <div className="my-1 border-t border-outline-variant" />
              {patient.isActive
                ? <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onDeactivate)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">person_off</span>Desactivar paciente</button>
                : <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onRestore)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">restore</span>Restaurar paciente</button>}
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-error transition hover:bg-error-container" onClick={closeAndRun(onDelete)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">delete_forever</span>Eliminar definitivamente</button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MedicalPatientList({
  canEdit,
  canManageLifecycle,
  onDeactivate,
  onDelete,
  onEdit,
  onOpen,
  onOpenChange,
  onRestore,
  openPatientActionsId,
  patients,
}) {
  return (
    <PatientDirectoryList
      actionContent={(patient) => (
        <PatientActionsMenu
          canEdit={canEdit}
          canManageLifecycle={canManageLifecycle}
          isOpen={openPatientActionsId === patient.id}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
          onEdit={onEdit}
          onOpenChange={onOpenChange}
          onRestore={onRestore}
          patient={patient}
        />
      )}
      onOpen={onOpen}
      patients={patients}
    />
  );
}
function asDate(value) {
  return new Date(value);
}

function dateKey(value) {
  const date = asDate(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayDate(value, options = {}) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...options,
  }).format(asDate(value));
}

function displayTime(value) {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(asDate(value));
}

function localDateTimeValue(value) {
  const date = value ? asDate(value) : new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function addDays(value, days) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(value) {
  const result = new Date(value);
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  result.setHours(0, 0, 0, 0);
  return result;
}

function datesForView(view, referenceDate) {
  if (view === "day") return [referenceDate];
  if (view === "week") {
    const start = startOfWeek(referenceDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }
  const first = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function MedicalPatientForm({ close, onSaved, patient }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    setSaving(true);
    try {
      const saved = patient
        ? await updateMedicalPatient(patient.id, data)
        : await createMedicalPatient(data);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={close} title={patient ? "Editar paciente" : "Registrar paciente"}>
      <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-sm font-bold">
          Nombres
          <input className={`${field} mt-1`} defaultValue={patient?.firstName || ""} name="firstName" required />
        </label>
        <label className="text-sm font-bold">
          Apellidos
          <input className={`${field} mt-1`} defaultValue={patient?.lastName || ""} name="lastName" required />
        </label>
        <label className="text-sm font-bold">
          Documento
          <input className={`${field} mt-1`} defaultValue={patient?.document || ""} name="document" required />
        </label>
        <label className="text-sm font-bold">
          Teléfono
          <input className={`${field} mt-1`} defaultValue={patient?.phone || ""} name="phone" />
        </label>
        <label className="text-sm font-bold">
          Correo
          <input className={`${field} mt-1`} defaultValue={patient?.email || ""} name="email" type="email" />
        </label>
        <label className="text-sm font-bold">
          Fecha de nacimiento
          <input className={`${field} mt-1`} defaultValue={patient?.birthDate || ""} name="birthDate" type="date" />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Alergias relevantes
          <textarea className={`${field} mt-1 min-h-20 py-2`} defaultValue={patient?.allergies || ""} name="allergies" />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Antecedentes y observaciones
          <textarea className={`${field} mt-1 min-h-20 py-2`} defaultValue={patient?.notes || ""} name="notes" />
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button onClick={close} type="button" variant="outlined">Cancelar</Button>
          <Button disabled={saving} icon="save" type="submit">
            {patient ? "Guardar cambios" : "Registrar paciente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function MedicalAppointmentForm({ appointment, close, done, patients, professionals, services }) {
  const [patientId, setPatientId] = useState(appointment?.patientId || "");
  const [professionalId, setProfessionalId] = useState(appointment?.professionalId || "");
  const [serviceId, setServiceId] = useState(appointment?.medicalServiceTypeId || "");
  const [minimumDateTime] = useState(() => {
    const nextMinute = new Date();
    nextMinute.setSeconds(0, 0);
    nextMinute.setMinutes(nextMinute.getMinutes() + 1);
    return localDateTimeValue(nextMinute);
  });
  const [startsAt, setStartsAt] = useState(() => appointment?.startsAt ? localDateTimeValue(appointment.startsAt) : minimumDateTime);
  const [endsAt, setEndsAt] = useState(() => appointment?.endsAt ? localDateTimeValue(appointment.endsAt) : localDateTimeValue(new Date(new Date(minimumDateTime).getTime() + 30 * 60_000)));
  const [scheduleError, setScheduleError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const now = new Date();

    if (Number.isNaN(start.getTime()) || start.getTime() < now.getTime()) {
      setScheduleError("Selecciona una fecha y hora futura para la cita.");
      return;
    }
    if (Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      setScheduleError("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    setScheduleError("");
    const form = new FormData(event.currentTarget);
    const data = {
      patientId,
      professionalId,
      medicalServiceTypeId: serviceId,
      startsAt,
      endsAt,
      reason: form.get("reason"),
      notes: form.get("notes"),
    };
    setSaving(true);
    try {
      if (appointment) await updateMedicalAppointment(appointment.id, data);
      else await createMedicalAppointment(data);
      done();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={close} title={appointment ? "Reprogramar cita" : "Nueva cita"}>
      <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={submit}>
        <div className="sm:col-span-2">
          <EntitySearchSelect
            getLabel={(item) => `${item.lastName}, ${item.firstName}`}
            getMeta={(item) => [item.document, item.phone].filter(Boolean).join(" · ")}
            getSearchValues={(item) => [item.firstName, item.lastName, item.document, item.phone, item.email]}
            items={patients}
            label="Paciente"
            name="patientId"
            onChange={setPatientId}
            placeholder="Buscar por nombre, DNI o teléfono"
            required
            value={patientId}
          />
        </div>
        <label className="text-sm font-bold">
          Servicio médico
          <select className={`${field} mt-1`} onChange={(event) => setServiceId(event.target.value)} required value={serviceId}>
            <option value="">Selecciona un servicio</option>
            {services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">
          Profesional
          <select className={`${field} mt-1`} onChange={(event) => setProfessionalId(event.target.value)} required value={professionalId}>
            <option value="">Selecciona un profesional</option>
            {professionals.map((item) => <option key={item.userId} value={item.userId}>{item.name} · {item.specialty}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">
          Inicio
          <input className={`${field} mt-1`} min={minimumDateTime} name="startsAt" onChange={(event) => { setStartsAt(event.target.value); setScheduleError(""); }} required type="datetime-local" value={startsAt} />
        </label>
        <label className="text-sm font-bold">
          Fin
          <input className={`${field} mt-1`} min={startsAt > minimumDateTime ? startsAt : minimumDateTime} name="endsAt" onChange={(event) => { setEndsAt(event.target.value); setScheduleError(""); }} required type="datetime-local" value={endsAt} />
        </label>
        {scheduleError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container sm:col-span-2" role="alert">{scheduleError}</p> : null}
        <label className="text-sm font-bold sm:col-span-2">
          Motivo de consulta
          <input className={`${field} mt-1`} defaultValue={appointment?.reason || ""} name="reason" required />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Notas de agenda
          <textarea className={`${field} mt-1 min-h-20 py-2`} defaultValue={appointment?.notes || ""} name="notes" />
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button onClick={close} type="button" variant="outlined">Cancelar</Button>
          <Button disabled={saving || !patientId || !professionalId || !serviceId} icon="event_available" type="submit">
            {appointment ? "Guardar cita" : "Agendar cita"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ClinicalEntryForm({ close, done, patient, records, type }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const recordId = form.get("recordId") || null;
    setSaving(true);
    try {
      if (type === "record") {
        await createMedicalRecord({
          patientId: patient.id,
          recordType: "evolution",
          title: form.get("title"),
          content: form.get("content"),
          vitalSigns: {
            temperature: form.get("temperature"),
            bloodPressure: form.get("bloodPressure"),
            heartRate: form.get("heartRate"),
          },
        });
      } else if (type === "diagnosis") {
        await createMedicalDiagnosis({ patientId: patient.id, recordId, name: form.get("name"), notes: form.get("notes") });
      } else if (type === "prescription") {
        await createMedicalPrescription({ patientId: patient.id, recordId, medication: form.get("medication"), dose: form.get("dose"), frequency: form.get("frequency"), duration: form.get("duration"), instructions: form.get("instructions") });
      } else if (type === "order") {
        await createMedicalOrder({ patientId: patient.id, recordId, orderType: form.get("orderType"), name: form.get("name"), instructions: form.get("instructions") });
      } else {
        await createMedicalResult({ patientId: patient.id, name: form.get("name"), summary: form.get("summary"), url: form.get("url"), status: "validated" });
      }
      done();
    } finally {
      setSaving(false);
    }
  };
  const titles = {
    record: "Registrar evolución",
    diagnosis: "Registrar diagnóstico",
    prescription: "Crear receta",
    order: "Crear orden médica",
    result: "Subir resultado",
  };
  return (
    <Modal onClose={close} title={titles[type]}>
      <form className="grid gap-3 p-5" onSubmit={submit}>
        {type !== "record" && type !== "result" ? (
          <label className="text-sm font-bold">
            Historia relacionada
            <select className={`${field} mt-1`} name="recordId">
              <option value="">Sin historia específica</option>
              {records.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
        ) : null}
        {type === "record" ? (
          <>
            <label className="text-sm font-bold">Título<input className={`${field} mt-1`} name="title" required /></label>
            <label className="text-sm font-bold">Evolución<textarea className={`${field} mt-1 min-h-28 py-2`} name="content" /></label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-bold">Temperatura<input className={`${field} mt-1`} name="temperature" placeholder="36.7" /></label>
              <label className="text-sm font-bold">Presión arterial<input className={`${field} mt-1`} name="bloodPressure" placeholder="120/80" /></label>
              <label className="text-sm font-bold">Frecuencia cardiaca<input className={`${field} mt-1`} name="heartRate" placeholder="72" /></label>
            </div>
          </>
        ) : null}
        {type === "diagnosis" ? <><label className="text-sm font-bold">Diagnóstico<input className={`${field} mt-1`} name="name" required /></label><label className="text-sm font-bold">Notas<textarea className={`${field} mt-1 min-h-20 py-2`} name="notes" /></label></> : null}
        {type === "prescription" ? <><label className="text-sm font-bold">Medicamento<input className={`${field} mt-1`} name="medication" required /></label><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-bold">Dosis<input className={`${field} mt-1`} name="dose" /></label><label className="text-sm font-bold">Frecuencia<input className={`${field} mt-1`} name="frequency" /></label><label className="text-sm font-bold">Duración<input className={`${field} mt-1`} name="duration" /></label></div><label className="text-sm font-bold">Indicaciones<textarea className={`${field} mt-1 min-h-20 py-2`} name="instructions" /></label></> : null}
        {type === "order" ? <><label className="text-sm font-bold">Tipo<select className={`${field} mt-1`} defaultValue="exam" name="orderType"><option value="exam">Examen</option><option value="laboratory">Laboratorio</option><option value="imaging">Imagen</option><option value="procedure">Procedimiento</option><option value="referral">Derivación</option></select></label><label className="text-sm font-bold">Orden<input className={`${field} mt-1`} name="name" required /></label><label className="text-sm font-bold">Indicaciones<textarea className={`${field} mt-1 min-h-20 py-2`} name="instructions" /></label></> : null}
        {type === "result" ? <><label className="text-sm font-bold">Resultado<input className={`${field} mt-1`} name="name" required /></label><label className="text-sm font-bold">Resumen<textarea className={`${field} mt-1 min-h-20 py-2`} name="summary" /></label><label className="text-sm font-bold">Enlace del archivo<input className={`${field} mt-1`} name="url" type="url" /></label></> : null}
        <div className="flex justify-end gap-2"><Button onClick={close} type="button" variant="outlined">Cancelar</Button><Button disabled={saving} icon="save" type="submit">Guardar</Button></div>
      </form>
    </Modal>
  );
}

function ClinicalEditForm({ close, done, entry }) {
  const [saving, setSaving] = useState(false);
  const { item, type } = entry;
  const config = {
    record: { title: "Editar evolución", update: updateMedicalRecord },
    diagnosis: { title: "Editar diagnóstico", update: updateMedicalDiagnosis },
    prescription: { title: "Editar receta", update: updateMedicalPrescription },
    order: { title: "Editar orden médica", update: updateMedicalOrder },
    result: { title: "Editar resultado", update: updateMedicalResult },
  }[type];
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      if (type === "record") await config.update(item.id, { title: form.get("title"), content: form.get("content") });
      else if (type === "diagnosis") await config.update(item.id, { name: form.get("name"), notes: form.get("notes") });
      else if (type === "prescription") await config.update(item.id, { medication: form.get("medication"), dose: form.get("dose"), frequency: form.get("frequency"), duration: form.get("duration"), instructions: form.get("instructions") });
      else if (type === "order") await config.update(item.id, { name: form.get("name"), instructions: form.get("instructions"), status: form.get("status") });
      else await config.update(item.id, { name: form.get("name"), summary: form.get("summary"), url: form.get("url"), status: form.get("status") });
      done();
    } finally {
      setSaving(false);
    }
  };
  return <Modal onClose={close} title={config.title}><form className="grid gap-3 p-5" onSubmit={submit}>
    {type === "record" ? <><label className="text-sm font-bold">Título<input className={`${field} mt-1`} defaultValue={item.title} name="title" required /></label><label className="text-sm font-bold">Evolución<textarea className={`${field} mt-1 min-h-28 py-2`} defaultValue={item.content} name="content" /></label></> : null}
    {type === "diagnosis" ? <><label className="text-sm font-bold">Diagnóstico<input className={`${field} mt-1`} defaultValue={item.name} name="name" required /></label><label className="text-sm font-bold">Notas<textarea className={`${field} mt-1 min-h-20 py-2`} defaultValue={item.notes} name="notes" /></label></> : null}
    {type === "prescription" ? <><label className="text-sm font-bold">Medicamento<input className={`${field} mt-1`} defaultValue={item.medication} name="medication" required /></label><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm font-bold">Dosis<input className={`${field} mt-1`} defaultValue={item.dose} name="dose" /></label><label className="text-sm font-bold">Frecuencia<input className={`${field} mt-1`} defaultValue={item.frequency} name="frequency" /></label><label className="text-sm font-bold">Duración<input className={`${field} mt-1`} defaultValue={item.duration} name="duration" /></label></div><label className="text-sm font-bold">Indicaciones<textarea className={`${field} mt-1 min-h-20 py-2`} defaultValue={item.instructions} name="instructions" /></label></> : null}
    {type === "order" ? <><label className="text-sm font-bold">Orden<input className={`${field} mt-1`} defaultValue={item.name} name="name" required /></label><label className="text-sm font-bold">Indicaciones<textarea className={`${field} mt-1 min-h-20 py-2`} defaultValue={item.instructions} name="instructions" /></label><label className="text-sm font-bold">Estado<select className={`${field} mt-1`} defaultValue={item.status} name="status"><option value="pending">Pendiente</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option></select></label></> : null}
    {type === "result" ? <><label className="text-sm font-bold">Resultado<input className={`${field} mt-1`} defaultValue={item.name} name="name" required /></label><label className="text-sm font-bold">Resumen<textarea className={`${field} mt-1 min-h-20 py-2`} defaultValue={item.summary} name="summary" /></label><label className="text-sm font-bold">Enlace del archivo<input className={`${field} mt-1`} defaultValue={item.url} name="url" type="url" /></label><label className="text-sm font-bold">Estado<select className={`${field} mt-1`} defaultValue={item.status} name="status"><option value="pending">Pendiente</option><option value="validated">Validado</option><option value="rejected">Rechazado</option></select></label></> : null}
    <div className="flex justify-end gap-2"><Button onClick={close} type="button" variant="outlined">Cancelar</Button><Button disabled={saving} icon="save" type="submit">{saving ? "Guardando..." : "Guardar cambios"}</Button></div>
  </form></Modal>;
}

export function MedicalRecordModal({ close, initialTab = "summary", onEdit, onReload, patient, record }) {
  const [clinicalType, setClinicalType] = useState("");
  const [editingEntry, setEditingEntry] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [exporting, setExporting] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const saveClinical = async () => {
    setClinicalType("");
    await onReload(patient.id);
  };
  useEffect(() => {
    if (activeTab !== "report") return undefined;
    let active = true;
    let objectUrl = "";
    queueMicrotask(() => {
      if (active) {
        setPdfLoading(true);
        setPdfError("");
      }
    });
    previewMedicalClinicalRecordPdf(patient.id)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfPreviewUrl(objectUrl);
      })
      .catch((error) => {
        if (active) setPdfError(error.message || "No se pudo generar el PDF.");
      })
      .finally(() => {
        if (active) setPdfLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      queueMicrotask(() => setPdfPreviewUrl(""));
    };
  }, [activeTab, patient.id]);
  const tabs = [
    ["summary", "account_circle", "Resumen"],
    ["records", "clinical_notes", "Evoluciones"],
    ["diagnoses", "diagnosis", "Diagnósticos"],
    ["prescriptions", "medication", "Recetas"],
    ["orders", "lab_profile", "Órdenes"],
    ["results", "science", "Resultados"],
    ["files", "folder", "Archivos"],
    ["report", "picture_as_pdf", "Reporte PDF"],
  ];
  const tabItems = record[activeTab] || [];
  const tabConfig = {
    records: { type: "record", label: "Evoluciones", icon: "note_add", remove: deleteMedicalRecord },
    diagnoses: { type: "diagnosis", label: "Diagnósticos", icon: "diagnosis", remove: deleteMedicalDiagnosis },
    prescriptions: { type: "prescription", label: "Recetas", icon: "medication", remove: deleteMedicalPrescription },
    orders: { type: "order", label: "Órdenes", icon: "lab_profile", remove: deleteMedicalOrder },
    results: { type: "result", label: "Resultados", icon: "science", remove: deleteMedicalResult },
  }[activeTab];
  const openCreate = (type) => {
    setActionError("");
    setEditingEntry(null);
    setClinicalType(type);
  };
  const openEdit = (type, item) => {
    setActionError("");
    setClinicalType("");
    setEditingEntry({ type, item });
  };
  const removeEntry = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      setActionError("");
      await pendingDelete.remove(pendingDelete.item.id);
      await onReload(patient.id);
      setPendingDelete(null);
    } catch (error) {
      setActionError(error.message || "No se pudo eliminar el registro.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <>
      <Modal
        contentClassName="min-h-0 flex-1 overflow-hidden"
        fixedHeight
        onClose={close}
        title={`Expediente médico · ${patient.firstName} ${patient.lastName}`}
      >
        <div className="flex h-full min-h-0 flex-col p-3 sm:p-5">
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-fixed font-bold text-primary">
                {patient.firstName?.[0]}{patient.lastName?.[0]}
              </span>
              <div className="min-w-0">
                <b>{patient.documentType} {patient.document}</b>
                <p className="truncate text-sm text-on-surface-variant">
                  {patient.phone || "Sin teléfono"} · {patient.allergies ? `Alergias: ${patient.allergies}` : "Sin alertas clínicas"}
                </p>
              </div>
            </div>
            {onEdit ? <Button icon="edit" onClick={() => onEdit(patient)} size="small" variant="outlined">Editar ficha</Button> : null}
          </div>
          <div aria-label="Secciones del expediente médico" className="mb-3 flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-outline-variant bg-white p-1.5" role="tablist">
            {tabs.map(([id, icon, label]) => (
              <button
                aria-selected={activeTab === id}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${activeTab === id ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-primary-fixed hover:text-primary"}`}
                key={id}
                onClick={() => setActiveTab(id)}
                role="tab"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
              </button>
            ))}
          </div>
          {activeTab === "summary" ? (
            <section className="grid min-h-0 flex-1 gap-3 overflow-y-auto pb-2 lg:grid-cols-3">
              <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-primary">Ficha del paciente</p><dl className="mt-3 grid gap-2 text-sm"><div><dt className="text-xs text-on-surface-variant">Contacto</dt><dd>{patient.phone || "Sin teléfono"} · {patient.email || "Sin correo"}</dd></div><div><dt className="text-xs text-on-surface-variant">Antecedentes</dt><dd>{patient.chronicConditions || "Sin antecedentes registrados"}</dd></div><div><dt className="text-xs text-on-surface-variant">Contacto de emergencia</dt><dd>{patient.emergencyContact || "No registrado"}</dd></div></dl></Card>
              <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-primary">Alertas clínicas</p><div className="mt-3 grid gap-2 text-sm"><p className={patient.allergies ? "rounded-xl bg-error-container p-2" : "text-on-surface-variant"}><b>Alergias:</b> {patient.allergies || "Sin alergias registradas"}</p><p><b>Tipo de sangre:</b> {patient.bloodType || "No registrado"}</p><p><b>Seguro:</b> {patient.insuranceProvider || "No registrado"}</p></div></Card>
              <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-primary">Resumen conectado</p><div className="mt-3 grid grid-cols-2 gap-2 text-center"><div className="rounded-xl bg-primary-fixed p-2"><b className="block text-xl">{record.appointments.length}</b><span className="text-xs">Citas</span></div><div className="rounded-xl bg-primary-fixed p-2"><b className="block text-xl">{record.records.length}</b><span className="text-xs">Evoluciones</span></div><div className="rounded-xl bg-surface-container-low p-2"><b className="block text-xl">{record.diagnoses.length}</b><span className="text-xs">Diagnósticos</span></div><div className="rounded-xl bg-surface-container-low p-2"><b className="block text-xl">{record.orders.length + record.results.length}</b><span className="text-xs">Órdenes / resultados</span></div></div></Card>
            </section>
          ) : null}
          {["records", "diagnoses", "prescriptions", "orders", "results"].includes(activeTab) ? (
            <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-outline-variant p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-3">
                <div><h3 className="font-bold">{tabConfig.label}</h3><p className="text-xs text-on-surface-variant">Registra, edita o elimina información clínica de esta categoría.</p></div>
                <Button icon={tabConfig.icon} onClick={() => openCreate(tabConfig.type)} size="small">Agregar</Button>
              </div>
              {actionError ? <p className="mb-3 rounded-xl bg-error-container p-3 text-sm text-error">{actionError}</p> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                {tabItems.map((item) => {
                  const title = activeTab === "records" ? item.title : activeTab === "diagnoses" ? item.name : activeTab === "prescriptions" ? item.medication : item.name;
                  const detail = activeTab === "records" ? item.content : activeTab === "diagnoses" ? item.notes : activeTab === "prescriptions" ? `${item.dose || ""} ${item.frequency || ""} ${item.duration || ""}` : `${item.status || ""} ${item.instructions || item.summary || ""}`;
                  const stamp = item.createdAt || item.issuedAt || item.orderedAt || item.resultedAt;
                  return <article className="rounded-xl bg-surface-container-low p-3" key={item.id}><div className="flex flex-wrap justify-between gap-2"><b>{title}</b><small>{stamp ? new Date(stamp).toLocaleString("es-PE") : ""}</small></div><p className="mt-1 text-sm text-on-surface-variant">{detail || "Sin detalle adicional"}</p><div className="mt-3 flex justify-end gap-2"><Button icon="edit" onClick={() => openEdit(tabConfig.type, item)} size="small" variant="outlined">Editar</Button><Button icon="delete" onClick={() => setPendingDelete({ item, remove: tabConfig.remove, title })} size="small" variant="danger">Eliminar</Button></div></article>;
                })}
                {!tabItems.length ? <EmptyState description="No hay información registrada en esta sección." icon="clinical_notes" title="Sin registros" /> : null}
              </div>
            </section>
          ) : null}
          {activeTab === "files" ? <div className="min-h-0 flex-1 overflow-y-auto pb-2"><EntityAttachments entityId={patient.id} entityType="health_patient" /></div> : null}
          {activeTab === "report" ? (
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low p-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Expediente clínico integral</p><h3 className="font-bold">Reporte médico de {patient.firstName} {patient.lastName}</h3></div><Button disabled={exporting} icon="picture_as_pdf" onClick={async () => { setExporting(true); try { await exportMedicalClinicalRecord(patient.id); } finally { setExporting(false); } }} variant="outlined">{exporting ? "Generando..." : "Descargar PDF"}</Button></div>
              {pdfError ? <p className="m-3 rounded-xl bg-error-container p-3 text-sm text-error">{pdfError}</p> : null}
              {pdfLoading ? <div className="grid min-h-0 flex-1 place-items-center bg-surface-container-low text-sm text-on-surface-variant">Generando vista previa...</div> : null}
              {!pdfLoading && pdfPreviewUrl ? <iframe className="min-h-0 flex-1 w-full bg-surface-container-low" src={pdfPreviewUrl} title={`Reporte médico de ${patient.firstName} ${patient.lastName}`} /> : null}
            </section>
          ) : null}
        </div>
      </Modal>
      {clinicalType ? <ClinicalEntryForm close={() => setClinicalType("")} done={saveClinical} patient={patient} records={record.records} type={clinicalType} /> : null}
      {editingEntry ? <ClinicalEditForm close={() => setEditingEntry(null)} done={async () => { setEditingEntry(null); await onReload(patient.id); }} entry={editingEntry} /> : null}
      {pendingDelete ? (
        <Modal onClose={() => !deleting && setPendingDelete(null)} title="Eliminar registro clínico">
          <div className="grid gap-4 p-5">
            <p>
              Se eliminará <b>{pendingDelete.title}</b>. Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={deleting} onClick={() => setPendingDelete(null)} type="button" variant="secondary">Cancelar</Button>
              <Button disabled={deleting} icon="delete" onClick={removeEntry} type="button" variant="danger">{deleting ? "Eliminando..." : "Eliminar"}</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

export function MedicalAppointmentDetail({ appointment, canUpdateStatus = true, close, done, onOpenRecord }) {
  const [saving, setSaving] = useState(false);
  const setStatus = async (status) => {
    setSaving(true);
    try {
      await updateMedicalAppointment(appointment.id, { status });
      done();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={close} title="Detalle de cita">
      <div className="grid gap-4 p-5">
        <div><p className="text-lg font-bold">{appointment.patient.firstName} {appointment.patient.lastName}</p><p className="text-sm text-on-surface-variant">{displayDate(appointment.startsAt)} · {displayTime(appointment.startsAt)} a {displayTime(appointment.endsAt)}</p></div>
        <div className="grid gap-2 rounded-xl bg-surface-container p-3 text-sm"><p><b>Profesional:</b> {appointment.professionalName}</p><p><b>Servicio:</b> {appointment.medicalServiceName}</p><p><b>Motivo:</b> {appointment.reason}</p><p><b>Estado:</b> {statusLabels[appointment.status]}</p></div>
        {onOpenRecord ? (
          <button
            className="flex min-h-14 items-center justify-between rounded-2xl border border-primary/30 bg-primary-fixed p-4 text-left text-primary"
            onClick={() => onOpenRecord(appointment.patient)}
            type="button"
          >
            <span>
              <b className="block">Abrir expediente médico</b>
              <span className="text-xs">Historia, diagnósticos, recetas, órdenes, resultados y PDF</span>
            </span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {canUpdateStatus && (appointment.status === "scheduled" || appointment.status === "confirmed") ? <Button disabled={saving} icon="play_circle" onClick={() => setStatus("in_attention")} size="small">Iniciar atención</Button> : null}
          {canUpdateStatus && appointment.status === "in_attention" ? <Button disabled={saving} icon="task_alt" onClick={() => setStatus("completed")} size="small">Finalizar atención</Button> : null}
          {canUpdateStatus && !['completed', 'cancelled', 'no_show'].includes(appointment.status) ? <Button disabled={saving} icon="event_busy" onClick={() => setStatus("cancelled")} size="small" variant="outlined">Cancelar</Button> : null}
          {canUpdateStatus && !['completed', 'cancelled', 'no_show'].includes(appointment.status) ? <Button disabled={saving} icon="person_off" onClick={() => setStatus("no_show")} size="small" variant="outlined">Inasistencia</Button> : null}
        </div>
      </div>
    </Modal>
  );
}

export default function MedicalWorkspace({ operator = false }) {
  const { moduleKey } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { config } = useAppConfig();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [clinicalRecord, setClinicalRecord] = useState({ appointments: [], records: [], diagnoses: [], prescriptions: [], orders: [], results: [] });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [modal, setModal] = useState("");
  const [editingPatient, setEditingPatient] = useState(null);
  const [patientActionError, setPatientActionError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(() => searchParams.get("search") || "");
  const [patientTotal, setPatientTotal] = useState(0);
  const [patientPage, setPatientPage] = useState(1);
  const patientPageSize = useResponsivePatientPageSize();
  const [patientStatus, setPatientStatus] = useState("active");
  const [openPatientActionsId, setOpenPatientActionsId] = useState(null);
  const [view, setView] = useState("week");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [filters, setFilters] = useState({ professionalId: "", medicalServiceTypeId: "", status: "" });
  const isPatients = moduleKey === "patients";
  const Shell = operator ? OperatorShell : DashboardShell;
  const administrator = ["admin", "admin_owner"].includes(user?.role);
  const capabilities = new Set(config?.capabilities || []);
  const canCreatePatient = administrator || capabilities.has("health.patients.edit");
  const canCreateAppointment = administrator || capabilities.has("health.appointments.create");
  const canUpdateAppointmentStatus = administrator || capabilities.has("health.appointments.status");
  const canManagePatientLifecycle = ["admin", "admin_owner"].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const patientRequest = isPatients
        ? getMedicalPatientsPage({
          include_inactive: patientStatus === "all",
          page: patientPage,
          page_size: patientPageSize,
          search: query,
          status: patientStatus === "all" ? undefined : patientStatus,
        })
        : getMedicalPatients();
      const [patientRows, appointmentRows, professionalsRows, businessServices] = await Promise.all([
        patientRequest,
        getMedicalAppointments({
          professional_id: filters.professionalId,
          medical_service_type_id: filters.medicalServiceTypeId,
          status: filters.status,
        }),
        getMedicalProfessionals(),
        getBusinessMedicalServices(),
      ]);
      if (isPatients) {
        const totalPages = Math.max(1, Math.ceil(patientRows.total / patientPageSize));
        if (patientRows.total > 0 && patientPage > totalPages) {
          setPatientPage(totalPages);
          return;
        }
        setPatients(patientRows.items);
        setPatientTotal(patientRows.total);
      } else {
        setPatients(patientRows);
        setPatientTotal(patientRows.length);
      }
      setAppointments(appointmentRows);
      setProfessionals(professionalsRows);
      setServices(businessServices.map((item) => item.serviceType));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [filters, isPatients, patientPage, patientPageSize, patientStatus, query]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(load, ["/medical"]);

  const days = useMemo(() => datesForView(view, referenceDate), [referenceDate, view]);
  const appointmentsByDay = useMemo(() => {
    const grouped = new Map();
    appointments.forEach((item) => {
      const key = dateKey(item.startsAt);
      grouped.set(key, [...(grouped.get(key) || []), item]);
    });
    return grouped;
  }, [appointments]);
  const openPatient = async (patient) => {
    setSelectedPatient(patient);
    setModal("record");
    try {
      setClinicalRecord(await getMedicalClinicalRecord(patient.id));
    } catch (requestError) {
      setError(requestError.message);
      setClinicalRecord({ appointments: [], records: [], diagnoses: [], prescriptions: [], orders: [], results: [] });
    }
  };
  const reloadPatientRecords = async (patientId) => {
    setClinicalRecord(await getMedicalClinicalRecord(patientId));
    await load();
  };
  const completeModal = async () => {
    setModal("");
    setEditingPatient(null);
    setSelectedAppointment(null);
    await load();
  };
  const moveDate = (direction) => {
    const amount = view === "day" ? 1 : view === "week" ? 7 : 31;
    setReferenceDate((current) => addDays(current, direction * amount));
  };
  const askDeactivate = (patient) => {
    setSelectedPatient(patient);
    setPatientActionError("");
    setModal("deactivate");
  };
  const askPermanentDelete = (patient) => {
    setSelectedPatient(patient);
    setPatientActionError("");
    setModal("permanent-delete");
  };
  const restorePatient = async (patient) => {
    try {
      setError("");
      await restoreMedicalPatient(patient.id);
      await load();
    } catch (requestError) {
      setError(requestError.message || "No se pudo restaurar al paciente.");
    }
  };
  const detectDuplicates = async () => {
    try {
      setError("");
      setDuplicateGroups(await getMedicalPatientDuplicates());
      setModal("duplicates");
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <Shell
      action={(isPatients ? canCreatePatient : canCreateAppointment) ? <Button icon="add" onClick={() => setModal(isPatients ? "patient" : "appointment")}>{isPatients ? "Registrar paciente" : "Nueva cita"}</Button> : null}
      subtitle={isPatients ? "Fichas clínicas, antecedentes y trazabilidad de pacientes." : "Agenda por profesional, servicio y estado de atención."}
      title={isPatients ? "Pacientes" : "Agenda médica"}
    >
      {error ? <EmptyState description={error} icon="cloud_off" title="No se pudo cargar" /> : null}
      {loading ? <Card className="h-44 animate-pulse" /> : null}
      {!loading && !error && isPatients ? (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 min-w-56 flex-[1_1_24rem] items-center gap-2 rounded-xl border border-outline-variant bg-white px-3"><span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">search</span><input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => { setQuery(event.target.value); setPatientPage(1); }} placeholder="Buscar por nombre, DNI, teléfono o correo" value={query} /></label>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 text-sm font-bold"><span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">filter_list</span><span className="sr-only">Estado</span><select aria-label="Filtrar pacientes por estado" className="bg-transparent outline-none" onChange={(event) => { setPatientStatus(event.target.value); setPatientPage(1); }} value={patientStatus}><option value="active">Activos</option><option value="all">Todos</option><option value="inactive">Inactivos</option></select></label>
            <Button icon="content_copy" onClick={detectDuplicates} variant="secondary">Detectar duplicados</Button>
          </div>
          {patients.length ? <MedicalPatientList canEdit={canCreatePatient} canManageLifecycle={canManagePatientLifecycle} onDeactivate={askDeactivate} onDelete={askPermanentDelete} onEdit={(patient) => { setEditingPatient(patient); setModal("patient"); }} onOpen={openPatient} onOpenChange={setOpenPatientActionsId} onRestore={restorePatient} openPatientActionsId={openPatientActionsId} patients={patients} /> : <EmptyState description="Prueba con otro nombre, documento o estado." icon="groups" title="No hay pacientes para mostrar" />}
          <PatientDirectoryPagination
            onPageChange={setPatientPage}
            page={patientPage}
            pageSize={patientPageSize}
            total={patientTotal}
          />
        </section>
      ) : null}
      {!loading && !error && !isPatients ? (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-surface-container p-1" role="group" aria-label="Vista de calendario">{[["day", "Día"], ["week", "Semana"], ["month", "Mes"]].map(([key, label]) => <button className={`min-h-9 rounded-lg px-3 text-sm font-bold ${view === key ? "bg-white text-primary shadow-sm" : "text-on-surface-variant"}`} key={key} onClick={() => setView(key)} type="button">{label}</button>)}</div>
            <Button icon="chevron_left" onClick={() => moveDate(-1)} size="small" title="Periodo anterior" variant="outlined" /><Button icon="today" onClick={() => setReferenceDate(new Date())} size="small" title="Ir a hoy" variant="outlined" /><Button icon="chevron_right" onClick={() => moveDate(1)} size="small" title="Periodo siguiente" variant="outlined" />
            <b className="ml-1 text-sm capitalize">{displayDate(referenceDate, { weekday: undefined, month: "long", year: "numeric" })}</b>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <select className={field} onChange={(event) => setFilters((current) => ({ ...current, professionalId: event.target.value }))} value={filters.professionalId}><option value="">Todos los profesionales</option>{professionals.map((item) => <option key={item.userId} value={item.userId}>{item.name}</option>)}</select>
            <select className={field} onChange={(event) => setFilters((current) => ({ ...current, medicalServiceTypeId: event.target.value }))} value={filters.medicalServiceTypeId}><option value="">Todos los servicios</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <select className={field} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} value={filters.status}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          </div>
          <div className={`grid gap-2 ${view === "day" ? "grid-cols-1" : view === "week" ? "sm:grid-cols-2 xl:grid-cols-7" : "grid-cols-2 md:grid-cols-4 xl:grid-cols-7"}`}>
            {days.map((day) => {
              const key = dateKey(day);
              const dayAppointments = appointmentsByDay.get(key) || [];
              const currentMonth = day.getMonth() === referenceDate.getMonth();
              return <Card className={`min-h-36 p-3 ${currentMonth ? "" : "opacity-55"}`} key={key}><div className="flex items-center justify-between gap-2"><b className="capitalize text-sm">{displayDate(day, { month: "short" })}</b><span className="text-xs text-on-surface-variant">{dayAppointments.length}</span></div><div className="mt-2 grid gap-1">{dayAppointments.map((appointment) => <button className="border-l-2 border-primary bg-primary-fixed/35 px-2 py-1 text-left text-xs" key={appointment.id} onClick={() => { setSelectedAppointment(appointment); setModal("appointment-detail"); }} type="button"><b className="block truncate">{displayTime(appointment.startsAt)} · {appointment.patient.firstName}</b><span className="block truncate text-on-surface-variant">{appointment.professionalName}</span></button>)}</div></Card>;
            })}
          </div>
        </section>
      ) : null}
      {modal === "patient" ? <MedicalPatientForm close={() => { setModal(""); setEditingPatient(null); }} onSaved={completeModal} patient={editingPatient} /> : null}
      {modal === "appointment" ? <MedicalAppointmentForm close={() => setModal("")} done={completeModal} patients={patients.filter((item) => item.isActive)} professionals={professionals} services={services} /> : null}
      {modal === "record" && selectedPatient ? <MedicalRecordModal close={() => { setModal(""); setSelectedPatient(null); }} onEdit={canCreatePatient ? (patient) => { setEditingPatient(patient); setModal("patient"); } : undefined} onReload={reloadPatientRecords} patient={selectedPatient} record={clinicalRecord} /> : null}
      {modal === "appointment-detail" && selectedAppointment ? <MedicalAppointmentDetail appointment={selectedAppointment} canUpdateStatus={canUpdateAppointmentStatus} close={() => setModal("")} done={completeModal} onOpenRecord={(patient) => { setSelectedAppointment(null); openPatient(patient); }} /> : null}
      {canManagePatientLifecycle && modal === "deactivate" && selectedPatient ? <Modal onClose={() => setModal("")} title="Desactivar paciente"><div className="grid gap-4 p-5"><p>La ficha se conservará junto con sus citas e historia clínica. No se eliminarán datos de atención.</p>{patientActionError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">{patientActionError}</p> : null}<div className="flex justify-end gap-2"><Button onClick={() => setModal("")} type="button" variant="outlined">Cancelar</Button><Button icon="person_off" onClick={async () => { try { setPatientActionError(""); await deactivateMedicalPatient(selectedPatient.id); setModal(""); await load(); } catch (requestError) { setPatientActionError(requestError.message || "No se pudo desactivar al paciente."); } }}>Desactivar</Button></div></div></Modal> : null}
      {canManagePatientLifecycle && modal === "permanent-delete" && selectedPatient ? <Modal onClose={() => setModal("")} title="Eliminar paciente definitivamente"><div className="grid gap-4 p-5"><p>Se eliminará definitivamente la ficha de <b>{selectedPatient.firstName} {selectedPatient.lastName}</b>. Solo se permite si no tiene citas, historia clínica, pagos ni archivos adjuntos.</p><p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">Esta acción no se puede deshacer. Si el paciente ya tiene atención registrada, usa Desactivar.</p>{patientActionError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">{patientActionError}</p> : null}<div className="flex justify-end gap-2"><Button onClick={() => setModal("")} type="button" variant="outlined">Cancelar</Button><Button icon="delete_forever" onClick={async () => { try { setPatientActionError(""); await permanentlyDeleteMedicalPatient(selectedPatient.id); setSelectedPatient(null); setModal(""); await load(); } catch (requestError) { setPatientActionError(requestError.message || "No se pudo eliminar al paciente."); } }} type="button" variant="danger">Eliminar definitivamente</Button></div></div></Modal> : null}
      {modal === "duplicates" ? <Modal onClose={() => setModal("")} title="Posibles pacientes duplicados"><div className="grid gap-3 p-5">{!canManagePatientLifecycle && duplicateGroups.length ? <p className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">Solo la administración puede fusionar fichas de pacientes.</p> : null}{duplicateGroups.map((group) => { const [target, ...sources] = group.patients; return <Card className="p-3" key={target.id}><p className="text-sm">Conservar ficha: <b>{target.firstName} {target.lastName} · {target.document}</b></p>{sources.map((source) => <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant pt-2" key={source.id}><span className="text-sm">{canManagePatientLifecycle ? "Fusionar" : "Posible duplicado:"} {source.firstName} {source.lastName} · {source.document}</span>{canManagePatientLifecycle ? <Button icon="merge_type" onClick={async () => { await mergeMedicalPatient(source.id, target.id); setModal(""); await load(); }} size="small">Fusionar</Button> : null}</div>)}</Card>; })}{!duplicateGroups.length ? <EmptyState description="No encontramos fichas activas con coincidencias de nombre, fecha, teléfono o correo." icon="verified" title="Sin duplicados" /> : null}</div></Modal> : null}
    </Shell>
  );
}
