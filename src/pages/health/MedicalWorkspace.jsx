import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EntityAttachments from "../../components/attachments/EntityAttachments";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import {
  createMedicalAppointment,
  createMedicalDiagnosis,
  createMedicalOrder,
  createMedicalPatient,
  createMedicalPrescription,
  createMedicalRecord,
  createMedicalResult,
  deactivateMedicalPatient,
  getBusinessMedicalServices,
  getMedicalAppointments,
  getMedicalPatientDuplicates,
  getMedicalPatients,
  getMedicalProfessionals,
  getMedicalRecords,
  mergeMedicalPatient,
  restoreMedicalPatient,
  updateMedicalAppointment,
  updateMedicalPatient,
} from "../../services/medicalService";
import { matchesEntitySearch } from "../../utils/entitySearch";

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

function PatientForm({ close, onSaved, patient }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    setSaving(true);
    try {
      if (patient) await updateMedicalPatient(patient.id, data);
      else await createMedicalPatient(data);
      onSaved();
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

function AppointmentForm({ appointment, close, done, patients, professionals, services }) {
  const [patientId, setPatientId] = useState(appointment?.patientId || "");
  const [professionalId, setProfessionalId] = useState(appointment?.professionalId || "");
  const [serviceId, setServiceId] = useState(appointment?.medicalServiceTypeId || "");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      patientId,
      professionalId,
      medicalServiceTypeId: serviceId,
      startsAt: form.get("startsAt"),
      endsAt: form.get("endsAt"),
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
          <input className={`${field} mt-1`} defaultValue={localDateTimeValue(appointment?.startsAt)} name="startsAt" required type="datetime-local" />
        </label>
        <label className="text-sm font-bold">
          Fin
          <input className={`${field} mt-1`} defaultValue={localDateTimeValue(appointment?.endsAt || addDays(new Date(), 0))} name="endsAt" required type="datetime-local" />
        </label>
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

function PatientRecord({ close, onEdit, onReload, patient, records }) {
  const [clinicalType, setClinicalType] = useState("");
  const saveClinical = async () => {
    setClinicalType("");
    await onReload(patient.id);
  };
  return (
    <>
      <Modal onClose={close} title={`${patient.firstName} ${patient.lastName} · Expediente`}>
        <div className="grid gap-4 p-5">
          <div className="grid gap-2 rounded-xl bg-surface-container p-3 text-sm sm:grid-cols-2">
            <p><b>Documento:</b> {patient.document}</p>
            <p><b>Teléfono:</b> {patient.phone || "Sin registrar"}</p>
            <p className="sm:col-span-2"><b>Alergias:</b> {patient.allergies || "Sin alertas registradas"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon="note_add" onClick={() => setClinicalType("record")} size="small">Evolución</Button>
            <Button icon="diagnosis" onClick={() => setClinicalType("diagnosis")} size="small" variant="outlined">Diagnóstico</Button>
            <Button icon="medication" onClick={() => setClinicalType("prescription")} size="small" variant="outlined">Receta</Button>
            <Button icon="lab_profile" onClick={() => setClinicalType("order")} size="small" variant="outlined">Orden</Button>
            <Button icon="upload_file" onClick={() => setClinicalType("result")} size="small" variant="outlined">Resultado</Button>
            <Button icon="edit" onClick={() => onEdit(patient)} size="small" variant="outlined">Editar ficha</Button>
          </div>
          <section>
            <h3 className="text-sm font-bold">Historia clínica</h3>
            <div className="mt-2 grid gap-2">
              {records.map((record) => (
                <div className="border-l-2 border-primary bg-surface-container px-3 py-2" key={record.id}>
                  <div className="flex flex-wrap justify-between gap-2"><b>{record.title}</b><small>{new Date(record.createdAt).toLocaleString("es-PE")}</small></div>
                  <p className="mt-1 text-sm text-on-surface-variant">{record.content || "Sin texto adicional"}</p>
                </div>
              ))}
              {!records.length ? <EmptyState description="Registra la primera evolución para iniciar la historia clínica." icon="clinical_notes" title="Sin evoluciones" /> : null}
            </div>
          </section>
          <EntityAttachments entityId={patient.id} entityType="health_patient" />
        </div>
      </Modal>
      {clinicalType ? <ClinicalEntryForm close={() => setClinicalType("")} done={saveClinical} patient={patient} records={records} type={clinicalType} /> : null}
    </>
  );
}

function AppointmentDetail({ appointment, close, done }) {
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
        <div className="flex flex-wrap gap-2">
          {appointment.status === "scheduled" || appointment.status === "confirmed" ? <Button disabled={saving} icon="play_circle" onClick={() => setStatus("in_attention")} size="small">Iniciar atención</Button> : null}
          {appointment.status === "in_attention" ? <Button disabled={saving} icon="task_alt" onClick={() => setStatus("completed")} size="small">Finalizar atención</Button> : null}
          {!['completed', 'cancelled', 'no_show'].includes(appointment.status) ? <Button disabled={saving} icon="event_busy" onClick={() => setStatus("cancelled")} size="small" variant="outlined">Cancelar</Button> : null}
          {!['completed', 'cancelled', 'no_show'].includes(appointment.status) ? <Button disabled={saving} icon="person_off" onClick={() => setStatus("no_show")} size="small" variant="outlined">Inasistencia</Button> : null}
        </div>
      </div>
    </Modal>
  );
}

export default function MedicalWorkspace({ operator = false }) {
  const { moduleKey } = useParams();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [modal, setModal] = useState("");
  const [editingPatient, setEditingPatient] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(() => searchParams.get("search") || "");
  const [showInactive, setShowInactive] = useState(false);
  const [view, setView] = useState("week");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [filters, setFilters] = useState({ professionalId: "", medicalServiceTypeId: "", status: "" });
  const isPatients = moduleKey === "patients";
  const Shell = operator ? OperatorShell : DashboardShell;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const [patientRows, appointmentRows, professionalsRows, businessServices] = await Promise.all([
        getMedicalPatients({ include_inactive: showInactive }),
        getMedicalAppointments({
          professional_id: filters.professionalId,
          medical_service_type_id: filters.medicalServiceTypeId,
          status: filters.status,
        }),
        getMedicalProfessionals(),
        getBusinessMedicalServices(),
      ]);
      setPatients(patientRows);
      setAppointments(appointmentRows);
      setProfessionals(professionalsRows);
      setServices(businessServices.map((item) => item.serviceType));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [filters, showInactive]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(load, ["/medical"]);

  const filteredPatients = useMemo(
    () => patients.filter((item) => matchesEntitySearch(item, query, [item.firstName, item.lastName, item.document, item.phone, item.email])),
    [patients, query],
  );
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
      setRecords(await getMedicalRecords(patient.id));
    } catch (requestError) {
      setError(requestError.message);
      setRecords([]);
    }
  };
  const reloadPatientRecords = async (patientId) => {
    setRecords(await getMedicalRecords(patientId));
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
    setModal("deactivate");
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
      action={<Button icon="add" onClick={() => setModal(isPatients ? "patient" : "appointment")}>{isPatients ? "Registrar paciente" : "Nueva cita"}</Button>}
      subtitle={isPatients ? "Fichas clínicas, antecedentes y trazabilidad de pacientes." : "Agenda por profesional, servicio y estado de atención."}
      title={isPatients ? "Pacientes" : "Agenda médica"}
    >
      {error ? <EmptyState description={error} icon="cloud_off" title="No se pudo cargar" /> : null}
      {loading ? <Card className="h-44 animate-pulse" /> : null}
      {!loading && !error && isPatients ? (
        <section className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <label className="flex min-h-11 min-w-56 flex-1 items-center gap-2 rounded-xl border border-outline-variant bg-white px-3"><span className="material-symbols-outlined text-on-surface-variant">search</span><input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, DNI, teléfono o correo" value={query} /></label>
            <Button icon="content_copy" onClick={detectDuplicates} variant="outlined">Detectar duplicados</Button>
            <button aria-pressed={showInactive} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${showInactive ? "border-primary bg-primary text-white" : "border-outline-variant bg-white"}`} onClick={() => setShowInactive((current) => !current)} type="button">{showInactive ? "Ocultar inactivos" : "Ver inactivos"}</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPatients.map((patient) => (
              <Card className="flex min-h-48 flex-col p-4" key={patient.id}>
                <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-fixed font-bold text-primary">{patient.firstName?.[0]}{patient.lastName?.[0]}</span><span className="min-w-0"><b className="block truncate">{patient.firstName} {patient.lastName}</b><small>{patient.documentType} {patient.document}</small></span></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${patient.isActive ? "bg-emerald-50 text-emerald-800" : "bg-error-container text-on-error-container"}`}>{patient.isActive ? "Activo" : "Inactivo"}</span></div>
                <p className="mt-3 text-sm text-on-surface-variant">{patient.phone || "Sin teléfono"} · {patient.email || "Sin correo"}</p>
                <p className="mt-2 line-clamp-2 text-sm">{patient.allergies ? `Alergias: ${patient.allergies}` : "Sin alergias registradas"}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4"><Button icon="clinical_notes" onClick={() => openPatient(patient)} size="small">Expediente</Button><Button icon="edit" onClick={() => { setEditingPatient(patient); setModal("patient"); }} size="small" variant="outlined">Editar</Button>{patient.isActive ? <Button icon="person_off" onClick={() => askDeactivate(patient)} size="small" variant="outlined">Desactivar</Button> : <Button icon="restore" onClick={async () => { await restoreMedicalPatient(patient.id); await load(); }} size="small" variant="outlined">Restaurar</Button>}</div>
              </Card>
            ))}
            {!filteredPatients.length ? <EmptyState description="Registra un paciente o ajusta la búsqueda." icon="groups" title="No hay pacientes para mostrar" /> : null}
          </div>
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
      {modal === "patient" ? <PatientForm close={() => { setModal(""); setEditingPatient(null); }} onSaved={completeModal} patient={editingPatient} /> : null}
      {modal === "appointment" ? <AppointmentForm close={() => setModal("")} done={completeModal} patients={patients.filter((item) => item.isActive)} professionals={professionals} services={services} /> : null}
      {modal === "record" && selectedPatient ? <PatientRecord close={() => { setModal(""); setSelectedPatient(null); }} onEdit={(patient) => { setEditingPatient(patient); setModal("patient"); }} onReload={reloadPatientRecords} patient={selectedPatient} records={records} /> : null}
      {modal === "appointment-detail" && selectedAppointment ? <AppointmentDetail appointment={selectedAppointment} close={() => setModal("")} done={completeModal} /> : null}
      {modal === "deactivate" && selectedPatient ? <Modal onClose={() => setModal("")} title="Desactivar paciente"><div className="grid gap-4 p-5"><p>La ficha se conservará junto con sus citas e historia clínica. No se eliminarán datos de atención.</p><div className="flex justify-end gap-2"><Button onClick={() => setModal("")} type="button" variant="outlined">Cancelar</Button><Button icon="person_off" onClick={async () => { await deactivateMedicalPatient(selectedPatient.id); setModal(""); await load(); }}>Desactivar</Button></div></div></Modal> : null}
      {modal === "duplicates" ? <Modal onClose={() => setModal("")} title="Posibles pacientes duplicados"><div className="grid gap-3 p-5">{duplicateGroups.map((group) => { const [target, ...sources] = group.patients; return <Card className="p-3" key={target.id}><p className="text-sm">Conservar ficha: <b>{target.firstName} {target.lastName} · {target.document}</b></p>{sources.map((source) => <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant pt-2" key={source.id}><span className="text-sm">Fusionar {source.firstName} {source.lastName} · {source.document}</span><Button icon="merge_type" onClick={async () => { await mergeMedicalPatient(source.id, target.id); setModal(""); await load(); }} size="small">Fusionar</Button></div>)}</Card>; })}{!duplicateGroups.length ? <EmptyState description="No encontramos fichas activas con coincidencias de nombre, fecha, teléfono o correo." icon="verified" title="Sin duplicados" /> : null}</div></Modal> : null}
    </Shell>
  );
}