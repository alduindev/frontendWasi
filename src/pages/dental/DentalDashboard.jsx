import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/atoms/Card";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useAuth } from "../../context/authStore";
import { useAppConfig } from "../../context/appConfigStore";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import * as api from "../../services/healthService";
import { OdontogramModal } from "./DentalWorkspace";

const states = {
  waiting: ["En espera", "schedule", "amber"],
  in_attention: ["En atención", "dentistry", "blue"],
  ready_for_payment: ["Por cobrar", "payments", "violet"],
  completed: ["Finalizado", "task_alt", "emerald"],
};
const tone = {
  amber: "bg-amber-50 text-amber-900",
  blue: "bg-blue-50 text-blue-900",
  violet: "bg-violet-50 text-violet-900",
  emerald: "bg-emerald-50 text-emerald-900",
};
const DASHBOARD_REFRESH_INTERVAL_MS = 60_000;
const time = (value) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const quickActions = [
  {
    to: "/dashboard/appointments",
    icon: "event_available",
    art: "calendar_month",
    title: "Agendar cita",
    note: "Reserva un horario disponible, selecciona al paciente, el servicio dental y el odontólogo responsable.",
    hint: "Ideal para organizar nuevas consultas y controles.",
    gradient: "from-indigo-500 to-violet-400",
  },
  {
    to: "/dashboard/patients",
    icon: "person_add",
    art: "personal_injury",
    title: "Registrar paciente",
    note: "Crea el expediente con datos de contacto, antecedentes, alergias y la información clínica inicial.",
    hint: "El expediente quedará conectado con agenda y odontograma.",
    gradient: "from-sky-500 to-cyan-400",
  },
  {
    to: "/dashboard/odontogram",
    icon: "dentistry",
    art: "dentistry",
    title: "Abrir expedientes",
    note: "Consulta el historial completo del paciente, sus atenciones, tratamientos y el estado actual de cada pieza dental.",
    hint: "Todo el seguimiento clínico desde un solo lugar.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    to: "/dashboard/team",
    icon: "group_add",
    art: "groups",
    title: "Gestionar equipo",
    note: "Agrega colaboradores, asigna funciones clínicas, configura horarios y controla los accesos de cada cargo.",
    hint: "Define claramente qué puede ver y hacer cada persona.",
    gradient: "from-fuchsia-500 to-pink-400",
  },
];

function Metric({ icon, label, value, note, onClick }) {
  return (
    <button
      aria-label={`Ver detalle de ${label}`}
      className="group relative min-h-28 w-full overflow-hidden rounded-3xl border border-outline-variant bg-white p-3 text-left shadow-[0_12px_40px_rgba(31,24,39,0.06)] transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      data-no-drag
      onClick={onClick}
      type="button"
    >
      <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-primary-fixed opacity-60" />
      <span className="material-symbols-outlined relative text-xl text-primary">
        {icon}
      </span>
      <span className="material-symbols-outlined absolute right-3 top-3 text-lg text-primary opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
        arrow_outward
      </span>
      <p className="relative mt-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="relative text-2xl font-extrabold">{value}</p>
      <div className="relative flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[11px] text-on-surface-variant">
          {note}
        </p>
        <span className="shrink-0 text-[10px] font-bold text-primary">
          Ver detalle
        </span>
      </div>
    </button>
  );
}

function PatientInitials({ patient }) {
  const firstName = patient?.firstName || "";
  const lastName = patient?.lastName || "";
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-fixed font-bold text-primary">
      {`${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?"}
    </span>
  );
}

export default function DentalDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config } = useAppConfig();
  const owner = ["admin_owner", "admin"].includes(user.role);
  const dentist = config?.user?.functions?.some((item) => item.code === "dentist");
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [report, setReport] = useState(null);
  const [operations, setOperations] = useState([]);
  const [error, setError] = useState("");
  const [view, setView] = useState("flow");
  const [activeStatus, setActiveStatus] = useState("waiting");
  const [quickOpen, setQuickOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState("");
  const [recordPatient, setRecordPatient] = useState(null);
  const [recordChart, setRecordChart] = useState([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [recordExporting, setRecordExporting] = useState(false);
  const loadInFlight = useRef(false);
  const load = useCallback(async () => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    try {
      const [p, a, r, o] = await Promise.all([
        api.getPatients(),
        api.getHealthAppointments(),
        owner ? api.getDentalReport() : Promise.resolve(null),
        api.getDentalOperations(),
      ]);
      setPatients(p);
      setAppointments(a);
      setReport(r);
      setOperations(o);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      loadInFlight.current = false;
    }
  }, [owner]);
  useEffect(() => {
    queueMicrotask(load);
    const refresh = () => {
      if (document.visibilityState === "visible") load();
    };
    const timer = setInterval(refresh, DASHBOARD_REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);
  useLiveRefresh(load, ["/health"]);
  const today = new Date().toLocaleDateString("en-CA"),
    todayItems = useMemo(
      () =>
        appointments
          .filter((x) => x.startsAt.slice(0, 10) === today)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      [appointments, today],
    );
  const checked = new Set(
    operations.map((x) => x.appointment?.id).filter(Boolean),
  );
  const groups = Object.keys(states).map((status) => [
    status,
    operations.filter((x) => x.status === status),
  ]);
  const activeRows = operations.filter((x) => x.status === activeStatus);
  const workload = Object.entries(
    operations.reduce((acc, x) => {
      const name = x.dentist?.name || "Sin asignar";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const detailDefinitions = useMemo(
    () => ({
      patients: {
        title: "Pacientes activos",
        description:
          "Selecciona un paciente para revisar su expediente clínico completo.",
        icon: "groups",
        rows: patients.map((patient) => ({
          id: patient.id,
          patient,
          title: `${patient.firstName} ${patient.lastName}`,
          detail: `${patient.documentType || "DNI"} ${patient.document || "Sin documento"}`,
          meta: patient.phone || patient.email || "Sin datos de contacto",
          badge: patient.status === "active" ? "Activo" : patient.status,
        })),
        empty: "Aún no hay pacientes registrados.",
        route: "/dashboard/patients",
        routeLabel: "Gestionar pacientes",
      },
      appointments: {
        title: "Citas de hoy",
        description:
          "Agenda del día con paciente, motivo y odontólogo responsable.",
        icon: "today",
        rows: todayItems.map((appointment) => ({
          id: appointment.id,
          patient: appointment.patient,
          title: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          detail: `${time(appointment.startsAt)} · ${appointment.reason || "Consulta dental"}`,
          meta: appointment.professionalName || "Odontólogo por asignar",
          badge:
            appointment.status === "confirmed" ? "Confirmada" : "Programada",
        })),
        empty: "No hay citas programadas para hoy.",
        route: "/dashboard/appointments",
        routeLabel: "Abrir agenda",
      },
      attending: {
        title: "Pacientes en atención",
        description:
          "Consultas que se encuentran activas en este momento.",
        icon: "dentistry",
        rows: operations
          .filter((item) => item.status === "in_attention")
          .map((operation) => ({
            id: operation.id,
            patient: operation.patient,
            title: `${operation.patient.firstName} ${operation.patient.lastName}`,
            detail: operation.reason || "Atención clínica",
            meta: `${operation.dentist?.name || "Odontólogo por asignar"} · Inicio ${time(operation.startedAt)}`,
            badge: "Atendiendo",
          })),
        empty: "No hay pacientes en atención ahora.",
        route: "/dashboard/appointments",
        routeLabel: "Abrir agenda",
      },
      billing: {
        title: "Atenciones por cobrar",
        description:
          "Pacientes derivados a recepción después de finalizar su consulta.",
        icon: "payments",
        rows: operations
          .filter((item) => item.status === "ready_for_payment")
          .map((operation) => ({
            id: operation.id,
            patient: operation.patient,
            title: `${operation.patient.firstName} ${operation.patient.lastName}`,
            detail: operation.reason || "Atención dental",
            meta: `${operation.dentist?.name || "Odontólogo por asignar"} · Finalizó ${time(operation.finishedAt)}`,
            badge: "Por cobrar",
          })),
        empty: "No existen atenciones pendientes de cobro.",
        route: "/dashboard/dental-billing",
        routeLabel: "Ir a finanzas",
      },
    }),
    [operations, patients, todayItems],
  );
  const activeDetail = detailDefinitions[detailOpen];
  const openPatientRecord = async (patientReference) => {
    const patient =
      patients.find((item) => item.id === patientReference?.id) ||
      patientReference;
    if (!patient?.id) return;
    setDetailOpen("");
    setRecordPatient(patient);
    setRecordChart([]);
    setRecordError("");
    setRecordLoading(true);
    try {
      setRecordChart(await api.getDentalChart(patient.id));
    } catch (requestError) {
      setRecordError(
        requestError.message || "No se pudo cargar el odontograma del paciente.",
      );
    } finally {
      setRecordLoading(false);
    }
  };
  const retryPatientRecord = () => {
    if (recordPatient) openPatientRecord(recordPatient);
  };
  const checkIn = async (appointment) => {
    try {
      await api.checkInDentalAttention({
        patientId: appointment.patient.id,
        appointmentId: appointment.id,
        dentistId: appointment.professionalId || null,
        reason: appointment.reason,
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <DashboardShell
      title={`Panel dental · ${config?.business?.name || ""}`}
      subtitle="Control de agenda, atención clínica y cobro en un solo flujo."
    >
      {error ? (
        <p className="mb-4 rounded-xl bg-error-container p-3 text-sm text-error">
          {error}
        </p>
      ) : null}
      <HorizontalScroller
        className="lg:justify-center"
        label="Indicadores dentales"
      >
        {[
          {
            id: "patients",
            icon: "groups",
            label: "Pacientes",
            value: patients.length,
            note: "Expedientes activos",
          },
          {
            id: "appointments",
            icon: "today",
            label: "Citas hoy",
            value: todayItems.length,
            note: "Atenciones programadas",
          },
          {
            id: "attending",
            icon: "dentistry",
            label: "Atendiendo",
            value: operations.filter((x) => x.status === "in_attention").length,
            note: "En consulta ahora",
          },
          {
            id: "billing",
            icon: "payments",
            label: "Por cobrar",
            value: operations.filter((x) => x.status === "ready_for_payment")
              .length,
            note: owner
              ? `Cobrado S/ ${Number(report?.paidAmount || 0).toFixed(2)}`
              : "Derivados a recepción",
          },
        ].map((metric) => (
          <div
            className="w-[70vw] max-w-72 shrink-0 snap-start sm:w-60 lg:w-64"
            key={metric.id}
          >
            <Metric
              icon={metric.icon}
              label={metric.label}
              note={metric.note}
              onClick={() => setDetailOpen(metric.id)}
              value={metric.value}
            />
          </div>
        ))}
      </HorizontalScroller>
      <div className="mx-auto mt-3 grid w-full max-w-2xl grid-cols-3 rounded-2xl border border-outline-variant bg-white p-1">
        <button
          className={`min-h-10 rounded-xl px-2 text-sm font-bold ${view === "flow" ? "bg-primary text-white" : "text-on-surface-variant"}`}
          onClick={() => setView("flow")}
          type="button"
        >
          Flujo clínico
        </button>
        <button
          className={`min-h-10 rounded-xl px-2 text-sm font-bold ${view === "agenda" ? "bg-primary text-white" : "text-on-surface-variant"}`}
          onClick={() => setView("agenda")}
          type="button"
        >
          Agenda
        </button>
        <button
          className="flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-sm font-bold text-primary hover:bg-primary-fixed"
          onClick={() => setQuickOpen(true)}
          type="button"
        >
          <span className="material-symbols-outlined text-lg">apps</span>
          <span className="hidden sm:inline">Acciones</span>
        </button>
      </div>
      {view === "flow" && owner ? (
        <section className="mt-3">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Operación de hoy</h2>
              <p className="text-xs text-on-surface-variant">
                Selecciona un estado para revisar sus pacientes.
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-on-surface-variant">
              Actualiza cada 15 s
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {groups.map(([status, rows]) => {
              const [label, icon, color] = states[status];
              return (
                <button
                  className={`flex min-h-14 items-center justify-between rounded-xl border p-2.5 text-left transition ${activeStatus === status ? `${tone[color]} border-current shadow-sm` : "border-outline-variant bg-white"}`}
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  type="button"
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <span className="material-symbols-outlined text-xl">
                      {icon}
                    </span>
                    {label}
                  </span>
                  <b>{rows.length}</b>
                </button>
              );
            })}
          </div>
          <Card className="mt-2 min-h-40 overflow-hidden">
            <div className="flex items-center justify-between border-b border-outline-variant px-3 py-2">
              <b>{states[activeStatus][0]}</b>
              <span className="text-xs text-on-surface-variant">
                {activeRows.length} paciente(s)
              </span>
            </div>
            {activeRows.length ? (
              <HorizontalScroller
                label={`Pacientes ${states[activeStatus][0]}`}
              >
                {activeRows.map((x) => (
                  <button
                    aria-label={`Abrir expediente de ${x.patient.firstName} ${x.patient.lastName}`}
                    className="group w-60 shrink-0 snap-start rounded-xl border border-outline-variant p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    key={x.id}
                    onClick={() => openPatientRecord(x.patient)}
                    type="button"
                  >
                    <div className="flex items-start gap-2.5">
                      <PatientInitials patient={x.patient} />
                      <div className="min-w-0 flex-1">
                        <b className="block truncate">
                          {x.patient.firstName} {x.patient.lastName}
                        </b>
                        <p className="truncate text-xs text-on-surface-variant">
                          {x.dentist?.name || "Odontólogo por asignar"}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-lg text-primary transition group-hover:translate-x-0.5">
                        arrow_forward
                      </span>
                    </div>
                    <p className="mt-2 text-xs">
                      Ingreso {time(x.checkedInAt)} · Inicio {time(x.startedAt)}
                    </p>
                  </button>
                ))}
              </HorizontalScroller>
            ) : (
              <p className="grid min-h-28 place-items-center text-sm text-on-surface-variant">
                Sin pacientes en este estado
              </p>
            )}
          </Card>
        </section>
      ) : null}
      {view === "agenda" ? (
        <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b p-3">
              <div>
                <h2 className="text-lg font-bold">Agenda de hoy</h2>
                <p className="text-xs text-on-surface-variant">
                  Recepción confirma la llegada.
                </p>
              </div>
              <Link
                className="rounded-xl border px-3 py-2 text-sm font-bold text-primary"
                to="/dashboard/appointments"
              >
                Calendario
              </Link>
            </div>
            <div className="grid max-h-64 gap-2 overflow-y-auto p-3">
              {todayItems.map((x) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant p-3"
                  key={x.id}
                >
                  <button
                    aria-label={`Abrir expediente de ${x.patient.firstName} ${x.patient.lastName}`}
                    className="group flex min-w-0 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    onClick={() => openPatientRecord(x.patient)}
                    type="button"
                  >
                    <PatientInitials patient={x.patient} />
                    <div className="min-w-0">
                    <b>
                      {x.patient.firstName} {x.patient.lastName}
                    </b>
                    <p className="text-sm">
                      {time(x.startsAt)} · {x.professionalName || "Por asignar"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {x.reason}
                    </p>
                    </div>
                    <span className="material-symbols-outlined text-lg text-primary opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                      arrow_outward
                    </span>
                  </button>
                  {checked.has(x.id) ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                      Llegada registrada
                    </span>
                  ) : (
                    <button
                      className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
                      onClick={() => checkIn(x)}
                      type="button"
                    >
                      Registrar llegada
                    </button>
                  )}
                </div>
              ))}
              {!todayItems.length ? (
                <p className="p-8 text-center text-sm text-on-surface-variant">
                  Sin citas programadas hoy
                </p>
              ) : null}
            </div>
          </Card>
          <Card className="p-3">
            <h2 className="font-bold">Carga por odontólogo</h2>
            <div className="mt-2 grid max-h-40 gap-2 overflow-y-auto">
              {workload.map(([name, count]) => (
                <div
                  className="flex items-center justify-between rounded-xl bg-surface-container-low p-2.5"
                  key={name}
                >
                  <b>{name}</b>
                  <span className="rounded-full bg-primary-fixed px-3 py-1 text-sm font-bold text-primary">
                    {count}
                  </span>
                </div>
              ))}
              {!workload.length ? (
                <p className="text-sm text-on-surface-variant">
                  Aún no hay atenciones.
                </p>
              ) : null}
            </div>
            <div className="mt-2 rounded-xl bg-emerald-50 p-2.5">
              <p className="text-xs text-emerald-800">Saldo por cobrar</p>
              <b className="text-xl text-emerald-900">
                S/ {Number(report?.balance || 0).toFixed(2)}
              </b>
            </div>
          </Card>
        </section>
      ) : null}
      {activeDetail ? (
        <Modal
          dialogClassName="sm:max-w-4xl"
          onClose={() => setDetailOpen("")}
          title={activeDetail.title}
        >
          <div className="p-3 sm:p-5">
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-primary-fixed p-3">
              <span className="material-symbols-outlined grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl text-primary shadow-sm">
                {activeDetail.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{activeDetail.description}</p>
                <p className="text-xs text-on-surface-variant">
                  {activeDetail.rows.length} resultado(s) · Pulsa una tarjeta
                  para abrir el expediente.
                </p>
              </div>
            </div>
            {activeDetail.rows.length ? (
              <div className="grid max-h-[min(32rem,60svh)] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {activeDetail.rows.map((row) => (
                  <button
                    aria-label={`Abrir expediente de ${row.title}`}
                    className="group flex min-h-28 items-start gap-3 rounded-2xl border border-outline-variant bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    key={row.id}
                    onClick={() => openPatientRecord(row.patient)}
                    type="button"
                  >
                    <PatientInitials patient={row.patient} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <b className="truncate">{row.title}</b>
                        <span className="shrink-0 rounded-full bg-primary-fixed px-2 py-1 text-[10px] font-bold text-primary">
                          {row.badge}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm">{row.detail}</p>
                      <p className="mt-1 truncate text-xs text-on-surface-variant">
                        {row.meta}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                        Ver expediente
                        <span className="material-symbols-outlined text-base transition group-hover:translate-x-0.5">
                          arrow_forward
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 text-center">
                <div>
                  <span className="material-symbols-outlined text-4xl text-primary">
                    {activeDetail.icon}
                  </span>
                  <p className="mt-2 font-bold">{activeDetail.empty}</p>
                  <p className="text-sm text-on-surface-variant">
                    Puedes continuar desde la sección correspondiente.
                  </p>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2 border-t border-outline-variant pt-3">
              <button
                className="min-h-11 rounded-xl border border-outline-variant px-4 text-sm font-bold"
                onClick={() => setDetailOpen("")}
                type="button"
              >
                Cerrar
              </button>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-md"
                onClick={() => {
                  setDetailOpen("");
                  navigate(activeDetail.route);
                }}
                type="button"
              >
                {activeDetail.routeLabel}
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
      {recordPatient && recordLoading ? (
        <Modal
          dialogClassName="sm:max-w-lg"
          onClose={() => setRecordPatient(null)}
          title={`Expediente · ${recordPatient.firstName} ${recordPatient.lastName}`}
        >
          <div className="grid min-h-56 place-items-center p-6 text-center">
            <div>
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                progress_activity
              </span>
              <p className="mt-3 font-bold">Cargando expediente clínico…</p>
              <p className="text-sm text-on-surface-variant">
                Consultando odontograma e historial conectado.
              </p>
            </div>
          </div>
        </Modal>
      ) : null}
      {recordPatient && !recordLoading && recordError ? (
        <Modal
          dialogClassName="sm:max-w-lg"
          onClose={() => {
            setRecordPatient(null);
            setRecordError("");
          }}
          title="No se pudo abrir el expediente"
        >
          <div className="p-5">
            <p className="rounded-2xl bg-error-container p-4 text-sm text-error">
              {recordError}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="min-h-11 rounded-xl border border-outline-variant px-4 text-sm font-bold"
                onClick={() => setRecordPatient(null)}
                type="button"
              >
                Cerrar
              </button>
              <button
                className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white"
                onClick={retryPatientRecord}
                type="button"
              >
                Reintentar
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
      {recordPatient && !recordLoading && !recordError ? (
        <OdontogramModal
          admin={owner}
          canManageConsent={dentist}
          canEditRecords={owner || config?.capabilities?.includes("dental.records.edit")}
          canEditTreatments={owner || config?.capabilities?.includes("dental.treatments.edit")}
          chart={recordChart}
          close={() => {
            setRecordPatient(null);
            setRecordChart([]);
          }}
          exporting={recordExporting}
          onExport={async (format) => {
            setRecordExporting(true);
            try {
              await api.exportDentalChart(recordPatient.id, format);
            } finally {
              setRecordExporting(false);
            }
          }}
          patient={recordPatient}
        />
      ) : null}
      {quickOpen ? (
        <Modal
          dialogClassName="sm:max-w-3xl"
          onClose={() => setQuickOpen(false)}
          title="Acciones dentales"
        >
          <div className="p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">¿Qué deseas hacer?</p>
                <p className="text-xs text-on-surface-variant">
                  Una acción por vista. Desliza, arrastra o utiliza las flechas.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                4 accesos
              </span>
            </div>
            <HorizontalScroller
              className="gap-3 snap-mandatory"
              label="Acciones rápidas dentales"
              pageStep
            >
              {quickActions.map((action, index) => (
                <div
                  className="group min-w-full shrink-0 snap-start overflow-hidden rounded-3xl border border-outline-variant bg-white text-left shadow-sm transition hover:border-primary hover:shadow-xl"
                  data-drag-card
                  key={action.to}
                >
                  <article className="grid min-h-[22rem] sm:min-h-[19rem] sm:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
                    <div
                      className={`relative grid min-h-48 place-items-center overflow-hidden bg-gradient-to-br ${action.gradient} sm:min-h-full`}
                    >
                      <span className="absolute -left-12 -top-14 size-44 rounded-full bg-white/15" />
                      <span className="absolute -bottom-20 -right-10 size-60 rounded-full bg-white/15" />
                      <span className="absolute left-5 top-5 rounded-full bg-black/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        {String(index + 1).padStart(2, "0")} /{" "}
                        {String(quickActions.length).padStart(2, "0")}
                      </span>
                      <span className="material-symbols-outlined relative text-[7rem] text-white/95 drop-shadow-lg sm:text-[8.5rem]">
                        {action.art}
                      </span>
                      <span className="material-symbols-outlined absolute right-5 top-5 grid size-11 place-items-center rounded-2xl bg-white/20 text-2xl text-white backdrop-blur">
                        {action.icon}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center p-5 sm:p-7">
                      <span className="text-xs font-bold uppercase tracking-[.18em] text-primary">
                        Acceso rápido dental
                      </span>
                      <h3 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
                        {action.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                        {action.note}
                      </p>
                      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-container-low p-3 text-xs leading-5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-lg text-primary">
                          info
                        </span>
                        <span>{action.hint}</span>
                      </div>
                      <button
                        className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                        data-no-drag
                        onClick={() => {
                          setQuickOpen(false);
                          navigate(action.to);
                        }}
                        type="button"
                      >
                        Abrir esta sección
                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </article>
                </div>
              ))}
            </HorizontalScroller>
          </div>
        </Modal>
      ) : null}
    </DashboardShell>
  );
}
