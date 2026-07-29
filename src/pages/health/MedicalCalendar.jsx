import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";
import { MedicalPatientForm, MedicalRecordModal } from "./MedicalWorkspace";
import {
  createMedicalAppointment,
  getBusinessMedicalServices,
  getMedicalAppointments,
  getMedicalClinicalRecord,
  getMedicalPatients,
  getMedicalProfessionals,
  updateMedicalAppointment,
} from "../../services/medicalService";

const statusMeta = {
  scheduled: { label: "Programada", icon: "event", tone: "bg-primary-fixed text-primary" },
  confirmed: { label: "Confirmada", icon: "event_available", tone: "bg-sky-100 text-sky-900" },
  in_attention: { label: "En atención", icon: "medical_services", tone: "bg-violet-100 text-violet-900" },
  completed: { label: "Completada", icon: "task_alt", tone: "bg-emerald-100 text-emerald-900" },
  no_show: { label: "No asistió", icon: "person_off", tone: "bg-slate-100 text-slate-900" },
  cancelled: { label: "Cancelada", icon: "event_busy", tone: "bg-error-container text-on-error-container" },
};
const filters = [{ value: "all", label: "Todo", icon: "calendar_month" }, ...Object.entries(statusMeta).map(([value, item]) => ({ value, label: item.label, icon: item.icon }))];
const field = "min-h-11 rounded-xl border border-outline-variant bg-surface px-3";
const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const monthTitle = (date) => new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(date);
const dayTitle = (value) => new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));

function appointmentDraftFor(date) {
  return { patientId: "", medicalServiceTypeId: "", professionalId: "", date, time: "09:00", reason: "", notes: "" };
}

function MedicalAppointmentForm({ close, draft, onDraftChange, patients, professionals, services, onNewPatient, onSaved }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedPatient = patients.find((item) => item.id === draft.patientId);
  const selectedService = services.find((item) => item.id === draft.medicalServiceTypeId);
  const selectedProfessional = professionals.find((item) => item.userId === draft.professionalId);
  const setValue = (key, value) => { setError(""); onDraftChange((current) => ({ ...current, [key]: value })); };
  const validate = (currentStep = step) => {
    if (currentStep === 0 && !selectedPatient) { setError("Selecciona un paciente para continuar."); return false; }
    if (currentStep === 1) {
      if (!selectedService) { setError("Selecciona el servicio médico."); return false; }
      if (!selectedProfessional) { setError("Selecciona al profesional responsable."); return false; }
      if (!draft.date || !draft.time) { setError("Completa la fecha y hora de la cita."); return false; }
    }
    return true;
  };
  const submit = async (event) => {
    event.preventDefault();
    if (step < 2) { if (validate()) setStep((current) => current + 1); return; }
    if (!validate(0) || !validate(1)) return;
    const startsAt = new Date(`${draft.date}T${draft.time}:00`);
    const endsAt = new Date(startsAt.getTime() + Number(selectedProfessional.appointmentDurationMinutes || 30) * 60_000);
    setSaving(true);
    try {
      await createMedicalAppointment({ patientId: draft.patientId, professionalId: draft.professionalId, medicalServiceTypeId: draft.medicalServiceTypeId, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), reason: draft.reason || selectedService.name, notes: draft.notes });
      onSaved();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  return <Modal dialogClassName="max-w-[52rem]" onClose={close} title="Agendar cita médica"><form className="grid min-h-0" onSubmit={submit}>
    <div className="border-b border-outline-variant px-4 py-3 sm:px-5"><nav className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-container-low p-1">{[["person_search", "Paciente"], ["medical_services", "Atención"], ["task_alt", "Confirmar"]].map(([icon, label], index) => <button aria-current={index === step ? "step" : undefined} className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold sm:text-sm ${index === step ? "bg-primary text-white shadow-md" : index < step ? "bg-primary-fixed text-primary" : "text-on-surface-variant"}`} disabled={index > step} key={label} onClick={() => index < step && setStep(index)} type="button"><span className="material-symbols-outlined text-lg">{index < step ? "check_circle" : icon}</span>{index + 1}. {label}</button>)}</nav></div>
    <div className="grid min-h-[20rem] content-start gap-4 p-4 sm:p-5">
      {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container" role="alert">{error}</p> : null}
      {step === 0 ? <fieldset className="grid gap-4"><legend className="text-lg font-bold">¿A quién atenderemos?</legend><p className="-mt-3 text-sm text-on-surface-variant">Busca por nombre, documento o celular.</p><EntitySearchSelect getLabel={(item) => `${item.lastName}, ${item.firstName}`} getMeta={(item) => [item.document, item.phone].filter(Boolean).join(" · ")} getSearchValues={(item) => [item.firstName, item.lastName, item.document, item.phone, item.email]} items={patients} label="Paciente" name="patientId" onChange={(value) => setValue("patientId", value)} placeholder="Nombre, DNI o celular" required value={draft.patientId}/><button className="flex min-h-12 items-center justify-between rounded-xl border border-primary/30 bg-primary-fixed px-4 text-left font-bold text-primary" onClick={onNewPatient} type="button"><span className="flex items-center gap-2"><span className="material-symbols-outlined">person_add</span>Registrar paciente nuevo</span><span className="material-symbols-outlined">arrow_forward</span></button></fieldset> : null}
      {step === 1 ? <fieldset className="grid gap-4"><legend className="text-lg font-bold">Define la atención</legend><p className="-mt-3 text-sm text-on-surface-variant">Elige servicio, profesional y horario clínico.</p><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Servicio *<select className={field} onChange={(event) => setValue("medicalServiceTypeId", event.target.value)} required value={draft.medicalServiceTypeId}><option value="">Selecciona un servicio</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Profesional *<select className={field} onChange={(event) => setValue("professionalId", event.target.value)} required value={draft.professionalId}><option value="">Selecciona un profesional</option>{professionals.map((item) => <option key={item.userId} value={item.userId}>{item.name} · {item.specialty}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">Fecha *<input className={field} min={iso(new Date())} onChange={(event) => setValue("date", event.target.value)} required type="date" value={draft.date}/></label><label className="grid gap-1 text-sm font-medium">Hora *<input className={field} onChange={(event) => setValue("time", event.target.value)} required type="time" value={draft.time}/></label></div>{selectedProfessional ? <div className="rounded-2xl bg-primary-fixed p-3 text-sm text-primary"><b>{selectedProfessional.appointmentDurationMinutes || 30} min</b> de duración estimada para la cita.</div> : null}</fieldset> : null}
      {step === 2 ? <fieldset className="grid gap-4"><legend className="text-lg font-bold">Revisa y confirma</legend><label className="grid gap-1 text-sm font-medium">Motivo de consulta<input className={field} onChange={(event) => setValue("reason", event.target.value)} placeholder="Control, dolor, evaluación..." value={draft.reason}/></label><label className="grid gap-1 text-sm font-medium">Notas para el equipo<textarea className={`${field} min-h-24 py-2`} onChange={(event) => setValue("notes", event.target.value)} value={draft.notes}/></label><div className="grid gap-2 rounded-2xl bg-surface-container-low p-4 text-sm"><p><b>Paciente:</b> {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Sin seleccionar"}</p><p><b>Servicio:</b> {selectedService?.name || "Sin seleccionar"}</p><p><b>Profesional:</b> {selectedProfessional?.name || "Sin seleccionar"}</p><p><b>Fecha:</b> {dayTitle(draft.date)} · {draft.time}</p></div></fieldset> : null}
    </div>
    <div className="flex flex-col-reverse gap-2 border-t border-outline-variant bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><Button disabled={saving} onClick={() => step === 0 ? close() : setStep((current) => current - 1)} type="button" variant="secondary">{step === 0 ? "Cancelar" : "Anterior"}</Button><Button disabled={saving || !patients.length || !services.length || !professionals.length} icon={step === 2 ? "event_available" : "arrow_forward"} type="submit">{saving ? "Agendando..." : step === 2 ? "Confirmar cita" : "Continuar"}</Button></div>
  </form></Modal>;
}

function DayAgenda({ date, events, onEvent, onSchedule, canSchedule, past }) {
  const [active, setActive] = useState("scheduled");
  const groups = filters.slice(1).map((item) => ({ ...item, events: events.filter((event) => event.status === item.value) }));
  const group = groups.find((item) => item.value === active) || groups[0];
  return <Card className="overflow-hidden"><div className="bg-primary p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-white/70">Agenda del día</p><h2 className="mt-1 text-xl font-bold capitalize">{dayTitle(date)}</h2><p className="mt-2 text-sm text-white/80">{events.length} cita(s) · {events.reduce((total, item) => total + Math.round((new Date(item.endsAt) - new Date(item.startsAt)) / 60_000), 0)} min programados</p></div><div className="border-b border-outline-variant px-2 pt-2"><HorizontalScroller className="gap-1 pb-2" label="Estados de la agenda médica">{groups.map((item) => <button className={`min-w-[76px] snap-start rounded-xl p-2 text-center ${active === item.value ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant"}`} key={item.value} onClick={() => setActive(item.value)} type="button"><span className="material-symbols-outlined text-lg">{item.icon}</span><b className="block text-lg">{item.events.length}</b><span className="text-[10px]">{item.label}</span></button>)}</HorizontalScroller></div><div className="min-h-[360px] max-h-[52vh] overflow-y-auto p-3"><div className="mb-2 flex justify-between"><h3 className="flex items-center gap-2 text-sm font-bold"><span className="material-symbols-outlined text-primary">{group.icon}</span>{group.label}</h3><span className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-bold text-primary">{group.events.length}</span></div><div className="grid gap-2">{group.events.map((item) => { const meta = statusMeta[item.status] || statusMeta.scheduled; return <button className="rounded-xl border border-outline-variant p-3 text-left hover:border-primary hover:bg-primary-fixed/30" key={item.id} onClick={() => onEvent(item)} type="button"><div className="flex gap-2"><span className={`material-symbols-outlined h-fit rounded-lg p-1.5 text-lg ${meta.tone}`}>{meta.icon}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><b className="truncate">{item.patient.firstName} {item.patient.lastName}</b><span className="shrink-0 text-xs font-bold">{new Date(item.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span></div><p className="text-xs text-on-surface-variant">{item.medicalServiceName} · {item.professionalName}</p></div></div></button>; })}</div>{!group.events.length ? <div className="grid min-h-[285px] place-items-center"><EmptyState description={`No hay citas ${group.label.toLowerCase()} para este día.`} icon={group.icon} title={`Sin citas ${group.label.toLowerCase()}`}/></div> : null}</div>{canSchedule ? <div className="border-t border-outline-variant p-3"><Button className="w-full" disabled={past} icon="event_available" onClick={onSchedule}>{past ? "Fecha histórica" : "Agendar para este día"}</Button></div> : null}</Card>;
}

function AppointmentDetail({ appointment, close, onOpenRecord, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const setStatus = async (status) => { setSaving(true); setError(""); try { await updateMedicalAppointment(appointment.id, { status }); onSaved(); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); } };
  const meta = statusMeta[appointment.status] || statusMeta.scheduled;
  return <Modal onClose={close} title="Detalle de cita médica"><div className="grid gap-4 p-5"><div className="flex gap-3 rounded-2xl bg-surface-container-low p-4"><span className={`material-symbols-outlined h-fit rounded-xl p-2 ${meta.tone}`}>{meta.icon}</span><div><span className={`rounded-full px-2 py-1 text-xs font-bold ${meta.tone}`}>{meta.label}</span><h3 className="mt-2 text-lg font-bold">{appointment.patient.firstName} {appointment.patient.lastName}</h3><p className="text-sm text-on-surface-variant">{appointment.medicalServiceName} · {appointment.professionalName}</p></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-outline-variant p-3"><p className="text-xs font-bold uppercase text-on-surface-variant">Fecha</p><b>{dayTitle(iso(new Date(appointment.startsAt)))}</b></div><div className="rounded-xl border border-outline-variant p-3"><p className="text-xs font-bold uppercase text-on-surface-variant">Horario</p><b>{new Date(appointment.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} – {new Date(appointment.endsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</b></div><div className="rounded-xl border border-outline-variant p-3 sm:col-span-2"><p className="text-xs font-bold uppercase text-on-surface-variant">Motivo</p><b>{appointment.reason}</b></div></div><button className="flex min-h-14 items-center justify-between rounded-2xl border border-primary/30 bg-primary-fixed p-4 text-left text-primary" onClick={() => onOpenRecord(appointment.patient)} type="button"><span><b className="block">Abrir expediente médico</b><span className="text-xs">Historia, diagnósticos, recetas, órdenes, resultados y PDF</span></span><span className="material-symbols-outlined">arrow_forward</span></button>{error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}<div className="flex flex-wrap justify-end gap-2"><Button onClick={close} variant="secondary">Cerrar</Button>{["scheduled", "confirmed"].includes(appointment.status) ? <Button disabled={saving} icon="play_circle" onClick={() => setStatus("in_attention")}>Iniciar atención</Button> : null}{appointment.status === "in_attention" ? <Button disabled={saving} icon="task_alt" onClick={() => setStatus("completed")}>Finalizar atención</Button> : null}{!["completed", "cancelled", "no_show"].includes(appointment.status) ? <Button disabled={saving} onClick={() => setStatus("no_show")} variant="secondary">Inasistencia</Button> : null}</div></div></Modal>;
}

export default function MedicalCalendar({ operator = false }) {
  const now = new Date();
  const today = iso(now);
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [recordPatient, setRecordPatient] = useState(null);
  const [clinicalRecord, setClinicalRecord] = useState({ appointments: [], records: [], diagnoses: [], prescriptions: [], orders: [], results: [] });
  const [draft, setDraft] = useState(() => appointmentDraftFor(today));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const Shell = operator ? OperatorShell : DashboardShell;
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [appointmentsRows, patientRows, professionalRows, businessServices] = await Promise.all([getMedicalAppointments(), getMedicalPatients(), getMedicalProfessionals(), getBusinessMedicalServices()]); setAppointments(appointmentsRows); setPatients(patientRows); setProfessionals(professionalRows); setServices(businessServices.map((item) => item.serviceType)); } catch (requestError) { setError(requestError.message); } finally { setLoading(false); } }, []);
  useEffect(() => { queueMicrotask(load); }, [load]);
  const filtered = useMemo(() => appointments.filter((item) => filter === "all" || item.status === filter), [appointments, filter]);
  const grouped = useMemo(() => Object.groupBy(filtered, (item) => iso(new Date(item.startsAt))), [filtered]);
  const selectedEvents = grouped[selected] || [];
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const leading = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => { const day = index - leading + 1; return { date: new Date(cursor.getFullYear(), cursor.getMonth(), day), current: day >= 1 && day <= last.getDate() }; });
  const move = (offset) => { const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1); setCursor(next); setSelected(iso(next)); };
  const openSchedule = () => { setDraft(appointmentDraftFor(selected)); setModal("appointment"); };
  const openRecord = async (patient) => {
    try {
      setError("");
      setModal("");
      setRecordPatient(patient);
      setClinicalRecord(await getMedicalClinicalRecord(patient.id));
    } catch (requestError) {
      setError(requestError.message);
      setRecordPatient(null);
    }
  };
  return <Shell action={<div className="flex gap-2"><Button icon="today" onClick={() => { setCursor(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(today); }} variant="secondary">Hoy</Button><Button disabled={selected < today} icon="event_available" onClick={openSchedule}>Agendar cita</Button></div>} subtitle="Agenda médica por servicio, profesional, estado y expediente clínico." title="Agenda médica">
    {error ? <EmptyState description={error} icon="cloud_off" title="No se pudo cargar la agenda" /> : null}
    {loading ? <Card className="h-72 animate-pulse" /> : null}
    {!loading && !error ? <><div className="mb-3 flex flex-wrap gap-2"><HorizontalScroller className="gap-2" label="Filtros de la agenda">{filters.map((item) => <button className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-bold ${filter === item.value ? "border-primary bg-primary text-white" : "border-outline-variant bg-white text-on-surface-variant"}`} key={item.value} onClick={() => setFilter(item.value)} type="button"><span className="material-symbols-outlined text-lg">{item.icon}</span>{item.label}</button>)}</HorizontalScroller></div><div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]"><Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-3"><Button icon="chevron_left" onClick={() => move(-1)} size="small" variant="outlined">Anterior</Button><h2 className="capitalize font-heading text-lg font-bold">{monthTitle(cursor)}</h2><Button icon="chevron_right" onClick={() => move(1)} size="small" variant="outlined">Siguiente</Button></div><div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low text-center text-[11px] font-bold text-on-surface-variant">{["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((day) => <span className="p-2" key={day}>{day}</span>)}</div><div className="grid grid-cols-7">{cells.map(({ date, current }) => { const key = iso(date); const events = grouped[key] || []; const selectedDay = key === selected; return <button aria-pressed={selectedDay} className={`relative min-h-[88px] border-b border-r border-outline-variant p-1.5 text-left transition sm:min-h-[108px] ${current ? "bg-white" : "bg-surface-container-low text-on-surface-variant"} ${selectedDay ? "ring-2 ring-inset ring-primary" : "hover:bg-primary-fixed/30"}`} key={key} onClick={() => { setSelected(key); if (!current) setCursor(new Date(date.getFullYear(), date.getMonth(), 1)); }} type="button"><span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${key === today ? "bg-primary text-white" : ""}`}>{date.getDate()}</span><div className="mt-1 grid gap-1">{events.slice(0, 3).map((event) => <span className={`truncate rounded px-1.5 py-1 text-[10px] font-bold ${statusMeta[event.status]?.tone || "bg-primary-fixed text-primary"}`} key={event.id}>{new Date(event.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} {event.patient.firstName}</span>)}{events.length > 3 ? <span className="text-[10px] font-bold text-primary">+{events.length - 3} más</span> : null}</div></button>; })}</div></Card><DayAgenda canSchedule date={selected} events={selectedEvents} onEvent={(item) => { setSelectedAppointment(item); setModal("detail"); }} onSchedule={openSchedule} past={selected < today}/></div></> : null}
    {modal === "appointment" ? <MedicalAppointmentForm close={() => setModal("")} draft={draft} onDraftChange={setDraft} patients={patients} professionals={professionals} services={services} onNewPatient={() => setModal("patient")} onSaved={async () => { setModal(""); await load(); }} /> : null}
    {modal === "patient" ? <MedicalPatientForm close={() => setModal("appointment")} onSaved={async (patient) => { setDraft((current) => ({ ...current, patientId: patient.id })); await load(); setModal("appointment"); }} /> : null}
    {modal === "detail" && selectedAppointment ? <AppointmentDetail appointment={selectedAppointment} close={() => setModal("")} onOpenRecord={openRecord} onSaved={async () => { setModal(""); await load(); }} /> : null}
    {recordPatient ? <MedicalRecordModal close={() => setRecordPatient(null)} onReload={async (patientId) => setClinicalRecord(await getMedicalClinicalRecord(patientId))} patient={recordPatient} record={clinicalRecord} /> : null}
  </Shell>;
}