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
  AgendaFilterBar,
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
import VeterinaryAttentionForm from "./VeterinaryAttentionForm";
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

function timeAfter(time, minutes) {
  const [hour, minute] = String(time || "00:00").split(":").map(Number);
  const total = Math.min(
    23 * 60 + 59,
    Math.max(0, hour * 60 + minute + Number(minutes || 0)),
  );
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const appointmentSteps = [
  { icon: "pets", label: "Mascota" },
  { icon: "event_available", label: "Horario" },
  { icon: "task_alt", label: "Confirmar" },
];

function AppointmentForm({
  date,
  onClose,
  onSaved,
  pets,
  professionals,
  services = [],
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    petId: "",
    professionalId: "",
    serviceId: "",
    startsAt: "09:00",
    endsAt: "09:30",
    reason: "",
    notes: "",
  });
  const pet = pets.find((item) => String(item.id) === String(draft.petId));
  const professional = professionals.find(
    (item) => String(item.id) === String(draft.professionalId),
  );
  const service = services.find(
    (item) => String(item.id) === String(draft.serviceId),
  );
  const setValue = (key, value) => {
    setError("");
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const validate = (currentStep = step) => {
    if (currentStep === 0 && !pet) {
      setError("Selecciona una mascota para continuar.");
      return false;
    }
    if (currentStep === 1) {
      if (!draft.startsAt || !draft.endsAt || !draft.reason.trim()) {
        setError("Completa el horario y el motivo de la cita.");
        return false;
      }
      const startsAt = toUtc(date, draft.startsAt);
      const endsAt = toUtc(date, draft.endsAt);
      if (new Date(endsAt) <= new Date(startsAt)) {
        setError("La hora de fin debe ser posterior al inicio.");
        return false;
      }
      if (new Date(startsAt) <= new Date()) {
        setError("Elige una hora futura para la cita.");
        return false;
      }
    }
    setError("");
    return true;
  };
  const save = async (event) => {
    event.preventDefault();
    if (step < appointmentSteps.length - 1) {
      if (validate(step)) setStep((current) => current + 1);
      return;
    }
    if (!validate(0) || !validate(1)) return;
    setError("");
    setSaving(true);
    try {
      await api.createVeterinaryAppointment({
        pet_id: draft.petId,
        professional_id: draft.professionalId || null,
        service_id: draft.serviceId || null,
        starts_at: toUtc(date, draft.startsAt),
        ends_at: toUtc(date, draft.endsAt),
        reason: draft.reason.trim(),
        notes: draft.notes.trim(),
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal dialogClassName="sm:max-w-3xl" onClose={onClose} title="Agendar cita veterinaria">
      <form className="grid min-h-0" onSubmit={save}>
        <div className="border-b border-outline-variant px-4 py-3 sm:px-5">
          <nav aria-label="Pasos para agendar la cita" className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-container-low p-1">
            {appointmentSteps.map((item, index) => (
              <button
                aria-current={index === step ? "step" : undefined}
                className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition sm:text-sm ${index === step ? "bg-primary text-white shadow-md" : index < step ? "bg-primary-fixed text-primary" : "text-on-surface-variant"}`}
                disabled={index > step}
                key={item.label}
                onClick={() => {
                  if (index < step) {
                    setError("");
                    setStep(index);
                  }
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">{index < step ? "check_circle" : item.icon}</span>
                <span className="truncate"><span className="sm:hidden">{index + 1}</span><span className="hidden sm:inline">{index + 1}. {item.label}</span></span>
              </button>
            ))}
          </nav>
        </div>
        <div className="grid min-h-[20rem] content-start gap-4 p-4 sm:p-5">
          {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}
          {step === 0 ? (
            <fieldset className="grid gap-4">
              <legend className="text-lg font-bold">¿Qué mascota atenderemos?</legend>
              <p className="-mt-3 text-sm text-on-surface-variant">Busca por mascota, propietario, documento o celular.</p>
              <EntitySearchSelect
                getLabel={(item) => item.name}
                getMeta={(item) => [item.owner?.name, item.owner?.document, item.owner?.phone].filter(Boolean).join(" · ")}
                getSearchValues={(item) => [item.name, item.code, item.owner?.name, item.owner?.document, item.owner?.phone, item.owner?.email]}
                items={pets}
                label="Mascota o propietario"
                name="pet_id"
                onChange={(value) => setValue("petId", value)}
                placeholder="Mascota, propietario, DNI o celular"
                required
                value={draft.petId}
              />
              {pet ? <div className="rounded-xl bg-primary-fixed p-3 text-primary"><b>{pet.name}</b><p className="text-sm">{pet.code} · {pet.owner?.name || "Propietario no registrado"}</p></div> : null}
            </fieldset>
          ) : null}
          {step === 1 ? (
            <fieldset className="grid gap-4">
              <legend className="text-lg font-bold">Define el horario</legend>
              <div className="rounded-xl bg-primary-fixed p-3 text-primary"><b className="block">{dayLabel(date)}</b><span className="text-sm">Fecha elegida en el calendario</span></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 sm:col-span-2">Servicio
                  <select
                    className={field}
                    onChange={(event) => {
                      const nextService = services.find(
                        (item) => String(item.id) === event.target.value,
                      );
                      setError("");
                      setDraft((current) => {
                        const currentService = services.find(
                          (item) => String(item.id) === String(current.serviceId),
                        );
                        const shouldReplaceReason =
                          !current.reason.trim() ||
                          current.reason === currentService?.name;
                        return {
                          ...current,
                          serviceId: event.target.value,
                          reason:
                            nextService && shouldReplaceReason
                              ? nextService.name
                              : current.reason,
                          endsAt: nextService
                            ? timeAfter(current.startsAt, nextService.durationMinutes)
                            : current.endsAt,
                        };
                      });
                    }}
                    value={draft.serviceId}
                  >
                    <option value="">Servicio personalizado / sin catÃ¡logo</option>
                    {services.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} Â· S/ {Number(item.price || 0).toFixed(2)} Â· {item.durationMinutes} min
                      </option>
                    ))}
                  </select>
                  {service ? <span className="text-xs text-on-surface-variant">La duraciÃ³n y tarifa se usarÃ¡n como base de la cita y el cobro.</span> : null}
                </label>
                <label className="grid gap-1">Profesional
                  <select className={field} onChange={(event) => setValue("professionalId", event.target.value)} value={draft.professionalId}>
                    <option value="">Por asignar</option>
                    {professionals.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.site}</option>)}
                  </select>
                </label>
                <label className="grid gap-1">Inicio
                  <input className={field} onChange={(event) => {
                    const startsAt = event.target.value;
                    setError("");
                    setDraft((current) => ({
                      ...current,
                      startsAt,
                      endsAt: service ? timeAfter(startsAt, service.durationMinutes) : current.endsAt,
                    }));
                  }} required type="time" value={draft.startsAt} />
                </label>
                <label className="grid gap-1">Fin
                  <input className={field} onChange={(event) => setValue("endsAt", event.target.value)} required type="time" value={draft.endsAt} />
                </label>
                <label className="grid gap-1 sm:col-span-2">Motivo
                  <input className={field} maxLength="300" onChange={(event) => setValue("reason", event.target.value)} placeholder="Consulta, vacuna, control, estética..." required value={draft.reason} />
                </label>
              </div>
            </fieldset>
          ) : null}
          {step === 2 ? (
            <fieldset className="grid gap-4">
              <legend className="text-lg font-bold">Revisa y confirma</legend>
              <div className="grid gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm">
                <p><b>Mascota:</b> {pet?.name} · {pet?.owner?.name}</p>
                <p><b>Profesional:</b> {professional?.name || "Por asignar"}</p>
                <p><b>Servicio:</b> {service ? `${service.name} · S/ ${Number(service.price || 0).toFixed(2)}` : "Servicio personalizado"}</p>
                <p><b>Horario:</b> {dayLabel(date)} · {draft.startsAt} - {draft.endsAt}</p>
                <p><b>Motivo:</b> {draft.reason}</p>
              </div>
              <label className="grid gap-1">Indicaciones para el equipo
                <textarea className={`${field} min-h-24 py-2`} maxLength="2000" onChange={(event) => setValue("notes", event.target.value)} value={draft.notes} />
              </label>
            </fieldset>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-outline-variant bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Button disabled={saving} onClick={() => { if (step === 0) onClose(); else { setError(""); setStep((current) => current - 1); } }} type="button" variant="secondary">
            {step === 0 ? "Cancelar" : "Anterior"}
          </Button>
          <Button disabled={saving || !pets.length} icon={step === appointmentSteps.length - 1 ? "event_available" : "arrow_forward"} type="submit">
            {saving ? "Agendando..." : step === appointmentSteps.length - 1 ? "Confirmar cita" : "Continuar"}
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
                    {item.supplies?.length ? (
                      <p className="mt-2 text-xs text-primary">
                        <b>Inventario:</b>{" "}
                        {item.supplies
                          .map((supply) => `${supply.quantity} × ${supply.product.name}`)
                          .join(", ")}
                      </p>
                    ) : null}
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
  canRecord = canStart,
  appointments = [],
  onClose,
  onSaved,
  professionals = [],
}) {
  const [recordOpen, setRecordOpen] = useState(false);
  const [attentionOpen, setAttentionOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reminding, setReminding] = useState(false);
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
  const remind = async () => {
    const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
    setReminding(true);
    setError("");
    try {
      const result = await api.prepareVeterinaryAppointmentWhatsApp(appointment.id);
      if (popup) popup.location.href = result.url;
      else window.location.href = result.url;
    } catch (requestError) {
      if (popup) popup.close();
      setError(requestError.message);
    } finally {
      setReminding(false);
    }
  };
  if (attentionOpen)
    return (
      <VeterinaryAttentionForm
        appointments={appointments}
        initialAppointmentId={appointment.id}
        initialProfessionalId={appointment.professional?.id || ""}
        initialServicePrice={appointment.service?.price}
        onClose={() => setAttentionOpen(false)}
        onSaved={onSaved}
        pet={appointment.pet}
        professionals={professionals}
      />
    );
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
              label="Servicio"
              value={appointment.service ? `${appointment.service.name} · S/ ${Number(appointment.service.price || 0).toFixed(2)}` : "Servicio personalizado"}
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
            {canManage && ["scheduled", "confirmed"].includes(appointment.status) ? (
              <Button
                disabled={saving || reminding}
                icon="chat"
                onClick={remind}
                type="button"
                variant="secondary"
              >
                {reminding ? "Preparando..." : "Recordar por WhatsApp"}
              </Button>
            ) : null}
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
            {canRecord && appointment.status === "in_attention" ? (
              <Button
                disabled={saving}
                icon="clinical_notes"
                onClick={() => setAttentionOpen(true)}
                type="button"
              >
                Registrar atención
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
  const [services, setServices] = useState([]);
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
    functions.has("veterinarian") || functions.has("veterinary-groomer");
  const canEditPets = admin || capabilities.has("pets.edit");
  const canSchedule = canEditPets && (admin || reception);
  const canManage = canEditPets && (admin || reception);
  const canStart = (admin || clinical) && canEditPets;
  const canSeeBilling =
    admin ||
    (reception && capabilities.has("pets.read") && capabilities.has("pets.edit"));
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
      const [appointmentItems, petItems, professionalItems, serviceItems] =
        await Promise.all([
          api.getVeterinaryAppointments(range.start, range.end),
          api.getPets(),
          api.getVeterinaryProfessionals(),
          api.getVeterinaryServices(),
        ]);
      setAppointments(appointmentItems);
      setPets(petItems);
      setProfessionals(professionalItems);
      setServices(serviceItems);
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

  const openSchedule = () => {
    if (selectedDate < today) return;
    setModal({ type: "appointment" });
  };

  const saved = async () => {
    setModal(null);
    await load();
  };
  const Shell = operator ? OperatorShell : DashboardShell;
  return (
    <Shell
      action={
        <div className="flex min-w-0 flex-wrap justify-end gap-2">
          <Button icon="today" onClick={goToday} variant="secondary">
            Hoy
          </Button>
          {canSchedule ? (
            <Button
              disabled={selectedDate < today}
              icon="event_available"
              onClick={openSchedule}
            >
              Agendar cita
            </Button>
          ) : null}
        </div>
      }
      subtitle={
        operator
          ? "Revisa tus citas asignadas y abre el expediente sin salir de la agenda."
          : "Agenda veterinaria por mascota, servicio, profesional y estado de atención."
      }
      title="Agenda veterinaria"
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
      <AgendaFilterBar filters={filters} onChange={setFilter} value={filter} />
      <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <MonthCalendarGrid
          canViewPast={canViewPast}
          cursor={cursor}
          eventsByDate={eventsByDate}
          filters={filters}
          getEventLabel={(appointment) =>
            `${timeInLima(appointment.startsAt)} ${appointment.pet.name}`
          }
          loading={loading}
          onFilter={setFilter}
          onMoveMonth={moveMonth}
          onSelectDate={selectDay}
          selectedDate={selectedDate}
          selectedFilter={filter}
          showFilters={false}
          statusMeta={statusMeta}
          today={today}
        />
        <aside className="xl:order-2 xl:sticky xl:top-20">
          <DayAgendaPanel
            canSchedule={canSchedule}
            date={selectedDate}
            events={selectedEvents}
            filters={filters}
            key={selectedDate}
            onEvent={(appointment) =>
              setModal({ type: "detail", appointment })
            }
            onSchedule={openSchedule}
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
      </div>
      {modal?.type === "appointment" ? (
        <AppointmentForm
          date={selectedDate}
          onClose={() => setModal(null)}
          onSaved={saved}
          pets={pets}
          professionals={professionals}
          services={services}
        />
      ) : null}
      {modal?.type === "detail" ? (
        <AppointmentDetail
          appointment={modal.appointment}
          appointments={appointments}
          canManage={canManage}
          canRecord={canStart}
          canSeeBilling={canSeeBilling}
          canStart={canStart}
          onClose={() => setModal(null)}
          onSaved={saved}
          professionals={professionals}
        />
      ) : null}
    </Shell>
  );
}
