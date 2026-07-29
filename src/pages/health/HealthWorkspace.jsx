import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import PatientDirectoryList from "../../components/patients/PatientDirectoryList";
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
  const [patientTotal, setPatientTotal] = useState(0);
  const [patientPage, setPatientPage] = useState(1);
  const [patientPageSize, setPatientPageSize] = useState(15);
  const [patientStatus, setPatientStatus] = useState("active");
  const isPatients = moduleKey === "patients";
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const patientRequest = isPatients
        ? api.getPatientsPage({
            page: patientPage,
            page_size: patientPageSize,
            search: query,
            status: patientStatus === "all" ? undefined : patientStatus,
          })
        : api.getPatients();
      const [patientRows, appointmentRows] = await Promise.all([
        patientRequest,
        api.getHealthAppointments(),
      ]);
      if (isPatients) {
        const totalPages = Math.max(1, Math.ceil(patientRows.total / patientPageSize));
        if (patientRows.total > 0 && patientPage > totalPages) {
          setPatientPage(totalPages);
          return;
        }
        setPatients(patientRows.items);
        setPatientTotal(patientRows.total);
      } else {
        setPatients(patientRows);
        setPatientTotal(patientRows.length);
      }
      setAppointments(appointmentRows);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [isPatients, patientPage, patientPageSize, patientStatus, query]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(load, ["/health"]);
  const done = () => {
    setModal("");
    load();
  };
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
  const patientTotalPages = Math.max(1, Math.ceil(patientTotal / patientPageSize));
  const patientRangeStart = patientTotal ? (patientPage - 1) * patientPageSize + 1 : 0;
  const patientRangeEnd = Math.min(patientPage * patientPageSize, patientTotal);
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
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 min-w-56 flex-[1_1_24rem] items-center gap-2 rounded-xl border border-outline-variant bg-white px-3">
              <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">
                search
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPatientPage(1);
                }}
                placeholder="Buscar por nombre, DNI, teléfono o correo"
                value={query}
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 text-sm font-bold">
              <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">
                filter_list
              </span>
              <span className="sr-only">Estado</span>
              <select
                aria-label="Filtrar pacientes por estado"
                className="bg-transparent outline-none"
                onChange={(event) => {
                  setPatientStatus(event.target.value);
                  setPatientPage(1);
                }}
                value={patientStatus}
              >
                <option value="active">Activos</option>
                <option value="all">Todos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </label>
          </div>

          {patients.length ? (
            <PatientDirectoryList
              actionIcon="dentistry"
              actionLabel="Expediente"
              onOpen={openRecord}
              patients={patients}
            />
          ) : (
            <EmptyState
              description="Prueba con otro nombre, documento o estado."
              icon="groups"
              title="No hay pacientes para mostrar"
            />
          )}

          {patientTotal ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-on-surface-variant">
                Mostrando <b className="text-on-surface">{patientRangeStart}–{patientRangeEnd}</b> de{" "}
                <b className="text-on-surface">{patientTotal}</b> pacientes
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-on-surface-variant">
                  Filas
                  <select
                    aria-label="Pacientes por página"
                    className="min-h-9 rounded-lg border border-outline-variant bg-white px-2 text-sm font-bold text-on-surface"
                    onChange={(event) => {
                      setPatientPageSize(Number(event.target.value));
                      setPatientPage(1);
                    }}
                    value={patientPageSize}
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                </label>
                <button
                  aria-label="Página anterior"
                  className="grid size-9 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={patientPage <= 1}
                  onClick={() => setPatientPage((currentPage) => Math.max(1, currentPage - 1))}
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined">
                    chevron_left
                  </span>
                </button>
                <span className="min-w-16 text-center font-bold">
                  {patientPage} / {patientTotalPages}
                </span>
                <button
                  aria-label="Página siguiente"
                  className="grid size-9 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={patientPage >= patientTotalPages}
                  onClick={() => setPatientPage((currentPage) => Math.min(patientTotalPages, currentPage + 1))}
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
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
