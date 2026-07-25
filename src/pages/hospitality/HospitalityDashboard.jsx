import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../../components/atoms/Badge";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import {
  getHospitalitySummary,
  getReservations,
  getRooms,
} from "../../services/hospitalityService";
import { getProducts } from "../../services/inventoryService";
import { getAttendanceHistory } from "../../services/attendanceService";

const roomTone = {
  available: "success",
  occupied: "info",
  cleaning: "warning",
  maintenance: "danger",
  inactive: "neutral",
};
const roomLabel = {
  available: "Disponible",
  occupied: "Ocupada",
  cleaning: "Limpieza",
  maintenance: "Mantenimiento",
  inactive: "Inactiva",
};
const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const actions = [
  {
    to: "/dashboard/reservations",
    icon: "event_available",
    art: "calendar_month",
    title: "Nueva reserva",
    text: "Consulta disponibilidad, selecciona la habitación adecuada y registra las fechas de la estancia.",
    hint: "La reserva quedará conectada con recepción, huésped y cobro.",
    gradient: "from-indigo-500 to-violet-400",
  },
  {
    to: "/dashboard/checkin",
    icon: "meeting_room",
    art: "door_open",
    title: "Recepción",
    text: "Gestiona llegadas, check-in, consumos durante la estancia y salidas programadas del día.",
    hint: "Controla el recorrido completo del huésped sin cambiar de módulo.",
    gradient: "from-sky-500 to-cyan-400",
  },
  {
    to: "/dashboard/guests",
    icon: "person_add",
    art: "luggage",
    title: "Registrar huésped",
    text: "Crea o consulta la ficha de un visitante con sus datos de contacto, documento y estadías.",
    hint: "Su información se reutilizará en futuras reservas.",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    to: "/dashboard/team",
    icon: "badge",
    art: "groups",
    title: "Equipo y asistencia",
    text: "Revisa colaboradores, funciones, horarios, ingresos, salidas, jornadas cerradas y tardanzas.",
    hint: "Administra accesos y seguimiento operativo desde un solo lugar.",
    gradient: "from-fuchsia-500 to-pink-400",
  },
];
function Metric({ icon, label, note, value }) {
  return (
    <Card className="relative h-full min-h-32 overflow-hidden p-3.5">
      <div className="absolute -right-6 -top-6 size-16 rounded-full bg-primary-fixed opacity-60" />
      <span className="material-symbols-outlined relative text-xl text-primary">
        {icon}
      </span>
      <p className="relative mt-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="relative mt-1 text-2xl font-extrabold">{value}</p>
      <p className="relative mt-1 truncate text-[11px] text-on-surface-variant">
        {note}
      </p>
    </Card>
  );
}

export default function HospitalityDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null),
    [rooms, setRooms] = useState([]),
    [reservations, setReservations] = useState([]),
    [products, setProducts] = useState([]),
    [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [tab, setTab] = useState("operation"),
    [detail, setDetail] = useState(null),
    [selectedFloor, setSelectedFloor] = useState("1"),
    [quickOpen, setQuickOpen] = useState(false);
  useEffect(() => {
    let active = true;
    const end = new Date().toISOString().slice(0, 10),
      start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    Promise.all([
      getHospitalitySummary(),
      getRooms(),
      getReservations(),
      getProducts(),
      getAttendanceHistory(start, end),
    ])
      .then(([s, r, v, p, a]) => {
        if (active) {
          setSummary(s);
          setRooms(r);
          setReservations(v);
          setProducts(p);
          setAttendance(a);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const today = new Date().toISOString().slice(0, 10),
    occupancy = summary?.rooms
      ? Math.round((summary.occupied / summary.rooms) * 100)
      : 0;
  const movements = useMemo(
    () =>
      reservations.filter(
        (x) => x.checkInDate === today || x.checkOutDate === today,
      ),
    [reservations, today],
  );
  const grouped = useMemo(() => Object.groupBy(rooms, (x) => x.floor), [rooms]);
  const floors = Object.keys(grouped),
    floorRooms = grouped[selectedFloor] || grouped[floors[0]] || [];
  const inventory = useMemo(
    () =>
      products.reduce(
        (v, p) => ({
          cost: v.cost + Number(p.cost || 0) * Number(p.stock || 0),
          sale: v.sale + Number(p.price || 0) * Number(p.stock || 0),
        }),
        { cost: 0, sale: 0 },
      ),
    [products],
  );
  const late = attendance.filter((x) => x.record.late).length,
    completed = attendance.filter(
      (x) => x.record.status === "completed",
    ).length;
  return (
    <DashboardShell
      subtitle="Control de ocupación, finanzas y operación diaria."
      title="Panel del hostal"
    >
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((x) => (
            <Card className="h-32 animate-pulse" key={x} />
          ))}
        </div>
      ) : null}
      {error ? (
        <EmptyState
          description={error}
          icon="cloud_off"
          title="No se pudo cargar el panel"
        />
      ) : null}
      {!loading && !error ? (
        <>
          <div className="mx-auto mb-3 grid w-full max-w-2xl grid-cols-3 rounded-2xl border border-outline-variant bg-white p-1">
            <button
              className={`min-h-10 rounded-xl px-2 text-sm font-bold ${tab === "operation" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant"}`}
              onClick={() => setTab("operation")}
              type="button"
            >
              Operación
            </button>
            <button
              className={`min-h-10 rounded-xl px-2 text-sm font-bold ${tab === "admin" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant"}`}
              onClick={() => setTab("admin")}
              type="button"
            >
              Administración
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
          <HorizontalScroller
            className="xl:justify-center"
            label={
              tab === "operation"
                ? "Indicadores operativos"
                : "Indicadores administrativos"
            }
          >
            {(tab === "operation"
              ? [
                  {
                    icon: "hotel",
                    label: "Ocupación",
                    note: `${summary?.occupied || 0} de ${summary?.rooms || 0} habitaciones`,
                    value: `${occupancy}%`,
                  },
                  {
                    icon: "bed",
                    label: "Disponibles",
                    note: "Listas para asignar",
                    value: summary?.available || 0,
                  },
                  {
                    icon: "login",
                    label: "Llegadas hoy",
                    note: "Reservas confirmadas",
                    value: summary?.arrivalsToday || 0,
                  },
                  {
                    icon: "logout",
                    label: "Salidas hoy",
                    note: "Estancias por finalizar",
                    value: summary?.departuresToday || 0,
                  },
                ]
              : [
                  {
                    icon: "inventory_2",
                    label: "Costo inventario",
                    note: `${products.length} productos registrados`,
                    value: money(inventory.cost),
                  },
                  {
                    icon: "trending_up",
                    label: "Ganancia potencial",
                    note: "Precio de venta menos costo",
                    value: money(Math.max(0, inventory.sale - inventory.cost)),
                  },
                  {
                    icon: "task_alt",
                    label: "Jornadas completas",
                    note: "Últimos 30 días",
                    value: completed,
                  },
                  {
                    icon: "schedule",
                    label: "Tardanzas",
                    note: "Últimos 30 días",
                    value: late,
                  },
                ]
            ).map((item) => (
              <button
                className="w-[78vw] max-w-[18rem] shrink-0 snap-start text-left sm:w-64 xl:w-[17rem] 2xl:w-[18rem]"
                key={item.label}
                onClick={() => setDetail(item)}
                type="button"
              >
                <Metric {...item} />
              </button>
            ))}
          </HorizontalScroller>
          <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)]">
            <Card className="min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-3.5">
                <div>
                  <h2 className="text-lg font-bold">Estado de habitaciones</h2>
                  <p className="text-xs text-on-surface-variant">
                    Selecciona un piso y abre una habitación.
                  </p>
                </div>
                <Link
                  className="rounded-xl border px-3 py-2 text-sm font-bold text-primary"
                  to="/dashboard/rooms"
                >
                  Administrar
                </Link>
              </div>
              <div className="p-3">
                <div className="mb-3 flex gap-2 overflow-x-auto">
                  {floors.map((floor) => (
                    <button
                      className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${selectedFloor === floor ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"}`}
                      key={floor}
                      onClick={() => setSelectedFloor(floor)}
                      type="button"
                    >
                      Piso {floor}
                    </button>
                  ))}
                </div>
                <HorizontalScroller
                  label={`Habitaciones del piso ${selectedFloor}`}
                >
                  {floorRooms.map((room) => (
                    <button
                      className="w-44 shrink-0 snap-start text-left sm:w-48"
                      key={room.id}
                      onClick={() => setDetail(room)}
                      type="button"
                    >
                      <div className="rounded-2xl border border-outline-variant p-3 transition hover:border-primary hover:shadow-md">
                        <div className="flex justify-between gap-2">
                          <span className="material-symbols-outlined text-primary">
                            bed
                          </span>
                          <Badge tone={roomTone[room.status]}>
                            {roomLabel[room.status] || room.status}
                          </Badge>
                        </div>
                        <b className="mt-3 block text-lg">{room.number}</b>
                        <p className="truncate text-xs text-on-surface-variant">
                          {room.roomType} · {room.capacity} pers.
                        </p>
                      </div>
                    </button>
                  ))}
                </HorizontalScroller>
              </div>
            </Card>
            <div className="grid content-start gap-4">
              <Card className="p-3.5">
                <h2 className="font-bold">Movimiento de hoy</h2>
                <div className="mt-3 grid max-h-36 gap-2 overflow-y-auto">
                  {movements.slice(0, 6).map((x) => (
                    <Link
                      className="rounded-xl bg-surface-container-low p-2.5"
                      key={x.id}
                      to="/dashboard/checkin"
                    >
                      <b className="text-sm">{x.guest.name}</b>
                      <p className="text-xs">
                        Hab. {x.room.number} ·{" "}
                        {x.checkInDate === today ? "Llega hoy" : "Sale hoy"}
                      </p>
                    </Link>
                  ))}
                  {!movements.length ? (
                    <p className="rounded-xl border border-dashed p-3 text-sm">
                      Sin movimientos.
                    </p>
                  ) : null}
                </div>
              </Card>
              <Card className="p-3.5">
                <h2 className="font-bold">Atención operativa</h2>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-amber-50 p-2.5 text-sm">
                    Limpieza
                    <b className="block text-xl">{summary?.cleaning || 0}</b>
                  </div>
                  <div className="rounded-xl bg-red-50 p-2.5 text-sm">
                    Mantenimiento
                    <b className="block text-xl">{summary?.maintenance || 0}</b>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </>
      ) : null}
      {detail ? (
        <Modal
          onClose={() => setDetail(null)}
          title={detail.number ? `Habitación ${detail.number}` : detail.label}
        >
          <div className="grid gap-4 p-5 text-center">
            <span className="material-symbols-outlined mx-auto grid size-14 place-items-center rounded-2xl bg-primary-fixed text-3xl text-primary">
              {detail.number ? "bed" : detail.icon}
            </span>
            <b className="text-3xl">
              {detail.number ? money(detail.nightlyRate) : detail.value}
            </b>
            <p className="text-on-surface-variant">
              {detail.number
                ? `${detail.roomType} · Piso ${detail.floor} · ${detail.capacity} persona(s) · ${roomLabel[detail.status] || detail.status}`
                : detail.note}
            </p>
            {detail.number ? (
              <Link
                className="rounded-xl bg-primary px-4 py-3 font-bold text-white"
                onClick={() => setDetail(null)}
                to="/dashboard/rooms"
              >
                Administrar habitación
              </Link>
            ) : null}
          </div>
        </Modal>
      ) : null}
      {quickOpen ? (
        <Modal
          dialogClassName="sm:max-w-3xl"
          onClose={() => setQuickOpen(false)}
          title="Acciones rápidas"
        >
          <div className="p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">¿Qué deseas hacer?</p>
                <p className="text-xs text-on-surface-variant">
                  Selecciona una acción para continuar.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                4 accesos
              </span>
            </div>
            <HorizontalScroller
              className="gap-3 snap-mandatory"
              label="Acciones rápidas hoteleras"
              pageStep
            >
              {actions.map((action, index) => (
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
                        Acceso rápido hotelero
                      </span>
                      <h3 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
                        {action.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                        {action.text}
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
