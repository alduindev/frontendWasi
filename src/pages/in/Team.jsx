import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Input from "../../components/atoms/Input";
import ConfirmDialog from "../../components/molecules/ConfirmDialog";
import PasswordField from "../../components/molecules/PasswordField";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import DashboardShell from "../../components/organisms/DashboardShell";
import { useAppConfig } from "../../context/appConfigStore";
import { useToast } from "../../hooks/useToast";
import { matchesEntitySearch } from "../../utils/entitySearch";
import * as userService from "../../services/userService";
import { getHospitalityStaffDashboard } from "../../services/hospitalityService";
import {
  createMedicalProfessionalProfile,
  getBusinessMedicalServices,
  getMedicalProfessionals,
  updateMedicalProfessionalProfile,
} from "../../services/medicalService";
import {
  exportDentalChart,
  getDentalChart,
  getDentalStaffSummary,
  getPatients,
} from "../../services/healthService";
import {
  correctAttendance,
  exportAttendance,
  getAttendanceHistory,
  getBusinessSchedule,
  getSchedule,
  getTodayAttendance,
  updateBusinessSchedule,
  updateSchedule,
} from "../../services/attendanceService";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { OdontogramModal } from "../dental/DentalWorkspace";
import AdminPasswordResetModal from "../../components/credentials/AdminPasswordResetModal";

const hospitalityPositionFunctions = {
  reception: ["reception"],
  cashier: ["cashier"],
  housekeeping: ["housekeeping"],
  "room-service": ["room-service"],
  maintenance: ["maintenance"],
  security: ["security"],
  laundry: ["laundry"],
  kitchen: ["kitchen"],
  "customer-service": ["customer-service"],
  inventory: ["inventory"],
  purchasing: ["purchasing"],
  "hospitality-supervisor": ["hospitality-supervisor"],
  veterinarian: ["veterinarian"],
  "veterinary-reception": ["veterinary-reception"],
  "veterinary-assistant": ["veterinary-assistant"],
  "veterinary-groomer": ["veterinary-groomer"],
};

const permissionLabels = {
  "hospitality.rooms.read": "Consultar habitaciones",
  "hospitality.guests.read": "Consultar huéspedes",
  "hospitality.guests.manage": "Registrar y editar huéspedes",
  "hospitality.reservations.manage": "Gestionar reservas",
  "hospitality.checkin": "Realizar check-in y registrar consumos",
  "hospitality.checkout": "Realizar check-out",
  "hospitality.housekeeping.request": "Solicitar limpieza",
  "hospitality.housekeeping.read_assigned": "Ver limpiezas asignadas",
  "hospitality.housekeeping.start": "Iniciar limpieza",
  "hospitality.housekeeping.complete": "Finalizar limpieza",
  "hospitality.housekeeping.damage": "Reportar daños",
  "hospitality.staff.read": "Supervisar operación y asignaciones",
  "hospitality.cash.manage": "Gestionar caja hotelera",
  "hospitality.room_service.manage": "Gestionar room service",
  "inventory.read": "Consultar inventario",
  "inventory.create": "Registrar productos",
  "inventory.edit": "Modificar inventario",
  "sales.create": "Registrar cobros y ventas",
  "sales.read_own": "Consultar sus propios comprobantes",
};

const dayNames = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const attendanceTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
function AttendanceSummary({ item }) {
  const record = item?.record;
  if (record?.clockOutAt)
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1 font-bold text-emerald-800">
            <span className="material-symbols-outlined text-base">
              task_alt
            </span>
            Jornada cerrada
          </span>
          <b className="text-emerald-900">
            {record.workedMinutes == null
              ? "—"
              : `${Math.floor(record.workedMinutes / 60)}h ${record.workedMinutes % 60}m`}
          </b>
        </div>
        <p className="mt-1 text-[11px] text-emerald-800">
          Entrada {attendanceTime(record.clockInAt)} · Salida{" "}
          {attendanceTime(record.clockOutAt)}
        </p>
      </div>
    );
  if (record?.clockInAt)
    return (
      <div className="rounded-xl bg-primary-fixed px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-bold text-primary">
            <span className="material-symbols-outlined text-base">
              schedule
            </span>
            Jornada abierta
          </span>
          <b className="text-primary">
            Desde {attendanceTime(record.clockInAt)}
          </b>
        </div>
        <p className="mt-1 text-[11px] text-on-surface-variant">
          Salida aún no registrada
        </p>
      </div>
    );
  const labels = {
    absent: "Ausente",
    missing_exit: "Falta registrar salida",
    not_started: "Sin ingreso",
  };
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-xs">
      <span className="font-bold">Jornada de hoy</span>
      <span
        className={`font-bold ${record?.status === "absent" || record?.status === "missing_exit" ? "text-error" : "text-on-surface-variant"}`}
      >
        {labels[record?.status] || "Sin ingreso"}
      </span>
    </div>
  );
}
function ScheduleModal({ onClose, user }) {
  const [days, setDays] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getSchedule(user.id)
      .then(setDays)
      .catch((e) => setError(e.message));
  }, [user.id]);
  const change = (index, key, value) =>
    setDays((current) =>
      current.map((day, i) => (i === index ? { ...day, [key]: value } : day)),
    );
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateSchedule(user.id, days);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      dialogClassName="sm:max-w-4xl"
      onClose={onClose}
      title={`Horario · ${user.name}`}
    >
      <div className="grid gap-3 p-4 sm:p-5">
        <p className="text-sm text-on-surface-variant">
          Configura días, turnos diurnos o nocturnos y minutos de tolerancia.
        </p>
        {error ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        {days.map((day, index) => (
          <div
            className="grid items-center gap-2 rounded-xl border border-outline-variant p-3 sm:grid-cols-[110px_100px_1fr_1fr_110px]"
            key={day.weekday}
          >
            <b>{dayNames[day.weekday]}</b>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={day.isWorkday}
                onChange={(event) =>
                  change(index, "isWorkday", event.target.checked)
                }
                type="checkbox"
              />
              Laborable
            </label>
            <input
              aria-label={`Ingreso ${dayNames[day.weekday]}`}
              className="min-h-10 rounded-xl border border-outline-variant px-3 disabled:opacity-40"
              disabled={!day.isWorkday}
              onChange={(event) =>
                change(index, "startTime", event.target.value)
              }
              type="time"
              value={day.startTime}
            />
            <input
              aria-label={`Salida ${dayNames[day.weekday]}`}
              className="min-h-10 rounded-xl border border-outline-variant px-3 disabled:opacity-40"
              disabled={!day.isWorkday}
              onChange={(event) => change(index, "endTime", event.target.value)}
              type="time"
              value={day.endTime}
            />
            <label className="text-xs font-bold">
              Tolerancia
              <input
                className="mt-1 min-h-10 w-full rounded-xl border border-outline-variant px-2"
                disabled={!day.isWorkday}
                max="120"
                min="0"
                onChange={(event) =>
                  change(index, "toleranceMinutes", Number(event.target.value))
                }
                type="number"
                value={day.toleranceMinutes}
              />
            </label>
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={saving || days.length !== 7}
            icon="save"
            onClick={save}
          >
            {saving ? "Guardando..." : "Guardar horario"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BusinessScheduleModal({ onClose, onSaved }) {
  const [days, setDays] = useState([]);
  const [applyAll, setApplyAll] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getBusinessSchedule()
      .then(setDays)
      .catch((e) => setError(e.message));
  }, []);
  const change = (index, key, value) =>
    setDays((current) =>
      current.map((day, i) => (i === index ? { ...day, [key]: value } : day)),
    );
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateBusinessSchedule(days, applyAll);
      await onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      dialogClassName="sm:max-w-4xl"
      onClose={onClose}
      title="Horario general del negocio"
    >
      <div className="grid gap-3 p-4 sm:p-5">
        <div className="rounded-xl bg-primary-fixed p-3 text-sm text-on-surface-variant">
          <b className="text-on-surface">Horario base del local.</b> Define
          apertura, cierre y tolerancia; después puedes personalizar el turno de
          cada colaborador.
        </div>
        {error ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        <div className="grid max-h-[52vh] gap-2 overflow-y-auto pr-1">
          {days.map((day, index) => (
            <div
              className="grid items-center gap-2 rounded-xl border border-outline-variant p-2.5 sm:grid-cols-[110px_100px_1fr_1fr_110px]"
              key={day.weekday}
            >
              <b>{dayNames[day.weekday]}</b>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={day.isWorkday}
                  onChange={(event) =>
                    change(index, "isWorkday", event.target.checked)
                  }
                  type="checkbox"
                />
                Laborable
              </label>
              <input
                aria-label={`Apertura ${dayNames[day.weekday]}`}
                className="min-h-10 rounded-xl border border-outline-variant px-3 disabled:opacity-40"
                disabled={!day.isWorkday}
                onChange={(event) =>
                  change(index, "startTime", event.target.value)
                }
                type="time"
                value={day.startTime}
              />
              <input
                aria-label={`Cierre ${dayNames[day.weekday]}`}
                className="min-h-10 rounded-xl border border-outline-variant px-3 disabled:opacity-40"
                disabled={!day.isWorkday}
                onChange={(event) =>
                  change(index, "endTime", event.target.value)
                }
                type="time"
                value={day.endTime}
              />
              <label className="text-xs font-bold">
                Tolerancia
                <input
                  className="mt-1 min-h-10 w-full rounded-xl border border-outline-variant px-2"
                  disabled={!day.isWorkday}
                  max="120"
                  min="0"
                  onChange={(event) =>
                    change(
                      index,
                      "toleranceMinutes",
                      Number(event.target.value),
                    )
                  }
                  type="number"
                  value={day.toleranceMinutes}
                />
              </label>
            </div>
          ))}
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-outline-variant p-3 text-sm">
          <input
            checked={applyAll}
            className="mt-1"
            onChange={(event) => setApplyAll(event.target.checked)}
            type="checkbox"
          />
          <span>
            <b className="block">Aplicar a todos los colaboradores activos</b>
            <span className="text-on-surface-variant">
              Copia este horario como base; los turnos individuales podrán
              ajustarse después.
            </span>
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={saving || days.length !== 7}
            icon="save"
            onClick={save}
          >
            {saving ? "Guardando..." : "Guardar horario general"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* eslint-disable react-hooks/purity -- initial date filters are intentionally calculated when the modal opens */
const localDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
function AttendanceHistoryModal({ onClose, users }) {
  const today = new Date().toISOString().slice(0, 10);
  const prior = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const [start, setStart] = useState(prior);
  const [end, setEnd] = useState(today);
  const [userId, setUserId] = useState("");
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [reason, setReason] = useState("");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      getAttendanceHistory(start, end, userId)
        .then(setItems)
        .catch((e) => setError(e.message)),
    [end, start, userId],
  );
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const begin = (item) => {
    setEditing(item);
    setClockIn(localDateTime(item.record.clockInAt));
    setClockOut(localDateTime(item.record.clockOutAt));
    setReason("");
  };
  const save = async () => {
    try {
      await correctAttendance(editing.record.id, {
        clockInAt: clockIn ? new Date(clockIn).toISOString() : null,
        clockOutAt: clockOut ? new Date(clockOut).toISOString() : null,
        reason,
      });
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Modal
      dialogClassName="sm:max-w-5xl"
      onClose={onClose}
      title="Asistencia del equipo"
    >
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.5fr_auto]">
          <Input
            label="Desde"
            onChange={(e) => setStart(e.target.value)}
            type="date"
            value={start}
          />
          <Input
            label="Hasta"
            onChange={(e) => setEnd(e.target.value)}
            type="date"
            value={end}
          />
          <label className="grid gap-1 text-sm font-bold text-on-surface-variant">
            Colaborador
            <select
              className="min-h-11 rounded-xl border border-outline-variant bg-white px-3"
              onChange={(e) => setUserId(e.target.value)}
              value={userId}
            >
              <option value="">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            icon="download"
            onClick={() => exportAttendance(start, end)}
            variant="secondary"
          >
            Excel/CSV
          </Button>
        </div>
        {error ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        {editing ? (
          <div className="grid gap-3 rounded-2xl border border-primary bg-primary-fixed/30 p-4 sm:grid-cols-2">
            <h3 className="font-bold sm:col-span-2">
              Corregir · {editing.user.name} · {editing.record.workDate}
            </h3>
            <Input
              label="Entrada"
              onChange={(e) => setClockIn(e.target.value)}
              type="datetime-local"
              value={clockIn}
            />
            <Input
              label="Salida"
              onChange={(e) => setClockOut(e.target.value)}
              type="datetime-local"
              value={clockOut}
            />
            <label className="grid gap-1 text-sm font-bold sm:col-span-2">
              Motivo obligatorio
              <textarea
                className="min-h-20 rounded-xl border border-outline-variant p-3 font-normal"
                maxLength="500"
                minLength="5"
                onChange={(e) => setReason(e.target.value)}
                value={reason}
              />
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button onClick={() => setEditing(null)} variant="secondary">
                Cancelar
              </Button>
              <Button disabled={reason.trim().length < 5} onClick={save}>
                Guardar corrección
              </Button>
            </div>
          </div>
        ) : null}
        <div className="max-h-[55vh] overflow-auto rounded-2xl border border-outline-variant">
          <div className="grid gap-2 p-2 md:hidden">
            {items.map((item) => (
              <article
                className="rounded-2xl border border-outline-variant bg-white p-3"
                key={item.record.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{item.user.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {item.record.workDate}
                    </p>
                  </div>
                  <button
                    aria-label={`Corregir asistencia de ${item.user.name}`}
                    className="material-symbols-outlined grid min-h-10 min-w-10 place-items-center rounded-full text-primary hover:bg-primary-fixed"
                    onClick={() => begin(item)}
                    type="button"
                  >
                    edit
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-surface-container-low p-2">
                    <dt className="font-bold uppercase text-on-surface-variant">
                      Entrada
                    </dt>
                    <dd className="mt-1">
                      {item.record.clockInAt
                        ? new Date(item.record.clockInAt).toLocaleString("es-PE")
                        : "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-2">
                    <dt className="font-bold uppercase text-on-surface-variant">
                      Salida
                    </dt>
                    <dd className="mt-1">
                      {item.record.clockOutAt
                        ? new Date(item.record.clockOutAt).toLocaleString("es-PE")
                        : "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-2">
                    <dt className="font-bold uppercase text-on-surface-variant">
                      Horas
                    </dt>
                    <dd className="mt-1 font-bold">
                      {item.record.workedMinutes == null
                        ? "—"
                        : `${Math.floor(item.record.workedMinutes / 60)}h ${item.record.workedMinutes % 60}m`}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-2">
                    <dt className="font-bold uppercase text-on-surface-variant">
                      Estado
                    </dt>
                    <dd className={`mt-1 font-bold ${item.record.late ? "text-error" : "text-primary"}`}>
                      {item.record.late ? "Tardanza" : item.record.status}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 bg-surface-container-low">
              <tr>
                <th className="p-3">Fecha</th>
                <th>Colaborador</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  className="border-t border-outline-variant"
                  key={item.record.id}
                >
                  <td className="p-3">{item.record.workDate}</td>
                  <td className="font-bold">{item.user.name}</td>
                  <td>
                    {item.record.clockInAt
                      ? new Date(item.record.clockInAt).toLocaleString("es-PE")
                      : "—"}
                  </td>
                  <td>
                    {item.record.clockOutAt
                      ? new Date(item.record.clockOutAt).toLocaleString("es-PE")
                      : "—"}
                  </td>
                  <td>
                    {item.record.workedMinutes == null
                      ? "—"
                      : `${Math.floor(item.record.workedMinutes / 60)}h ${item.record.workedMinutes % 60}m`}
                  </td>
                  <td>{item.record.late ? "Tardanza" : item.record.status}</td>
                  <td>
                    <button
                      className="material-symbols-outlined rounded-full p-2 text-primary hover:bg-primary-fixed"
                      onClick={() => begin(item)}
                      type="button"
                    >
                      edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {!items.length ? (
            <p className="p-8 text-center text-sm text-on-surface-variant">
              Sin registros en este rango.
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

/* eslint-enable react-hooks/purity */
function DentalStaffDetailModal({ attendanceItem, onClose, user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("patients");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState("");
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    getDentalStaffSummary(user.id)
      .then(setData)
      .catch((requestError) => setError(requestError.message));
  }, [user.id]);
  const openPatient = async (summary) => {
    setPatientLoading(true);
    setPatientError("");
    try {
      const [patients, chart] = await Promise.all([
        getPatients(summary.document || summary.name),
        getDentalChart(summary.id),
      ]);
      const patient = patients.find((item) => item.id === summary.id);
      if (!patient)
        throw new Error("No se encontró el expediente del paciente");
      setSelectedPatient({ patient, chart });
    } catch (requestError) {
      setPatientError(requestError.message);
    } finally {
      setPatientLoading(false);
    }
  };
  const metrics = data?.metrics;
  return (
    <Modal
      contentClassName="min-h-0 overflow-hidden"
      dialogClassName="sm:max-w-5xl"
      onClose={onClose}
      title={`Perfil operativo · ${user.name}`}
    >
      <div className="grid max-h-[min(78vh,46rem)] min-h-0 gap-3 overflow-y-auto p-3 sm:p-4">
        {!data && !error ? (
          <p className="p-8 text-center text-on-surface-variant">
            Conectando información clínica...
          </p>
        ) : null}
        {error ? (
          <div className="rounded-2xl bg-error-container p-4 text-sm text-error">
            <b>No se pudo cargar el perfil.</b>
            <p>{error}</p>
          </div>
        ) : null}
        {data ? (
          <>
            <section className="flex flex-col gap-3 rounded-2xl bg-primary-fixed/60 p-3 sm:flex-row sm:items-center">
              <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary text-xl font-bold text-white">
                {data.user.avatarUrl ? (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={data.user.avatarUrl}
                  />
                ) : (
                  data.user.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold">{data.user.name}</h3>
                <p className="truncate text-sm text-on-surface-variant">
                  {data.user.position || "Colaborador dental"} ·{" "}
                  {data.user.site || "Sin sede"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {data.functions.map((item) => (
                    <span
                      className="rounded-full bg-white px-2 py-1 text-xs font-bold text-primary"
                      key={item.id}
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid shrink-0 gap-1 text-xs text-on-surface-variant">
                <span>{data.user.email}</span>
                <span>{data.user.phone || "Sin teléfono"}</span>
              </div>
            </section>
            <AttendanceSummary item={attendanceItem} />
            <HorizontalScroller
              className="gap-2 pb-2"
              label="Indicadores del colaborador"
            >
              {[
                [
                  "Pacientes atendidos",
                  metrics.patientsAttended,
                  "personal_injury",
                ],
                ["Atenciones", metrics.totalAttentions, "dentistry"],
                [
                  "Próximas citas",
                  metrics.upcomingAppointments,
                  "calendar_month",
                ],
                ["Finalizadas", metrics.completedAttentions, "task_alt"],
              ].map(([label, value, icon]) => (
                <div
                  className="w-[min(68vw,13.5rem)] shrink-0 snap-start rounded-2xl border border-outline-variant bg-white p-3 sm:w-[calc((100%_-_1.5rem)/4)]"
                  key={label}
                >
                  <span className="material-symbols-outlined text-primary">
                    {icon}
                  </span>
                  <b className="mt-1 block text-2xl">{value}</b>
                  <span className="text-xs text-on-surface-variant">
                    {label}
                  </span>
                </div>
              ))}
            </HorizontalScroller>
            <nav
              className="grid grid-cols-2 gap-1 rounded-2xl border border-outline-variant bg-surface-container-low p-1"
              aria-label="Detalle del colaborador"
            >
              <button
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold transition ${tab === "patients" ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-white"}`}
                onClick={() => setTab("patients")}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">
                  personal_injury
                </span>
                <span className="truncate">Pacientes</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${tab === "patients" ? "bg-white/20" : "bg-white text-primary"}`}
                >
                  {data.patients.length}
                </span>
              </button>
              <button
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-bold transition ${tab === "agenda" ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-white"}`}
                onClick={() => setTab("agenda")}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">
                  event_upcoming
                </span>
                <span className="truncate">Próxima agenda</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${tab === "agenda" ? "bg-white/20" : "bg-white text-primary"}`}
                >
                  {data.upcoming.length}
                </span>
              </button>
            </nav>
            {tab === "patients" && data.patients.length ? (
              <HorizontalScroller
                className="gap-2 pb-2"
                label="Pacientes atendidos"
              >
                {data.patients.map((patient) => (
                  <button
                    className="group w-[min(76vw,19rem)] shrink-0 snap-start rounded-2xl border border-outline-variant bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md sm:w-[calc((100%_-_0.5rem)/2)] lg:w-[calc((100%_-_1rem)/3)]"
                    data-drag-card
                    disabled={patientLoading}
                    key={patient.id}
                    onClick={() => openPatient(patient)}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-fixed font-bold text-primary">
                        {patient.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <b className="block truncate">{patient.name}</b>
                        <span className="block truncate text-xs text-on-surface-variant">
                          {patient.document
                            ? `${patient.documentType || "Documento"} ${patient.document}`
                            : "Sin documento"}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-primary">
                        {patientLoading ? "progress_activity" : "visibility"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-outline-variant pt-2 text-xs">
                      <span className="text-on-surface-variant">
                        Última atención
                      </span>
                      <b className="truncate text-right">
                        {patient.lastAttentionAt
                          ? new Date(
                              patient.lastAttentionAt,
                            ).toLocaleDateString("es-PE")
                          : "Sin fecha"}
                      </b>
                    </div>
                  </button>
                ))}
              </HorizontalScroller>
            ) : null}
            {tab === "patients" && !data.patients.length ? (
              <p className="rounded-2xl border border-dashed border-outline-variant p-6 text-center text-sm text-on-surface-variant">
                Este colaborador aún no registra pacientes atendidos.
              </p>
            ) : null}
            {patientError ? (
              <p className="rounded-xl bg-error-container p-3 text-sm text-error">
                {patientError}
              </p>
            ) : null}
            {tab === "agenda" && data.upcoming.length ? (
              <HorizontalScroller className="gap-2 pb-2" label="Próxima agenda">
                {data.upcoming.map((item) => (
                  <Link
                    className="w-[min(78vw,20rem)] shrink-0 snap-start rounded-2xl border border-outline-variant bg-white p-3 transition hover:border-primary hover:bg-primary-fixed/30 sm:w-[calc((100%_-_0.5rem)/2)] lg:w-[calc((100%_-_1rem)/3)]"
                    key={item.id}
                    to="/dashboard/appointments"
                  >
                    <div className="flex justify-between gap-3">
                      <b className="truncate">
                        {item.patient?.name || "Paciente"}
                      </b>
                      <span className="shrink-0 rounded-full bg-primary-fixed px-2 py-1 text-xs font-bold text-primary">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {new Date(item.startsAt).toLocaleString("es-PE")}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {item.reason || "Atención dental"}
                    </p>
                  </Link>
                ))}
              </HorizontalScroller>
            ) : null}
            {tab === "agenda" && !data.upcoming.length ? (
              <p className="rounded-2xl border border-dashed border-outline-variant p-6 text-center text-sm text-on-surface-variant">
                No tiene próximas citas asignadas.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
      {selectedPatient ? (
        <OdontogramModal
          admin
          chart={selectedPatient.chart}
          close={() => setSelectedPatient(null)}
          exporting={exporting}
          onExport={async (format) => {
            setExporting(true);
            try {
              await exportDentalChart(selectedPatient.patient.id, format);
            } finally {
              setExporting(false);
            }
          }}
          patient={selectedPatient.patient}
        />
      ) : null}
    </Modal>
  );
}

function UserForm({
  access,
  health,
  medicalServices,
  onClose,
  onSaved,
  professionalProfile,
  user,
}) {
  const initialPositionId = user?.positionId || access.positions[0]?.id || "";
  const initialPosition = access.positions.find(
    (item) => item.id === initialPositionId,
  );
  const initialFunctionCodes =
    hospitalityPositionFunctions[initialPosition?.code] || [];
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [summaryData, setSummaryData] = useState({
    name: user?.name || "",
    document: user?.document || "",
    email: user?.email || "",
    phone: user?.phone || "",
    site: user?.site || "",
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const formRef = useRef(null);
  const [positionId, setPositionId] = useState(initialPositionId);
  const [functionIds, setFunctionIds] = useState(
    () =>
      user?.functions?.map((item) => item.id) ||
      access.functions
        .filter((item) => initialFunctionCodes.includes(item.code))
        .map((item) => item.id),
  );
  const selectedFunctions = access.functions.filter((item) =>
    functionIds.includes(item.id),
  );
  const hasClinicalFunction = selectedFunctions.some((item) =>
    item.permissions.some((permission) =>
      ["health.records.create", "health.results.create"].includes(permission),
    ),
  );
  const [attendsPatients, setAttendsPatients] = useState(
    Boolean(professionalProfile),
  );
  const [professionalData, setProfessionalData] = useState({
    professionalType: professionalProfile?.professionalType || "",
    specialty: professionalProfile?.specialty || "",
    licenseNumber: professionalProfile?.licenseNumber || "",
    appointmentDurationMinutes:
      String(professionalProfile?.appointmentDurationMinutes || 30),
    medicalServiceIds: professionalProfile?.serviceTypeIds || [],
  });
  const effectivePermissions = [
    ...new Set(selectedFunctions.flatMap((item) => item.permissions)),
  ];
  const changePosition = (event) => {
    const value = event.target.value;
    setPositionId(value);
    const position = access.positions.find((item) => item.id === value);
    const defaults = hospitalityPositionFunctions[position?.code];
    if (defaults)
      setFunctionIds(
        access.functions
          .filter((item) => defaults.includes(item.code))
          .map((item) => item.id),
      );
  };
  const toggleFunction = (id, checked) =>
    setFunctionIds((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((item) => item !== id),
    );
  const selectAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen válida.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("La foto debe pesar como máximo 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result));
      setError("");
    };
    reader.readAsDataURL(file);
  };
  const nextStep = () => {
    setError("");
    if (step === 0) {
      const fields = [...formRef.current.querySelectorAll("[data-personal]")];
      const invalid = fields.find((field) => !field.checkValidity());
      if (invalid) {
        setError(
          invalid.validity.valueMissing
            ? "Completa los campos obligatorios para continuar."
            : "Revisa el formato del campo señalado y los requisitos de la contraseña.",
        );
        invalid.focus();
        return;
      }
      const elements = formRef.current.elements;
      setSummaryData({
        name: elements.name.value,
        document: elements.document.value,
        email: elements.email.value,
        phone: elements.phone.value,
        site: elements.site.value || "Sin sede",
      });
    }
    if (step === 1 && !functionIds.length) {
      setError(
        "Selecciona al menos una función para habilitar el acceso operativo.",
      );
      return;
    }
    if (step === 1 && health && attendsPatients) {
      if (!hasClinicalFunction) {
        setError("Selecciona una función clínica compatible para habilitar la atención.");
        return;
      }
      if (
        professionalData.professionalType.trim().length < 2 ||
        professionalData.specialty.trim().length < 2 ||
        professionalData.licenseNumber.trim().length < 4 ||
        !professionalData.medicalServiceIds.length
      ) {
        setError("Completa el perfil profesional y al menos un servicio clínico.");
        return;
      }
    }
    setStep((current) => Math.min(2, current + 1));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const data = {
      name: form.get("name"),
      document: form.get("document"),
      email: form.get("email"),
      phone: form.get("phone"),
      site: form.get("site"),
      avatarUrl,
      positionId: positionId || null,
      functionIds,
    };
    if (!user) data.password = form.get("password");
    try {
      const savedUser = user
        ? await userService.updateUser(user.id, data)
        : await userService.createUser(data);
      if (health && attendsPatients) {
        const profileData = {
          userId: savedUser.id,
          professionalType: professionalData.professionalType,
          specialty: professionalData.specialty,
          licenseNumber: professionalData.licenseNumber,
          appointmentDurationMinutes: Number(
            professionalData.appointmentDurationMinutes,
          ),
          medicalServiceIds: professionalData.medicalServiceIds,
        };
        if (professionalProfile) {
          await updateMedicalProfessionalProfile(savedUser.id, profileData);
        } else {
          await createMedicalProfessionalProfile(profileData);
        }
      }
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const steps = [
    ["person", "Datos"],
    ["badge", "Cargo y funciones"],
    ["verified_user", "Confirmar"],
  ];
  return (
    <Modal
      contentClassName="min-h-0 overflow-y-auto"
      dialogClassName="sm:max-w-4xl"
      onClose={onClose}
      title={user ? "Editar colaborador" : "Nuevo colaborador"}
    >
      <form
        className="flex min-h-0 flex-col"
        noValidate
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <div className="shrink-0 border-b border-outline-variant px-4 py-2.5 sm:px-5">
          <ol className="grid grid-cols-3 gap-2">
            {steps.map((item, index) => (
              <li
                className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-2 text-xs font-bold sm:px-3 sm:text-sm ${index === step ? "bg-primary text-white shadow-sm" : index < step ? "bg-primary-fixed text-primary" : "bg-surface-container-low text-on-surface-variant"}`}
                key={item[1]}
              >
                <span className="material-symbols-outlined text-lg">
                  {index < step ? "check" : item[0]}
                </span>
                <span className="truncate">{item[1]}</span>
              </li>
            ))}
          </ol>
        </div>
        {error ? (
          <div className="mx-4 mt-3 shrink-0 rounded-xl bg-error-container p-3 text-sm text-on-error-container sm:mx-5">
            {error}
          </div>
        ) : null}
        <div className="min-h-0 flex-1 p-4 sm:p-5">
          <div
            className={
              step === 0
                ? "mb-4 flex items-center gap-4 rounded-2xl bg-surface-container-low p-3"
                : "hidden"
            }
          >
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary text-xl font-bold text-white">
              {avatarUrl ? (
                <img
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                  src={avatarUrl}
                />
              ) : (
                <span className="material-symbols-outlined text-3xl">
                  person
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                Foto del colaborador{" "}
                <span className="font-normal text-on-surface-variant">
                  (opcional)
                </span>
              </p>
              <p className="text-xs text-on-surface-variant">
                JPG, PNG o WebP · máximo 2 MB
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 text-sm font-bold text-primary">
                  <span className="material-symbols-outlined text-lg">
                    add_a_photo
                  </span>
                  {avatarUrl ? "Cambiar foto" : "Agregar foto"}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={selectAvatar}
                    type="file"
                  />
                </label>
                {avatarUrl ? (
                  <button
                    className="min-h-9 rounded-xl px-3 text-sm font-bold text-error hover:bg-error-container"
                    onClick={() => setAvatarUrl("")}
                    type="button"
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <section
            className={step === 0 ? "grid gap-4 sm:grid-cols-2" : "hidden"}
          >
            <Input
              data-personal
              defaultValue={user?.name || ""}
              label="Nombre"
              maxLength="120"
              minLength="2"
              name="name"
              required
            />
            <Input
              data-personal
              defaultValue={user?.document || ""}
              inputMode="numeric"
              label="DNI"
              maxLength="8"
              minLength="8"
              name="document"
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 8);
              }}
              pattern="\d{8}"
              required
            />
            <Input
              data-personal
              defaultValue={user?.email || ""}
              label="Correo"
              maxLength="254"
              name="email"
              required
              type="email"
            />
            <Input
              data-personal
              defaultValue={user?.phone || ""}
              inputMode="numeric"
              label="Teléfono"
              maxLength="9"
              minLength="9"
              name="phone"
              onInput={(event) => {
                event.currentTarget.value = event.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 9);
              }}
              pattern="9[0-9]{8}"
              required
              type="tel"
            />
            <Input
              data-personal
              defaultValue={user?.site || ""}
              label="Sede"
              maxLength="120"
              name="site"
            />
            {!user ? (
              <div className="sm:col-span-2">
                <PasswordField
                  data-personal
                  helperText="El operador la usará una vez para iniciar sesión y luego creará una definitiva."
                  label="Contraseña temporal"
                  minLength="8"
                  name="password"
                  required
                  showFeedback
                />
              </div>
            ) : null}
          </section>
          <section className={step === 1 ? "grid gap-4" : "hidden"}>
            <label className="grid gap-1 text-sm font-semibold">
              Cargo principal
              <select
                className="min-h-11 rounded-xl border border-outline-variant bg-white px-3"
                onChange={changePosition}
                value={positionId}
              >
                {access.positions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <small className="font-normal text-on-surface-variant">
                Selecciona una base y ajusta las funciones necesarias.
              </small>
            </label>
            <fieldset>
              <legend className="font-bold">Funciones del empleado</legend>
              <p className="mb-3 text-sm text-on-surface-variant">
                Las vistas del operario se generan con esta selección.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {access.functions.map((item) => {
                  const checked = functionIds.includes(item.id);
                  return (
                    <label
                      className={`flex min-h-20 cursor-pointer gap-3 rounded-xl border p-3 transition ${checked ? "border-primary bg-primary-fixed/40" : "border-outline-variant hover:border-primary"}`}
                      key={item.id}
                    >
                      <input
                        checked={checked}
                        onChange={(event) =>
                          toggleFunction(item.id, event.target.checked)
                        }
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <b className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary">
                            {item.icon}
                          </span>
                          <span className="truncate">{item.name}</span>
                        </b>
                        <small className="text-on-surface-variant">
                          {item.permissions.length} permisos
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {health ? (
              <section className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    checked={attendsPatients}
                    disabled={!hasClinicalFunction && !professionalProfile}
                    onChange={(event) => {
                      const next = event.target.checked;
                      setAttendsPatients(next);
                      if (next && !professionalData.medicalServiceIds.length) {
                        setProfessionalData((current) => ({
                          ...current,
                          medicalServiceIds: medicalServices.map((item) => item.id),
                        }));
                      }
                    }}
                    type="checkbox"
                  />
                  <span>
                    <b className="block">También atenderá pacientes</b>
                    <span className="text-on-surface-variant">
                      Crea un perfil profesional sobre esta misma cuenta y la habilita en la agenda.
                    </span>
                  </span>
                </label>
                {attendsPatients ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Tipo de profesional"
                      minLength="2"
                      onChange={(event) =>
                        setProfessionalData((current) => ({ ...current, professionalType: event.target.value }))
                      }
                      value={professionalData.professionalType}
                    />
                    <Input
                      label="Especialidad"
                      minLength="2"
                      onChange={(event) =>
                        setProfessionalData((current) => ({ ...current, specialty: event.target.value }))
                      }
                      value={professionalData.specialty}
                    />
                    <Input
                      label="Colegiatura o licencia"
                      minLength="4"
                      onChange={(event) =>
                        setProfessionalData((current) => ({ ...current, licenseNumber: event.target.value.toUpperCase() }))
                      }
                      value={professionalData.licenseNumber}
                    />
                    <Input
                      label="Duración promedio (minutos)"
                      max="480"
                      min="5"
                      onChange={(event) =>
                        setProfessionalData((current) => ({ ...current, appointmentDurationMinutes: event.target.value }))
                      }
                      type="number"
                      value={professionalData.appointmentDurationMinutes}
                    />
                    <fieldset className="sm:col-span-2">
                      <legend className="text-sm font-bold">Servicios que realizará</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {medicalServices.map((item) => {
                          const checked = professionalData.medicalServiceIds.includes(item.id);
                          return (
                            <label className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-bold ${checked ? "border-primary bg-primary text-white" : "border-outline-variant bg-white"}`} key={item.id}>
                              <input
                                checked={checked}
                                className="sr-only"
                                onChange={(event) =>
                                  setProfessionalData((current) => ({
                                    ...current,
                                    medicalServiceIds: event.target.checked
                                      ? [...current.medicalServiceIds, item.id]
                                      : current.medicalServiceIds.filter((id) => id !== item.id),
                                  }))
                                }
                                type="checkbox"
                              />
                              {item.name}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                    <p className="text-xs text-on-surface-variant sm:col-span-2">
                      El horario inicial se crea de lunes a viernes, de 09:00 a 18:00. Puedes ajustarlo desde el botón de horario del colaborador.
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}
          </section>
          <section className={step === 2 ? "grid gap-4" : "hidden"}>
            <div className="rounded-2xl bg-primary-fixed p-4">
              <p className="text-xs font-bold uppercase text-primary">
                Resumen del colaborador
              </p>
              <h3 className="mt-1 text-lg font-bold">{summaryData.name}</h3>
              <p className="text-sm text-on-surface-variant">
                Revisa la información antes de guardar los cambios.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["badge", "DNI", summaryData.document],
                ["mail", "Correo", summaryData.email],
                ["phone", "Teléfono", summaryData.phone],
                ["location_on", "Sede", summaryData.site],
                [
                  "badge",
                  "Cargo",
                  access.positions.find((item) => item.id === positionId)
                    ?.name || "Sin cargo",
                ],
                [
                  "work",
                  "Funciones",
                  selectedFunctions.map((item) => item.name).join(", ") ||
                    "Sin funciones",
                ],
                ...(!user
                  ? [["password", "Contraseña", "Contraseña temporal definida"]]
                  : []),
              ].map((item) => (
                <div
                  className="min-w-0 rounded-2xl border border-outline-variant p-3"
                  key={item[1]}
                >
                  <span className="material-symbols-outlined text-lg text-primary">
                    {item[0]}
                  </span>
                  <p className="mt-1 text-xs font-bold uppercase text-on-surface-variant">
                    {item[1]}
                  </p>
                  <p className="break-words text-sm font-bold">{item[2]}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-outline-variant p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-bold">
                  <span className="material-symbols-outlined text-primary">
                    verified_user
                  </span>
                  Accesos que se habilitarán
                </h3>
                <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                  {effectivePermissions.length} permisos
                </span>
              </div>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {effectivePermissions.map((permission) => (
                  <li className="flex gap-2" key={permission}>
                    <span className="material-symbols-outlined text-base text-emerald-700">
                      check_circle
                    </span>
                    <span>{permissionLabels[permission] || permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-outline-variant bg-white p-3 sm:px-5">
          <Button
            onClick={step ? () => setStep((current) => current - 1) : onClose}
            type="button"
            variant="secondary"
          >
            {step ? "Atrás" : "Cancelar"}
          </Button>
          {step < 2 ? (
            <Button onClick={nextStep} type="button">
              Continuar
            </Button>
          ) : (
            <Button disabled={saving} type="submit">
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          )}
        </footer>
      </form>
    </Modal>
  );
}

export default function Team() {
  const { config } = useAppConfig();
  const hospitality = config?.template?.dashboardKey === "hospitality";
  const dental = config?.template?.dashboardKey === "dental";
  const health = config?.template?.dashboardKey === "health";
  const veterinary = config?.template?.dashboardKey === "veterinary";
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [cleaningStats, setCleaningStats] = useState({});
  const [attendance, setAttendance] = useState({});
  const [access, setAccess] = useState({ positions: [], functions: [] });
  const [medicalServices, setMedicalServices] = useState([]);
  const [professionalProfiles, setProfessionalProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [scheduleUser, setScheduleUser] = useState(null);
  const [businessScheduleOpen, setBusinessScheduleOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [query, setQuery] = useState("");
  const [functionFilter, setFunctionFilter] = useState("all");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [team, accessCatalog, housekeeping, attendanceToday, professionals, businessServices] =
        await Promise.all([
          userService.getUsers(),
          userService.getAccessCatalog(),
          hospitality
            ? getHospitalityStaffDashboard()
            : Promise.resolve({ employees: [] }),
          getTodayAttendance(),
          health ? getMedicalProfessionals() : Promise.resolve([]),
          health ? getBusinessMedicalServices() : Promise.resolve([]),
        ]);
      setUsers(team);
      setAccess(accessCatalog);
      setProfessionalProfiles(professionals);
      setMedicalServices(businessServices.map((item) => item.serviceType));
      setCleaningStats(
        Object.fromEntries(
          housekeeping.employees.map((item) => [item.employee, item]),
        ),
      );
      setAttendance(
        Object.fromEntries(attendanceToday.map((item) => [item.user.id, item])),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [health, hospitality]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(load, ["/users", "/hospitality", "/attendance", "/medical"]);
  useEffect(() => {
    if (!hospitality) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === "visible")
        getHospitalityStaffDashboard()
          .then((data) =>
            setCleaningStats(
              Object.fromEntries(
                data.employees.map((item) => [item.employee, item]),
              ),
            ),
          )
          .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [hospitality]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible")
        getTodayAttendance()
          .then((items) =>
            setAttendance(
              Object.fromEntries(items.map((item) => [item.user.id, item])),
            ),
          )
          .catch(() => {});
    };
    const id = setInterval(refresh, 15000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const saved = async () => {
    setEditing(undefined);
    await load();
    showToast({ title: "Equipo actualizado", tone: "success" });
  };
  const remove = async () => {
    try {
      await userService.deleteUser(deleting.id);
      setDeleting(null);
      await load();
      showToast({ title: "Operador eliminado", tone: "warning" });
    } catch (requestError) {
      showToast({
        message: requestError.message,
        title: "No se pudo eliminar",
        tone: "error",
      });
    }
  };
  const teamUsers = users.filter((user) => user.role === "operator");
  const visibleUsers = teamUsers.filter(
    (user) =>
      (functionFilter === "all" ||
        user.functions?.some((fn) => fn.id === functionFilter)) &&
      matchesEntitySearch(user, query, (item) => [
        item.name,
        item.document,
        item.email,
        item.phone,
        item.site,
        ...(item.functions?.map((fn) => fn.name) || []),
      ]),
  );
  return (
    <DashboardShell
      action={
        <Button
          icon="person_add"
          onClick={() => setEditing(null)}
          type="button"
        >
          {dental || veterinary || health ? "Agregar colaborador" : "Agregar operador"}
        </Button>
      }
      subtitle={
        dental
          ? "Asigna funciones clínicas sin exponer cobros, reportes ni datos administrativos."
          : health
            ? "Asigna funciones, perfiles profesionales y horarios sin duplicar cuentas."
          : veterinary
            ? "Organiza médicos, recepción, asistentes y estética con sus accesos correspondientes."
            : "Administra quién puede acceder al inventario de tu negocio."
      }
      title={
        dental ? "Equipo dental" : health ? "Equipo médico" : veterinary ? "Equipo veterinario" : "Equipo"
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        <Button
          className="min-w-0 px-2 text-xs sm:px-4 sm:text-sm"
          icon="storefront"
          onClick={() => setBusinessScheduleOpen(true)}
          type="button"
          variant="secondary"
        >
          Horario del negocio
        </Button>
        <Button
          className="min-w-0 px-2 text-xs sm:px-4 sm:text-sm"
          icon="event_note"
          onClick={() => setAttendanceOpen(true)}
          type="button"
          variant="secondary"
        >
          Asistencia e historial
        </Button>
      </div>
      {loading ? <Card className="p-6">Cargando equipo...</Card> : null}
      {!loading && error ? (
        <EmptyState
          action={{ children: "Reintentar", onClick: load }}
          description={error}
          icon="cloud_off"
          title="No se pudo cargar el equipo"
        />
      ) : null}
      {!loading && !error ? (
        <section className="grid gap-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant bg-white p-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                aria-label="Buscar colaborador"
                className="min-h-11 w-full rounded-xl border border-outline-variant pl-11 pr-3"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, DNI, celular, correo o función"
                value={query}
              />
            </label>
            <select
              aria-label="Filtrar por función"
              className="min-h-11 rounded-xl border border-outline-variant bg-white px-3"
              onChange={(event) => setFunctionFilter(event.target.value)}
              value={functionFilter}
            >
              <option value="all">Todas las funciones</option>
              {access.functions.map((fn) => (
                <option key={fn.id} value={fn.id}>
                  {fn.name}
                </option>
              ))}
            </select>
            <span className="shrink-0 text-sm font-bold text-on-surface-variant">
              {visibleUsers.length} de {teamUsers.length}
            </span>
          </div>
          {visibleUsers.length ? (
            <HorizontalScroller
              className="pb-5"
              label="Colaboradores del equipo"
            >
              {visibleUsers.map((user) => (
                <Card
                  className="flex w-[min(88vw,22rem)] shrink-0 snap-start flex-col overflow-hidden p-0 sm:w-[calc((100%_-_0.75rem)/2)] xl:w-[calc((100%_-_1.5rem)/3)]"
                  key={user.id}
                >
                  <div className="relative h-[clamp(11rem,22vh,14rem)] shrink-0 overflow-hidden bg-gradient-to-br from-primary to-primary-container">
                    {user.avatarUrl ? (
                      <img
                        alt={`Foto de ${user.name}`}
                        className="h-full w-full object-cover"
                        src={user.avatarUrl}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-5xl font-bold text-white/90 sm:text-6xl">
                        {user.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                    )}
                    <span className="absolute right-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                      {user.position?.name || "Operador"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <h3 className="truncate text-lg font-bold">
                        {user.name}
                      </h3>
                      <p className="truncate text-xs text-on-surface-variant">
                        {user.site || "Sin sede"} · DNI{" "}
                        {user.document || "No registrado"}
                      </p>
                    </div>
                    <div className="grid gap-1 text-sm text-on-surface-variant">
                      <p className="flex min-w-0 items-center gap-2">
                        <span className="material-symbols-outlined text-base">
                          mail
                        </span>
                        <span className="truncate">{user.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">
                          phone
                        </span>
                        {user.phone || "Sin teléfono"}
                      </p>
                    </div>
                    {user.mustChangePassword ? (
                      <p className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                        <span className="material-symbols-outlined text-base">
                          key
                        </span>
                        Cambio de contraseña pendiente
                      </p>
                    ) : null}
                    <div className="flex min-h-8 flex-wrap content-start gap-1">
                      {user.functions?.slice(0, 3).map((fn) => (
                        <span
                          className="rounded-full bg-primary-fixed px-2 py-1 text-xs font-bold text-primary"
                          key={fn.id}
                        >
                          {fn.name}
                        </span>
                      ))}
                      {user.functions?.length > 3 ? (
                        <span className="rounded-full bg-surface-container-high px-2 py-1 text-xs font-bold">
                          +{user.functions.length - 3}
                        </span>
                      ) : null}
                      {!user.functions?.length && user.role === "operator" ? (
                        <span className="text-xs font-bold text-error">
                          Sin función asignada
                        </span>
                      ) : null}
                    </div>
                    <AttendanceSummary item={attendance[user.id]} />
                    {hospitality && cleaningStats[user.name] ? (
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-xl bg-surface-container-low p-2">
                          <b className="text-lg text-primary">
                            {cleaningStats[user.name].completed}
                          </b>
                          <p className="text-[11px] text-on-surface-variant">
                            Limpiezas
                          </p>
                        </div>
                        <div className="rounded-xl bg-surface-container-low p-2">
                          <b className="text-lg">
                            {cleaningStats[user.name].averageMinutes} min
                          </b>
                          <p className="text-[11px] text-on-surface-variant">
                            Promedio
                          </p>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-auto flex gap-2">
                      <Button
                        aria-label={`Horario de ${user.name}`}
                        className="!w-11 !min-w-11 !shrink-0 !px-0"
                        icon="schedule"
                        onClick={() => setScheduleUser(user)}
                        type="button"
                        variant="secondary"
                      />
                      {dental ? (
                        <Button
                          aria-label={`Ver pacientes y actividad de ${user.name}`}
                          className="!w-11 !min-w-11 !shrink-0 !px-0"
                          icon="clinical_notes"
                          onClick={() => setDetailUser(user)}
                          type="button"
                          variant="secondary"
                        />
                      ) : null}
                      <Button
                        aria-label={`Restablecer contraseña de ${user.name}`}
                        className="!w-11 !min-w-11 !shrink-0 !px-0"
                        icon="key"
                        onClick={() => setPasswordResetUser(user)}
                        title="Restablecer contraseña"
                        type="button"
                        variant="secondary"
                      />
                      <Button
                        className="!w-auto min-w-0 flex-1 whitespace-nowrap !px-2"
                        icon="manage_accounts"
                        onClick={() => setEditing(user)}
                        type="button"
                        variant="secondary"
                      >
                        Editar
                      </Button>
                      <Button
                        aria-label={`Eliminar a ${user.name}`}
                        className="!w-11 !min-w-11 !shrink-0 !px-0"
                        icon="delete"
                        onClick={() => setDeleting(user)}
                        type="button"
                        variant="danger"
                      />
                      {!hospitality && !dental ? (
                        <Link
                          className="grid min-h-11 min-w-11 place-items-center rounded-xl bg-primary text-white"
                          title="Rendimiento"
                          to={`/dashboard/team/${user.id}`}
                        >
                          <span className="material-symbols-outlined">
                            monitoring
                          </span>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </HorizontalScroller>
          ) : (
            <EmptyState
              description={
                teamUsers.length
                  ? "Prueba otra búsqueda o función."
                  : "Esta empresa todavía no tiene operarios. Agrega el primer colaborador para asignarle un cargo y sus accesos."
              }
              icon="person_search"
              title={
                teamUsers.length
                  ? "No encontramos colaboradores"
                  : "Aún no hay colaboradores"
              }
            />
          )}
        </section>
      ) : null}
      {editing !== undefined ? (
        <UserForm
          access={access}
          health={health}
          medicalServices={medicalServices}
          onClose={() => setEditing(undefined)}
          onSaved={saved}
          professionalProfile={professionalProfiles.find(
            (profile) => profile.userId === editing?.id,
          )}
          user={editing}
        />
      ) : null}
      {scheduleUser ? (
        <ScheduleModal
          onClose={() => setScheduleUser(null)}
          user={scheduleUser}
        />
      ) : null}
      {businessScheduleOpen ? (
        <BusinessScheduleModal
          onClose={() => setBusinessScheduleOpen(false)}
          onSaved={load}
        />
      ) : null}
      {attendanceOpen ? (
        <AttendanceHistoryModal
          onClose={() => setAttendanceOpen(false)}
          users={teamUsers}
        />
      ) : null}
      {detailUser ? (
        <DentalStaffDetailModal
          attendanceItem={attendance[detailUser.id]}
          onClose={() => setDetailUser(null)}
          user={detailUser}
        />
      ) : null}
      {passwordResetUser ? (
        <AdminPasswordResetModal
          onClose={() => setPasswordResetUser(null)}
          onReset={(reason) =>
            userService.resetUserPassword(passwordResetUser.id, reason)
          }
          target={passwordResetUser}
        />
      ) : null}
      <ConfirmDialog
        description={`Se eliminara el acceso de ${deleting?.name || "este operador"}.`}
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
        open={Boolean(deleting)}
        title="Eliminar operador"
      />
    </DashboardShell>
  );
}
