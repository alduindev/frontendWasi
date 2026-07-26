import { useCallback, useMemo, useState, useEffect } from "react";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import EntityAttachments from "../../components/attachments/EntityAttachments";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import {
  DayAgendaPanel,
  MonthCalendarGrid,
} from "../../components/scheduling/MonthlyAgenda";
import {
  buildMonthCells,
  calendarDateKey,
  dayLabel,
} from "../../components/scheduling/calendarUtils";
import { useAppConfig } from "../../context/appConfigStore";
import { useAuth } from "../../context/authStore";
import * as api from "../../services/veterinaryService";
import VeterinaryPaymentModal from "./VeterinaryPaymentModal";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";
import {
  dateKeyInLima,
  dateTimeInLima,
  timeInLima,
  veterinaryStatusMeta,
} from "./veterinaryPresentation";

const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary";

const filters = [
  { value: "all", label: "Todo", icon: "calendar_month" },
  { value: "scheduled", label: "Programadas", icon: "event" },
  { value: "confirmed", label: "Confirmadas", icon: "event_available" },
  { value: "in_attention", label: "En atención", icon: "pets" },
  { value: "completed", label: "Finalizadas", icon: "task_alt" },
  { value: "no_show", label: "No asistió", icon: "person_off" },
  { value: "cancelled", label: "Canceladas", icon: "event_busy" },
];

const statusMeta = veterinaryStatusMeta;

function toUtc(date, time) {
  return new Date(`${date}T${time}:00-05:00`).toISOString();
}

function AppointmentForm({
  date,
  onClose,
  onSaved,
  pets,
  professionals,
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [petId, setPetId] = useState("");
  const save = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const startsAt = toUtc(date, form.get("starts_at"));
    const endsAt = toUtc(date, form.get("ends_at"));
    try {
      if (new Date(endsAt) <= new Date(startsAt))
        throw new Error("La hora de fin debe ser posterior al inicio.");
      if (new Date(startsAt) < new Date())
        throw new Error("No puedes programar una cita en una hora pasada.");
      await api.createVeterinaryAppointment({
        pet_id: form.get("pet_id"),
        professional_id: form.get("professional_id") || null,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: form.get("reason"),
        notes: form.get("notes"),
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={onClose} title="Agendar cita veterinaria">
      <form className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5" onSubmit={save}>
        <div className="rounded-xl bg-primary-fixed p-3 sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            Fecha seleccionada
          </p>
          <b className="capitalize">{dayLabel(date)}</b>
        </div>
        <EntitySearchSelect
          getLabel={(pet) => pet.name}
          getMeta={(pet) =>
            [pet.owner?.name, pet.owner?.document, pet.owner?.phone]
              .filter(Boolean)
              .join(" · ")
          }
          getSearchValues={(pet) => [
            pet.name,
            pet.code,
            pet.owner?.name,
            pet.owner?.document,
            pet.owner?.phone,
            pet.owner?.email,
          ]}
          items={pets}
          label="Mascota o propietario"
          name="pet_id"
          onChange={setPetId}
          placeholder="Buscar mascota, propietario, DNI o celular"
          required
          value={petId}
        />
        <label className="grid gap-1">
          Profesional
          <select className={field} name="professional_id">
            <option value="">Por asignar</option>
            {professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name} · {professional.site}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Inicio
          <input
            className={field}
            defaultValue="09:00"
            name="starts_at"
            required
            type="time"
          />
        </label>
        <label className="grid gap-1">
          Fin
          <input
            className={field}
            defaultValue="09:30"
            name="ends_at"
            required
            type="time"
          />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          Motivo
          <input
            className={field}
            maxLength="300"
            name="reason"
            placeholder="Consulta, vacuna, control, estética..."
            required
          />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          Indicaciones
          <textarea
            className={`${field} min-h-20 py-2`}
            maxLength="2000"
            name="notes"
          />
        </label>
        {error ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={saving || !pets.length}
            type="submit"
          >
            {saving ? "Guardando..." : "Agendar cita"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-outline-variant p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <b className="block break-words">{value}</b>
    </div>
  );
}

function RecordView({ appointment, canSeeBilling, onBack }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("summary");
  const [paymentRecord, setPaymentRecord] = useState(null);
  useEffect(() => {
    let active = true;
    api
      .getPetRecord(appointment.pet.id)
      .then((value) => {
        if (active) setRecord(value);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [appointment.pet.id]);
  if (error)
    return (
      <div className="p-4">
        <EmptyState
          action={{ children: "Volver", onClick: onBack }}
          description={error}
          icon="cloud_off"
          title="No se pudo cargar el expediente"
        />
      </div>
    );
  if (!record)
    return <div className="h-72 animate-pulse bg-surface-container-low" />;
  const pet = record.pet;
  const tabs = [
    ["summary", "pets", "Resumen"],
    ["history", "clinical_notes", "Historia"],
    ["vaccines", "vaccines", "Vacunas"],
    ["appointments", "calendar_month", "Citas"],
    ["documents", "folder", "Archivos"],
  ];
  return (
    <div className="flex max-h-[76svh] min-h-0 flex-col overflow-hidden p-3 sm:p-4">
      <div className="flex shrink-0 items-center gap-3 rounded-2xl bg-primary-fixed p-3">
        {pet.photoUrl ? (
          <img
            alt={`Foto de ${pet.name}`}
            className="size-12 shrink-0 rounded-xl object-cover"
            src={pet.photoUrl}
          />
        ) : (
          <span className="material-symbols-outlined grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-white">
            pets
          </span>
        )}
        <div className="min-w-0 flex-1">
          <b className="block truncate text-lg">{pet.name}</b>
          <p className="truncate text-sm text-on-surface-variant">
            {pet.code} · {pet.owner.name}
          </p>
        </div>
        <Button onClick={onBack} type="button" variant="secondary">
          Volver
        </Button>
      </div>
      <div className="my-3 shrink-0 rounded-xl border border-outline-variant p-1">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(([value, icon, label]) => (
            <button
              className={`flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-bold ${tab === value ? "bg-primary text-white" : "hover:bg-primary-fixed"}`}
              key={value}
              onClick={() => setTab(value)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tab === "summary" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Especie y raza" value={`${pet.species} · ${pet.breed || "Sin raza registrada"}`} />
            <Info label="Peso" value={`${pet.weightKg || 0} kg`} />
            <Info label="Alergias" value={pet.allergies || "Sin alergias registradas"} />
            <Info label="Condiciones" value={pet.conditions || "Sin condiciones registradas"} />
            <div className="rounded-xl border border-outline-variant p-3 sm:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                Propietario
              </p>
              <b>{pet.owner.name}</b>
              <p className="text-sm text-on-surface-variant">
                DNI {pet.owner.document} · {pet.owner.phone || "Sin teléfono"}
              </p>
            </div>
          </div>
        ) : null}
        {tab === "history" ? (
          <div className="grid gap-2">
            {record.records.map((item) => (
              <Card className="p-3" key={item.id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Badge>{item.recordType}</Badge>
                    <b className="ml-2">{item.diagnosis || "Atención clínica"}</b>
                    <p className="mt-1 text-sm">{item.treatment}</p>
                    <small className="text-on-surface-variant">
                      {dateTimeInLima(item.createdAt)} · {item.professional?.name || "Equipo veterinario"}
                    </small>
                  </div>
                  {canSeeBilling ? (
                    <div className="text-right">
                      <b>S/ {Number(item.amount || 0).toFixed(2)}</b>
                      <p className="text-xs">
                        {item.paymentStatus === "paid" ? "Pagado" : "Por cobrar"}
                      </p>
                      {item.paymentStatus === "pending" && Number(item.amount) > 0 ? (
                        <Button
                          className="mt-2"
                          icon="receipt_long"
                          onClick={() =>
                            setPaymentRecord({ ...item, pet: record.pet })
                          }
                          type="button"
                        >
                          Cobrar
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
            {!record.records.length ? (
              <EmptyState
                description="Las consultas y tratamientos aparecerán aquí."
                icon="clinical_notes"
                title="Sin atenciones"
              />
            ) : null}
          </div>
        ) : null}
        {tab === "vaccines" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {record.vaccines.map((item) => (
              <Card className="p-3" key={item.id}>
                <b>{item.name}</b>
                <p className="text-sm">Aplicada: {item.appliedAt}</p>
                <p className="text-sm text-primary">
                  Próxima: {item.nextDueAt || "No indicada"}
                </p>
              </Card>
            ))}
            {!record.vaccines.length ? (
              <EmptyState
                description="Aún no hay vacunas vinculadas."
                icon="vaccines"
                title="Sin vacunas"
              />
            ) : null}
          </div>
        ) : null}
        {tab === "appointments" ? (
          <div className="grid gap-2">
            {record.appointments.map((item) => (
              <Card className="p-3" key={item.id}>
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <b>{item.reason}</b>
                    <p className="text-sm">
                      {dateTimeInLima(item.startsAt)} · {item.professional?.name || "Por asignar"}
                    </p>
                  </div>
                  <Badge>{statusMeta[item.status]?.label || item.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
        {tab === "documents" ? (
          <EntityAttachments
            entityId={pet.id}
            entityType="veterinary_pet"
            legacyItems={record.documents}
            title="Archivos de la mascota"
          />
        ) : null}
      </div>
      {paymentRecord ? (
        <VeterinaryPaymentModal
          onClose={() => setPaymentRecord(null)}
          onPaid={(response) => {
            const updated = response.record || response;
            setRecord((current) => ({
              ...current,
              records: current.records.map((item) =>
                item.id === updated.id
                  ? { ...item, ...updated, paymentStatus: "paid" }
                  : item,
              ),
            }));
          }}
          record={paymentRecord}
        />
      ) : null}
    </div>
  );
}

export function AppointmentDetail({
  appointment,
  canManage,
  canSeeBilling,
  canStart,
  onClose,
  onSaved,
}) {
  const [recordOpen, setRecordOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const meta = statusMeta[appointment.status] || statusMeta.scheduled;
  const change = async (status) => {
    setSaving(true);
    setError("");
    try {
      await api.updateVeterinaryAppointment(appointment.id, status);
      await onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      contentClassName="min-h-0 overflow-hidden"
      dialogClassName={recordOpen ? "sm:max-w-5xl" : "sm:max-w-2xl"}
      onClose={onClose}
      title={recordOpen ? `Expediente · ${appointment.pet.name}` : "Detalle de la cita"}
    >
      {recordOpen ? (
        <RecordView
          appointment={appointment}
          canSeeBilling={canSeeBilling}
          onBack={() => setRecordOpen(false)}
        />
      ) : (
        <div className="grid gap-4 p-4 sm:p-5">
          <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4">
            {appointment.pet.photoUrl ? (
              <img
                alt={`Foto de ${appointment.pet.name}`}
                className="size-14 shrink-0 rounded-xl object-cover"
                src={appointment.pet.photoUrl}
              />
            ) : (
              <span className={`material-symbols-outlined grid size-14 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
                {meta.icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${meta.tone}`}>
                {meta.label}
              </span>
              <h3 className="mt-2 truncate text-xl font-bold">
                {appointment.pet.name} · {appointment.pet.owner.name}
              </h3>
              <p className="text-sm text-on-surface-variant">
                {appointment.reason}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info
              label="Fecha"
              value={dayLabel(dateKeyInLima(appointment.startsAt))}
            />
            <Info
              label="Horario"
              value={`${timeInLima(appointment.startsAt)} – ${timeInLima(appointment.endsAt)}`}
            />
            <Info
              label="Profesional"
              value={appointment.professional?.name || "Por asignar"}
            />
            <Info
              label="Propietario"
              value={`${appointment.pet.owner.name} · ${appointment.pet.owner.phone || "Sin teléfono"}`}
            />
          </div>
          <button
            className="flex min-h-14 items-center justify-between rounded-2xl border border-primary/30 bg-primary-fixed p-4 text-left text-primary transition hover:border-primary"
            onClick={() => setRecordOpen(true)}
            type="button"
          >
            <span>
              <b className="block">Abrir expediente completo</b>
              <span className="text-xs">
                Historia, vacunas, citas y archivos de la mascota
              </span>
            </span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          {appointment.notes ? (
            <p className="rounded-xl bg-surface-container-low p-3 text-sm">
              <b>Indicaciones:</b> {appointment.notes}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-error-container p-3 text-sm text-error">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={onClose} type="button" variant="secondary">
              Cerrar
            </Button>
            {canManage && appointment.status === "scheduled" ? (
              <Button
                disabled={saving}
                icon="event_available"
                onClick={() => change("confirmed")}
              >
                Confirmar
              </Button>
            ) : null}
            {canStart && appointment.status === "confirmed" ? (
              <Button
                disabled={saving}
                icon="play_arrow"
                onClick={() => change("in_attention")}
              >
                Iniciar atención
              </Button>
            ) : null}
            {canManage && ["scheduled", "confirmed"].includes(appointment.status) ? (
              <Button
                disabled={saving}
                onClick={() => change("no_show")}
                variant="secondary"
              >
                No asistió
              </Button>
            ) : null}
            {canManage && ["scheduled", "confirmed"].includes(appointment.status) ? (
              <Button
                disabled={saving}
                onClick={() => change("cancelled")}
                variant="danger"
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function VeterinaryCalendar({ operator = false }) {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const today = dateKeyInLima(new Date());
  const [year, month] = today.split("-").map(Number);
  const [cursor, setCursor] = useState(() => new Date(year, month - 1, 1, 12));
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const admin = ["admin", "admin_owner"].includes(user.role);
  const functions = new Set(
    config?.user?.functions?.map((item) => item.code) || [],
  );
  const capabilities = new Set(config?.capabilities || []);
  const reception = functions.has("veterinary-reception");
  const clinical =
    functions.has("veterinarian") || functions.has("veterinary-assistant");
  const canSchedule = admin || reception;
  const canManage = admin || reception;
  const canStart = (admin || clinical) && (admin || capabilities.has("pets.edit"));
  const canSeeBilling = admin || reception;
  const canViewPast = admin;

  const range = useMemo(() => {
    const cells = buildMonthCells(cursor);
    const first = calendarDateKey(cells[0].date);
    const last = calendarDateKey(cells.at(-1).date);
    return {
      start: new Date(`${first}T00:00:00-05:00`).toISOString(),
      end: new Date(`${last}T23:59:59-05:00`).toISOString(),
    };
  }, [cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appointmentItems, petItems, professionalItems] =
        await Promise.all([
          api.getVeterinaryAppointments(range.start, range.end),
          api.getPets(),
          api.getVeterinaryProfessionals(),
        ]);
      setAppointments(appointmentItems);
      setPets(petItems);
      setProfessionals(professionalItems);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [range.end, range.start]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const filtered = useMemo(
    () =>
      appointments.filter(
        (appointment) => filter === "all" || appointment.status === filter,
      ),
    [appointments, filter],
  );
  const eventsByDate = useMemo(
    () =>
      filtered.reduce((groups, appointment) => {
        const key = dateKeyInLima(appointment.startsAt);
        groups[key] = [...(groups[key] || []), appointment];
        return groups;
      }, {}),
    [filtered],
  );
  const selectedEvents = eventsByDate[selectedDate] || [];

  const moveMonth = (offset) => {
    const next = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + offset,
      1,
      12,
    );
    const nextKey = calendarDateKey(next);
    if (!canViewPast && nextKey.slice(0, 7) < today.slice(0, 7)) return;
    setCursor(next);
    setSelectedDate(
      nextKey.slice(0, 7) === today.slice(0, 7) ? today : nextKey,
    );
  };

  const selectDay = (date) => {
    const key = calendarDateKey(date);
    if (!canViewPast && key < today) return;
    setSelectedDate(key);
    if (date.getMonth() !== cursor.getMonth())
      setCursor(new Date(date.getFullYear(), date.getMonth(), 1, 12));
  };

  const goToday = () => {
    setCursor(new Date(year, month - 1, 1, 12));
    setSelectedDate(today);
  };

  const saved = async () => {
    setModal(null);
    await load();
  };
  const Shell = operator ? OperatorShell : DashboardShell;
  return (
    <Shell
      action={
        <div className="flex flex-wrap gap-2">
          <Button icon="today" onClick={goToday} variant="secondary">
            Hoy
          </Button>
          {canSchedule ? (
            <Button
              disabled={selectedDate < today}
              icon="event_available"
              onClick={() => setModal({ type: "appointment" })}
            >
              Agendar cita
            </Button>
          ) : null}
        </div>
      }
      subtitle={
        operator
          ? "Revisa tus citas asignadas y abre el expediente sin salir de la agenda."
          : "Organiza mascotas, horarios y profesionales desde un calendario conectado al expediente."
      }
      title="Calendario veterinario"
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
          <DayAgendaPanel
            canSchedule={canSchedule}
            date={selectedDate}
            events={selectedEvents}
            filters={filters}
            onEvent={(appointment) =>
              setModal({ type: "detail", appointment })
            }
            onSchedule={() => setModal({ type: "appointment" })}
            past={selectedDate < today}
            renderEvent={(appointment) => {
              const meta = statusMeta[appointment.status] || statusMeta.scheduled;
              return (
                <div className="flex min-w-0 gap-2">
                  <span className={`material-symbols-outlined h-fit rounded-lg p-1.5 text-lg ${meta.tone}`}>
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <b className="truncate">{appointment.pet.name}</b>
                      <span className="shrink-0 text-xs font-bold">
                        {timeInLima(appointment.startsAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-on-surface-variant">
                      {appointment.reason} · {appointment.professional?.name || "Por asignar"}
                    </p>
                  </div>
                </div>
              );
            }}
          />
        </aside>
        <MonthCalendarGrid
          canViewPast={canViewPast}
          cursor={cursor}
          eventsByDate={eventsByDate}
          filters={filters}
          getEventLabel={(appointment) =>
            `${appointment.pet.name} · ${timeInLima(appointment.startsAt)}`
          }
          loading={loading}
          onFilter={setFilter}
          onMoveMonth={moveMonth}
          onSelectDate={selectDay}
          selectedDate={selectedDate}
          selectedFilter={filter}
          statusMeta={statusMeta}
          today={today}
        />
      </div>
      {modal?.type === "appointment" ? (
        <AppointmentForm
          date={selectedDate}
          onClose={() => setModal(null)}
          onSaved={saved}
          pets={pets}
          professionals={professionals}
        />
      ) : null}
      {modal?.type === "detail" ? (
        <AppointmentDetail
          appointment={modal.appointment}
          canManage={canManage}
          canSeeBilling={canSeeBilling}
          canStart={canStart}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      ) : null}
    </Shell>
  );
}
