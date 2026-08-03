import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import { AgendaFilterBar } from "../../components/scheduling/MonthlyAgenda";
import DynamicForm from "../../forms/engine/DynamicForm";
import patientTemplate from "../../forms/templates/health/patient.template";
import { useAppConfig } from "../../context/appConfigStore";
import { useAuth } from "../../context/authStore";
import * as api from "../../services/healthService";
import DentalAttentionForm from "./DentalAttentionForm";
import { ChartForm, OdontogramModal } from "./DentalWorkspace";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";

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
const appointmentDraftFor = (date) => ({
  patientId: "",
  procedureId: "",
  professionalId: "",
  date,
  time: "09:00",
  reason: "",
  notes: "",
});
const appointmentSteps = [
  { icon: "person_search", label: "Paciente" },
  { icon: "dentistry", label: "Atención" },
  { icon: "task_alt", label: "Confirmar" },
];
const appointmentProcedureCode = (name) => {
  const slug = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "SERVICIO";
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
  return `DENT-${slug.slice(0, Math.max(1, 34 - suffix.length))}-${suffix}`;
};

function AppointmentForm({
  draft,
  onDraftChange,
  patients,
  procedures,
  professionals,
  onClose,
  onNewPatient,
  onProcedureCreated,
  onSaved,
  canManageServices,
}) {
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingProcedure, setAddingProcedure] = useState(false);
  const [creatingProcedure, setCreatingProcedure] = useState(false);
  const [procedureDraft, setProcedureDraft] = useState({
    category: "General",
    durationMinutes: "30",
    name: "",
    price: "0",
  });
  const selectedPatient = patients.find(
    (item) => String(item.id) === String(draft.patientId),
  );
  const selectedProcedure = procedures.find(
    (item) => String(item.id) === String(draft.procedureId),
  );
  const selectedProfessional = professionals.find(
    (item) => String(item.id) === String(draft.professionalId),
  );
  const today = iso(new Date());
  const setValue = (key, value) => {
    setFormError("");
    onDraftChange((current) => ({ ...current, [key]: value }));
  };
  const createProcedure = async () => {
    const name = procedureDraft.name.trim();
    const price = Number(procedureDraft.price);
    const durationMinutes = Number(procedureDraft.durationMinutes);
    if (!name) {
      setFormError("Escribe el nombre del servicio para agregarlo.");
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
      setFormError("Indica un precio válido y una duración entre 5 y 480 minutos.");
      return;
    }
    setCreatingProcedure(true);
    setFormError("");
    try {
      const procedure = await api.createDentalProcedure({
        category: procedureDraft.category.trim() || "General",
        code: appointmentProcedureCode(name),
        durationMinutes,
        name,
        price,
      });
      onProcedureCreated?.(procedure);
      setValue("procedureId", procedure.id);
      setProcedureDraft({
        category: "General",
        durationMinutes: "30",
        name: "",
        price: "0",
      });
      setAddingProcedure(false);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setCreatingProcedure(false);
    }
  };
  const validate = (currentStep = step) => {
    if (currentStep === 0 && !selectedPatient) {
      setFormError(
        "Selecciona un paciente para continuar. Puedes buscarlo por nombre, DNI o celular.",
      );
      return false;
    }
    if (currentStep === 1) {
      if (!selectedProcedure) {
        setFormError("Selecciona el servicio que recibirá el paciente.");
        return false;
      }
      if (!selectedProfessional) {
        setFormError("Selecciona al odontólogo responsable de la atención.");
        return false;
      }
      if (!draft.date || !draft.time) {
        setFormError("Completa la fecha y la hora de la cita.");
        return false;
      }
      const start = new Date(`${draft.date}T${draft.time}:00`);
      if (Number.isNaN(start.getTime())) {
        setFormError("La fecha u hora elegida no es válida.");
        return false;
      }
      if (draft.date < today || start.getTime() <= Date.now()) {
        setFormError("Elige una fecha y hora futura para la cita.");
        return false;
      }
    }
    setFormError("");
    return true;
  };
  const submit = async (event) => {
    event.preventDefault();
    if (step < appointmentSteps.length - 1) {
      if (validate(step)) setStep((current) => current + 1);
      return;
    }
    if (!validate(0) || !validate(1)) return;
    setSaving(true);
    setFormError("");
    const start = new Date(`${draft.date}T${draft.time}:00`),
      end = new Date(
        start.getTime() +
          Number(selectedProcedure?.durationMinutes || 30) * 60000,
      );
    try {
      const appointment = await api.createHealthAppointment({
        patientId: draft.patientId,
        professionalId: draft.professionalId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        professionalName: "",
        specialty: selectedProcedure?.name || "Consulta odontológica",
        reason:
          draft.reason ||
          selectedProcedure?.name ||
          "Atención dental",
        notes: draft.notes,
      });
      onSaved(appointment);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      dialogClassName="max-w-[52rem]"
      onClose={onClose}
      title="Agendar cita dental"
    >
      <form className="grid min-h-0" onSubmit={submit}>
        <div className="border-b border-outline-variant px-4 py-3 sm:px-5">
          <nav
            aria-label="Pasos para agendar la cita"
            className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-container-low p-1"
          >
            {appointmentSteps.map((item, index) => (
              <button
                aria-current={index === step ? "step" : undefined}
                className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition sm:text-sm ${
                  index === step
                    ? "bg-primary text-white shadow-md"
                    : index < step
                      ? "bg-primary-fixed text-primary"
                      : "text-on-surface-variant"
                }`}
                disabled={index > step}
                key={item.label}
                onClick={() => {
                  if (index < step) {
                    setFormError("");
                    setStep(index);
                  }
                }}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">
                  {index < step ? "check_circle" : item.icon}
                </span>
                <span className="truncate">
                  <span className="sm:hidden">{index + 1}</span>
                  <span className="hidden sm:inline">
                    {index + 1}. {item.label}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="grid min-h-[20rem] content-start gap-4 p-4 sm:p-5">
          {formError ? (
            <div
              className="flex items-start gap-2 rounded-xl bg-error-container p-3 text-sm text-on-error-container"
              role="alert"
            >
              <span className="material-symbols-outlined text-lg">error</span>
              <p>{formError}</p>
            </div>
          ) : null}

          {step === 0 ? (
            <fieldset className="grid gap-4">
              <legend className="mb-1 text-lg font-bold">
                ¿A quién atenderemos?
              </legend>
              <p className="-mt-3 text-sm text-on-surface-variant">
                Busca por nombre, DNI o celular. Los resultados pertenecen
                únicamente a tu empresa.
              </p>
              <EntitySearchSelect
                emptyMessage="No encontramos al paciente. Puedes registrarlo sin perder esta cita."
                getLabel={(item) => `${item.lastName}, ${item.firstName}`}
                getMeta={(item) =>
                  [item.document, item.phone].filter(Boolean).join(" · ")
                }
                getSearchValues={(item) => [
                  item.firstName,
                  item.lastName,
                  `${item.firstName} ${item.lastName}`,
                  `${item.lastName} ${item.firstName}`,
                  item.document,
                  item.phone,
                  item.email,
                ]}
                items={patients}
                label="Paciente"
                name="patientId"
                onChange={(value) => setValue("patientId", value)}
                placeholder="Nombre, DNI o celular"
                required
                value={draft.patientId}
              />
              <button
                className="flex min-h-12 items-center justify-between rounded-xl border border-primary/30 bg-primary-fixed px-4 text-left font-bold text-primary hover:border-primary"
                onClick={onNewPatient}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined">
                    person_add
                  </span>
                  Registrar paciente nuevo
                </span>
                <span className="material-symbols-outlined">
                  arrow_forward
                </span>
              </button>
            </fieldset>
          ) : null}

          {step === 1 ? (
            <fieldset className="grid gap-4">
              <legend className="mb-1 text-lg font-bold">
                Define la atención
              </legend>
              <p className="-mt-3 text-sm text-on-surface-variant">
                Elige el servicio, el odontólogo responsable y un horario
                disponible.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1 text-sm font-medium">
                  <div className="flex items-center justify-between gap-2">
                    <span>Servicio *</span>
                    {canManageServices ? (
                      <button
                        className="text-xs font-bold text-primary hover:underline"
                        onClick={() => setAddingProcedure((current) => !current)}
                        type="button"
                      >
                        {addingProcedure ? "Cancelar" : "Agregar servicio"}
                      </button>
                    ) : null}
                  </div>
                  <select
                    className={cls}
                    onChange={(event) =>
                      setValue("procedureId", event.target.value)
                    }
                    required
                    value={draft.procedureId}
                  >
                    <option value="">Selecciona un servicio</option>
                    {procedures.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.durationMinutes} min · S/{" "}
                        {Number(item.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {!procedures.length ? (
                    <p className="text-xs font-normal text-on-surface-variant">
                      Aún no hay servicios registrados.
                    </p>
                  ) : null}
                </div>
                <label className="grid gap-1 text-sm font-medium">
                  Odontólogo *
                  <select
                    className={cls}
                    onChange={(event) =>
                      setValue("professionalId", event.target.value)
                    }
                    required
                    value={draft.professionalId}
                  >
                    <option value="">Selecciona un odontólogo</option>
                    {professionals.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.site}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Fecha *
                  <input
                    className={cls}
                    min={today}
                    onChange={(event) =>
                      setValue("date", event.target.value)
                    }
                    required
                    type="date"
                    value={draft.date}
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Hora *
                  <input
                    className={cls}
                    onChange={(event) =>
                      setValue("time", event.target.value)
                    }
                    required
                    type="time"
                    value={draft.time}
                  />
                </label>
              </div>
              {addingProcedure ? (
                <div className="grid gap-3 rounded-2xl border border-primary/30 bg-primary-fixed/50 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className="font-bold text-primary">Nuevo servicio dental</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Se guardará en Servicios y se seleccionará automáticamente para esta cita.
                    </p>
                  </div>
                  <label className="grid gap-1 text-sm font-medium sm:col-span-2">
                    Nombre del servicio *
                    <input
                      className={cls}
                      maxLength={160}
                      onChange={(event) => setProcedureDraft((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ej. Limpieza dental"
                      value={procedureDraft.name}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Categoría
                    <input
                      className={cls}
                      maxLength={80}
                      onChange={(event) => setProcedureDraft((current) => ({ ...current, category: event.target.value }))}
                      placeholder="General"
                      value={procedureDraft.category}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Precio (S/)
                    <input
                      className={cls}
                      min="0"
                      onChange={(event) => setProcedureDraft((current) => ({ ...current, price: event.target.value }))}
                      step="0.01"
                      type="number"
                      value={procedureDraft.price}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Duración (minutos)
                    <input
                      className={cls}
                      max="480"
                      min="5"
                      onChange={(event) => setProcedureDraft((current) => ({ ...current, durationMinutes: event.target.value }))}
                      type="number"
                      value={procedureDraft.durationMinutes}
                    />
                  </label>
                  <div className="flex items-end justify-end sm:col-span-2">
                    <Button
                      disabled={creatingProcedure}
                      icon="add"
                      onClick={createProcedure}
                      type="button"
                    >
                      {creatingProcedure ? "Guardando servicio..." : "Guardar y seleccionar"}
                    </Button>
                  </div>
                </div>
              ) : null}
              {selectedProcedure ? (
                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-primary-fixed p-3 text-center text-sm text-primary">
                  <span>
                    <b className="block">
                      {selectedProcedure.durationMinutes} min
                    </b>
                    Duración
                  </span>
                  <span>
                    <b className="block">
                      S/ {Number(selectedProcedure.price).toFixed(2)}
                    </b>
                    Precio
                  </span>
                  <span>
                    <b className="block">
                      {new Date(
                        new Date(
                          `${draft.date}T${draft.time || "00:00"}:00`,
                        ).getTime() +
                          Number(
                            selectedProcedure.durationMinutes || 30,
                          ) *
                            60000,
                      ).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </b>
                    Finaliza
                  </span>
                </div>
              ) : null}
            </fieldset>
          ) : null}

          {step === 2 ? (
            <fieldset className="grid gap-4">
              <legend className="mb-1 text-lg font-bold">
                Revisa y confirma
              </legend>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <div className="grid gap-3">
                  <label className="grid gap-1 text-sm font-medium">
                    Motivo de la consulta
                    <input
                      className={cls}
                      maxLength={160}
                      onChange={(event) =>
                        setValue("reason", event.target.value)
                      }
                      placeholder="Control, dolor, evaluación..."
                      value={draft.reason}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Notas para el equipo
                    <textarea
                      className={`${cls} min-h-24 resize-none py-2`}
                      maxLength={500}
                      onChange={(event) =>
                        setValue("notes", event.target.value)
                      }
                      placeholder="Indicaciones o información adicional (opcional)"
                      value={draft.notes}
                    />
                  </label>
                </div>
                <div className="grid content-start gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Resumen de la cita
                  </p>
                  <SummaryRow
                    icon="person"
                    label="Paciente"
                    value={
                      selectedPatient
                        ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                        : "Sin seleccionar"
                    }
                  />
                  <SummaryRow
                    icon="dentistry"
                    label="Servicio"
                    value={selectedProcedure?.name || "Sin seleccionar"}
                  />
                  <SummaryRow
                    icon="medical_services"
                    label="Odontólogo"
                    value={selectedProfessional?.name || "Sin seleccionar"}
                  />
                  <SummaryRow
                    icon="calendar_month"
                    label="Fecha y hora"
                    value={`${dayTitle(draft.date)} · ${draft.time}`}
                  />
                </div>
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-primary-fixed p-3 text-sm text-primary">
                <span className="material-symbols-outlined text-lg">
                  notifications_active
                </span>
                La cita aparecerá en la agenda del equipo después de
                confirmarla.
              </p>
            </fieldset>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-outline-variant bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Button
            disabled={saving}
            onClick={() => {
              if (step === 0) onClose();
              else {
                setFormError("");
                setStep((current) => current - 1);
              }
            }}
            type="button"
            variant="secondary"
          >
            {step === 0 ? "Cancelar" : "Anterior"}
          </Button>
          <Button
            disabled={saving || (step === 0 && !selectedPatient)}
            icon={step === 2 ? "event_available" : "arrow_forward"}
            type="submit"
          >
            {saving
              ? "Agendando..."
              : step === 2
                ? "Confirmar cita"
                : "Continuar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-2 rounded-xl bg-white p-2.5">
      <span className="material-symbols-outlined text-lg text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <small className="block text-on-surface-variant">{label}</small>
        <b className="block truncate text-sm capitalize">{value}</b>
      </span>
    </div>
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
  const dentistOperator = user.role === "operator" && config?.user?.functions?.some((item) => item.code === "dentist");
  const editAllowed =
    !dentistOperator && (canEdit ??
    (admin || (config?.capabilities || []).includes("appointments.status")));
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
        canEditRecords={!dentistOperator && (admin || config?.capabilities?.includes("dental.records.edit"))}
        canEditTreatments={!dentistOperator && (admin || config?.capabilities?.includes("dental.treatments.edit"))}
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
      <div className="grid grid-cols-3 gap-1 border-b border-outline-variant p-2">
        {groups.map((item) => (
          <button
            aria-pressed={active === item.value}
            className={`grid min-w-0 place-items-center gap-0.5 rounded-xl p-2 text-center transition ${active === item.value ? "bg-primary text-white shadow-md" : "bg-surface-container-low text-on-surface-variant hover:bg-primary-fixed"}`}
            key={item.value}
            onClick={() => setActive(item.value)}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              {item.icon}
            </span>
            <b className="text-base leading-none">{item.events.length}</b>
            <span className="w-full truncate text-[10px] leading-tight" title={item.label}>
              {item.label}
            </span>
          </button>
        ))}
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
      {canSchedule && !past ? <div className="border-t border-outline-variant p-3"><Button className="w-full" icon="event_available" onClick={onSchedule}>Agendar para este día</Button></div> : null}
      {past ? <div className="flex items-center gap-2 border-t border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant"><span aria-hidden="true" className="material-symbols-outlined text-primary">history</span><span><b className="text-on-surface">Día histórico.</b> Puedes revisar las citas y atenciones realizadas, pero no agendar una nueva.</span></div> : null}
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
  const [appointmentDraft, setAppointmentDraft] = useState(() =>
    appointmentDraftFor(today),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dentistOperator = operator && config?.user?.functions?.some((item) => item.code === "dentist");
  const canManageServices = ["admin", "admin_owner"].includes(config?.user?.role) || (config?.capabilities || []).includes("dental.catalog.manage");
  const canSchedule =
    !dentistOperator && (!operator || (config?.capabilities || []).includes("appointments.create"));
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
  const openSchedule = () => {
    if (selected < today) return;
    setAppointmentDraft(appointmentDraftFor(selected));
    setModal({ type: "appointment" });
  };
  const closeSchedule = () => {
    setAppointmentDraft(appointmentDraftFor(selected));
    setModal(null);
  };
  const Shell = operator ? OperatorShell : DashboardShell;
  return (
    <Shell
      action={
        <div className="flex min-w-0 flex-wrap justify-end gap-2">
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
              title={selected < today ? "No se pueden agendar citas en un día pasado" : undefined}
            >
              Agendar cita
            </Button>
          ) : null}
        </div>
      }
      subtitle="Agenda odontológica por servicio, profesional, estado y expediente clínico."
      title="Agenda dental"
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
        <aside className="xl:order-2 xl:sticky xl:top-20">
          <DayAgenda
            canSchedule={canSchedule}
            date={selected}
            events={selectedEvents}
            onEvent={(item) => setModal({ type: "detail", item })}
            onSchedule={openSchedule}
            past={selected < today}
          />
        </aside>
        <Card className="min-w-0 overflow-hidden xl:order-1">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-outline-variant p-3">
            <button
              aria-label="Mes anterior"
              className="grid size-10 place-items-center rounded-xl border border-outline-variant bg-white text-primary transition hover:bg-primary-fixed"
              onClick={() => move(-1)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 className="truncate text-center font-heading text-base font-bold capitalize sm:text-lg">
                {monthTitle(cursor)}
            </h2>
            <button
              aria-label="Mes siguiente"
              className="grid size-10 place-items-center rounded-xl border border-outline-variant bg-white text-primary transition hover:bg-primary-fixed"
              onClick={() => move(1)}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          {loading ? (
            <div className="h-[32rem] animate-pulse bg-surface-container-low" />
          ) : (
            <>
              <div className="grid min-w-0 grid-cols-7 border-b border-outline-variant bg-surface-container-low text-center text-[10px] font-bold text-on-surface-variant sm:text-[11px]">
                {weekdays.map((day) => (
                  <span className="min-w-0 truncate p-2" key={day}>
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid min-w-0 grid-cols-7">
                {cells.map((cell) => {
                  const key = iso(cell.date),
                    events = grouped[key] || [];
                  const selectedDay = key === selected;
                  const past = key < today;
                  return (
                    <button
                      aria-label={`${dayTitle(key)}${past ? ", fecha histórica" : ""}`}
                      aria-pressed={selectedDay}
                      className={`relative min-h-[76px] min-w-0 overflow-hidden border-b border-r border-outline-variant p-1.5 text-left transition sm:min-h-[108px] ${cell.current ? past ? "bg-surface-container-low/70 text-on-surface-variant" : "bg-white" : "bg-surface-container-low text-on-surface-variant"} ${selectedDay ? "ring-2 ring-inset ring-primary" : "hover:bg-primary-fixed/30"}`}
                      key={key}
                      onClick={() => selectDay(cell.date)}
                      type="button"
                    >
                      <span className="flex items-center gap-1">
                        <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${key === today ? "bg-primary text-white" : ""}`}>{cell.date.getDate()}</span>
                        {past && cell.current ? <span aria-hidden="true" className="material-symbols-outlined text-sm text-on-surface-variant">history</span> : null}
                      </span>
                      <div className="mt-1 grid min-w-0 gap-1">
                        {events.slice(0, 3).map((item) => (
                          <span
                            className={`min-w-0 truncate rounded px-1 py-1 text-[9px] font-bold sm:px-1.5 sm:text-[10px] ${(statusMeta[item.status] || statusMeta.scheduled).tone}`}
                            key={item.id}
                            title={`${new Date(item.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} · ${item.patient.firstName}`}
                          >
                            {new Date(item.startsAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} <span className="hidden sm:inline">{item.patient.firstName}</span>
                          </span>
                        ))}
                        {events.length > 3 ? (
                          <span className="truncate text-[10px] font-bold text-primary">
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
          canManageServices={canManageServices}
          draft={appointmentDraft}
          onClose={closeSchedule}
          onDraftChange={setAppointmentDraft}
          onNewPatient={() => setModal({ type: "patient" })}
          onProcedureCreated={(procedure) => {
            setProcedures((current) =>
              [...current, procedure].sort((left, right) =>
                left.name.localeCompare(right.name, "es"),
              ),
            );
          }}
          onSaved={() => {
            const scheduledDate = appointmentDraft.date;
            setModal(null);
            setAppointmentDraft(appointmentDraftFor(scheduledDate));
            setSelected(scheduledDate);
            setCursor(
              new Date(
                Number(scheduledDate.slice(0, 4)),
                Number(scheduledDate.slice(5, 7)) - 1,
                1,
              ),
            );
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
              const created = await api.createPatient(values);
              const refreshedPatients = await api.getPatients();
              setPatients(refreshedPatients);
              if (created?.id) {
                setAppointmentDraft((current) => ({
                  ...current,
                  patientId: String(created.id),
                }));
              }
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
