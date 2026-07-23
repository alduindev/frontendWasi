import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import {
  checkIn,
  getGuests,
  getHospitalityCalendar,
  getReservations,
  getRoomCharges,
  getRooms,
} from "../../services/hospitalityService";
import ReservationWizard from "./forms/ReservationWizard";
import VisitDetailModal from "./VisitDetailModal";
import RoomServiceOrder from "../operator/RoomServiceOrder";
import HotelCheckoutModal from "./HotelCheckoutModal";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import HospitalityStayNav from "./HospitalityStayNav";

const weekdays = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const filters = [
  { value: "all", label: "Todo", icon: "calendar_month" },
  { value: "arrival", label: "Entradas", icon: "login" },
  { value: "departure", label: "Salidas", icon: "logout" },
  { value: "charge", label: "Consumos", icon: "room_service" },
  { value: "housekeeping", label: "Limpieza", icon: "cleaning_services" },
  { value: "services", label: "Servicios", icon: "assignment" },
];
const typeMeta = {
  arrival: {
    label: "Entrada",
    icon: "login",
    dot: "bg-primary",
    tone: "bg-primary-fixed text-primary",
  },
  departure: {
    label: "Salida",
    icon: "logout",
    dot: "bg-orange-500",
    tone: "bg-orange-100 text-orange-900",
  },
  charge: {
    label: "Consumo",
    icon: "room_service",
    dot: "bg-emerald-500",
    tone: "bg-emerald-100 text-emerald-900",
  },
  housekeeping_requested: {
    label: "Limpieza solicitada",
    icon: "add_task",
    dot: "bg-amber-400",
    tone: "bg-amber-100 text-amber-900",
  },
  housekeeping_started: {
    label: "Limpieza iniciada",
    icon: "cleaning_services",
    dot: "bg-amber-600",
    tone: "bg-amber-100 text-amber-900",
  },
  housekeeping_completed: {
    label: "Limpieza completada",
    icon: "task_alt",
    dot: "bg-sky-500",
    tone: "bg-sky-100 text-sky-900",
  },
  work_order_requested: {
    label: "Servicio solicitado",
    icon: "assignment_add",
    dot: "bg-violet-500",
    tone: "bg-violet-100 text-violet-900",
  },
  work_order_started: {
    label: "Servicio iniciado",
    icon: "play_circle",
    dot: "bg-indigo-500",
    tone: "bg-indigo-100 text-indigo-900",
  },
  work_order_completed: {
    label: "Servicio completado",
    icon: "verified",
    dot: "bg-teal-500",
    tone: "bg-teal-100 text-teal-900",
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
const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

function EventDetailModal({ event, onClose, onVisit }) {
  const meta = typeMeta[event.type] || typeMeta.arrival;
  return (
    <Modal onClose={onClose} title="Detalle del movimiento">
      <div className="grid gap-4 p-4 sm:p-6">
        <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4">
          <span
            className={`material-symbols-outlined rounded-xl p-2 ${meta.tone}`}
          >
            {meta.icon}
          </span>
          <div>
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${meta.tone}`}
            >
              {meta.label}
            </span>
            <h3 className="mt-2 text-lg font-bold">{event.title}</h3>
            <p className="text-sm text-on-surface-variant">
              {event.description}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="Fecha" value={dayTitle(event.date)} />
          <Info
            label="Hora"
            value={
              event.occurredAt
                ? new Date(event.occurredAt).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Programado"
            }
          />
          {event.guest ? (
            <Info label="Huésped" value={event.guest.name} />
          ) : null}
          {event.room ? (
            <Info label="Habitación" value={event.room.number} />
          ) : null}
          {event.checkInDate ? (
            <Info
              label="Estadía"
              value={`${event.checkInDate} → ${event.checkOutDate}`}
            />
          ) : null}
          {event.adults != null ? (
            <Info
              label="Ocupantes"
              value={`${event.adults} adulto(s) · ${event.children} niño(s)`}
            />
          ) : null}
          {event.amount != null ? (
            <Info label="Importe" value={money(event.amount)} />
          ) : null}
          {event.createdBy ? (
            <Info label="Registrado por" value={event.createdBy.name} />
          ) : null}
          {event.durationMinutes != null ? (
            <Info label="Duración" value={`${event.durationMinutes} min`} />
          ) : null}
        </div>
        {event.notes ? (
          <p className="rounded-xl bg-surface-container-low p-3 text-sm">
            <b>Observaciones:</b> {event.notes}
          </p>
        ) : null}
        {event.damageReport ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">
            <b>Daños:</b> {event.damageReport}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
          {onVisit ? (
            <Button icon="visibility" onClick={onVisit}>
              Ver visita completa
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

const agendaGroups = [
  {
    key: "arrival",
    label: "Entradas",
    icon: "login",
    matches: (event) => event.type === "arrival",
  },
  {
    key: "departure",
    label: "Salidas",
    icon: "logout",
    matches: (event) => event.type === "departure",
  },
  {
    key: "charge",
    label: "Consumos",
    icon: "room_service",
    matches: (event) => event.type === "charge",
  },
  {
    key: "housekeeping",
    label: "Limpieza",
    icon: "cleaning_services",
    matches: (event) => event.type.startsWith("housekeeping_"),
  },
  {
    key: "services",
    label: "Servicios",
    icon: "assignment",
    matches: (event) => event.type.startsWith("work_order_"),
  },
];

function DayAgenda({ date, events, onEvent, onSchedule, past }) {
  const groups = agendaGroups.map((group) => ({
    ...group,
    events: events.filter(group.matches),
  }));
  const [activeKey, setActiveKey] = useState("arrival");
  const activeGroup =
    groups.find((group) => group.key === activeKey) || groups[0];
  const consumptionTotal = groups
    .find((group) => group.key === "charge")
    .events.reduce((sum, event) => sum + Number(event.amount || 0), 0);
  return (
    <Card className="hospitality-day-agenda flex h-[calc(100dvh-21rem)] min-h-[30rem] max-h-[42rem] flex-col overflow-hidden">
      <div className="shrink-0 bg-primary p-3 text-white">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
          Agenda del día
        </p>
        <h2 className="mt-0.5 text-lg font-bold capitalize">
          {dayTitle(date)}
        </h2>
        <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
          <span>{events.length} movimiento(s)</span>
          {consumptionTotal ? (
            <>
              <span>·</span>
              <b>{money(consumptionTotal)} en consumos</b>
            </>
          ) : null}
        </div>
      </div>
      <div className="border-b border-outline-variant px-2 pt-2">
        <HorizontalScroller
          className="gap-1 pb-2"
          label="Categorías de la agenda"
        >
          {groups.map((group) => (
            <button
              aria-pressed={activeKey === group.key}
              className={`min-w-[76px] snap-start rounded-xl p-2 text-center transition ${activeKey === group.key ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed hover:text-primary"}`}
              key={group.key}
              onClick={() => setActiveKey(group.key)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {group.icon}
              </span>
              <b className="block text-lg leading-5">{group.events.length}</b>
              <span className="text-[10px]">{group.label}</span>
            </button>
          ))}
        </HorizontalScroller>
      </div>
      <div className="min-h-[360px] max-h-[52vh] overflow-y-auto p-3">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <span className="material-symbols-outlined text-lg text-primary">
                {activeGroup.icon}
              </span>
              {activeGroup.label}
            </h3>
            <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-bold text-primary">
              {activeGroup.events.length}
            </span>
          </div>
          <div className="grid gap-2">
            {activeGroup.events.map((event) => {
              const meta = typeMeta[event.type] || typeMeta.arrival;
              const timeLabel = event.occurredAt
                ? new Date(event.occurredAt).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Programado";
              return (
                <button
                  className="group rounded-xl border border-outline-variant p-3 text-left transition hover:border-primary hover:bg-primary-fixed/30"
                  key={event.id}
                  onClick={() => onEvent(event)}
                  type="button"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`material-symbols-outlined rounded-lg p-1.5 text-lg ${meta.tone}`}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <b className="text-sm">
                          {event.room
                            ? `Habitación ${event.room.number}`
                            : event.title}
                        </b>
                        <span className="shrink-0 text-[10px] font-bold text-on-surface-variant">
                          {timeLabel}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {event.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {event.guest ? (
                          <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[10px]">
                            {event.guest.name}
                          </span>
                        ) : null}
                        {event.amount != null ? (
                          <b
                            className={`text-xs ${event.type === "charge" ? "text-emerald-700" : "text-primary"}`}
                          >
                            {event.type === "charge" ? "Consumo " : "Estancia "}
                            {money(event.amount)}
                          </b>
                        ) : null}
                        <span className="ml-auto material-symbols-outlined text-base text-primary opacity-0 transition group-hover:opacity-100">
                          chevron_right
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {!activeGroup.events.length ? (
            <div className="grid min-h-[290px] place-items-center">
              <EmptyState
                description={`No hay ${activeGroup.label.toLowerCase()} registradas para este día.`}
                icon={activeGroup.icon}
                title={`Sin ${activeGroup.label.toLowerCase()}`}
              />
            </div>
          ) : null}
        </section>
      </div>
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
    </Card>
  );
}

export default function HospitalityCalendar() {
  const now = new Date();
  const today = iso(now);
  const [cursor, setCursor] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [data, setData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [charges, setCharges] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [working, setWorking] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(
    async (silent = false) => {
      const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      if (!silent) setLoading(true);
      setError("");
      try {
        const [calendar, roomItems, guestItems, visits, chargeItems] =
          await Promise.all([
            getHospitalityCalendar(iso(start), iso(end)),
            getRooms(),
            getGuests(),
            getReservations(),
            getRoomCharges(),
          ]);
        setData(calendar);
        setRooms(roomItems);
        setGuests(guestItems);
        setReservations(visits);
        setCharges(chargeItems);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [cursor],
  );
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(() => load(true), ["/hospitality", "/products"]);
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, 10000);
    return () => clearInterval(id);
  }, [load]);
  const filtered = useMemo(
    () =>
      (data?.events || []).filter(
        (event) =>
          filter === "all" ||
          event.type === filter ||
          (filter === "housekeeping" &&
            event.type.startsWith("housekeeping_")) ||
          (filter === "services" && event.type.startsWith("work_order_")),
      ),
    [data, filter],
  );
  const grouped = useMemo(
    () => Object.groupBy(filtered, (event) => event.date),
    [filtered],
  );
  const selectedEvents = grouped[selectedDate] || [];
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const leading = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - leading + 1;
    return {
      date: new Date(cursor.getFullYear(), cursor.getMonth(), day),
      current: day >= 1 && day <= last.getDate(),
    };
  });
  const selectDay = (date) => {
    setSelectedDate(iso(date));
    if (date.getMonth() !== cursor.getMonth())
      setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
  };
  const move = (offset) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    setCursor(next);
    setSelectedDate(iso(next));
  };
  const openVisit = (referenceId) => {
    const reservation = reservations.find((item) => item.id === referenceId);
    if (reservation) setModal({ type: "visit", item: reservation });
  };
  const done = () => {
    setModal(null);
    load();
  };
  const runCheckIn = async (reservation) => {
    setWorking(reservation.id);
    setError("");
    try {
      await checkIn(reservation.id);
      setModal(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking("");
    }
  };

  return (
    <DashboardShell
      action={
        <div className="flex gap-2">
          <Button
            icon="today"
            onClick={() => {
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDate(today);
            }}
            variant="secondary"
          >
            Hoy
          </Button>
          <Button
            disabled={selectedDate < today}
            icon="event_available"
            onClick={() => setModal({ type: "reservation" })}
          >
            Agendar visita
          </Button>
        </div>
      }
      subtitle="Reservas, huéspedes, ingresos, consumos y salidas desde un solo lugar."
      title="Agenda y estancias"
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
      <HospitalityStayNav />
      <div className="grid items-start gap-3 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="grid gap-4 xl:sticky xl:top-20">
          <DayAgenda
            date={selectedDate}
            events={selectedEvents}
            onEvent={(item) => setModal({ type: "event", item })}
            onSchedule={() => setModal({ type: "reservation" })}
            past={selectedDate < today}
          />
        </aside>
        <Card className="flex h-[calc(100dvh-21rem)] min-h-[30rem] max-h-[42rem] min-w-0 flex-col overflow-hidden">
          <div className="flex shrink-0 flex-col gap-2 border-b border-outline-variant p-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1">
              <button
                aria-label="Mes anterior"
                className="material-symbols-outlined rounded-full p-1.5 hover:bg-primary-fixed"
                onClick={() => move(-1)}
                type="button"
              >
                chevron_left
              </button>
              <h2 className="min-w-40 text-center text-base font-bold capitalize">
                {monthTitle(cursor)}
              </h2>
              <button
                aria-label="Mes siguiente"
                className="material-symbols-outlined rounded-full p-1.5 hover:bg-primary-fixed"
                onClick={() => move(1)}
                type="button"
              >
                chevron_right
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {filters.map((item) => (
                <button
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold ${filter === item.value ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"}`}
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="min-h-0 flex-1 animate-pulse bg-surface-container-low" />
          ) : (
            <>
              <div className="grid shrink-0 grid-cols-7 border-b border-outline-variant bg-surface-container-low">
                {weekdays.map((day) => (
                  <div
                    className="p-1.5 text-center text-[10px] font-bold text-on-surface-variant"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
                {cells.map((cell) => {
                  const key = iso(cell.date);
                  const events = grouped[key] || [];
                  return (
                    <button
                      className={`min-h-0 overflow-hidden border-b border-r border-outline-variant p-1 text-left transition hover:bg-primary-fixed/40 ${!cell.current ? "bg-surface-container-low/50 text-outline" : ""} ${key === today ? "ring-2 ring-inset ring-primary" : ""} ${key === selectedDate ? "bg-primary-fixed" : ""}`}
                      key={key}
                      onClick={() => selectDay(cell.date)}
                      type="button"
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${key === selectedDate ? "bg-primary text-white" : ""}`}
                      >
                        {cell.date.getDate()}
                      </span>
                      <div className="mt-0.5 grid gap-0.5">
                        {events.slice(0, 3).map((event) => (
                          <span
                            className="flex items-center gap-1 truncate text-[9px]"
                            key={event.id}
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${(typeMeta[event.type] || typeMeta.arrival).dot}`}
                            />
                            <span className="truncate">
                              {event.guest?.name ||
                                (typeMeta[event.type] || typeMeta.arrival)
                                  .label}
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
      {modal?.type === "reservation" ? (
        <ReservationWizard
          defaultDate={selectedDate}
          guests={guests}
          onClose={() => setModal(null)}
          onSaved={done}
          rooms={rooms}
        />
      ) : null}
      {modal?.type === "event" ? (
        <EventDetailModal
          event={modal.item}
          onClose={() => setModal(null)}
          onVisit={
            modal.item.referenceId &&
            ["arrival", "departure"].includes(modal.item.type)
              ? () => openVisit(modal.item.referenceId)
              : null
          }
        />
      ) : null}
      {modal?.type === "visit" ? (
        <VisitDetailModal
          charges={charges.filter(
            (item) => item.reservationId === modal.item.id,
          )}
          onAddCharge={() => setModal({ type: "charge", item: modal.item })}
          onCheckIn={() => runCheckIn(modal.item)}
          onCheckout={() => setModal({ type: "checkout", item: modal.item })}
          onClose={() => setModal(null)}
          reservation={modal.item}
          working={working === modal.item.id}
        />
      ) : null}
      {modal?.type === "charge" ? (
        <RoomServiceOrder
          initialOpen
          onClose={() => setModal(null)}
          onSaved={done}
          reservation={modal.item}
        />
      ) : null}
      {modal?.type === "checkout" ? (
        <HotelCheckoutModal
          charges={charges.filter(
            (item) => item.reservationId === modal.item.id,
          )}
          onClose={() => setModal(null)}
          onSaved={() => load(true)}
          reservation={modal.item}
        />
      ) : null}
    </DashboardShell>
  );
}
