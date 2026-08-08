import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import OperatorShell from "../../components/operator/OperatorShell";
import { useAppConfig } from "../../context/appConfigStore";
import {
  completeHousekeepingTask,
  getHousekeepingTasks,
  startHousekeepingTask,
} from "../../services/hospitalityService";

const parseServerDate = (value) =>
  new Date(value?.endsWith("Z") ? value : `${value}Z`).getTime();
const clock = (seconds) =>
  `${Math.floor(Math.abs(seconds) / 60)}:${String(
    Math.abs(seconds) % 60,
  ).padStart(2, "0")}`;
const statusLabel = {
  pending: "Pendiente",
  assigned: "Asignada",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};
const tabs = [
  { value: "active", label: "Por atender", icon: "pending_actions" },
  { value: "in_progress", label: "En progreso", icon: "cleaning_services" },
  { value: "completed", label: "Completadas", icon: "task_alt" },
  { value: "cancelled", label: "Canceladas", icon: "cancel" },
];

export default function OperatorHousekeeping() {
  const { config } = useAppConfig();
  const capabilities = new Set(config?.capabilities || []);
  const canStart = capabilities.has("hospitality.housekeeping.start");
  const canComplete = capabilities.has("hospitality.housekeeping.complete");
  const [tasks, setTasks] = useState([]);
  const [reports, setReports] = useState({});
  const [activeTab, setActiveTab] = useState("active");
  const [now, setNow] = useState(0);
  const [working, setWorking] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return getHousekeepingTasks()
      .then(setTasks)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);
  const refresh = useCallback(
    () => getHousekeepingTasks().then(setTasks).catch(() => {}),
    [],
  );

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  const act = async (request, id, data) => {
    setWorking(id);
    setError("");
    try {
      await request(id, data);
      await refresh();
      if (request === startHousekeepingTask) setActiveTab("in_progress");
      if (request === completeHousekeepingTask) setActiveTab("completed");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking("");
    }
  };

  const counts = useMemo(
    () => ({
      active: tasks.filter((task) => ["pending", "assigned"].includes(task.status))
        .length,
      in_progress: tasks.filter((task) => task.status === "in_progress")
        .length,
      completed: tasks.filter((task) => task.status === "completed").length,
      cancelled: tasks.filter((task) => task.status === "cancelled").length,
    }),
    [tasks],
  );
  const visibleTasks = useMemo(
    () =>
      activeTab === "active"
        ? tasks.filter((task) => ["pending", "assigned"].includes(task.status))
        : tasks.filter((task) => task.status === activeTab),
    [activeTab, tasks],
  );

  return (
    <OperatorShell
      subtitle="Consulta el estado completo de tus limpiezas asignadas."
      title="Mis habitaciones"
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

      <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-outline-variant bg-white p-2">
        {tabs.map((tab) => (
          <button
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold ${activeTab === tab.value ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:bg-primary-fixed hover:text-primary"}`}
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.value ? "bg-white/20" : "bg-surface-container-high"}`}
            >
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {loading ? <Card className="h-32 animate-pulse" /> : null}
      {!loading ? (
        <div className="grid max-h-[68vh] gap-3 overflow-y-auto pr-2 md:grid-cols-2 xl:grid-cols-3">
          {visibleTasks.map((task) => {
            const elapsed = task.startedAt
              ? Math.max(0, Math.floor((now - parseServerDate(task.startedAt)) / 1000))
              : 0;
            const remaining = task.expectedMinutes * 60 - elapsed;
            const pending = ["pending", "assigned"].includes(task.status);
            const canChangeState =
              (pending && canStart) ||
              (task.status === "in_progress" && canComplete);

            return (
              <Card
                className={`p-4 ${remaining < 0 && task.status === "in_progress" ? "border-error" : ""}`}
                key={task.id}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-primary">
                      Piso {task.room.floor}
                    </p>
                    <h2 className="text-xl font-extrabold">Habitación {task.room.number}</h2>
                  </div>
                  <span
                    className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${task.status === "cancelled" ? "bg-error-container text-on-error-container" : task.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-primary-fixed text-primary"}`}
                  >
                    {statusLabel[task.status] || task.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">
                  {task.notes || "Sin indicaciones"} · objetivo {task.expectedMinutes} min
                </p>

                {task.status === "in_progress" ? (
                  <div
                    className={`mt-3 rounded-xl p-3 ${remaining < 0 ? "bg-error-container text-on-error-container" : "bg-primary-fixed text-on-primary-fixed"}`}
                  >
                    <p className="text-xs font-bold uppercase">
                      {remaining < 0 ? "Tiempo excedido" : "Tiempo restante"}
                    </p>
                    <p className="font-mono text-3xl font-extrabold">
                      {remaining < 0 ? "+" : ""}
                      {clock(remaining)}
                    </p>
                    <p className="text-xs">Transcurrido {clock(elapsed)}</p>
                  </div>
                ) : null}
                {pending ? (
                  <div className="mt-3 rounded-xl bg-surface-container-low p-3">
                    <p className="text-sm font-bold">Lista para iniciar</p>
                    <p className="text-xs text-on-surface-variant">
                      El contador comenzará cuando pulses el botón.
                    </p>
                  </div>
                ) : null}
                {task.status === "completed" ? (
                  <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-emerald-900">
                    <p className="text-sm font-bold">Trabajo finalizado</p>
                    <p className="text-xs">
                      Duración: {task.durationMinutes || 0} min
                      {task.damageReport
                        ? " · Se reportaron daños"
                        : " · Habitación liberada"}
                    </p>
                  </div>
                ) : null}
                {task.status === "cancelled" ? (
                  <div className="mt-3 rounded-xl bg-error-container p-3 text-on-error-container">
                    <p className="text-sm font-bold">Solicitud cancelada</p>
                    <p className="text-xs">Ya no debes atender esta habitación.</p>
                  </div>
                ) : null}
                {task.status === "in_progress" && canComplete ? (
                  <textarea
                    className="mt-3 min-h-20 w-full rounded-xl border border-outline-variant p-3 text-sm"
                    onChange={(event) =>
                      setReports((current) => ({
                        ...current,
                        [task.id]: event.target.value,
                      }))
                    }
                    placeholder="Daños encontrados (opcional)"
                    value={reports[task.id] || ""}
                  />
                ) : null}

                <div className="mt-4">
                  {pending && canStart ? (
                    <Button
                      disabled={working === task.id}
                      onClick={() => act(startHousekeepingTask, task.id)}
                    >
                      {working === task.id ? "Iniciando..." : "Iniciar limpieza"}
                    </Button>
                  ) : null}
                  {task.status === "in_progress" && canComplete ? (
                    <Button
                      disabled={working === task.id}
                      onClick={() =>
                        act(completeHousekeepingTask, task.id, {
                          damageReport: reports[task.id] || "",
                        })
                      }
                    >
                      {working === task.id ? "Finalizando..." : "Finalizar limpieza"}
                    </Button>
                  ) : null}
                  {!canChangeState && (pending || task.status === "in_progress") ? (
                    <p className="rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">
                      Tu perfil puede consultar esta tarea, pero no cambiar su estado.
                    </p>
                  ) : null}
                </div>
              </Card>
            );
          })}
          {!visibleTasks.length ? (
            <EmptyState
              description={
                activeTab === "active"
                  ? "No tienes habitaciones pendientes por atender."
                  : `No hay tareas ${tabs
                      .find((tab) => tab.value === activeTab)
                      ?.label.toLowerCase()}.`
              }
              icon="cleaning_services"
              title="Sin tareas en este estado"
            />
          ) : null}
        </div>
      ) : null}
    </OperatorShell>
  );
}
