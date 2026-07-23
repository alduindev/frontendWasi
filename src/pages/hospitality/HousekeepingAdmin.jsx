import { useCallback, useEffect, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import ConfirmDialog from "../../components/molecules/ConfirmDialog";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import {
  cancelHousekeepingTask,
  createHousekeepingTask,
  getHospitalityStaffDashboard,
  getRooms,
  updateHousekeepingTask,
} from "../../services/hospitalityService";
import { getUsers } from "../../services/userService";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";

const statusLabel = {
  pending: "Pendiente",
  assigned: "Asignada",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};
const priorityLabel = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};
const parseServerDate = (value) =>
  new Date(value?.endsWith("Z") ? value : `${value}Z`).getTime();
const clock = (seconds) =>
  `${Math.floor(Math.abs(seconds) / 60)}:${String(Math.abs(seconds) % 60).padStart(2, "0")}`;

function LiveTimer({ now, task }) {
  if (task.status !== "in_progress" || !task.startedAt)
    return (
      <p className="mt-3 rounded-xl bg-surface-container-low p-3 text-sm font-bold text-on-surface-variant">
        Esperando que el operario inicie · objetivo {task.expectedMinutes} min
      </p>
    );
  if (!now)
    return (
      <p className="mt-3 rounded-xl bg-primary-fixed p-3 text-sm font-bold">
        Iniciando contador...
      </p>
    );
  const elapsed = Math.max(
    0,
    Math.floor((now - parseServerDate(task.startedAt)) / 1000),
  );
  const remaining = task.expectedMinutes * 60 - elapsed;
  const percent = Math.min(
    100,
    Math.round((elapsed / (task.expectedMinutes * 60)) * 100),
  );
  return (
    <div
      className={`mt-3 rounded-xl p-3 ${remaining < 0 ? "bg-error-container text-on-error-container" : "bg-primary-fixed text-on-primary-fixed"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">
          {remaining < 0 ? "Tiempo excedido" : "Tiempo restante"}
        </span>
        <b className="font-mono text-xl">
          {remaining < 0 ? "+" : ""}
          {clock(remaining)}
        </b>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/60">
        <div
          className={`h-full ${remaining < 0 ? "bg-error" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs">Transcurrido: {clock(elapsed)}</p>
    </div>
  );
}

function CleaningRequestModal({ onClose, onSaved, rooms, staff }) {
  const eligibleRooms = rooms.filter((room) => room.status !== "inactive");
  const [roomId, setRoomId] = useState("");
  const [cleaningType, setCleaningType] = useState("Limpieza por salida");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [expectedMinutes, setExpectedMinutes] = useState(30);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedRoom = rooms.find((room) => room.id === roomId);
  const submit = async (event) => {
    event.preventDefault();
    if (!roomId) {
      setError("Selecciona la habitación que necesita limpieza.");
      return;
    }
    if (expectedMinutes < 5 || expectedMinutes > 480) {
      setError("El tiempo objetivo debe estar entre 5 y 480 minutos.");
      return;
    }
    setSaving(true);
    setError("");
    const detail = notes.trim();
    try {
      await createHousekeepingTask({
        roomId,
        assignedToId: assignedToId || null,
        priority,
        expectedMinutes,
        notes: `${cleaningType}${detail ? ` · ${detail}` : ""}`,
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={onClose} title="Nueva solicitud de limpieza">
      <form className="grid gap-5 p-4 sm:p-6" onSubmit={submit}>
        {error ? (
          <div className="flex gap-2 rounded-xl bg-error-container p-3 text-sm text-on-error-container">
            <span className="material-symbols-outlined text-lg">error</span>
            <p>{error}</p>
          </div>
        ) : null}
        <section>
          <h3 className="text-lg font-bold">1. Selecciona la habitación</h3>
          <p className="text-sm text-on-surface-variant">
            Desliza la lista; las habitaciones inactivas no se pueden
            seleccionar.
          </p>
          {eligibleRooms.length ? (
            <div className="mt-3">
              <HorizontalScroller label="Habitaciones para limpieza">
                {eligibleRooms.map((room) => {
                  const active = room.id === roomId;
                  return (
                    <button
                      aria-pressed={active}
                      className={`min-w-[220px] snap-start rounded-2xl border p-4 text-left ${active ? "border-primary bg-primary-fixed ring-2 ring-primary/20" : "border-outline-variant bg-white hover:border-primary"}`}
                      key={room.id}
                      onClick={() => {
                        setRoomId(room.id);
                        setError("");
                      }}
                      type="button"
                    >
                      <div className="flex justify-between">
                        <span className="material-symbols-outlined text-3xl text-primary">
                          bed
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold">
                          {room.status}
                        </span>
                      </div>
                      <b className="mt-3 block text-xl">
                        Habitación {room.number}
                      </b>
                      <p className="text-sm text-on-surface-variant">
                        Piso {room.floor} · {room.roomType}
                      </p>
                      {active ? (
                        <p className="mt-2 text-xs font-bold text-primary">
                          ✓ Seleccionada
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </HorizontalScroller>
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-error-container p-3 text-sm">
              No existen habitaciones habilitadas.
            </p>
          )}
        </section>
        <section className="grid gap-3">
          <div>
            <h3 className="text-lg font-bold">2. Trabajo y responsable</h3>
            <p className="text-sm text-on-surface-variant">
              El operario recibirá exactamente estas indicaciones.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold">
              Tipo de trabajo
              <select
                className="min-h-11 rounded-xl border border-outline-variant px-3 font-normal"
                onChange={(event) => setCleaningType(event.target.value)}
                value={cleaningType}
              >
                <option>Limpieza por salida</option>
                <option>Limpieza de rutina</option>
                <option>Limpieza profunda</option>
                <option>Incidente o derrame</option>
                <option>Inspección de habitación</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Responsable
              <select
                className="min-h-11 rounded-xl border border-outline-variant px-3 font-normal"
                onChange={(event) => setAssignedToId(event.target.value)}
                value={assignedToId}
              >
                <option value="">Asignar después</option>
                {staff.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Prioridad
              <select
                className="min-h-11 rounded-xl border border-outline-variant px-3 font-normal"
                onChange={(event) => setPriority(event.target.value)}
                value={priority}
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Tiempo objetivo (min)
              <input
                className="min-h-11 rounded-xl border border-outline-variant px-3 font-normal"
                max="480"
                min="5"
                onChange={(event) =>
                  setExpectedMinutes(Number(event.target.value))
                }
                required
                type="number"
                value={expectedMinutes}
              />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-bold">
            Indicaciones
            <textarea
              className="min-h-24 rounded-xl border border-outline-variant p-3 font-normal"
              maxLength="900"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej. cambiar sábanas, reponer dos toallas y revisar minibar"
              value={notes}
            />
          </label>
        </section>
        {selectedRoom ? (
          <div className="rounded-2xl bg-surface-container-low p-4 text-sm">
            <p className="font-bold">Resumen de asignación</p>
            <p className="mt-1">
              Habitación {selectedRoom.number} · {cleaningType} ·{" "}
              {priorityLabel[priority]} · {expectedMinutes} min
            </p>
            <p className="text-on-surface-variant">
              {staff.find((employee) => employee.id === assignedToId)?.name ||
                "Sin responsable por ahora"}
            </p>
          </div>
        ) : null}
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button
            disabled={saving}
            onClick={onClose}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
          <Button disabled={saving || !eligibleRooms.length} type="submit">
            {saving ? "Creando..." : "Crear y asignar limpieza"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function HousekeepingAdmin() {
  const [data, setData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [now, setNow] = useState(0);
  const [working, setWorking] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTask, setCancelTask] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    return Promise.all([getHospitalityStaffDashboard(), getRooms(), getUsers()])
      .then(([dashboard, roomItems, users]) => {
        setData(dashboard);
        setRooms(roomItems);
        setStaff(
          users.filter((user) =>
            user.functions?.some((fn) => fn.code === "housekeeping"),
          ),
        );
      })
      .catch((requestError) => setError(requestError.message));
  }, []);
  const refreshDashboard = useCallback(
    () =>
      getHospitalityStaffDashboard()
        .then(setData)
        .catch(() => {}),
    [],
  );
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useLiveRefresh(load, ["/hospitality", "/users"]);
  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refreshDashboard();
    }, 3000);
    return () => clearInterval(id);
  }, [refreshDashboard]);
  const assign = async (id, user) => {
    if (!user) return;
    setWorking(id);
    setError("");
    try {
      await updateHousekeepingTask(id, { assignedToId: user });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking("");
    }
  };
  const cancel = async () => {
    const task = cancelTask;
    if (!task) return;
    setWorking(task.id);
    setError("");
    try {
      await cancelHousekeepingTask(task.id);
      setCancelTask(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking("");
    }
  };
  const saved = async () => {
    setCreateOpen(false);
    await load();
  };
  const activeTasks =
    data?.tasks.filter((task) => task.status !== "cancelled") || [];
  return (
    <DashboardShell
      action={
        <Button icon="add" onClick={() => setCreateOpen(true)}>
          Solicitar limpieza
        </Button>
      }
      title="Control de limpieza"
      subtitle="Asignaciones, cuenta regresiva, alertas y productividad en tiempo real."
    >
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
      {data ? (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Pendientes", data.pending],
              ["En progreso", data.inProgress],
              ["Fuera de tiempo", data.overdue],
              ["Completadas", data.completed],
            ].map((metric) => (
              <Card className="p-4" key={metric[0]}>
                <p className="text-sm text-on-surface-variant">{metric[0]}</p>
                <b className="text-3xl text-primary">{metric[1]}</b>
              </Card>
            ))}
          </section>
          <section className="mt-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Operación activa</h2>
                <p className="text-sm text-on-surface-variant">
                  La lista conserva su altura y se desplaza internamente cuando
                  crece.
                </p>
              </div>
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">
                {activeTasks.length} tarea(s)
              </span>
            </div>
            <div className="grid max-h-[58vh] gap-3 overflow-y-auto overscroll-contain pr-2 lg:grid-cols-2">
              {activeTasks.map((task) => (
                <Card
                  className={`p-4 ${task.overdue ? "border-error" : ""}`}
                  key={task.id}
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <b>Habitación {task.room.number}</b>
                      <p className="text-sm text-on-surface-variant">
                        {task.assignedTo?.name || "Sin asignar"} · prioridad{" "}
                        {priorityLabel[task.priority] || task.priority}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {task.notes || "Sin indicaciones"}
                      </p>
                    </div>
                    <span className="h-fit rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold">
                      {statusLabel[task.status] || task.status}
                    </span>
                  </div>
                  <LiveTimer now={now} task={task} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!task.assignedTo &&
                    ["pending", "assigned"].includes(task.status) ? (
                      <select
                        className="rounded-xl border border-outline-variant p-2"
                        defaultValue=""
                        disabled={working === task.id}
                        onChange={(event) =>
                          assign(task.id, event.target.value)
                        }
                      >
                        <option value="">Asignar empleado</option>
                        {staff.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {["pending", "assigned"].includes(task.status) ? (
                      <Button
                        disabled={working === task.id}
                        onClick={() => setCancelTask(task)}
                        variant="danger"
                      >
                        Cancelar tarea
                      </Button>
                    ) : null}
                  </div>
                </Card>
              ))}
              {!activeTasks.length ? (
                <EmptyState
                  description="Crea una solicitud cuando una habitación necesite atención."
                  icon="cleaning_services"
                  title="Sin tareas activas"
                />
              ) : null}
            </div>
          </section>
          <section className="mt-6">
            <h2 className="text-xl font-bold">Productividad completada</h2>
            <p className="text-sm text-on-surface-variant">
              Se calcula cuando el operario finaliza una limpieza.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.employees.map((employee) => (
                <Card className="p-4" key={employee.employee}>
                  <b>{employee.employee}</b>
                  <p className="mt-2 text-sm">
                    {employee.completed} limpiezas · promedio{" "}
                    {employee.averageMinutes} min
                  </p>
                </Card>
              ))}
              {!data.employees.length ? (
                <EmptyState
                  description="Aparecerá cuando se complete la primera limpieza."
                  icon="analytics"
                  title="Sin limpiezas completadas"
                />
              ) : null}
            </div>
          </section>
        </>
      ) : (
        <Card className="h-40 animate-pulse" />
      )}
      {createOpen ? (
        <CleaningRequestModal
          onClose={() => setCreateOpen(false)}
          onSaved={saved}
          rooms={rooms}
          staff={staff}
        />
      ) : null}
      <ConfirmDialog
        description={`Se cancelará la limpieza pendiente de la habitación ${cancelTask?.room.number || ""}.`}
        onCancel={() => setCancelTask(null)}
        onConfirm={cancel}
        open={Boolean(cancelTask)}
        title="Cancelar tarea de limpieza"
      />
    </DashboardShell>
  );
}
