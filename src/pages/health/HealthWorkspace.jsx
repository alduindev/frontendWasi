import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import PatientDirectoryList, {
  PatientDirectoryPagination,
} from "../../components/patients/PatientDirectoryList";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import { ChartForm, OdontogramModal } from "../dental/DentalWorkspace";
import DentalAttentionForm from "../dental/DentalAttentionForm";
import DynamicForm from "../../forms/engine/DynamicForm";
import patientTemplate from "../../forms/templates/health/patient.template";
import Tooltip from "../../components/ui/Tooltip";
import { useAuth } from "../../context/authStore";
import { useAppConfig } from "../../context/appConfigStore";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import useResponsivePatientPageSize from "../../hooks/useResponsivePatientPageSize";
import * as api from "../../services/healthService";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";

function PatientActionsMenu({
  canEdit,
  canManageLifecycle,
  isOpen,
  onDeactivate,
  onDelete,
  onEdit,
  onOpenChange,
  onRestore,
  patient,
}) {
  if (!canEdit && !canManageLifecycle) return null;
  const closeAndRun = (action) => () => {
    onOpenChange(null);
    action(patient);
  };

  return (
    <div
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onOpenChange(null);
      }}
    >
      <Tooltip label="Más acciones" placement="top-end">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Más acciones para ${patient.firstName} ${patient.lastName}`}
          className="grid size-9 place-items-center rounded-lg border border-outline-variant bg-white text-on-surface-variant shadow-sm transition hover:border-primary hover:bg-primary-fixed hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          onClick={() => onOpenChange(isOpen ? null : patient.id)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">more_vert</span>
        </button>
      </Tooltip>
      {isOpen ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-outline-variant bg-white p-1.5 shadow-xl" role="menu">
          {canEdit ? <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onEdit)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>Editar ficha</button> : null}
          {canManageLifecycle ? (
            <>
              <div className="my-1 border-t border-outline-variant" />
              {patient.isActive
                ? <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onDeactivate)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">person_off</span>Desactivar paciente</button>
                : <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onRestore)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">restore</span>Restaurar paciente</button>}
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-error transition hover:bg-error-container" onClick={closeAndRun(onDelete)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">delete_forever</span>Eliminar definitivamente</button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

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
  const debouncedQuery = useDebouncedValue(query);
  const [patientTotal, setPatientTotal] = useState(0);
  const [patientPage, setPatientPage] = useState(1);
  const patientPageSize = useResponsivePatientPageSize();
  const [patientStatus, setPatientStatus] = useState("active");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [openPatientActionsId, setOpenPatientActionsId] = useState(null);
  const [patientActionError, setPatientActionError] = useState("");
  const isPatients = moduleKey === "patients";
  const isSearchDebouncing = isPatients && query !== debouncedQuery;
  const requestIdRef = useRef(0);
  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError("");
    try {
      const patientRequest = isPatients
        ? api.getPatientsPage({
            page: patientPage,
            page_size: patientPageSize,
            search: debouncedQuery,
            status: patientStatus === "all" ? undefined : patientStatus,
          })
        : api.getPatients();
      const [patientRows, appointmentRows] = await Promise.all([
        patientRequest,
        api.getHealthAppointments(),
      ]);
      if (requestId !== requestIdRef.current) return;
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
      setHasLoaded(true);
    } catch (requestError) {
      if (requestId === requestIdRef.current) setError(requestError.message);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [debouncedQuery, isPatients, patientPage, patientPageSize, patientStatus]);
  useEffect(() => {
    if (isSearchDebouncing) return undefined;
    queueMicrotask(load);
    return undefined;
  }, [isSearchDebouncing, load]);
  useLiveRefresh(load, ["/health"]);
  const done = () => {
    setModal("");
    setEditingPatient(null);
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
  const capabilities = new Set(config?.capabilities || []);
  const dentistOperator = operator && !admin && config?.user?.functions?.some((item) => item.code === "dentist");
  const canEditPatient = !dentistOperator && (admin || capabilities.has("patients.edit"));
  const canManagePatientLifecycle = admin;
  const patientAttachmentType =
    config?.template?.dashboardKey === "dental"
      ? "dental_patient"
      : "health_patient";
  const canAttention =
    !dentistOperator && (admin || config?.capabilities?.includes("dental.records.edit"));
  const canEditOdontogram =
    !dentistOperator && (admin || config?.capabilities?.includes("dental.odontogram.edit"));
  const canCreateAppointment =
    !dentistOperator && (admin || capabilities.has("appointments.create"));
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
  const askDeactivate = (patient) => {
    setSelected(patient);
    setPatientActionError("");
    setModal("deactivate");
  };
  const askPermanentDelete = (patient) => {
    setSelected(patient);
    setPatientActionError("");
    setModal("permanent-delete");
  };
  const restorePatient = async (patient) => {
    try {
      setError("");
      await api.restorePatient(patient.id);
      await load();
    } catch (requestError) {
      setError(requestError.message || "No se pudo restaurar al paciente.");
    }
  };
  return (
    <Shell
      action={
        (isPatients ? canEditPatient : canCreateAppointment) ? <Button
          icon="add"
          onClick={() => setModal(isPatients ? "patient" : "appointment")}
        >
          {isPatients ? "Registrar paciente" : "Nueva cita"}
        </Button> : null
      }
      subtitle="Información clínica aislada y conectada para tu empresa."
      title={isPatients ? "Pacientes" : "Agenda clínica"}
    >
      {error && !hasLoaded ? (
        <EmptyState
          description={error}
          icon="cloud_off"
          title="No se pudo cargar"
        />
      ) : null}
      {error && hasLoaded ? (
        <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container" role="alert">
          {error}
        </p>
      ) : null}
      {loading && !hasLoaded ? <Card className="h-40 animate-pulse" /> : null}
      {isPatients && hasLoaded ? (
        <section aria-busy={loading} className="grid gap-3">
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

          {loading ? (
            <p aria-live="polite" className="text-xs text-on-surface-variant">
              Actualizando pacientes…
            </p>
          ) : null}

          {patients.length ? (
            <PatientDirectoryList
              actionIcon="dentistry"
              actionContent={(patient) => (
                <PatientActionsMenu
                  canEdit={canEditPatient}
                  canManageLifecycle={canManagePatientLifecycle}
                  isOpen={openPatientActionsId === patient.id}
                  onDeactivate={askDeactivate}
                  onDelete={askPermanentDelete}
                  onEdit={(item) => {
                    setEditingPatient(item);
                    setModal("patient");
                  }}
                  onOpenChange={setOpenPatientActionsId}
                  onRestore={restorePatient}
                  patient={patient}
                />
              )}
              actionLabel="Ver expediente"
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

          <PatientDirectoryPagination
            onPageChange={setPatientPage}
            page={patientPage}
            pageSize={patientPageSize}
            total={patientTotal}
          />
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
        <Modal onClose={() => { setModal(""); setEditingPatient(null); }} title={editingPatient ? "Editar paciente" : "Registrar paciente"}>
          <DynamicForm
            initialValues={editingPatient || {}}
            onCancel={() => { setModal(""); setEditingPatient(null); }}
            onSubmit={async (values) => {
              if (editingPatient) await api.updatePatient(editingPatient.id, values);
              else await api.createPatient(values);
              done();
            }}
            submitLabel={editingPatient ? "Guardar cambios" : "Registrar paciente"}
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
      {canManagePatientLifecycle && modal === "deactivate" && selected ? <Modal onClose={() => setModal("")} title="Desactivar paciente"><div className="grid gap-4 p-5"><p>La ficha se conservará junto con su odontograma, citas e historia dental. No se eliminarán datos de atención.</p>{patientActionError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">{patientActionError}</p> : null}<div className="flex justify-end gap-2"><Button onClick={() => setModal("")} type="button" variant="outlined">Cancelar</Button><Button icon="person_off" onClick={async () => { try { setPatientActionError(""); await api.deactivatePatient(selected.id); setModal(""); await load(); } catch (requestError) { setPatientActionError(requestError.message || "No se pudo desactivar al paciente."); } }}>Desactivar</Button></div></div></Modal> : null}
      {canManagePatientLifecycle && modal === "permanent-delete" && selected ? <Modal onClose={() => setModal("")} title="Eliminar paciente definitivamente"><div className="grid gap-4 p-5"><p>Se eliminará definitivamente la ficha de <b>{selected.firstName} {selected.lastName}</b>. Solo se permite si no tiene citas, odontograma, historia dental, pagos ni archivos adjuntos.</p><p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">Esta acción no se puede deshacer. Si el paciente ya tiene atención registrada, usa Desactivar.</p>{patientActionError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">{patientActionError}</p> : null}<div className="flex justify-end gap-2"><Button onClick={() => setModal("")} type="button" variant="outlined">Cancelar</Button><Button icon="delete_forever" onClick={async () => { try { setPatientActionError(""); await api.permanentlyDeletePatient(selected.id); setSelected(null); setModal(""); await load(); } catch (requestError) { setPatientActionError(requestError.message || "No se pudo eliminar al paciente."); } }} type="button" variant="danger">Eliminar definitivamente</Button></div></div></Modal> : null}
      {modal === "record" && selected ? (
        <OdontogramModal
          admin={admin}
          attachmentEntityType={patientAttachmentType}
          canEditRecords={canAttention}
          canEditTreatments={!dentistOperator && (admin || capabilities.has("dental.treatments.edit"))}
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
