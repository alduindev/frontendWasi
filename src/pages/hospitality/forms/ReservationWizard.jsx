import { useMemo, useState } from "react";
import Button from "../../../components/atoms/Button";
import HorizontalScroller from "../../../components/atoms/HorizontalScroller";
import Input from "../../../components/atoms/Input";
import Modal from "../../../components/molecules/Modal";
import {
  createReservation,
  updateReservation,
} from "../../../services/hospitalityService";
import GuestFormModal from "./GuestFormModal";

const field =
  "min-h-11 rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const roomStatus = {
  available: "Disponible",
  occupied: "Ocupada actualmente",
  cleaning: "En limpieza",
};

export default function ReservationWizard({
  defaultDate = "",
  guests: initialGuests,
  item,
  onClose,
  onSaved,
  rooms,
}) {
  const bookable = rooms.filter(
    (room) => !["maintenance", "inactive"].includes(room.status),
  );
  const [guests, setGuests] = useState(initialGuests);
  const [guestOpen, setGuestOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState(() => ({
    guestId: item?.guestId || guests[0]?.id || "",
    roomId: item?.roomId || "",
    checkInDate: item?.checkInDate || defaultDate,
    checkOutDate:
      item?.checkOutDate ||
      (defaultDate
        ? new Date(new Date(`${defaultDate}T12:00:00`).getTime() + 86400000)
            .toISOString()
            .slice(0, 10)
        : ""),
    adults: item?.adults || 1,
    children: item?.children || 0,
    source: item?.source || "direct",
    notes: item?.notes || "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const room = rooms.find((x) => x.id === data.roomId);
  const guest = guests.find((x) => x.id === data.guestId);
  const nights = useMemo(
    () =>
      data.checkInDate && data.checkOutDate
        ? Math.max(
            0,
            Math.ceil(
              (new Date(data.checkOutDate) - new Date(data.checkInDate)) /
                86400000,
            ),
          )
        : 0,
    [data.checkInDate, data.checkOutDate],
  );
  const total = nights * Number(room?.nightlyRate || 0);
  const exceedsCapacity = Boolean(
    room && data.adults + data.children > room.capacity,
  );
  const today = new Date().toISOString().slice(0, 10);
  const set = (key, value) => {
    setError("");
    setData((current) => ({ ...current, [key]: value }));
  };
  const validation =
    step === 1
      ? !data.guestId
        ? "Selecciona un huésped para continuar."
        : ""
      : step === 2
        ? !data.roomId
          ? "Selecciona una habitación."
          : !data.checkInDate || !data.checkOutDate
            ? "Completa las fechas de ingreso y salida."
            : nights < 1
              ? "La salida debe ser posterior al ingreso."
              : exceedsCapacity
                ? `La habitación admite un máximo de ${room.capacity} personas.`
                : ""
        : "";
  const next = () => {
    if (validation) {
      setError(validation);
      return;
    }
    setStep((current) => current + 1);
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...data, total };
      if (item) await updateReservation(item.id, payload);
      else await createReservation(payload);
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={item ? "Editar reserva" : "Nueva reserva"}>
      <div className="p-4 sm:p-6">
        <div className="mb-6 grid grid-cols-3 gap-2">
          {["Huésped", "Habitación y fechas", "Confirmación"].map(
            (label, index) => (
              <div key={label}>
                <div
                  className={`h-2 rounded-full ${step >= index + 1 ? "bg-primary" : "bg-surface-container-high"}`}
                />
                <p className="mt-1 text-center text-xs font-bold text-on-surface-variant">
                  {label}
                </p>
              </div>
            ),
          )}
        </div>
        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-error-container p-3 text-sm text-on-error-container">
            <span className="material-symbols-outlined text-lg">error</span>
            <p>{error}</p>
          </div>
        ) : null}
        {step === 1 ? (
          <section className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">¿Quién se hospedará?</h3>
                <p className="text-sm text-on-surface-variant">
                  Selecciona una ficha existente o registra al huésped sin salir
                  de la reserva.
                </p>
              </div>
              <Button
                icon="person_add"
                onClick={() => setGuestOpen(true)}
                type="button"
                variant="secondary"
              >
                Nuevo huésped
              </Button>
            </div>
            <label className="grid gap-1 text-sm font-bold">
              Huésped
              <select
                className={field}
                onChange={(event) => set("guestId", event.target.value)}
                value={data.guestId}
              >
                <option value="">Seleccionar huésped</option>
                {guests.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} · {option.documentType} {option.document}
                  </option>
                ))}
              </select>
            </label>
            {guest ? (
              <div className="rounded-2xl border border-primary/20 bg-primary-fixed p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined rounded-full bg-white p-2 text-primary">
                    person
                  </span>
                  <div>
                    <b>{guest.name}</b>
                    <p className="text-sm text-on-surface-variant">
                      {guest.phone || "Sin teléfono"} ·{" "}
                      {guest.email || "Sin correo"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {!guests.length ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                No hay huéspedes registrados. Usa “Nuevo huésped” para crear la
                primera ficha.
              </p>
            ) : null}
          </section>
        ) : null}
        {step === 2 ? (
          <section className="grid gap-5">
            <div>
              <h3 className="text-xl font-bold">Elige una habitación</h3>
              <p className="text-sm text-on-surface-variant">
                Desliza con las flechas o el dedo. La disponibilidad por fechas
                se confirma al guardar.
              </p>
            </div>
            {bookable.length ? (
              <HorizontalScroller label="Habitaciones disponibles para reservar">
                {bookable.map((option) => {
                  const active = data.roomId === option.id;
                  return (
                    <button
                      aria-pressed={active}
                      className={`min-w-[240px] snap-start rounded-2xl border p-4 text-left transition sm:min-w-[280px] ${active ? "border-primary bg-primary-fixed shadow-lg ring-2 ring-primary/20" : "border-outline-variant bg-white hover:-translate-y-0.5 hover:border-primary"}`}
                      key={option.id}
                      onClick={() => set("roomId", option.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="material-symbols-outlined text-3xl text-primary">
                          bed
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-on-surface-variant">
                          {roomStatus[option.status] || option.status}
                        </span>
                      </div>
                      <p className="mt-3 text-xl font-extrabold">
                        Habitación {option.number}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {option.roomType} · Piso {option.floor}
                      </p>
                      <div className="mt-3 flex items-end justify-between">
                        <span className="text-xs">
                          Hasta {option.capacity} personas
                        </span>
                        <b className="text-lg text-primary">
                          S/ {Number(option.nightlyRate).toFixed(2)}
                        </b>
                      </div>
                      {active ? (
                        <p className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                          <span className="material-symbols-outlined text-base">
                            check_circle
                          </span>
                          Seleccionada
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </HorizontalScroller>
            ) : (
              <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">
                No existen habitaciones habilitadas para reservar.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Ingreso"
                min={item ? undefined : today}
                onChange={(event) => set("checkInDate", event.target.value)}
                required
                type="date"
                value={data.checkInDate}
              />
              <Input
                label="Salida"
                min={data.checkInDate || today}
                onChange={(event) => set("checkOutDate", event.target.value)}
                required
                type="date"
                value={data.checkOutDate}
              />
              <Input
                label="Adultos"
                max={room?.capacity || 50}
                min="1"
                onChange={(event) => set("adults", Number(event.target.value))}
                required
                type="number"
                value={data.adults}
              />
              <Input
                label="Niños"
                max={room?.capacity || 50}
                min="0"
                onChange={(event) =>
                  set("children", Number(event.target.value))
                }
                required
                type="number"
                value={data.children}
              />
            </div>
            {room && data.checkInDate && data.checkOutDate && nights > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-4">
                <div>
                  <p className="text-sm font-bold">Resumen provisional</p>
                  <p className="text-xs text-on-surface-variant">
                    {nights} noche(s) · {data.adults + data.children}{" "}
                    huésped(es)
                  </p>
                </div>
                <b className="text-2xl text-primary">S/ {total.toFixed(2)}</b>
              </div>
            ) : null}
          </section>
        ) : null}
        {step === 3 ? (
          <section className="grid gap-4">
            <div>
              <h3 className="text-xl font-bold">Confirma la reserva</h3>
              <p className="text-sm text-on-surface-variant">
                Revisa toda la información antes de guardar.
              </p>
            </div>
            <div className="grid gap-3 rounded-2xl bg-surface-container-low p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="block text-xs text-on-surface-variant">
                  Huésped
                </span>
                <b>{guest?.name}</b>
              </p>
              <p>
                <span className="block text-xs text-on-surface-variant">
                  Habitación
                </span>
                <b>
                  {room?.number} · {room?.roomType}
                </b>
              </p>
              <p>
                <span className="block text-xs text-on-surface-variant">
                  Estancia
                </span>
                <b>
                  {data.checkInDate} → {data.checkOutDate}
                </b>
              </p>
              <p>
                <span className="block text-xs text-on-surface-variant">
                  Ocupantes
                </span>
                <b>
                  {data.adults} adulto(s) · {data.children} niño(s)
                </b>
              </p>
              <p className="sm:col-span-2">
                <span className="block text-xs text-on-surface-variant">
                  Total estimado
                </span>
                <b className="text-2xl text-primary">S/ {total.toFixed(2)}</b>
              </p>
            </div>
            <label className="grid gap-1 text-sm font-bold">
              Origen
              <select
                className={field}
                onChange={(event) => set("source", event.target.value)}
                value={data.source}
              >
                <option value="direct">Directa</option>
                <option value="phone">Teléfono</option>
                <option value="web">Web</option>
                <option value="agency">Agencia</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Observaciones
              <textarea
                className="min-h-20 rounded-xl border border-outline-variant p-3 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength="1000"
                onChange={(event) => set("notes", event.target.value)}
                placeholder="Preferencias, hora aproximada de llegada u otra indicación"
                value={data.notes}
              />
            </label>
          </section>
        ) : null}
        <div className="mt-6 flex flex-col-reverse justify-between gap-2 sm:flex-row">
          <Button
            disabled={saving}
            onClick={
              step === 1
                ? onClose
                : () => {
                    setError("");
                    setStep((current) => current - 1);
                  }
            }
            type="button"
            variant="secondary"
          >
            {step === 1 ? "Cancelar" : "Anterior"}
          </Button>
          {step < 3 ? (
            <Button
              disabled={saving || !bookable.length}
              onClick={next}
              type="button"
            >
              Continuar
            </Button>
          ) : (
            <Button disabled={saving} onClick={save} type="button">
              {saving
                ? "Guardando..."
                : item
                  ? "Guardar cambios"
                  : "Confirmar reserva"}
            </Button>
          )}
        </div>
        {guestOpen ? (
          <GuestFormModal
            onClose={() => setGuestOpen(false)}
            onSaved={(created) => {
              setGuests((current) => [...current, created]);
              set("guestId", created.id);
              setGuestOpen(false);
            }}
          />
        ) : null}
      </div>
    </Modal>
  );
}
