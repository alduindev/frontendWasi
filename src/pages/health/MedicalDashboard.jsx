import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import { useAuth } from "../../context/authStore";
import { useAppConfig } from "../../context/appConfigStore";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import {
  getBusinessMedicalServices,
  getMedicalAppointments,
  getMedicalClinicalRecord,
  getMedicalDashboard,
  getMedicalPatients,
  getMedicalProfessionals,
} from "../../services/medicalService";
import { MedicalAppointmentWizard } from "./MedicalCalendar";
import {
  MedicalAppointmentDetail,
  MedicalPatientForm,
  MedicalRecordModal,
} from "./MedicalWorkspace";
import { appointmentDraftFor } from "../../utils/medicalAppointment";

const states = {
  scheduled: ["Programadas", "event", "primary"],
  confirmed: ["Confirmadas", "event_available", "sky"],
  in_attention: ["En atención", "medical_services", "violet"],
  completed: ["Completadas", "task_alt", "emerald"],
  no_show: ["Inasistencias", "person_off", "slate"],
  cancelled: ["Canceladas", "event_busy", "error"],
};
const DASHBOARD_REFRESH_INTERVAL_MS = 60_000;

const tones = {
  primary: "bg-primary-fixed text-primary",
  sky: "bg-sky-100 text-sky-900",
  violet: "bg-violet-100 text-violet-900",
  emerald: "bg-emerald-100 text-emerald-900",
  slate: "bg-slate-100 text-slate-900",
  error: "bg-error-container text-on-error-container",
};

const statusLabels = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  in_attention: "En atención",
  completed: "Completada",
  no_show: "Inasistencia",
  cancelled: "Cancelada",
};

const emptyClinicalRecord = {
  appointments: [],
  records: [],
  diagnoses: [],
  prescriptions: [],
  orders: [],
  results: [],
};

const quickActionCatalog = [
  {
    id: "appointment",
    permission: "health.appointments.create",
    icon: "event_available",
    art: "calendar_month",
    title: "Agendar cita",
    note: "Selecciona al paciente, el servicio médico, el profesional responsable y el horario sin salir del panel.",
    hint: "También puedes registrar un paciente nuevo y regresar al mismo flujo.",
    gradient: "from-indigo-500 to-violet-400",
  },
  {
    id: "patient",
    permission: "health.patients.edit",
    icon: "person_add",
    art: "personal_injury",
    title: "Registrar paciente",
    note: "Crea la ficha con contacto, antecedentes, alergias y observaciones clínicas.",
    hint: "Al guardar se abrirá el expediente del paciente en otro modal.",
    gradient: "from-sky-500 to-cyan-400",
  },
  {
    id: "records",
    permission: "health.records.read",
    icon: "clinical_notes",
    art: "clinical_notes",
    title: "Abrir expedientes",
    note: "Busca un paciente y revisa evoluciones, diagnósticos, recetas, órdenes, resultados, archivos y PDF.",
    hint: "Todo el seguimiento clínico permanece dentro del dashboard.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    id: "agenda",
    permission: "health.appointments.read",
    icon: "today",
    art: "event_note",
    title: "Revisar agenda",
    note: "Consulta las citas de hoy, abre su detalle y actualiza el estado de la atención.",
    hint: "Desde cada cita puedes pasar directamente al expediente médico.",
    gradient: "from-fuchsia-500 to-pink-400",
  },
];

const time = (value) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function Metric({ icon, label, note, onClick, value }) {
  return (
    <button
      aria-label={`Ver detalle de ${label}`}
      className="group relative min-h-28 w-full overflow-hidden rounded-3xl border border-outline-variant bg-white p-3 text-left shadow-[0_12px_40px_rgba(31,24,39,0.06)] transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      onClick={onClick}
      type="button"
    >
      <div className="absolute -right-5 -top-5 size-16 rounded-full bg-primary-fixed opacity-60" />
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
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-fixed font-bold text-primary">
      {`${patient?.firstName?.[0] || ""}${patient?.lastName?.[0] || ""}`.toUpperCase() || "?"}
    </span>
  );
}

function DetailModal({ detail, onClose, onOpenRow, onPrimary }) {
  return (
    <Modal
      dialogClassName="sm:max-w-4xl"
      onClose={onClose}
      title={detail.title}
    >
      <div className="p-3 sm:p-5">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-primary-fixed p-3">
          <span className="material-symbols-outlined grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl text-primary shadow-sm">
            {detail.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{detail.description}</p>
            <p className="text-xs text-on-surface-variant">
              {detail.rows.length} resultado(s) · Pulsa una tarjeta para continuar
              en un modal.
            </p>
          </div>
        </div>
        {detail.rows.length ? (
          <div className="grid max-h-[min(32rem,60svh)] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {detail.rows.map((row) => (
              <button
                aria-label={`Abrir ${row.title}`}
                className="group flex min-h-28 items-start gap-3 rounded-2xl border border-outline-variant bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                key={`${row.kind}-${row.id}`}
                onClick={() => onOpenRow(row)}
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
                    {row.actionLabel ||
                      (row.kind === "appointment"
                        ? "Ver detalle de cita"
                        : "Ver expediente")}
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
                {detail.icon}
              </span>
              <p className="mt-2 font-bold">{detail.empty}</p>
              <p className="text-sm text-on-surface-variant">
                Puedes iniciar una nueva acción sin abandonar el dashboard.
              </p>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-outline-variant pt-3">
          <Button onClick={onClose} type="button" variant="secondary">
            Cerrar
          </Button>
          {detail.primary ? (
            <Button
              icon={detail.primary.icon}
              onClick={() => onPrimary(detail.primary.action)}
              type="button"
            >
              {detail.primary.label}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function QuickActionsModal({ actions, onClose, onSelect }) {
  return (
    <Modal
      dialogClassName="sm:max-w-3xl"
      onClose={onClose}
      title="Acciones médicas"
    >
      <div className="p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">¿Qué deseas hacer?</p>
            <p className="text-xs text-on-surface-variant">
              Cada opción se abre dentro del panel, sin cambiar de sección.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
            {actions.length} accesos
          </span>
        </div>
        <HorizontalScroller
          className="gap-3 snap-mandatory"
          label="Acciones rápidas médicas"
          pageStep
        >
          {actions.map((action, index) => (
            <div
              className="group min-w-full shrink-0 snap-start overflow-hidden rounded-3xl border border-outline-variant bg-white text-left shadow-sm transition hover:border-primary hover:shadow-xl"
              data-drag-card
              key={action.id}
            >
              <article className="grid min-h-[22rem] sm:min-h-[19rem] sm:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
                <div
                  className={`relative grid min-h-48 place-items-center overflow-hidden bg-gradient-to-br ${action.gradient} sm:min-h-full`}
                >
                  <span className="absolute -left-12 -top-14 size-44 rounded-full bg-white/15" />
                  <span className="absolute -bottom-20 -right-10 size-60 rounded-full bg-white/15" />
                  <span className="absolute left-5 top-5 rounded-full bg-black/15 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(actions.length).padStart(2, "0")}
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
                    Acceso rápido médico
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
                  <Button
                    className="mt-5 w-full"
                    data-no-drag
                    icon="open_in_new"
                    onClick={() => onSelect(action.id)}
                    type="button"
                  >
                    Abrir en modal
                  </Button>
                </div>
              </article>
            </div>
          ))}
        </HorizontalScroller>
      </div>
    </Modal>
  );
}

export default function MedicalDashboard({ operator = false }) {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const administrator = ["admin_owner", "admin"].includes(user?.role);
  const capabilities = useMemo(
    () => new Set(config?.capabilities || []),
    [config?.capabilities],
  );
  const canCreatePatients =
    administrator || capabilities.has("health.patients.edit");
  const canCreateAppointments =
    administrator || capabilities.has("health.appointments.create");
  const canReadPatients =
    administrator || capabilities.has("health.patients.read");
  const canReadAppointments =
    administrator || capabilities.has("health.appointments.read");
  const canReadRecords =
    administrator || capabilities.has("health.records.read");
  const canReadDashboard =
    administrator || capabilities.has("health.dashboard.read");
  const canUpdateAppointmentStatus =
    administrator || capabilities.has("health.appointments.status");
  const Shell = operator ? OperatorShell : DashboardShell;
  const quickActions = useMemo(
    () =>
      quickActionCatalog.filter(
        (action) =>
          administrator || capabilities.has(action.permission),
      ),
    [administrator, capabilities],
  );

  const [summary, setSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [view, setView] = useState("flow");
  const [activeStatus, setActiveStatus] = useState("scheduled");
  const [quickOpen, setQuickOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState("");
  const [actionModal, setActionModal] = useState("");
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [recordPatient, setRecordPatient] = useState(null);
  const [recordInitialTab, setRecordInitialTab] = useState("summary");
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [clinicalRecord, setClinicalRecord] = useState(emptyClinicalRecord);
  const today = new Date().toLocaleDateString("en-CA");
  const loadInFlight = useRef(false);
  const [appointmentDraft, setAppointmentDraft] = useState(() =>
    appointmentDraftFor(today),
  );

  const load = useCallback(async () => {
    if (loadInFlight.current) return;
    loadInFlight.current = true;
    try {
      const [
        dashboard,
        appointmentRows,
        professionalRows,
        patientRows,
        businessServices,
      ] = await Promise.all([
        canReadDashboard ? getMedicalDashboard() : Promise.resolve(null),
        canReadAppointments ? getMedicalAppointments() : Promise.resolve([]),
        canReadAppointments ? getMedicalProfessionals() : Promise.resolve([]),
        canReadPatients ? getMedicalPatients() : Promise.resolve([]),
        canReadPatients ? getBusinessMedicalServices() : Promise.resolve([]),
      ]);
      const currentDay = new Date().toLocaleDateString("en-CA");
      const now = new Date();
      setSummary(
        dashboard || {
          patientsTotal: patientRows.length,
          appointmentsToday: appointmentRows.filter(
            (item) => item.startsAt.slice(0, 10) === currentDay,
          ).length,
          appointmentsUpcoming: appointmentRows.filter(
            (item) =>
              new Date(item.startsAt) >= now &&
              ["scheduled", "confirmed"].includes(item.status),
          ).length,
        },
      );
      setAppointments(appointmentRows);
      setProfessionals(professionalRows);
      setPatients(patientRows);
      setServices(businessServices.map((item) => item.serviceType));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      loadInFlight.current = false;
    }
  }, [
    canReadAppointments,
    canReadDashboard,
    canReadPatients,
  ]);

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
  useLiveRefresh(load, ["/medical"]);

  const todayItems = useMemo(
    () =>
      appointments
        .filter((item) => item.startsAt.slice(0, 10) === today)
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    [appointments, today],
  );
  const upcomingItems = useMemo(
    () =>
      appointments
        .filter(
          (item) =>
            new Date(item.startsAt) >= new Date() &&
            ["scheduled", "confirmed"].includes(item.status),
        )
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt)),
    [appointments],
  );
  const groups = Object.keys(states).map((status) => [
    status,
    appointments.filter((item) => item.status === status),
  ]);
  const activeRows = appointments.filter(
    (item) => item.status === activeStatus,
  );
  const workload = Object.entries(
    appointments.reduce((result, item) => {
      const name = item.professionalName || "Sin asignar";
      result[name] = (result[name] || 0) + 1;
      return result;
    }, {}),
  ).sort((left, right) => right[1] - left[1]);

  const patientRow = useCallback(
    (patient) => ({
      id: patient.id,
      kind: "record",
      patient,
      title: `${patient.firstName} ${patient.lastName}`,
      detail: `${patient.documentType || "DNI"} ${patient.document || "Sin documento"}`,
      meta: patient.phone || patient.email || "Sin datos de contacto",
      badge: patient.isActive === false ? "Inactivo" : "Activo",
      actionLabel: canReadRecords ? "Ver expediente" : "Ver ficha",
    }),
    [canReadRecords],
  );
  const appointmentRow = useCallback(
    (appointment) => ({
      id: appointment.id,
      kind: "appointment",
      appointment,
      patient: appointment.patient,
      title: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      detail: `${time(appointment.startsAt)} · ${appointment.reason || appointment.medicalServiceName || "Consulta médica"}`,
      meta: appointment.professionalName || "Profesional por asignar",
      badge: statusLabels[appointment.status] || appointment.status,
    }),
    [],
  );
  const detailDefinitions = useMemo(
    () => ({
      patients: {
        title: "Pacientes activos",
        description:
          "Selecciona un paciente para abrir su expediente médico completo.",
        icon: "groups",
        rows: patients.filter((item) => item.isActive !== false).map(patientRow),
        empty: "Aún no hay pacientes registrados.",
        primary: canCreatePatients
          ? {
              action: "patient",
              icon: "person_add",
              label: "Registrar paciente",
            }
          : null,
      },
      appointments: {
        title: "Citas de hoy",
        description:
          "Revisa el detalle, actualiza el estado o abre el expediente del paciente.",
        icon: "today",
        rows: todayItems.map(appointmentRow),
        empty: "No hay citas programadas para hoy.",
        primary: canCreateAppointments
          ? {
              action: "appointment",
              icon: "event_available",
              label: "Agendar cita",
            }
          : null,
      },
      attending: {
        title: "Pacientes en atención",
        description:
          "Consultas activas que pueden finalizarse o continuar en el expediente.",
        icon: "medical_services",
        rows: appointments
          .filter((item) => item.status === "in_attention")
          .map(appointmentRow),
        empty: "No hay pacientes en atención ahora.",
        primary: null,
      },
      upcoming: {
        title: "Próximas citas",
        description:
          "Atenciones programadas o confirmadas ordenadas por fecha y hora.",
        icon: "event_upcoming",
        rows: upcomingItems.map(appointmentRow),
        empty: "No hay próximas citas pendientes.",
        primary: canCreateAppointments
          ? {
              action: "appointment",
              icon: "event_available",
              label: "Agendar cita",
            }
          : null,
      },
    }),
    [
      appointmentRow,
      appointments,
      canCreateAppointments,
      canCreatePatients,
      patientRow,
      patients,
      todayItems,
      upcomingItems,
    ],
  );
  const activeDetail = detailDefinitions[detailOpen];

  const openPatientRecord = async (patientReference, initialTab = "summary") => {
    const patient =
      patients.find((item) => item.id === patientReference?.id) ||
      patientReference;
    if (!patient?.id || !canReadRecords) return;
    setDetailOpen("");
    setSelectedAppointment(null);
    setActionModal("");
    setRecordPatient(patient);
    setRecordInitialTab(initialTab);
    setRecordLoading(true);
    setRecordError("");
    setClinicalRecord(emptyClinicalRecord);
    try {
      setClinicalRecord(await getMedicalClinicalRecord(patient.id));
    } catch (requestError) {
      setRecordError(
        requestError.message || "No se pudo cargar el expediente médico.",
      );
    } finally {
      setRecordLoading(false);
    }
  };

  const closeRecord = () => {
    setRecordPatient(null);
    setRecordError("");
    setRecordInitialTab("summary");
    setClinicalRecord(emptyClinicalRecord);
  };

  const openAction = (action) => {
    setQuickOpen(false);
    setDetailOpen("");
    setEditingPatient(null);
    if (action === "records") {
      setDetailOpen("patients");
      return;
    }
    if (action === "agenda") {
      setDetailOpen("appointments");
      return;
    }
    if (action === "appointment") {
      setAppointmentDraft(appointmentDraftFor(today));
    }
    if (action === "patient") {
      setEditingPatient(null);
    }
    setActionModal(action);
  };

  const openDetailRow = (row) => {
    if (row.kind === "appointment") {
      setDetailOpen("");
      setSelectedAppointment(row.appointment);
      return;
    }
    if (!canReadRecords && canCreatePatients) {
      setDetailOpen("");
      setEditingPatient(row.patient);
      setActionModal("patient-edit");
      return;
    }
    openPatientRecord(row.patient);
  };

  const savePatient = async (patient) => {
    const returnToAppointment = actionModal === "patient-from-appointment";
    setEditingPatient(null);
    await load();
    if (returnToAppointment) {
      setAppointmentDraft((current) => ({
        ...current,
        patientId: patient.id,
      }));
      setActionModal("appointment");
      return;
    }
    setActionModal("");
    await openPatientRecord(patient);
  };

  const openPatientEditor = (patient) => {
    setRecordPatient(null);
    setEditingPatient(patient);
    setActionModal("patient-edit");
  };

  return (
    <Shell
      subtitle="Agenda, atención clínica y expedientes en un solo flujo modal."
      title={`Panel médico${config?.business?.name ? ` · ${config.business.name}` : ""}`}
    >
      {error ? (
        <EmptyState
          description={error}
          icon="cloud_off"
          title="No se pudo cargar el dashboard"
        />
      ) : null}
      {!summary && !error ? <Card className="h-52 animate-pulse" /> : null}
      {summary ? (
        <>
          <HorizontalScroller
            className="lg:justify-center"
            label="Indicadores médicos"
          >
            {[
              {
                id: "patients",
                visible: canReadPatients,
                icon: "groups",
                label: "Pacientes",
                value: summary.patientsTotal,
                note: "Expedientes activos",
              },
              {
                id: "appointments",
                visible: canReadAppointments,
                icon: "today",
                label: "Citas hoy",
                value: summary.appointmentsToday,
                note: "Atenciones programadas",
              },
              {
                id: "attending",
                visible: canReadAppointments,
                icon: "medical_services",
                label: "Atendiendo",
                value: appointments.filter(
                  (item) => item.status === "in_attention",
                ).length,
                note: "En consulta ahora",
              },
              {
                id: "upcoming",
                visible: canReadAppointments,
                icon: "event_upcoming",
                label: "Próximas",
                value: summary.appointmentsUpcoming,
                note: "Programadas o confirmadas",
              },
            ]
              .filter((metric) => metric.visible)
              .map((metric) => (
              <div
                className="w-[70vw] max-w-72 shrink-0 snap-start sm:w-60 lg:w-64"
                key={metric.id}
              >
                <Metric
                  {...metric}
                  onClick={() => setDetailOpen(metric.id)}
                />
              </div>
              ))}
          </HorizontalScroller>

          <div className={`mx-auto mt-3 grid w-full max-w-2xl rounded-2xl border border-outline-variant bg-white p-1 ${canReadAppointments ? "grid-cols-3" : "grid-cols-1"}`}>
            {canReadAppointments ? (
              <>
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
              </>
            ) : null}
            <button
              className="flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-sm font-bold text-primary hover:bg-primary-fixed"
              onClick={() => setQuickOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">apps</span>
              <span className="hidden sm:inline">Acciones</span>
            </button>
          </div>

          {canReadAppointments && view === "flow" ? (
            <section className="mt-3">
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Operación clínica</h2>
                  <p className="text-xs text-on-surface-variant">
                    Selecciona un estado y abre cada cita en un modal.
                  </p>
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  Actualiza cada 15 s
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {groups.map(([status, rows]) => {
                  const [label, icon, color] = states[status];
                  return (
                    <button
                      className={`flex min-h-14 items-center justify-between rounded-xl border p-2.5 text-left transition ${activeStatus === status ? `${tones[color]} border-current shadow-sm` : "border-outline-variant bg-white"}`}
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
                    {activeRows.length} cita(s)
                  </span>
                </div>
                {activeRows.length ? (
                  <HorizontalScroller
                    label={`Citas ${states[activeStatus][0]}`}
                  >
                    {activeRows.map((item) => (
                      <button
                        className="group w-60 shrink-0 snap-start rounded-xl border border-outline-variant p-3 text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                        key={item.id}
                        onClick={() => setSelectedAppointment(item)}
                        type="button"
                      >
                        <div className="flex items-start gap-2.5">
                          <PatientInitials patient={item.patient} />
                          <div className="min-w-0 flex-1">
                            <b className="block truncate">
                              {item.patient.firstName} {item.patient.lastName}
                            </b>
                            <p className="truncate text-xs text-on-surface-variant">
                              {item.professionalName || "Sin asignar"}
                            </p>
                          </div>
                          <span className="material-symbols-outlined text-lg text-primary">
                            arrow_forward
                          </span>
                        </div>
                        <p className="mt-2 text-xs">
                          {item.medicalServiceName} · {time(item.startsAt)}
                        </p>
                      </button>
                    ))}
                  </HorizontalScroller>
                ) : (
                  <p className="grid min-h-28 place-items-center text-sm text-on-surface-variant">
                    Sin citas en este estado
                  </p>
                )}
              </Card>
            </section>
          ) : null}

          {canReadAppointments && view === "agenda" ? (
            <section className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b p-3">
                  <div>
                    <h2 className="text-lg font-bold">Agenda de hoy</h2>
                    <p className="text-xs text-on-surface-variant">
                      Pacientes, motivo y profesional responsable.
                    </p>
                  </div>
                  {canCreateAppointments ? (
                    <Button
                      icon="event_available"
                      onClick={() => openAction("appointment")}
                      size="small"
                      variant="outlined"
                    >
                      Agendar
                    </Button>
                  ) : null}
                </div>
                <div className="grid max-h-64 gap-2 overflow-y-auto p-3">
                  {todayItems.map((item) => (
                    <button
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant p-3 text-left transition hover:border-primary hover:bg-primary-fixed/20"
                      key={item.id}
                      onClick={() => setSelectedAppointment(item)}
                      type="button"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <PatientInitials patient={item.patient} />
                        <span className="min-w-0">
                          <b className="block truncate">
                            {item.patient.firstName} {item.patient.lastName}
                          </b>
                          <span className="block text-sm">
                            {time(item.startsAt)} ·{" "}
                            {item.professionalName || "Por asignar"}
                          </span>
                          <span className="block truncate text-xs text-on-surface-variant">
                            {item.reason}
                          </span>
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-3 py-2 text-xs font-bold ${tones[states[item.status]?.[2] || "primary"]}`}
                      >
                        {states[item.status]?.[0] || item.status}
                      </span>
                    </button>
                  ))}
                  {!todayItems.length ? (
                    <p className="p-8 text-center text-sm text-on-surface-variant">
                      Sin citas programadas hoy
                    </p>
                  ) : null}
                </div>
              </Card>
              <Card className="p-3">
                <h2 className="font-bold">Carga por profesional</h2>
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
                <div className="mt-2 rounded-xl bg-primary-fixed p-2.5">
                  <p className="text-xs text-primary">
                    Profesionales disponibles
                  </p>
                  <b className="text-xl text-primary">
                    {professionals.length}
                  </b>
                </div>
              </Card>
            </section>
          ) : null}
        </>
      ) : null}

      {activeDetail ? (
        <DetailModal
          detail={activeDetail}
          onClose={() => setDetailOpen("")}
          onOpenRow={openDetailRow}
          onPrimary={openAction}
        />
      ) : null}

      {quickOpen ? (
        <QuickActionsModal
          actions={quickActions}
          onClose={() => setQuickOpen(false)}
          onSelect={openAction}
        />
      ) : null}

      {actionModal === "appointment" ? (
        <MedicalAppointmentWizard
          close={() => setActionModal("")}
          draft={appointmentDraft}
          onDraftChange={setAppointmentDraft}
          onNewPatient={() => setActionModal("patient-from-appointment")}
          onSaved={async () => {
            setActionModal("");
            await load();
          }}
          patients={patients.filter((item) => item.isActive !== false)}
          professionals={professionals}
          services={services}
        />
      ) : null}

      {["patient", "patient-edit", "patient-from-appointment"].includes(
        actionModal,
      ) ? (
        <MedicalPatientForm
          close={() => {
            if (actionModal === "patient-from-appointment") {
              setEditingPatient(null);
              setActionModal("appointment");
              return;
            }
            if (actionModal === "patient-edit" && editingPatient) {
              const patient = editingPatient;
              setEditingPatient(null);
              setActionModal("");
              openPatientRecord(patient);
              return;
            }
            setEditingPatient(null);
            setActionModal("");
          }}
          onSaved={savePatient}
          patient={editingPatient}
        />
      ) : null}

      {selectedAppointment ? (
        <MedicalAppointmentDetail
          appointment={selectedAppointment}
          canUpdateStatus={canUpdateAppointmentStatus}
          close={() => setSelectedAppointment(null)}
          done={async () => {
            setSelectedAppointment(null);
            await load();
          }}
          onOpenRecord={(patient) => {
            setSelectedAppointment(null);
            openPatientRecord(patient);
          }}
        />
      ) : null}

      {recordPatient && recordLoading ? (
        <Modal
          dialogClassName="sm:max-w-lg"
          onClose={closeRecord}
          title={`Expediente · ${recordPatient.firstName} ${recordPatient.lastName}`}
        >
          <div className="grid min-h-56 place-items-center p-6 text-center">
            <div>
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                progress_activity
              </span>
              <p className="mt-3 font-bold">Cargando expediente médico…</p>
              <p className="text-sm text-on-surface-variant">
                Consultando historia y documentos conectados.
              </p>
            </div>
          </div>
        </Modal>
      ) : null}

      {recordPatient && !recordLoading && recordError ? (
        <Modal
          dialogClassName="sm:max-w-lg"
          onClose={closeRecord}
          title="No se pudo abrir el expediente"
        >
          <div className="p-5">
            <p className="rounded-2xl bg-error-container p-4 text-sm text-error">
              {recordError}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={closeRecord} type="button" variant="secondary">
                Cerrar
              </Button>
              <Button
                onClick={() =>
                  openPatientRecord(recordPatient, recordInitialTab)
                }
                type="button"
              >
                Reintentar
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {recordPatient && !recordLoading && !recordError ? (
        <MedicalRecordModal
          close={closeRecord}
          initialTab={recordInitialTab}
          key={`${recordPatient.id}-${recordInitialTab}`}
          onEdit={canCreatePatients ? openPatientEditor : undefined}
          onReload={async (patientId) =>
            setClinicalRecord(await getMedicalClinicalRecord(patientId))
          }
          patient={recordPatient}
          record={clinicalRecord}
        />
      ) : null}
    </Shell>
  );
}
