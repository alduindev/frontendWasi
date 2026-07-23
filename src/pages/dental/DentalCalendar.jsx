import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import DynamicForm from "../../forms/engine/DynamicForm";
import patientTemplate from "../../forms/templates/health/patient.template";
import { useAppConfig } from "../../context/appConfigStore";
import { useAuth } from "../../context/authStore";
import * as api from "../../services/healthService";
import DentalAttentionForm from "./DentalAttentionForm";
import { ChartForm, OdontogramModal } from "./DentalWorkspace";

const weekdays = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const filters = [
  { value: "all", label: "Todo", icon: "calendar_month" },
  { value: "scheduled", label: "Programadas", icon: "event" },
  { value: "confirmed", label: "Confirmadas", icon: "event_available" },
  { value: "in_attention", label: "En atención", icon: "dentistry" },
  { value: "completed", label: "Completadas", icon: "task_alt" },
  { value: "no_show", label: "No asistió", icon: "person_off" },
  { value: "cancelled", label: "Canceladas", icon: "event_busy" },
];
const statusMeta = {
  scheduled: {
    label: "Programada",
    icon: "event",
    dot: "bg-primary",
    tone: "bg-primary-fixed text-primary",
  },
  confirmed: {
    label: "Confirmada",
    icon: "event_available",
    dot: "bg-sky-500",
    tone: "bg-sky-100 text-sky-900",
  },
  in_attention: {
    label: "En atención",
    icon: "dentistry",
    dot: "bg-violet-500",
    tone: "bg-violet-100 text-violet-900",
  },
  completed: {
    label: "Completada",
    icon: "task_alt",
    dot: "bg-emerald-500",
    tone: "bg-emerald-100 text-emerald-900",
  },
  no_show: {
    label: "No asistió",
    icon: "person_off",
    dot: "bg-slate-500",
    tone: "bg-slate-100 text-slate-900",
  },
  cancelled: {
    label: "Cancelada",
    icon: "event_busy",
    dot: "bg-error",
    tone: "bg-error-container text-error",
  },
};
const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const monthTitle = (date) =>
  new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(
    date,
  );
const dayTitle = (value) =>
  new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00`));
const cls = "min-h-11 rounded-xl border border-outline-variant bg-surface px-3";

function AppointmentForm({
  date,
  patients,
  procedures,
  professionals,
  onClose,
  onNewPatient,
  onSaved,
}) {
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget),
      procedure = procedures.find(
        (item) => item.id === form.get("procedureId"),
      ),
      start = new Date(`${date}T${form.get("time")}`),
      end = new Date(
        start.getTime() + Number(procedure?.durationMinutes || 30) * 60000,
      );
    try {
      await api.createHealthAppointment({
        patientId: form.get("patientId"),
        professionalId: form.get("professionalId"),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        professionalName: "",
        specialty: procedure?.name || "Consulta odontológica",
        reason: form.get("reason") || procedure?.name || "Atención dental",
        notes: form.get("notes"),
      });
      onSaved();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={onClose} title="Agendar cita dental">
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
        <label className="grid gap-1">
          Paciente
          <select className={cls} name="patientId" required>
            <option value="">Selecciona un paciente</option>
            {patients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.lastName}, {item.firstName}
              </option>
            ))}
          </select>
          <button
            className="w-fit text-sm font-bold text-primary"
            onClick={onNewPatient}
            type="button"
          >
            + Registrar paciente nuevo
          </button>
        </label>
        <label className="grid gap-1">
          Servicio
          <select className={cls} name="procedureId" required>
            <option value="">Selecciona un servicio</option>
            {procedures.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.durationMinutes} min · S/{" "}
                {Number(item.price).toFixed(2)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Hora
          <input
            className={cls}
            defaultValue="09:00"
            name="time"
            required
            type="time"
          />
        </label>
        <label className="grid gap-1">
          Odontólogo
          <select className={cls} name="professionalId" required>
            <option value="">Selecciona un odontólogo</option>
            {professionals.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.site}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 sm:col-span-2">
          Motivo
          <input
            className={cls}
            name="reason"
            placeholder="Control, dolor, evaluación..."
          />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          Notas
          <textarea className={`${cls} min-h-20 py-2`} name="notes" />
        </label>
        {formError ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2">
            {formError}
          </p>
        ) : null}
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={
              saving ||
              !patients.length ||
              !procedures.length ||
              !professionals.length
            }
            type="submit"
          >
            {saving ? "Guardando..." : "Agendar cita"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AppointmentDetail({ appointment, canEdit, onClose, onSaved }) {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const [mode, setMode] = useState("detail");
  const [chart, setChart] = useState([]);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [attentionId, setAttentionId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const meta = statusMeta[appointment.status] || statusMeta.scheduled;
  const admin = ["admin", "admin_owner"].includes(user.role);
  const editAllowed =
    canEdit ??
    (admin || (config?.capabilities || []).includes("appointments.status"));
  const canRemind =
    admin || (config?.capabilities || []).includes("appointments.create");
  const saved = onSaved || onClose;
  const loadChart = async () => {
    setActionError("");
    try {
      setChart(await api.getDentalChart(appointment.patient.id));
      setMode("record");
    } catch (e) {
      setActionError(e.message);
    }
  };
  const change = async (status) => {
    setSaving(true);
    setActionError("");
    try {
      await api.updateHealthAppointment(appointment.id, { status });
      saved();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const beginAttention = async () => {
    setSaving(true);
    setActionError("");
    try {
      const attention = await api.startDentalAttention({
        patientId: appointment.patient.id,
        appointmentId: appointment.id,
        dentistId: appointment.professionalId || null,
        reason: appointment.reason,
      });
      setAttentionId(attention.id);
      setMode("attention");
    } catch (e) {
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const remind = async () => {
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
    setSaving(true);
    setActionError("");
    try {
      const result = await api.prepareAppointmentWhatsApp(appointment.id);
      if (popup) popup.location.href = result.url;
      else window.location.href = result.url;
    } catch (e) {
      if (popup) popup.close();
      setActionError(e.message);
    } finally {
      setSaving(false);
    }
  };
  if (mode === "record")
    return (
      <OdontogramModal
        admin={admin}
        chart={chart}
        close={onClose}
        exporting={exporting}
        onAttention={editAllowed ? beginAttention : null}
        onExport={async (format) => {
          setExporting(true);
          try {
            await api.exportDentalChart(appointment.patient.id, format);
          } finally {
            setExporting(false);
          }
        }}
        onTooth={
          editAllowed
            ? (tooth) => {
                setSelectedTooth(tooth);
                setMode("chart");
              }
            : null
        }
        patient={appointment.patient}
      />
    );
  if (mode === "chart")
    return (
      <ChartForm
        close={() => setMode("record")}
        done={async () => {
          setChart(await api.getDentalChart(appointment.patient.id));
          setMode("record");
        }}
        patientId={appointment.patient.id}
        tooth={selectedTooth}
      />
    );
  if (mode === "attention")
    return (
      <DentalAttentionForm
        attentionId={attentionId}
        onClose={() => setMode("record")}
        onSaved={() => {
          setAttentionId("");
          saved();
        }}
        patient={appointment.patient}
      />
    );
  return (
    <Modal onClose={onClose} title="Detalle de la cita">
      <div className="grid gap-4 p-5">
        <div className="flex gap-3 rounded-2xl bg-surface-container-low p-4">
          <span
            className={`material-symbols-outlined h-fit rounded-xl p-2 ${meta.tone}`}
          >
            {meta.icon}
          </span>
          <div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${meta.tone}`}
            >
              {meta.label}
            </span>
            <h3 className="mt-2 text-lg font-bold">
              {appointment.patient.firstName} {appointment.patient.lastName}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {appointment.specialty}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Info
            label="Fecha"
            value={dayTitle(iso(new Date(appointment.startsAt)))}
          />
          <Info
            label="Horario"
            value={`${new Date(appointment.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} – ${new Date(appointment.endsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`}
          />
          <Info
            label="Odontólogo"
            value={appointment.professionalName || "Por asignar"}
          />
          <Info label="Motivo" value={appointment.reason} />
        </div>
        <button
          className="flex min-h-14 items-center justify-between rounded-2xl border border-primary/30 bg-primary-fixed p-4 text-left text-primary"
          onClick={loadChart}
          type="button"
        >
          <span>
            <b className="block">Ver expediente clínico completo</b>
            <span className="text-xs">
              Historial, odontograma, tratamientos, citas y consumos
            </span>
          </span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        {appointment.notes ? (
          <p className="rounded-xl bg-surface-container-low p-3 text-sm">
            <b>Observaciones:</b> {appointment.notes}
          </p>
        ) : null}
        {actionError ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {actionError}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
          {canRemind &&
          ["scheduled", "confirmed"].includes(appointment.status) ? (
            <Button
              disabled={saving}
              icon="chat"
              onClick={remind}
              variant="secondary"
            >
              Recordar por WhatsApp
            </Button>
          ) : null}
          {editAllowed && appointment.status === "scheduled" ? (
            <Button
              disabled={saving}
              icon="event_available"
              onClick={() => change("confirmed")}
            >
              Confirmar asistencia
            </Button>
          ) : null}
          {editAllowed && appointment.status === "confirmed" ? (
            <Button
              disabled={saving}
              onClick={() => change("scheduled")}
              variant="secondary"
            >
              Volver a programada
            </Button>
          ) : null}
          {editAllowed &&
          ["scheduled", "confirmed"].includes(appointment.status) ? (
            <Button
              disabled={saving}
              onClick={() => change("cancelled")}
              variant="danger"
            >
              Cancelar cita
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-outline-variant p-3">
      <p className="text-xs font-bold uppercase text-on-surface-variant">
        {label}
      </p>
      <b className="capitalize">{value}</b>
    </div>
  );
}

function DayAgenda({ date, events, onEvent, onSchedule, past, canSchedule }) {
  const groups = filters
    .slice(1)
    .map((item) => ({
      ...item,
      events: events.filter((event) => event.status === item.value),
    }));
  const [active, setActive] = useState("scheduled");
  const group = groups.find((item) => item.value === active) || groups[0];
  return (
    <Card className="overflow-hidden">
      <div className="bg-primary p-4 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">
          Agenda del día
        </p>
        <h2 className="mt-1 text-xl font-bold capitalize">{dayTitle(date)}</h2>
        <p className="mt-2 text-sm text-white/80">
          {events.length} cita(s) ·{" "}
          {events.reduce(
            (sum, item) =>
              sum +
              Math.round(
                (new Date(item.endsAt) - new Date(item.startsAt)) / 60000,
              ),
            0,
          )}{" "}
          min programados
        </p>
      </div>
      <div className="border-b border-outline-variant px-2 pt-2">
        <HorizontalScroller className="gap-1 pb-2" label="Estados de la agenda">
          {groups.map((item) => (
            <button
              className={`min-w-[76px] snap-start rounded-xl p-2 text-center ${active === item.value ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed"}`}
              key={item.value}
              onClick={() => setActive(item.value)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {item.icon}
              </span>
              <b className="block text-lg leading-5">{item.events.length}</b>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </HorizontalScroller>
      </div>
      <div className="min-h-[360px] max-h-[52vh] overflow-y-auto p-3">
        <div className="mb-2 flex justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <span className="material-symbols-outlined text-primary">
              {group.icon}
            </span>
            {group.label}
          </h3>
          <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-bold text-primary">
            {group.events.length}
          </span>
        </div>
        <div className="grid gap-2">
          {group.events.map((item) => {
            const meta = statusMeta[item.status] || statusMeta.scheduled;
            return (
              <button
                className="rounded-xl border border-outline-variant p-3 text-left hover:border-primary hover:bg-primary-fixed/30"
                key={item.id}
                onClick={() => onEvent(item)}
                type="button"
              >
                <div className="flex gap-2">
                  <span
                    className={`material-symbols-outlined h-fit rounded-lg p-1.5 text-lg ${meta.tone}`}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <b className="truncate">
                        {item.patient.firstName} {item.patient.lastName}
                      </b>
                      <span className="shrink-0 text-xs font-bold">
                        {new Date(item.startsAt).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {item.specialty} · {item.professionalName}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!group.events.length ? (
          <div className="grid min-h-[285px] place-items-center">
            <EmptyState
              description={`No hay citas ${group.label.toLowerCase()} para este día.`}
              icon={group.icon}
              title={`Sin citas ${group.label.toLowerCase()}`}
            />
          </div>
        ) : null}
      </div>
      {canSchedule ? (
        <div className="border-t border-outline-variant p-3">
          <Button
            className="w-full"
            disabled={past}
            icon="event_available"
            onClick={onSchedule}
          >
            {past ? "Fecha histórica" : "Agendar para este día"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export default function DentalCalendar({ operator = false }) {
  const now = new Date(),
    today = iso(now);
  const { config } = useAppConfig();
  const [cursor, setCursor] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [selected, setSelected] = useState(today);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canSchedule =
    !operator || (config?.capabilities || []).includes("appointments.create");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, p, s, d] = await Promise.all([
        api.getHealthAppointments(),
        api.getPatients(),
        api.getDentalProcedures(),
        api.getDentalProfessionals(),
      ]);
      setAppointments(a);
      setPatients(p);
      setProcedures(s);
      setProfessionals(d);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const filtered = useMemo(
    () =>
      appointments.filter((item) => filter === "all" || item.status === filter),
    [appointments, filter],
  );
  const grouped = useMemo(
    () => Object.groupBy(filtered, (item) => iso(new Date(item.startsAt))),
    [filtered],
  );
  const selectedEvents = grouped[selected] || [];
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1),
    last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
    leading = (first.getDay() + 6) % 7,
    cells = Array.from({ length: 42 }, (_, index) => {
      const day = index - leading + 1;
      return {
        date: new Date(cursor.getFullYear(), cursor.getMonth(), day),
        current: day >= 1 && day <= last.getDate(),
      };
    });
  const move = (offset) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    setCursor(next);
    setSelected(iso(next));
  };
  const selectDay = (date) => {
    setSelected(iso(date));
    if (date.getMonth() !== cursor.getMonth())
      setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
  };
  const openSchedule = () => setModal({ type: "appointment" });
  const Shell = operator ? OperatorShell : DashboardShell;
  return (
    <Shell
      action={
        <div className="flex gap-2">
          <Button
            icon="today"
            onClick={() => {
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelected(today);
            }}
            variant="secondary"
          >
            Hoy
          </Button>
          {canSchedule ? (
            <Button
              disabled={selected < today}
              icon="event_available"
              onClick={openSchedule}
            >
              Agendar cita
            </Button>
          ) : null}
        </div>
      }
      subtitle="Selecciona un día, revisa las atenciones y agenda pacientes sin salir del calendario."
      title="Calendario odontológico"
    >
      {error ? (
        <div className="mb-4">
          <EmptyState
            action={{ children: "Reintentar", onClick: load }}
            description={error}
            icon="cloud_off"
            title="No se pudo cargar el calendario"
          />
        </div>
      ) : null}
      <div className="grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-20">
          <DayAgenda
            canSchedule={canSchedule}
            date={selected}
            events={selectedEvents}
            onEvent={(item) => setModal({ type: "detail", item })}
            onSchedule={openSchedule}
            past={selected < today}
          />
        </aside>
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-outline-variant p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1">
              <button
                aria-label="Mes anterior"
                className="material-symbols-outlined rounded-full p-2 hover:bg-primary-fixed"
                onClick={() => move(-1)}
                type="button"
              >
                chevron_left
              </button>
              <h2 className="min-w-44 text-center text-lg font-bold capitalize">
                {monthTitle(cursor)}
              </h2>
              <button
                aria-label="Mes siguiente"
                className="material-symbols-outlined rounded-full p-2 hover:bg-primary-fixed"
                onClick={() => move(1)}
                type="button"
              >
                chevron_right
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {filters.map((item) => (
                <button
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold ${filter === item.value ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"}`}
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-[32rem] animate-pulse bg-surface-container-low" />
          ) : (
            <>
              <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low">
                {weekdays.map((day) => (
                  <div
                    className="p-2 text-center text-[10px] font-bold text-on-surface-variant"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((cell) => {
                  const key = iso(cell.date),
                    events = grouped[key] || [];
                  return (
                    <button
                      className={`min-h-20 border-b border-r border-outline-variant p-1.5 text-left transition hover:bg-primary-fixed/40 sm:min-h-24 ${!cell.current ? "bg-surface-container-low/50 text-outline" : ""} ${key === today ? "ring-2 ring-inset ring-primary" : ""} ${key === selected ? "bg-primary-fixed" : ""}`}
                      key={key}
                      onClick={() => selectDay(cell.date)}
                      type="button"
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${key === selected ? "bg-primary text-white" : ""}`}
                      >
                        {cell.date.getDate()}
                      </span>
                      <div className="mt-1 grid gap-0.5">
                        {events.slice(0, 3).map((item) => (
                          <span
                            className="flex items-center gap-1 truncate text-[9px]"
                            key={item.id}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${(statusMeta[item.status] || statusMeta.scheduled).dot}`}
                            />
                            <span className="truncate">
                              {item.patient.firstName} ·{" "}
                              {new Date(item.startsAt).toLocaleTimeString(
                                "es-PE",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </span>
                        ))}
                        {events.length > 3 ? (
                          <span className="text-[9px] font-bold text-primary">
                            +{events.length - 3} más
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
      {modal?.type === "appointment" ? (
        <AppointmentForm
          date={selected}
          onClose={() => setModal(null)}
          onNewPatient={() => setModal({ type: "patient" })}
          onSaved={() => {
            setModal(null);
            load();
          }}
          patients={patients}
          procedures={procedures}
          professionals={professionals}
        />
      ) : null}
      {modal?.type === "patient" ? (
        <Modal
          onClose={() => setModal({ type: "appointment" })}
          title="Registrar paciente"
        >
          <DynamicForm
            onCancel={() => setModal({ type: "appointment" })}
            onSubmit={async (values) => {
              await api.createPatient(values);
              await load();
              setModal({ type: "appointment" });
            }}
            submitLabel="Registrar y continuar"
            template={patientTemplate}
          />
        </Modal>
      ) : null}
      {modal?.type === "detail" ? (
        <AppointmentDetail
          appointment={modal.item}
          onClose={() => setModal(null)}
        />
      ) : null}
    </Shell>
  );
}
