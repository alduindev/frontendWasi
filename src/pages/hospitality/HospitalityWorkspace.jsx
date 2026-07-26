import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import ConfirmDialog from "../../components/molecules/ConfirmDialog";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import * as api from "../../services/hospitalityService";
import GuestFormModal from "./forms/GuestFormModal";
import ReservationWizard from "./forms/ReservationWizard";
import RoomFormModal from "./forms/RoomFormModal";
import RoomServiceOrder from "../operator/RoomServiceOrder";
import HotelCheckoutModal from "./HotelCheckoutModal";
import VisitReceiptsModal from "./VisitReceiptsModal";
import VisitDetailModal from "./VisitDetailModal";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import HospitalityStayNav from "./HospitalityStayNav";
import EntityAttachments from "../../components/attachments/EntityAttachments";
import { matchesEntitySearch } from "../../utils/entitySearch";

const titles = {
  rooms: "Habitaciones",
  guests: "Huéspedes",
  reservations: "Reservas",
  checkin: "Recepción",
};
const statusLabels = {
  available: "Disponible",
  occupied: "Ocupada",
  cleaning: "Limpieza",
  maintenance: "Mantenimiento",
  inactive: "Inactiva",
  confirmed: "Confirmada",
  checked_in: "Hospedado",
  checked_out: "Finalizada",
  cancelled: "Cancelada",
};
const reservationTabs = [
  { value: "", label: "Todas", icon: "calendar_month" },
  { value: "confirmed", label: "Confirmadas", icon: "event_available" },
  { value: "checked_in", label: "Hospedados", icon: "meeting_room" },
  { value: "checked_out", label: "Finalizadas", icon: "task_alt" },
  { value: "cancelled", label: "Canceladas", icon: "event_busy" },
];
function ChargeModal({ onClose, onSaved, reservation }) {
  return (
    <RoomServiceOrder
      initialOpen
      onClose={onClose}
      onSaved={onSaved}
      reservation={reservation}
    />
  );
}

function GuestDetailModal({ charges, guest, onClose, onEdit, reservations }) {
  const stays = reservations.filter(
    (reservation) => reservation.guestId === guest.id,
  );
  const stayIds = new Set(stays.map((stay) => stay.id));
  const guestCharges = charges.filter((charge) =>
    stayIds.has(charge.reservationId),
  );
  const lodgingTotal = stays
    .filter((stay) => stay.status !== "cancelled")
    .reduce((sum, stay) => sum + Number(stay.total), 0);
  const consumptionTotal = guestCharges.reduce(
    (sum, charge) => sum + Number(charge.total),
    0,
  );
  return (
    <Modal onClose={onClose} title={`Expediente · ${guest.name}`}>
      <div className="grid gap-5 p-4 sm:p-6">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-primary-fixed p-4">
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Estancias
            </p>
            <b className="mt-1 block text-2xl text-primary">{stays.length}</b>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Alojamiento
            </p>
            <b className="mt-1 block text-xl">S/ {lodgingTotal.toFixed(2)}</b>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Consumos
            </p>
            <b className="mt-1 block text-xl">
              S/ {consumptionTotal.toFixed(2)}
            </b>
          </div>
          <div className="rounded-2xl bg-surface-container-low p-4">
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Total registrado
            </p>
            <b className="mt-1 block text-xl text-primary">
              S/ {(lodgingTotal + consumptionTotal).toFixed(2)}
            </b>
          </div>
        </section>
        <section className="rounded-2xl border border-outline-variant p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold">Información personal</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                {guest.documentType} {guest.document} · Nacionalidad{" "}
                {guest.nationality}
              </p>
              <p className="text-sm text-on-surface-variant">
                {guest.phone || "Sin teléfono"} · {guest.email || "Sin correo"}
              </p>
              {guest.notes ? (
                <p className="mt-2 text-sm">{guest.notes}</p>
              ) : null}
            </div>
            <Button onClick={onEdit} variant="secondary">
              Editar ficha
            </Button>
          </div>
        </section>
        <EntityAttachments
          entityId={guest.id}
          entityType="hospitality_guest"
          title="Archivos del huésped"
        />
        <section>
          <h3 className="text-lg font-bold">Historial de habitaciones</h3>
          <p className="text-sm text-on-surface-variant">
            Estancias, estados y consumos asociados a este huésped.
          </p>
          <div className="mt-3 grid max-h-[46vh] gap-3 overflow-y-auto pr-2">
            {stays.map((stay) => {
              const items = guestCharges.filter(
                (charge) => charge.reservationId === stay.id,
              );
              const itemTotal = items.reduce(
                (sum, charge) => sum + Number(charge.total),
                0,
              );
              return (
                <Card className="p-4" key={stay.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <b>
                        Habitación {stay.room.number} · {stay.room.roomType}
                      </b>
                      <p className="text-sm text-on-surface-variant">
                        {stay.checkInDate} → {stay.checkOutDate}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {stay.adults} adulto(s) · {stay.children} niño(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                        {statusLabels[stay.status] || stay.status}
                      </span>
                      <p className="mt-2 font-bold">
                        S/ {Number(stay.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {items.length ? (
                    <div className="mt-3 rounded-xl bg-surface-container-low p-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span>Consumos</span>
                        <span>S/ {itemTotal.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex gap-2 overflow-x-auto">
                        {items.map((charge) => (
                          <span
                            className="shrink-0 rounded-full bg-white px-3 py-1 text-xs"
                            key={charge.id}
                          >
                            {charge.quantity}× {charge.itemName} · S/{" "}
                            {Number(charge.total).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-on-surface-variant">
                      Sin consumos registrados.
                    </p>
                  )}
                </Card>
              );
            })}
            {!stays.length ? (
              <EmptyState
                description="Este huésped todavía no tiene reservas asociadas."
                icon="hotel"
                title="Sin estancias"
              />
            ) : null}
          </div>
        </section>
      </div>
    </Modal>
  );
}

export default function HospitalityWorkspace() {
  const { moduleKey } = useParams();
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [charges, setCharges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        if (moduleKey === "rooms") {
          const [s, r] = await Promise.all([
            api.getHospitalitySummary(),
            api.getRooms(),
          ]);
          setSummary(s);
          setRooms(r);
        } else if (moduleKey === "guests") {
          const [g, v, c] = await Promise.all([
            api.getGuests(),
            api.getReservations(),
            api.getRoomCharges(),
          ]);
          setGuests(g);
          setReservations(v);
          setCharges(c);
        } else {
          const [r, g, v, c] = await Promise.all([
            api.getRooms(),
            api.getGuests(),
            api.getReservations(),
            moduleKey === "checkin"
              ? api.getRoomCharges()
              : Promise.resolve([]),
          ]);
          setRooms(r);
          setGuests(g);
          setReservations(v);
          setCharges(c);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [moduleKey],
  );

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(() => load(true), ["/hospitality", "/products"]);
  useEffect(() => {
    if (!["checkin", "guests"].includes(moduleKey)) return undefined;
    const sync = () => {
      if (document.visibilityState === "visible") load(true);
    };
    const timer = window.setInterval(sync, 3000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [load, moduleKey]);
  useEffect(() => {
    queueMicrotask(() => {
      setSearch("");
      setStatus("");
      setModal(null);
      setConfirm(null);
    });
  }, [moduleKey]);

  const done = () => {
    setModal(null);
    load();
  };
  const run = async (key, operation) => {
    setWorking(key);
    setError("");
    try {
      await operation();
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setWorking("");
    }
  };
  const normalized = search.trim().toLowerCase();
  const visibleRooms = useMemo(
    () =>
      rooms.filter(
        (x) =>
          (!normalized ||
            `${x.number} ${x.name} ${x.roomType}`
              .toLowerCase()
              .includes(normalized)) &&
          (!status || x.status === status),
      ),
    [normalized, rooms, status],
  );
  const visibleGuests = useMemo(
    () =>
      guests.filter((x) =>
        matchesEntitySearch(x, search, (item) => [
          item.name,
          item.document,
          item.phone,
          item.email,
        ]),
      ),
    [guests, search],
  );
  const visibleReservations = useMemo(
    () =>
      reservations.filter(
        (x) =>
          (!normalized ||
            `${x.guest.name} ${x.guest.document} ${x.room.number}`
              .toLowerCase()
              .includes(normalized)) &&
          (!status || x.status === status),
      ),
    [normalized, reservations, status],
  );
  const reservationCounts = useMemo(
    () =>
      Object.fromEntries(
        reservationTabs.map((tab) => [
          tab.value,
          tab.value
            ? reservations.filter((item) => item.status === tab.value).length
            : reservations.length,
        ]),
      ),
    [reservations],
  );
  const today = new Date().toLocaleDateString("en-CA");
  const action =
    moduleKey === "rooms"
      ? () => setModal({ type: "room" })
      : moduleKey === "guests"
        ? () => setModal({ type: "guest" })
        : moduleKey === "reservations"
          ? () => setModal({ type: "reservation" })
          : null;

  const headerAction =
    moduleKey === "checkin" ? (
      <Button
        icon="receipt_long"
        onClick={() => setModal({ type: "receipts" })}
      >
        Comprobantes
      </Button>
    ) : action ? (
      <Button icon="add" onClick={action}>
        Agregar
      </Button>
    ) : null;

  return (
    <DashboardShell
      action={headerAction}
      subtitle="Gestión hotelera conectada a tu empresa."
      title={titles[moduleKey] || "Hostal"}
    >
      {["reservations", "guests", "checkin"].includes(moduleKey) ? (
        <HospitalityStayNav />
      ) : null}
      {error ? (
        <div className="mb-4">
          <EmptyState
            action={{ children: "Reintentar", onClick: load }}
            description={error}
            icon="cloud_off"
            title="No se pudo completar la operación"
          />
        </div>
      ) : null}
      {loading ? <Card className="h-40 animate-pulse" /> : null}
      {!loading ? (
        <>
          {moduleKey === "rooms" && summary ? (
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Disponibles", summary.available, "bed"],
                ["Ocupadas", summary.occupied, "meeting_room"],
                ["Limpieza", summary.cleaning, "cleaning_services"],
                ["Mantenimiento", summary.maintenance, "home_repair_service"],
              ].map((x) => (
                <Card className="p-4" key={x[0]}>
                  <span className="material-symbols-outlined text-primary">
                    {x[2]}
                  </span>
                  <p className="mt-2 text-sm text-on-surface-variant">{x[0]}</p>
                  <b className="text-3xl">{x[1] || 0}</b>
                </Card>
              ))}
            </div>
          ) : null}
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-outline-variant bg-white p-3 sm:flex-row">
            <input
              className="min-h-11 flex-1 rounded-xl border border-outline-variant px-3"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                moduleKey === "guests"
                  ? "Buscar por nombre, DNI o celular"
                  : "Buscar por huésped, habitación o tipo"
              }
              value={search}
            />
            {moduleKey === "rooms" ? (
              <select
                className="min-h-11 rounded-xl border border-outline-variant px-3"
                onChange={(e) => setStatus(e.target.value)}
                value={status}
              >
                <option value="">Todos los estados</option>
                {[
                  "available",
                  "occupied",
                  "cleaning",
                  "maintenance",
                  "inactive",
                ].map((x) => (
                  <option key={x} value={x}>
                    {statusLabels[x]}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          {["reservations", "checkin"].includes(moduleKey) ? (
            <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-outline-variant bg-white p-2">
              {reservationTabs.map((tab) => (
                <button
                  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${status === tab.value ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-primary-fixed hover:text-primary"}`}
                  key={tab.value || "all"}
                  onClick={() => setStatus(tab.value)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    {tab.icon}
                  </span>
                  {tab.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${status === tab.value ? "bg-white/20" : "bg-surface-container-high"}`}
                  >
                    {reservationCounts[tab.value]}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {moduleKey === "rooms" ? (
            visibleRooms.length ? (
              <HorizontalScroller className="pb-5" label="Habitaciones">
                <>
                  {visibleRooms.map((x) => (
                    <button
                      className="w-[82vw] max-w-[19rem] shrink-0 snap-start text-left sm:w-64 xl:w-[18rem]"
                      key={x.id}
                      onClick={() => setModal({ type: "roomDetail", item: x })}
                      type="button"
                    >
                      <Card className="flex min-h-52 flex-col p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <b className="block truncate">
                              Habitación {x.number}
                            </b>
                            <p className="truncate text-xs text-on-surface-variant">
                              {x.name || "Sin nombre adicional"}
                            </p>
                          </div>
                          <span className="h-fit shrink-0 rounded-full bg-primary-fixed px-2 py-1 text-xs">
                            {statusLabels[x.status] || x.status}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <span className="rounded-xl bg-surface-container-low p-2">
                            Piso <b className="block text-base">{x.floor}</b>
                          </span>
                          <span className="rounded-xl bg-surface-container-low p-2">
                            Capacidad{" "}
                            <b className="block text-base">{x.capacity}</b>
                          </span>
                        </div>
                        <p className="mt-3 truncate text-sm">{x.roomType}</p>
                        <p className="mt-auto pt-3 text-xl font-bold text-primary">
                          S/ {Number(x.nightlyRate).toFixed(2)}
                        </p>
                      </Card>
                    </button>
                  ))}
                </>
              </HorizontalScroller>
            ) : (
              <EmptyState
                description="No hay habitaciones que coincidan con los filtros."
                icon="bed"
                title="Sin habitaciones"
              />
            )
          ) : null}
          {moduleKey === "guests" ? (
            <Card className="overflow-hidden">
              <div className="max-h-[64vh] overflow-auto">
                <div className="grid gap-2 p-2 md:hidden">
                  {visibleGuests.map((guest) => {
                    const stays = reservations.filter(
                      (reservation) => reservation.guestId === guest.id,
                    );
                    const latest = stays[0];
                    return (
                      <article
                        className="rounded-2xl border border-outline-variant bg-white p-3"
                        key={guest.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-bold">{guest.name}</h3>
                            <p className="truncate text-xs text-on-surface-variant">
                              {guest.documentType} {guest.document} · {guest.nationality}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-bold text-primary">
                            {stays.length} estancia{stays.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-surface-container-low p-2">
                            <dt className="font-bold uppercase text-on-surface-variant">Contacto</dt>
                            <dd className="mt-1 break-words">
                              {guest.phone || "Sin teléfono"}
                              <span className="block text-on-surface-variant">
                                {guest.email || "Sin correo"}
                              </span>
                            </dd>
                          </div>
                          <div className="rounded-xl bg-surface-container-low p-2">
                            <dt className="font-bold uppercase text-on-surface-variant">Última estancia</dt>
                            <dd className="mt-1">
                              {latest ? (
                                <>
                                  <b>Hab. {latest.room.number}</b>
                                  <span className="block text-on-surface-variant">
                                    {latest.checkInDate} · {statusLabels[latest.status]}
                                  </span>
                                </>
                              ) : (
                                "Sin estancias"
                              )}
                            </dd>
                          </div>
                        </dl>
                        {guest.notes ? (
                          <p className="mt-2 rounded-xl bg-surface-container-low p-2 text-xs text-on-surface-variant">
                            {guest.notes}
                          </p>
                        ) : null}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            onClick={() =>
                              setModal({ type: "guestDetail", item: guest })
                            }
                            variant="secondary"
                          >
                            Ver expediente
                          </Button>
                          <Button
                            onClick={() =>
                              setModal({ type: "guest", item: guest })
                            }
                            variant="ghost"
                          >
                            Editar
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="hidden md:block">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3">Huésped</th>
                      <th className="px-4 py-3">Documento</th>
                      <th className="px-4 py-3">Contacto</th>
                      <th className="px-4 py-3 text-center">Estancias</th>
                      <th className="px-4 py-3">Última habitación</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleGuests.map((guest) => {
                      const stays = reservations.filter(
                        (reservation) => reservation.guestId === guest.id,
                      );
                      const latest = stays[0];
                      return (
                        <tr
                          className="border-t border-outline-variant transition hover:bg-primary-fixed/40"
                          key={guest.id}
                        >
                          <td className="px-4 py-3">
                            <b>{guest.name}</b>
                            <p className="text-xs text-on-surface-variant">
                              {guest.nationality} ·{" "}
                              {guest.notes || "Sin observaciones"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            {guest.documentType} {guest.document}
                          </td>
                          <td className="px-4 py-3">
                            <p>{guest.phone || "Sin teléfono"}</p>
                            <p className="text-xs text-on-surface-variant">
                              {guest.email || "Sin correo"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="rounded-full bg-primary-fixed px-3 py-1 font-bold text-primary">
                              {stays.length}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {latest ? (
                              <>
                                <b>Hab. {latest.room.number}</b>
                                <p className="text-xs text-on-surface-variant">
                                  {latest.checkInDate} ·{" "}
                                  {statusLabels[latest.status]}
                                </p>
                              </>
                            ) : (
                              <span className="text-on-surface-variant">
                                Sin estancias
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() =>
                                  setModal({ type: "guestDetail", item: guest })
                                }
                                variant="secondary"
                              >
                                Ver expediente
                              </Button>
                              <Button
                                onClick={() =>
                                  setModal({ type: "guest", item: guest })
                                }
                                variant="ghost"
                              >
                                Editar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                {!visibleGuests.length ? (
                  <div className="p-4">
                    <EmptyState
                      description="Registra un huésped o cambia la búsqueda."
                      icon="person_search"
                      title="Sin huéspedes"
                    />
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}
          {["reservations", "checkin"].includes(moduleKey) ? (
            <div className="grid max-h-[62vh] gap-3 overflow-y-auto overscroll-contain pr-2">
              {visibleReservations.map((x) => {
                const stayCharges = charges.filter(
                  (c) => c.reservationId === x.id,
                );
                const consumption = stayCharges.reduce(
                  (sum, c) => sum + Number(c.total),
                  0,
                );
                return (
                  <Card className="p-4" key={x.id}>
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                      <div>
                        <b>{x.guest.name}</b>
                        <p className="text-sm">
                          Habitación {x.room.number} · {x.checkInDate} →{" "}
                          {x.checkOutDate}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {x.adults} adulto(s) · {x.children} niño(s) · Estancia
                          S/ {Number(x.total).toFixed(2)}
                        </p>
                        <span className="text-xs font-bold text-primary">
                          {statusLabels[x.status] || x.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          icon="visibility"
                          onClick={() =>
                            setModal({ type: "visitDetail", item: x })
                          }
                          variant="secondary"
                        >
                          Ver detalles
                        </Button>
                        {moduleKey === "reservations" &&
                        x.status === "confirmed" ? (
                          <>
                            <Button
                              onClick={() =>
                                setModal({ type: "reservation", item: x })
                              }
                              variant="secondary"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() =>
                                setConfirm({ type: "reservation", item: x })
                              }
                              variant="danger"
                            >
                              Cancelar reserva
                            </Button>
                          </>
                        ) : null}
                        {moduleKey === "checkin" && x.status === "confirmed" ? (
                          <Button
                            disabled={
                              working === x.id || x.checkInDate !== today
                            }
                            onClick={() => run(x.id, () => api.checkIn(x.id))}
                          >
                            {working === x.id
                              ? "Procesando..."
                              : x.checkInDate === today
                                ? "Check-in"
                                : `Ingreso ${new Date(`${x.checkInDate}T12:00:00`).toLocaleDateString("es-PE")}`}
                          </Button>
                        ) : null}
                        {moduleKey === "checkin" &&
                        x.status === "checked_in" ? (
                          <>
                            <Button
                              onClick={() =>
                                setModal({ type: "charge", item: x })
                              }
                              variant="secondary"
                            >
                              Agregar consumo
                            </Button>
                            <Button
                              disabled={working === x.id}
                              onClick={() =>
                                setConfirm({ type: "checkout", item: x })
                              }
                            >
                              {working === x.id ? "Procesando..." : "Check-out"}
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {stayCharges.length ? (
                      <div className="mt-3 rounded-xl bg-surface-container-low p-3">
                        <div className="flex justify-between text-sm font-bold">
                          <span>Consumos de habitación</span>
                          <span>S/ {consumption.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 flex gap-2 overflow-x-auto">
                          {stayCharges.map((c) => (
                            <span
                              className="shrink-0 rounded-full bg-white px-3 py-1 text-xs"
                              key={c.id}
                            >
                              {c.quantity}× {c.itemName} · S/{" "}
                              {Number(c.total).toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
              {!visibleReservations.length ? (
                <EmptyState
                  description="No hay reservas que coincidan con los filtros."
                  icon="event_busy"
                  title="Sin reservas"
                />
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
      {modal?.type === "room" ? (
        <RoomFormModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={done}
        />
      ) : null}
      {modal?.type === "roomDetail" ? (
        <Modal
          onClose={() => setModal(null)}
          title={`Habitación ${modal.item.number}`}
        >
          <div className="grid gap-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Tipo", modal.item.roomType],
                ["Piso", modal.item.floor],
                ["Capacidad", `${modal.item.capacity} personas`],
                ["Tarifa", `S/ ${Number(modal.item.nightlyRate).toFixed(2)}`],
              ].map(([label, value]) => (
                <div
                  className="rounded-xl bg-surface-container-low p-3"
                  key={label}
                >
                  <p className="text-xs text-on-surface-variant">{label}</p>
                  <b className="mt-1 block">{value}</b>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-outline-variant p-3">
              <p className="text-xs font-bold uppercase text-on-surface-variant">
                Estado actual
              </p>
              <p className="mt-1 font-bold text-primary">
                {statusLabels[modal.item.status] || modal.item.status}
              </p>
              <p className="mt-2 text-sm">
                {modal.item.notes || "Sin observaciones registradas."}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button onClick={() => setModal(null)} variant="secondary">
                Cerrar
              </Button>
              <Button
                icon="edit"
                onClick={() => setModal({ type: "room", item: modal.item })}
              >
                Editar habitación
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
      {modal?.type === "guest" ? (
        <GuestFormModal
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={done}
        />
      ) : null}
      {modal?.type === "guestDetail" ? (
        <GuestDetailModal
          charges={charges}
          guest={modal.item}
          onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "guest", item: modal.item })}
          reservations={reservations}
        />
      ) : null}
      {modal?.type === "reservation" ? (
        <ReservationWizard
          guests={guests}
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={done}
          rooms={rooms}
        />
      ) : null}
      {modal?.type === "charge" ? (
        <ChargeModal
          onClose={() => setModal(null)}
          onSaved={done}
          reservation={modal.item}
        />
      ) : null}
      {modal?.type === "visitDetail" ? (
        <VisitDetailModal
          charges={charges.filter(
            (item) => item.reservationId === modal.item.id,
          )}
          onAddCharge={() => setModal({ type: "charge", item: modal.item })}
          onCheckIn={() =>
            run(modal.item.id, () => api.checkIn(modal.item.id)).then(() =>
              setModal(null),
            )
          }
          onCheckout={() => {
            setModal(null);
            setConfirm({ type: "checkout", item: modal.item });
          }}
          onClose={() => setModal(null)}
          reservation={modal.item}
          working={working === modal.item.id}
        />
      ) : null}
      {modal?.type === "receipts" ? (
        <VisitReceiptsModal
          onClose={() => setModal(null)}
          reservations={reservations}
        />
      ) : null}
      {confirm?.type === "checkout" ? (
        <HotelCheckoutModal
          charges={charges.filter(
            (item) => item.reservationId === confirm.item.id,
          )}
          onClose={() => setConfirm(null)}
          onSaved={() => load(true)}
          reservation={confirm.item}
        />
      ) : null}
      <ConfirmDialog
        description={
          confirm?.type === "room"
            ? `Se eliminará la habitación ${confirm.item.number}. Si tiene reservas relacionadas, el servidor protegerá sus datos.`
            : `La reserva de ${confirm?.item.guest.name || ""} quedará cancelada y conservará su historial.`
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() =>
          confirm?.type === "room"
            ? run(confirm.item.id, () => api.deleteRoom(confirm.item.id))
            : run(confirm.item.id, () => api.cancelReservation(confirm.item.id))
        }
        open={Boolean(confirm && confirm.type !== "checkout")}
        title={
          confirm?.type === "room" ? "Eliminar habitación" : "Cancelar reserva"
        }
      />
    </DashboardShell>
  );
}
