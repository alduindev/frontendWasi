import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import { ChartForm, OdontogramModal } from "../dental/DentalWorkspace";
import DentalAttentionForm from "../dental/DentalAttentionForm";
import DynamicForm from "../../forms/engine/DynamicForm";
import patientTemplate from "../../forms/templates/health/patient.template";
import { useAuth } from "../../context/authStore";
import { useAppConfig } from "../../context/appConfigStore";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import * as api from "../../services/healthService";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";
import { matchesEntitySearch } from "../../utils/entitySearch";

function AppointmentForm({ patients, close, done }) {
  const [patientId, setPatientId] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.createHealthAppointment({
      patientId: form.get("patientId"),
      startsAt: form.get("startsAt"),
      endsAt: form.get("endsAt"),
      professionalName: form.get("professionalName"),
      specialty: form.get("specialty"),
      reason: form.get("reason"),
      notes: "",
    });
    done();
  };
  const field = "min-h-11 rounded-xl border border-outline-variant px-3";
  return (
    <Modal onClose={close} title="Nueva cita">
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
        <EntitySearchSelect
          getLabel={(patient) =>
            `${patient.lastName}, ${patient.firstName}`
          }
          getMeta={(patient) =>
            [patient.document, patient.phone].filter(Boolean).join(" · ")
          }
          getSearchValues={(patient) => [
            patient.firstName,
            patient.lastName,
            `${patient.firstName} ${patient.lastName}`,
            patient.document,
            patient.phone,
            patient.email,
          ]}
          items={patients}
          label="Paciente"
          name="patientId"
          onChange={setPatientId}
          placeholder="Buscar por nombre, DNI o celular"
          required
          value={patientId}
        />
        <label>
          Profesional
          <input className={field} name="professionalName" required />
        </label>
        <label>
          Especialidad
          <input className={field} name="specialty" />
        </label>
        <label>
          Motivo
          <input className={field} name="reason" required />
        </label>
        <label>
          Inicio
          <input
            className={field}
            name="startsAt"
            required
            type="datetime-local"
          />
        </label>
        <label>
          Fin
          <input
            className={field}
            name="endsAt"
            required
            type="datetime-local"
          />
        </label>
        <Button disabled={!patients.length} type="submit">
          Agendar cita
        </Button>
      </form>
    </Modal>
  );
}

export default function HealthWorkspace({ operator = false }) {
  const { moduleKey } = useParams();
  const { user } = useAuth();
  const { config } = useAppConfig();
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(null);
  const [chart, setChart] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [attentionId, setAttentionId] = useState("");
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [query, setQuery] = useState(() => searchParams.get("search") || "");
  const [patientPage, setPatientPage] = useState(0);
  const pageSize = 6;
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [patientRows, appointmentRows] = await Promise.all([
        api.getPatients(),
        api.getHealthAppointments(),
      ]);
      setPatients(patientRows);
      setAppointments(appointmentRows);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(load, ["/health"]);
  const done = () => {
    setModal("");
    load();
  };
  const isPatients = moduleKey === "patients";
  const Shell = operator ? OperatorShell : DashboardShell;
  const openRecord = async (patient) => {
    setSelected(patient);
    setChart([]);
    setModal("record");
    try {
      setChart(await api.getDentalChart(patient.id));
    } catch {
      setChart([]);
    }
  };
  const admin = ["admin", "admin_owner"].includes(user.role);
  const patientAttachmentType =
    config?.template?.dashboardKey === "dental"
      ? "dental_patient"
      : "health_patient";
  const canAttention =
    admin || config?.capabilities?.includes("dental.records.edit");
  const canEditOdontogram =
    admin || config?.capabilities?.includes("dental.odontogram.edit");
  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) =>
        matchesEntitySearch(patient, query, (item) => [
          item.firstName,
          item.lastName,
          `${item.firstName} ${item.lastName}`,
          item.document,
          item.phone,
          item.email,
        ]),
      ),
    [patients, query],
  );
  const patientPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / pageSize),
  );
  const effectivePage = Math.min(patientPage, patientPages - 1);
  const visiblePatients = filteredPatients.slice(
    effectivePage * pageSize,
    (effectivePage + 1) * pageSize,
  );
  const reloadChart = async () => {
    try {
      setChart(await api.getDentalChart(selected.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  const beginAttention = async () => {
    try {
      const today = new Date().toLocaleDateString("en-CA");
      const appointment = appointments.find(
        (item) =>
          item.patient.id === selected.id &&
          new Date(item.startsAt).toLocaleDateString("en-CA") === today &&
          ["scheduled", "confirmed", "in_attention"].includes(item.status),
      );
      const attention = await api.startDentalAttention({
        patientId: selected.id,
        appointmentId: appointment?.id || null,
        dentistId: appointment?.professionalId || null,
        reason: appointment?.reason || "Atención clínica",
      });
      setAttentionId(attention.id);
      setModal("attention");
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <Shell
      action={
        <Button
          icon="add"
          onClick={() => setModal(isPatients ? "patient" : "appointment")}
        >
          {isPatients ? "Registrar paciente" : "Nueva cita"}
        </Button>
      }
      subtitle="Información clínica aislada y conectada para tu empresa."
      title={isPatients ? "Pacientes" : "Agenda clínica"}
    >
      {error ? (
        <EmptyState
          description={error}
          icon="cloud_off"
          title="No se pudo cargar"
        />
      ) : null}
      {loading ? <Card className="h-40 animate-pulse" /> : null}
      {!loading && !error && isPatients ? (
        <section>
          <Card className="mb-3 flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-outline-variant bg-white px-3">
              <span className="material-symbols-outlined text-on-surface-variant">
                search
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, DNI, teléfono o correo"
                value={query}
              />
            </label>
            <span className="shrink-0 rounded-xl bg-primary-fixed px-3 py-2 text-sm font-bold text-primary">
              {filteredPatients.length} pacientes
            </span>
          </Card>
          <div className="grid min-h-[23rem] content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visiblePatients.map((patient) => (
              <button
                className="min-w-0 text-left"
                key={patient.id}
                onClick={() => openRecord(patient)}
                type="button"
              >
                <Card className="flex h-44 flex-col p-3 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-fixed text-xs font-bold text-primary">
                        {patient.firstName?.[0]}
                        {patient.lastName?.[0]}
                      </span>
                      <span className="min-w-0">
                        <b className="block truncate">
                          {patient.firstName} {patient.lastName}
                        </b>
                        <small className="text-on-surface-variant">
                          {patient.documentType} {patient.document}
                        </small>
                      </span>
                    </span>
                    <span className="rounded-full bg-primary-fixed px-2 py-1 text-[10px]">
                      {patient.status}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-xs text-on-surface-variant">
                    {patient.phone || "Sin teléfono"} ·{" "}
                    {patient.email || "Sin correo"}
                  </p>
                  {patient.allergies ? (
                    <p className="mt-2 line-clamp-2 rounded-lg bg-error-container px-2 py-1.5 text-xs">
                      Alergias: {patient.allergies}
                    </p>
                  ) : (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800">
                      Sin alertas clínicas
                    </p>
                  )}
                  <p className="mt-auto flex items-center gap-1 text-xs font-bold text-primary">
                    <span className="material-symbols-outlined text-base">
                      clinical_notes
                    </span>
                    Abrir expediente completo
                  </p>
                </Card>
              </button>
            ))}
            {!visiblePatients.length ? (
              <Card className="col-span-full grid min-h-48 place-items-center text-on-surface-variant">
                No se encontraron pacientes.
              </Card>
            ) : null}
          </div>
          {patientPages > 1 ? (
            <nav
              aria-label="Páginas de pacientes"
              className="mt-3 flex items-center justify-center gap-2"
            >
              <button
                aria-label="Página anterior"
                className="material-symbols-outlined grid size-10 place-items-center rounded-full border border-outline-variant bg-white disabled:opacity-30"
                disabled={patientPage === 0}
                onClick={() => setPatientPage((page) => Math.max(0, page - 1))}
                type="button"
              >
                chevron_left
              </button>
              <div className="flex gap-1">
                {Array.from({ length: patientPages }, (_, index) => (
                  <button
                    aria-label={`Página ${index + 1}`}
                    className={`h-2.5 rounded-full transition-all ${patientPage === index ? "w-8 bg-primary" : "w-2.5 bg-outline-variant"}`}
                    key={index}
                    onClick={() => setPatientPage(index)}
                    type="button"
                  />
                ))}
              </div>
              <span className="min-w-16 text-center text-xs font-bold text-on-surface-variant">
                {patientPage + 1} / {patientPages}
              </span>
              <button
                aria-label="Página siguiente"
                className="material-symbols-outlined grid size-10 place-items-center rounded-full border border-outline-variant bg-white disabled:opacity-30"
                disabled={patientPage >= patientPages - 1}
                onClick={() =>
                  setPatientPage((page) => Math.min(patientPages - 1, page + 1))
                }
                type="button"
              >
                chevron_right
              </button>
            </nav>
          ) : null}
        </section>
      ) : null}
      {!loading && !error && !isPatients ? (
        <div className="grid gap-3">
          {appointments.map((appointment) => (
            <Card className="p-4" key={appointment.id}>
              <b>
                {appointment.patient.firstName} {appointment.patient.lastName}
              </b>
              <p className="text-sm">
                {new Date(appointment.startsAt).toLocaleString("es-PE")} ·{" "}
                {appointment.professionalName}
              </p>
              <p className="text-sm text-on-surface-variant">
                {appointment.specialty} · {appointment.reason}
              </p>
            </Card>
          ))}
        </div>
      ) : null}
      {modal === "patient" ? (
        <Modal onClose={() => setModal("")} title="Registrar paciente">
          <DynamicForm
            onCancel={() => setModal("")}
            onSubmit={async (values) => {
              await api.createPatient(values);
              done();
            }}
            submitLabel="Registrar paciente"
            template={patientTemplate}
          />
        </Modal>
      ) : null}
      {modal === "appointment" ? (
        <AppointmentForm
          close={() => setModal("")}
          done={done}
          patients={patients}
        />
      ) : null}
      {modal === "record" && selected ? (
        <OdontogramModal
          admin={admin}
          attachmentEntityType={patientAttachmentType}
          chart={chart}
          close={() => setModal("")}
          exporting={exporting}
          onAttention={canAttention ? beginAttention : null}
          onExport={async (format) => {
            setExporting(true);
            try {
              await api.exportDentalChart(selected.id, format);
            } finally {
              setExporting(false);
            }
          }}
          onTooth={
            canEditOdontogram
              ? (tooth) => {
                  setSelectedTooth(tooth);
                  setModal("chart");
                }
              : null
          }
          patient={selected}
        />
      ) : null}
      {modal === "chart" && selected ? (
        <ChartForm
          close={() => setModal("record")}
          done={async () => {
            await reloadChart();
            setModal("record");
          }}
          patientId={selected.id}
          tooth={selectedTooth}
        />
      ) : null}
      {modal === "attention" && selected ? (
        <DentalAttentionForm
          attentionId={attentionId}
          onClose={() => setModal("record")}
          onSaved={() => {
            setAttentionId("");
            setModal("record");
            load();
          }}
          patient={selected}
        />
      ) : null}
    </Shell>
  );
}
