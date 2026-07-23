import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/atoms/Card";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import EmptyState from "../../components/molecules/EmptyState";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useAppConfig } from "../../context/appConfigStore";
import { useAuth } from "../../context/authStore";
import * as api from "../../services/veterinaryService";
import { AppointmentDetail } from "./VeterinaryCalendar";
import VeterinaryPaymentModal from "./VeterinaryPaymentModal";
import {
  dateKeyInLima,
  timeInLima,
  veterinaryStatusMeta,
} from "./veterinaryPresentation";

const flowStatuses = [
  "scheduled",
  "confirmed",
  "in_attention",
  "completed",
  "no_show",
];

const quickActions = [
  {
    description: "Consulta disponibilidad y organiza la atención del día.",
    icon: "calendar_month",
    label: "Calendario",
    to: "/dashboard/appointments",
  },
  {
    description: "Abre expedientes, vacunas, archivos y antecedentes.",
    icon: "pets",
    label: "Mascotas",
    to: "/dashboard/pets",
  },
  {
    description: "Revisa ventas y documentos emitidos por el negocio.",
    icon: "receipt_long",
    label: "Comprobantes",
    to: "/dashboard/invoices",
  },
  {
    description: "Gestiona funciones, horarios y asistencia del personal.",
    icon: "groups",
    label: "Equipo",
    to: "/dashboard/team",
  },
];

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

const longDate = (date) =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeZone: "America/Lima",
  }).format(new Date(`${date}T12:00:00-05:00`));

function PetAvatar({ pet }) {
  if (pet?.photoUrl)
    return (
      <img
        alt={`Foto de ${pet.name}`}
        className="size-11 shrink-0 rounded-xl object-cover"
        src={pet.photoUrl}
      />
    );
  return (
    <span className="material-symbols-outlined grid size-11 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary">
      pets
    </span>
  );
}

function Metric({ icon, label, note, value }) {
  return (
    <Card className="relative min-h-28 overflow-hidden p-3">
      <span className="absolute -right-6 -top-6 size-20 rounded-full bg-primary-fixed opacity-70" />
      <span className="material-symbols-outlined relative text-xl text-primary">
        {icon}
      </span>
      <p className="relative mt-2 text-[11px] font-bold uppercase tracking-[.16em] text-on-surface-variant">
        {label}
      </p>
      <b className="relative block truncate text-2xl">{value}</b>
      <p className="relative truncate text-[11px] text-on-surface-variant">
        {note}
      </p>
    </Card>
  );
}

function ViewTabs({ admin, onChange, value }) {
  const tabs = [
    ["flow", "pets", "Operación"],
    ["agenda", "event_available", "Agenda"],
    ...(admin ? [["followup", "monitor_heart", "Seguimiento"]] : []),
  ];
  return (
    <div className={`mx-auto mt-3 grid w-full max-w-3xl ${admin ? "grid-cols-3" : "grid-cols-2"} rounded-2xl border border-outline-variant bg-white p-1`}>
      {tabs.map(([key, icon, label]) => (
        <button
          className={`flex min-h-10 items-center justify-center gap-1 rounded-xl px-2 text-sm font-bold transition ${value === key ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-low"}`}
          key={key}
          onClick={() => onChange(key)}
          type="button"
        >
          <span className="material-symbols-outlined text-lg">{icon}</span>
          <span className="hidden xs:inline sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

async function upcomingVaccines(pets, from, until) {
  if (!pets.length) return [];
  const results = await Promise.allSettled(
    pets.map((pet) => api.getPetRecord(pet.id)),
  );
  return results
    .flatMap((result) => {
      if (result.status !== "fulfilled") return [];
      return result.value.vaccines.map((vaccine) => ({
        ...vaccine,
        pet: result.value.pet,
      }));
    })
    .filter(
      (vaccine) =>
        vaccine.nextDueAt && vaccine.nextDueAt <= until,
    )
    .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt))
    .map((vaccine) => ({
      ...vaccine,
      overdue: vaccine.nextDueAt < from,
    }));
}

export default function VeterinaryDashboard() {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const admin = ["admin", "admin_owner"].includes(user.role);
  const today = dateKeyInLima(new Date());
  const until = dateKeyInLima(
    new Date(new Date(`${today}T12:00:00-05:00`).getTime() + 30 * 86400000),
  );
  const [summary, setSummary] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [billing, setBilling] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vaccinesLoading, setVaccinesLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("flow");
  const [activeStatus, setActiveStatus] = useState("scheduled");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [paymentRecord, setPaymentRecord] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const start = new Date(`${today}T00:00:00-05:00`).toISOString();
      const end = new Date(`${today}T23:59:59-05:00`).toISOString();
      const [summaryData, petItems, appointmentItems, billingItems] =
        await Promise.all([
          api.getVeterinarySummary(),
          api.getPets(),
          api.getVeterinaryAppointments(start, end),
          admin ? api.getVeterinaryBilling("pending") : Promise.resolve([]),
        ]);
      setSummary(summaryData);
      setAppointments(appointmentItems);
      setBilling(billingItems);
      setLoading(false);
      setVaccinesLoading(true);
      setVaccines(await upcomingVaccines(petItems, today, until));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setVaccinesLoading(false);
    }
  }, [admin, today, until]);

  useEffect(() => {
    queueMicrotask(load);
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        flowStatuses.map((status) => [
          status,
          appointments.filter((appointment) => appointment.status === status),
        ]),
      ),
    [appointments],
  );
  const activeRows = grouped[activeStatus] || [];
  const workload = useMemo(() => {
    const rows = appointments.reduce((groups, appointment) => {
      const key = appointment.professional?.id || "unassigned";
      const current = groups[key] || {
        active: 0,
        completed: 0,
        name: appointment.professional?.name || "Por asignar",
        total: 0,
      };
      current.total += 1;
      current.completed += appointment.status === "completed" ? 1 : 0;
      current.active += appointment.status === "in_attention" ? 1 : 0;
      groups[key] = current;
      return groups;
    }, {});
    return Object.values(rows).sort((a, b) => b.total - a.total);
  }, [appointments]);

  const selectedMeta =
    veterinaryStatusMeta[activeStatus] || veterinaryStatusMeta.scheduled;
  const pendingAmount = billing.reduce(
    (total, record) => total + Number(record.amount || 0),
    0,
  );

  return (
    <DashboardShell
      action={
        <Link
          className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 font-bold text-white shadow-md"
          to="/dashboard/appointments"
        >
          <span className="material-symbols-outlined">event_available</span>
          Agendar cita
        </Link>
      }
      subtitle="Controla agenda, atención, prevención y cobros desde un solo flujo."
      title={`Panel veterinario · ${config?.business?.name || ""}`}
    >
      {error ? (
        <div className="mb-3">
          <EmptyState
            action={{ children: "Reintentar", onClick: load }}
            description={error}
            icon="cloud_off"
            title="No se pudo cargar el panel veterinario"
          />
        </div>
      ) : null}

      <HorizontalScroller className="lg:justify-center" label="Indicadores veterinarios">
        {[
          ["pets", "Mascotas", summary.pets || 0, "Expedientes activos"],
          [
            "calendar_month",
            "Citas hoy",
            appointments.length,
            longDate(today),
          ],
          [
            "medical_services",
            "En atención",
            grouped.in_attention?.length || 0,
            "Consultas abiertas ahora",
          ],
          [
            "vaccines",
            "Vacunas próximas",
            summary.vaccinesDue || 0,
            "Próximos 30 días",
          ],
          ...(admin
            ? [[
                "payments",
                "Por cobrar",
                money(summary.pendingAmount),
                `${billing.length} atención(es) pendiente(s)`,
              ]]
            : []),
        ].map(([icon, label, value, note]) => (
          <div
            className="w-[70vw] max-w-72 shrink-0 snap-start sm:w-60 lg:w-64"
            key={label}
          >
            <Metric icon={icon} label={label} note={note} value={value} />
          </div>
        ))}
      </HorizontalScroller>

      <ViewTabs admin={admin} onChange={setView} value={view} />

      {loading ? <Card className="mt-3 h-56 animate-pulse" /> : null}

      {!loading && view === "flow" ? (
        <section className="mt-3">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Flujo operativo de hoy</h2>
              <p className="text-xs text-on-surface-variant">
                Selecciona un estado para revisar cada cita.
              </p>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              Actualización automática cada 30 s
            </span>
          </div>
          <HorizontalScroller label="Estados de las citas de hoy">
            {flowStatuses.map((status) => {
              const meta = veterinaryStatusMeta[status];
              const active = activeStatus === status;
              return (
                <button
                  className={`flex min-h-16 w-44 shrink-0 snap-start items-center justify-between rounded-2xl border p-3 text-left transition ${active ? `${meta.tone} border-current shadow-sm` : "border-outline-variant bg-white hover:border-primary"}`}
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined">{meta.icon}</span>
                    <b className="text-sm">{meta.label}</b>
                  </span>
                  <b className="text-lg">{grouped[status]?.length || 0}</b>
                </button>
              );
            })}
          </HorizontalScroller>
          <Card className="mt-1 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined rounded-lg p-1.5 ${selectedMeta.tone}`}>
                  {selectedMeta.icon}
                </span>
                <b>{selectedMeta.label}</b>
              </div>
              <span className="text-xs text-on-surface-variant">
                {activeRows.length} cita(s)
              </span>
            </div>
            {activeRows.length ? (
              <HorizontalScroller label={`Citas ${selectedMeta.label}`}>
                {activeRows.map((appointment) => (
                  <button
                    className="w-[75vw] max-w-72 shrink-0 snap-start rounded-xl border border-outline-variant p-3 text-left transition hover:border-primary hover:bg-primary-fixed/30"
                    key={appointment.id}
                    onClick={() => setSelectedAppointment(appointment)}
                    type="button"
                  >
                    <div className="flex gap-2">
                      <PetAvatar pet={appointment.pet} />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2">
                          <b className="truncate">{appointment.pet.name}</b>
                          <span className="shrink-0 text-xs font-bold">
                            {timeInLima(appointment.startsAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-on-surface-variant">
                          {appointment.reason}
                        </p>
                        <p className="mt-1 truncate text-xs">
                          {appointment.professional?.name || "Profesional por asignar"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </HorizontalScroller>
            ) : (
              <p className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
                No hay citas en este estado.
              </p>
            )}
          </Card>
        </section>
      ) : null}

      {!loading && view === "agenda" ? (
        <section className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
          <Card className="p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Agenda de hoy</h2>
                <p className="text-xs capitalize text-on-surface-variant">
                  {longDate(today)}
                </p>
              </div>
              <Link
                className="rounded-xl border border-primary px-3 py-2 text-sm font-bold text-primary"
                to="/dashboard/appointments"
              >
                Calendario
              </Link>
            </div>
            {appointments.length ? (
              <HorizontalScroller label="Agenda veterinaria de hoy">
                {appointments.map((appointment) => {
                  const meta =
                    veterinaryStatusMeta[appointment.status] ||
                    veterinaryStatusMeta.scheduled;
                  return (
                    <button
                      className="w-[78vw] max-w-80 shrink-0 snap-start rounded-2xl border border-outline-variant p-3 text-left hover:border-primary"
                      key={appointment.id}
                      onClick={() => setSelectedAppointment(appointment)}
                      type="button"
                    >
                      <div className="flex gap-3">
                        <PetAvatar pet={appointment.pet} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <b className="truncate">{appointment.pet.name}</b>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${meta.tone}`}>
                              {meta.label}
                            </span>
                          </div>
                          <p className="text-sm">
                            {timeInLima(appointment.startsAt)} · {appointment.reason}
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">
                            {appointment.professional?.name || "Por asignar"} · {appointment.pet.owner.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </HorizontalScroller>
            ) : (
              <p className="rounded-xl border border-dashed border-outline-variant p-10 text-center text-sm text-on-surface-variant">
                Sin citas programadas para hoy.
              </p>
            )}
          </Card>
          <Card className="p-3">
            <h2 className="font-bold">Carga por veterinario</h2>
            <p className="text-xs text-on-surface-variant">
              Distribución de citas y atenciones del día.
            </p>
            {workload.length ? (
              <HorizontalScroller className="mt-2" label="Carga del equipo veterinario">
                {workload.map((row) => (
                  <div
                    className="w-52 shrink-0 snap-start rounded-xl bg-surface-container-low p-3"
                    key={row.name}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <b className="truncate">{row.name}</b>
                      <span className="rounded-full bg-primary-fixed px-2 py-1 text-xs font-bold text-primary">
                        {row.total}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
                      <span className="rounded-lg bg-white p-2">
                        <b className="block text-base">{row.active}</b>Atendiendo
                      </span>
                      <span className="rounded-lg bg-white p-2">
                        <b className="block text-base">{row.completed}</b>Finalizadas
                      </span>
                    </div>
                  </div>
                ))}
              </HorizontalScroller>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed p-6 text-center text-sm text-on-surface-variant">
                Sin carga asignada hoy.
              </p>
            )}
          </Card>
        </section>
      ) : null}

      {!loading && view === "followup" && admin ? (
        <section className="mt-3 grid items-start gap-3 xl:grid-cols-2">
          <Card className="p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Vacunas próximas</h2>
                <p className="text-xs text-on-surface-variant">
                  Próximas dosis y refuerzos dentro de 30 días.
                </p>
              </div>
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                {summary.vaccinesDue || vaccines.length}
              </span>
            </div>
            {vaccinesLoading ? (
              <div className="h-28 animate-pulse rounded-xl bg-surface-container-low" />
            ) : vaccines.length ? (
              <HorizontalScroller label="Vacunas próximas">
                {vaccines.slice(0, 16).map((vaccine) => (
                  <Link
                    className="w-60 shrink-0 snap-start rounded-xl border border-outline-variant p-3 hover:border-primary"
                    key={vaccine.id}
                    to="/dashboard/pets"
                  >
                    <div className="flex items-center gap-2">
                      <PetAvatar pet={vaccine.pet} />
                      <div className="min-w-0">
                        <b className="block truncate">{vaccine.pet.name}</b>
                        <p className="truncate text-xs">{vaccine.name}</p>
                      </div>
                    </div>
                    <p className={`mt-2 rounded-lg px-2 py-1 text-xs font-bold ${vaccine.overdue ? "bg-error-container text-error" : "bg-amber-50 text-amber-900"}`}>
                      {vaccine.overdue ? "Vencida" : "Próxima"}: {vaccine.nextDueAt}
                    </p>
                  </Link>
                ))}
              </HorizontalScroller>
            ) : (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-on-surface-variant">
                No hay vacunas próximas registradas.
              </p>
            )}
          </Card>
          <Card className="p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Cobros pendientes</h2>
                <p className="text-xs text-on-surface-variant">
                  Información económica exclusiva de administración.
                </p>
              </div>
              <b className="text-lg text-primary">{money(pendingAmount)}</b>
            </div>
            {billing.length ? (
              <HorizontalScroller label="Cobros veterinarios pendientes">
                {billing.map((record) => (
                  <button
                    className="w-64 shrink-0 snap-start rounded-xl border border-outline-variant p-3 hover:border-primary"
                    key={record.id}
                    onClick={() => setPaymentRecord(record)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <b className="truncate">{record.pet.name}</b>
                      <b className="shrink-0 text-primary">{money(record.amount)}</b>
                    </div>
                    <p className="mt-1 truncate text-xs text-on-surface-variant">
                      {record.diagnosis || record.recordType} · {record.pet.owner.name}
                    </p>
                    <span className="mt-2 flex items-center gap-1 text-xs font-bold text-primary">
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                      Cobrar y emitir comprobante
                    </span>
                  </button>
                ))}
              </HorizontalScroller>
            ) : (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-on-surface-variant">
                No hay cobros pendientes.
              </p>
            )}
          </Card>
        </section>
      ) : null}

      <section className="mt-3">
        <h2 className="mb-2 text-sm font-bold">Accesos rápidos</h2>
        <HorizontalScroller label="Accesos rápidos veterinarios">
          {quickActions.map((action) => (
            <Link
              className="group flex w-[74vw] max-w-72 shrink-0 snap-start items-center gap-3 rounded-2xl border border-outline-variant bg-white p-3 transition hover:border-primary hover:shadow-md"
              key={action.to}
              to={action.to}
            >
              <span className="material-symbols-outlined grid size-12 shrink-0 place-items-center rounded-xl bg-primary-fixed text-2xl text-primary">
                {action.icon}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block">{action.label}</b>
                <small className="line-clamp-2 text-on-surface-variant">
                  {action.description}
                </small>
              </span>
              <span className="material-symbols-outlined text-primary transition group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>
          ))}
        </HorizontalScroller>
      </section>

      {selectedAppointment ? (
        <AppointmentDetail
          appointment={selectedAppointment}
          canManage={admin}
          canSeeBilling={admin}
          canStart={admin}
          onClose={() => setSelectedAppointment(null)}
          onSaved={async () => {
            setSelectedAppointment(null);
            await load();
          }}
        />
      ) : null}
      {paymentRecord && admin ? (
        <VeterinaryPaymentModal
          onClose={() => setPaymentRecord(null)}
          onPaid={load}
          record={paymentRecord}
        />
      ) : null}
    </DashboardShell>
  );
}
