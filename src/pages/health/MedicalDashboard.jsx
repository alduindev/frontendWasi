import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/atoms/Card";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import EmptyState from "../../components/molecules/EmptyState";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { MedicalRecordModal } from "./MedicalWorkspace";
import {
  getMedicalAppointments,
  getMedicalClinicalRecord,
  getMedicalDashboard,
  getMedicalProfessionals,
} from "../../services/medicalService";

const states = {
  scheduled: ["Programadas", "event", "primary"],
  confirmed: ["Confirmadas", "event_available", "sky"],
  in_attention: ["En atención", "medical_services", "violet"],
  completed: ["Completadas", "task_alt", "emerald"],
  no_show: ["Inasistencias", "person_off", "slate"],
  cancelled: ["Canceladas", "event_busy", "error"],
};
const tones = {
  primary: "bg-primary-fixed text-primary",
  sky: "bg-sky-100 text-sky-900",
  violet: "bg-violet-100 text-violet-900",
  emerald: "bg-emerald-100 text-emerald-900",
  slate: "bg-slate-100 text-slate-900",
  error: "bg-error-container text-on-error-container",
};

function Metric({ icon, label, note, onClick, value }) {
  return (
    <button
      className="group relative min-h-28 w-full overflow-hidden rounded-3xl border border-outline-variant bg-white p-3 text-left shadow-[0_12px_40px_rgba(31,24,39,0.06)] transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      onClick={onClick}
      type="button"
    >
      <div className="absolute -right-5 -top-5 size-16 rounded-full bg-primary-fixed opacity-60" />
      <span className="material-symbols-outlined relative text-xl text-primary">{icon}</span>
      <span className="material-symbols-outlined absolute right-3 top-3 text-lg text-primary opacity-0 transition group-hover:opacity-100">arrow_outward</span>
      <p className="relative mt-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="relative text-2xl font-extrabold">{value}</p>
      <p className="relative truncate text-[11px] text-on-surface-variant">{note}</p>
    </button>
  );
}

function PatientInitials({ patient }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-fixed font-bold text-primary">
      {`${patient?.firstName?.[0] || ""}${patient?.lastName?.[0] || ""}`.toUpperCase() || "?"}
    </span>
  );
}

const time = (value) => value ? new Date(value).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function MedicalDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [error, setError] = useState("");
  const [view, setView] = useState("flow");
  const [activeStatus, setActiveStatus] = useState("scheduled");
  const [recordPatient, setRecordPatient] = useState(null);
  const [clinicalRecord, setClinicalRecord] = useState({ appointments: [], records: [], diagnoses: [], prescriptions: [], orders: [], results: [] });

  const load = useCallback(async () => {
    try {
      const [dashboard, appointmentRows, professionalRows] = await Promise.all([
        getMedicalDashboard(),
        getMedicalAppointments(),
        getMedicalProfessionals(),
      ]);
      setSummary(dashboard);
      setAppointments(appointmentRows);
      setProfessionals(professionalRows);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, [load]);
  useLiveRefresh(load, ["/medical"]);

  const today = new Date().toLocaleDateString("en-CA");
  const todayItems = useMemo(
    () => appointments.filter((item) => item.startsAt.slice(0, 10) === today).sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    [appointments, today],
  );
  const groups = Object.keys(states).map((status) => [status, appointments.filter((item) => item.status === status)]);
  const activeRows = appointments.filter((item) => item.status === activeStatus);
  const workload = Object.entries(
    appointments.reduce((result, item) => {
      const name = item.professionalName || "Sin asignar";
      result[name] = (result[name] || 0) + 1;
      return result;
    }, {}),
  ).sort((left, right) => right[1] - left[1]);
  const openRecord = async (patient) => {
    try {
      setError("");
      setRecordPatient(patient);
      setClinicalRecord(await getMedicalClinicalRecord(patient.id));
    } catch (requestError) {
      setError(requestError.message);
      setRecordPatient(null);
    }
  };

  return (
    <DashboardShell
      subtitle="Control de agenda, atención clínica y expedientes en un solo flujo."
      title="Panel médico"
    >
      {error ? <EmptyState description={error} icon="cloud_off" title="No se pudo cargar el dashboard" /> : null}
      {!summary && !error ? <Card className="h-52 animate-pulse" /> : null}
      {summary ? (
        <>
          <HorizontalScroller className="lg:justify-center" label="Indicadores médicos">
            {[
              { icon: "groups", label: "Pacientes", value: summary.patientsTotal, note: "Expedientes activos", route: "/dashboard/patients" },
              { icon: "today", label: "Citas hoy", value: summary.appointmentsToday, note: "Atenciones programadas", route: "/dashboard/appointments" },
              { icon: "medical_services", label: "Atendiendo", value: appointments.filter((item) => item.status === "in_attention").length, note: "En consulta ahora", route: "/dashboard/appointments" },
              { icon: "science", label: "Resultados", value: summary.resultsPending, note: "Pendientes de revisar", route: "/dashboard/patients" },
            ].map((metric) => (
              <div className="w-[70vw] max-w-72 shrink-0 snap-start sm:w-60 lg:w-64" key={metric.label}>
                <Metric {...metric} onClick={() => navigate(metric.route)} />
              </div>
            ))}
          </HorizontalScroller>

          <div className="mx-auto mt-3 grid w-full max-w-2xl grid-cols-3 rounded-2xl border border-outline-variant bg-white p-1">
            <button className={`min-h-10 rounded-xl px-2 text-sm font-bold ${view === "flow" ? "bg-primary text-white" : "text-on-surface-variant"}`} onClick={() => setView("flow")} type="button">Flujo clínico</button>
            <button className={`min-h-10 rounded-xl px-2 text-sm font-bold ${view === "agenda" ? "bg-primary text-white" : "text-on-surface-variant"}`} onClick={() => setView("agenda")} type="button">Agenda</button>
            <button className="flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-sm font-bold text-primary hover:bg-primary-fixed" onClick={() => navigate("/dashboard/patients")} type="button"><span className="material-symbols-outlined text-lg">apps</span><span className="hidden sm:inline">Acciones</span></button>
          </div>

          {view === "flow" ? (
            <section className="mt-3">
              <div className="mb-2 flex items-end justify-between gap-3">
                <div><h2 className="text-lg font-bold">Operación clínica</h2><p className="text-xs text-on-surface-variant">Selecciona un estado para revisar sus citas.</p></div>
                <span className="text-[11px] text-on-surface-variant">Actualiza cada 15 s</span>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {groups.map(([status, rows]) => {
                  const [label, icon, color] = states[status];
                  return <button className={`flex min-h-14 items-center justify-between rounded-xl border p-2.5 text-left transition ${activeStatus === status ? `${tones[color]} border-current shadow-sm` : "border-outline-variant bg-white"}`} key={status} onClick={() => setActiveStatus(status)} type="button"><span className="flex items-center gap-2 text-sm font-bold"><span className="material-symbols-outlined text-xl">{icon}</span>{label}</span><b>{rows.length}</b></button>;
                })}
              </div>
              <Card className="mt-2 min-h-40 overflow-hidden">
                <div className="flex items-center justify-between border-b border-outline-variant px-3 py-2"><b>{states[activeStatus][0]}</b><span className="text-xs text-on-surface-variant">{activeRows.length} cita(s)</span></div>
                {activeRows.length ? <HorizontalScroller label={`Citas ${states[activeStatus][0]}`}>{activeRows.map((item) => <button className="group w-60 shrink-0 snap-start rounded-xl border border-outline-variant p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md" key={item.id} onClick={() => openRecord(item.patient)} type="button"><div className="flex items-start gap-2.5"><PatientInitials patient={item.patient}/><div className="min-w-0 flex-1"><b className="block truncate">{item.patient.firstName} {item.patient.lastName}</b><p className="truncate text-xs text-on-surface-variant">{item.professionalName || "Sin asignar"}</p></div><span className="material-symbols-outlined text-lg text-primary">arrow_forward</span></div><p className="mt-2 text-xs">{item.medicalServiceName} · {time(item.startsAt)}</p></button>)}</HorizontalScroller> : <p className="grid min-h-28 place-items-center text-sm text-on-surface-variant">Sin citas en este estado</p>}
              </Card>
            </section>
          ) : null}

          {view === "agenda" ? (
            <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b p-3"><div><h2 className="text-lg font-bold">Agenda de hoy</h2><p className="text-xs text-on-surface-variant">Pacientes, motivo y profesional responsable.</p></div><Link className="rounded-xl border px-3 py-2 text-sm font-bold text-primary" to="/dashboard/appointments">Calendario</Link></div>
                <div className="grid max-h-64 gap-2 overflow-y-auto p-3">
                  {todayItems.map((item) => <button className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant p-3 text-left" key={item.id} onClick={() => openRecord(item.patient)} type="button"><span className="flex min-w-0 items-center gap-2.5"><PatientInitials patient={item.patient}/><span className="min-w-0"><b className="block truncate">{item.patient.firstName} {item.patient.lastName}</b><span className="block text-sm">{time(item.startsAt)} · {item.professionalName || "Por asignar"}</span><span className="block truncate text-xs text-on-surface-variant">{item.reason}</span></span></span><span className={`rounded-full px-3 py-2 text-xs font-bold ${tones[states[item.status]?.[2] || "primary"]}`}>{states[item.status]?.[0] || item.status}</span></button>)}
                  {!todayItems.length ? <p className="p-8 text-center text-sm text-on-surface-variant">Sin citas programadas hoy</p> : null}
                </div>
              </Card>
              <Card className="p-3"><h2 className="font-bold">Carga por profesional</h2><div className="mt-2 grid max-h-40 gap-2 overflow-y-auto">{workload.map(([name, count]) => <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-2.5" key={name}><b>{name}</b><span className="rounded-full bg-primary-fixed px-3 py-1 text-sm font-bold text-primary">{count}</span></div>)}{!workload.length ? <p className="text-sm text-on-surface-variant">Aún no hay atenciones.</p> : null}</div><div className="mt-2 rounded-xl bg-primary-fixed p-2.5"><p className="text-xs text-primary">Profesionales disponibles</p><b className="text-xl text-primary">{professionals.length}</b></div></Card>
            </section>
          ) : null}
        </>
      ) : null}
      {recordPatient ? <MedicalRecordModal close={() => setRecordPatient(null)} onReload={async (patientId) => setClinicalRecord(await getMedicalClinicalRecord(patientId))} patient={recordPatient} record={clinicalRecord} /> : null}
    </DashboardShell>
  );
}