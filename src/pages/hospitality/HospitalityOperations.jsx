import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import ConfirmDialog from "../../components/molecules/ConfirmDialog";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import {
  cancelHospitalityWorkOrder,
  cancelHousekeepingTask,
  createHospitalityWorkOrder,
  createHousekeepingTask,
  getHospitalityWorkOrders,
  getHousekeepingTasks,
  getReservations,
  getRooms,
  updateHospitalityWorkOrder,
  updateHousekeepingTask,
} from "../../services/hospitalityService";
import { getUsers } from "../../services/userService";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";

const departmentMeta = {
  housekeeping: {
    label: "Limpieza",
    icon: "cleaning_services",
    title: "Preparar habitación para el huésped",
    instructions:
      "Indica reposición de blancos, minibar, baño y cualquier revisión adicional.",
    amount: "Tiempo objetivo (min)",
    operations: [
      "Limpieza por salida",
      "Limpieza de rutina",
      "Limpieza profunda",
      "Incidente o derrame",
      "Inspección de habitación",
    ],
  },
  maintenance: {
    label: "Mantenimiento",
    icon: "home_repair_service",
    title: "Revisar aire acondicionado de habitación",
    instructions:
      "Indica la falla observada, equipo afectado y comprobaciones necesarias.",
    amount: "Costo estimado de reparación",
    operations: [
      "Reparación correctiva",
      "Inspección preventiva",
      "Electricidad",
      "Plomería",
      "Climatización",
    ],
  },
  security: {
    label: "Seguridad",
    icon: "security",
    title: "Verificar incidente en piso",
    instructions:
      "Describe el incidente, lugar, personas involucradas y protocolo requerido.",
    amount: "Monto previsto (si corresponde)",
    operations: [
      "Verificar incidente",
      "Ronda de seguridad",
      "Objeto perdido",
      "Control de acceso",
      "Emergencia",
    ],
  },
  laundry: {
    label: "Lavandería",
    icon: "local_laundry_service",
    title: "Procesar ropa de cama y toallas",
    instructions:
      "Indica cantidades, tipo de prendas, habitación y prioridad de entrega.",
    amount: "Costo previsto de lavandería",
    operations: [
      "Ropa de cama",
      "Toallas",
      "Prendas del huésped",
      "Lavado urgente",
      "Reposición de blancos",
    ],
  },
  kitchen: {
    label: "Cocina",
    icon: "skillet",
    title: "Preparar pedido especial para huésped",
    instructions:
      "Detalla preparación, restricciones alimentarias, cantidades y hora de entrega.",
    amount: "Costo previsto de preparación",
    operations: [
      "Preparar desayuno",
      "Pedido especial",
      "Restricción alimentaria",
      "Reposición de buffet",
      "Producción interna",
    ],
  },
  purchasing: {
    label: "Compras",
    icon: "shopping_cart",
    title: "Reponer suministros del hotel",
    instructions:
      "Especifica productos, cantidades, proveedor sugerido y fecha necesaria.",
    amount: "Presupuesto de compra",
    operations: [
      "Reposición de almacén",
      "Cotización",
      "Compra urgente",
      "Pedido a proveedor",
      "Recepción de mercadería",
    ],
  },
  "customer-service": {
    label: "Atención al cliente",
    icon: "support_agent",
    title: "Atender solicitud de huésped",
    instructions:
      "Describe la solicitud, solución esperada y datos relevantes del huésped.",
    amount: "Compensación prevista (si corresponde)",
    operations: [
      "Solicitud del huésped",
      "Queja o reclamo",
      "Información turística",
      "Coordinación de traslado",
      "Seguimiento de satisfacción",
    ],
  },
  "room-service": {
    label: "Room service",
    icon: "room_service",
    title: "Entregar pedido en habitación",
    instructions:
      "Detalla productos, presentación, observaciones y hora solicitada.",
    amount: "Total previsto del servicio",
    operations: [
      "Entrega de pedido",
      "Retiro de menaje",
      "Reposición de minibar",
      "Atención especial",
      "Entrega programada",
    ],
  },
};
const statusLabel = {
  pending: "Pendiente",
  assigned: "Asignada",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};
const statusTabs = [
  {
    id: "active",
    label: "Por atender",
    icon: "pending_actions",
    matches: (status) => ["pending", "assigned"].includes(status),
  },
  {
    id: "in_progress",
    label: "En progreso",
    icon: "play_circle",
    matches: (status) => status === "in_progress",
  },
  {
    id: "completed",
    label: "Completadas",
    icon: "task_alt",
    matches: (status) => status === "completed",
  },
  {
    id: "cancelled",
    label: "Canceladas",
    icon: "cancel",
    matches: (status) => status === "cancelled",
  },
  { id: "all", label: "Todas", icon: "list_alt", matches: () => true },
];
const statusTone = {
  pending: "bg-amber-100 text-amber-900",
  assigned: "bg-sky-100 text-sky-900",
  in_progress: "bg-violet-100 text-violet-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-surface-container-high text-on-surface-variant",
};
const priorityLabel = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};
const priorityTone = {
  low: "text-on-surface-variant",
  normal: "text-primary",
  high: "text-amber-700",
  urgent: "text-error",
};

function WorkOrderModal({ onClose, onSaved, reservations, rooms, users }) {
  const [department, setDepartment] = useState("maintenance");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [operation, setOperation] = useState(
    departmentMeta.maintenance.operations[0],
  );
  const meta = departmentMeta[department];
  const eligible = users.filter((user) =>
    user.functions?.some((fn) => fn.code === department),
  );
  const field =
    "min-h-11 rounded-xl border border-outline-variant bg-white px-3 font-normal";
  const chooseDepartment = (code) => {
    setDepartment(code);
    setOperation(departmentMeta[code].operations[0]);
    setError("");
  };
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      if (department === "housekeeping") {
        if (!roomId)
          throw new Error("Selecciona una habitación para la limpieza.");
        await createHousekeepingTask({
          roomId,
          assignedToId: form.get("assignedToId") || null,
          priority: form.get("priority"),
          notes: `${operation}${form.get("description") ? ` · ${form.get("description")}` : ""}`,
          expectedMinutes: Number(form.get("expectedMinutes") || 30),
        });
      } else
        await createHospitalityWorkOrder({
          functionCode: department,
          title: form.get("title") || operation,
          description: form.get("description"),
          roomId: roomId || null,
          reservationId: form.get("reservationId") || null,
          assignedToId: form.get("assignedToId") || null,
          priority: form.get("priority"),
          dueAt: form.get("dueAt") || null,
          amount: Number(form.get("amount") || 0),
        });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={onClose} title={`Nueva orden · ${meta.label}`}>
      <form className="grid gap-5 p-4 sm:p-6" onSubmit={submit}>
        {error ? (
          <div className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}
        <section>
          <h3 className="text-lg font-bold">1. Área y habitación</h3>
          <p className="text-sm text-on-surface-variant">
            Selecciona el equipo responsable y, si corresponde, la habitación
            relacionada.
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {Object.entries(departmentMeta).map(([code, item]) => (
              <button
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold ${department === code ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant"}`}
                key={code}
                onClick={() => chooseDepartment(code)}
                type="button"
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <HorizontalScroller label="Habitaciones para la operación">
              <button
                aria-pressed={!roomId}
                className={`min-w-[210px] snap-start rounded-2xl border p-4 text-left ${!roomId ? "border-primary bg-primary-fixed" : "border-outline-variant bg-white"}`}
                onClick={() => setRoomId("")}
                type="button"
              >
                <span className="material-symbols-outlined text-3xl text-primary">
                  domain
                </span>
                <b className="mt-3 block">Sin habitación</b>
                <p className="text-sm text-on-surface-variant">
                  Operación general
                </p>
              </button>
              {rooms.map((room) => (
                <button
                  aria-pressed={room.id === roomId}
                  className={`min-w-[220px] snap-start rounded-2xl border p-4 text-left ${room.id === roomId ? "border-primary bg-primary-fixed ring-2 ring-primary/20" : "border-outline-variant bg-white hover:border-primary"}`}
                  key={room.id}
                  onClick={() => setRoomId(room.id)}
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
                  <b className="mt-3 block text-lg">Habitación {room.number}</b>
                  <p className="text-sm text-on-surface-variant">
                    Piso {room.floor} · {room.roomType}
                  </p>
                </button>
              ))}
            </HorizontalScroller>
          </div>
        </section>
        <section>
          <h3 className="text-lg font-bold">2. Operación y responsable</h3>
          <p className="text-sm text-on-surface-variant">
            El operario recibirá el tipo de operación y estas indicaciones.
          </p>
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">
            Tipo de operación
            <select
              className={field}
              onChange={(event) => setOperation(event.target.value)}
              value={operation}
            >
              {meta.operations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {department !== "housekeeping" ? (
            <label className="grid gap-1 text-sm font-bold">
              Título o detalle
              <input
                className={field}
                key={`title-${department}`}
                maxLength="160"
                minLength="3"
                name="title"
                placeholder={meta.title}
              />
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-bold sm:col-span-2">
            Instrucciones
            <textarea
              className="min-h-24 rounded-xl border border-outline-variant p-3 font-normal"
              key={`description-${department}`}
              maxLength="2000"
              name="description"
              placeholder={meta.instructions}
            />
          </label>
          {department !== "housekeeping" ? (
            <label className="grid gap-1 text-sm font-bold">
              Estancia relacionada
              <select className={field} name="reservationId">
                <option value="">No aplica a una estancia</option>
                {reservations
                  .filter(
                    (item) =>
                      item.status === "checked_in" &&
                      (!roomId || item.room.id === roomId),
                  )
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      Hab. {item.room.number} · {item.guest.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-bold">
            Responsable
            <select className={field} name="assignedToId">
              <option value="">Asignar después</option>
              {eligible.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            {!eligible.length ? (
              <small className="font-normal text-amber-700">
                No hay empleados con función de {meta.label.toLowerCase()}.
              </small>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm font-bold">
            Prioridad
            <select className={field} name="priority">
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </label>
          {department !== "housekeeping" ? (
            <label className="grid gap-1 text-sm font-bold">
              Fecha límite
              <input className={field} name="dueAt" type="datetime-local" />
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-bold">
            {meta.amount}
            <input
              className={field}
              defaultValue={department === "housekeeping" ? 30 : undefined}
              max={department === "housekeeping" ? 480 : undefined}
              min={department === "housekeeping" ? 5 : 0}
              name={
                department === "housekeeping" ? "expectedMinutes" : "amount"
              }
              placeholder={department === "housekeeping" ? "30" : "0.00"}
              step={department === "housekeeping" ? 1 : "0.01"}
              type="number"
            />
          </label>
        </div>
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} type="submit">
            {saving
              ? "Creando..."
              : `Crear orden de ${meta.label.toLowerCase()}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

function EditWorkOrderModal({ onClose, onSaved, order, users }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const active = ["pending", "assigned", "in_progress"].includes(order.status);
  const housekeeping = order.source === "housekeeping";
  const meta = departmentMeta[order.functionCode];
  const eligible = users.filter((user) =>
    user.functions?.some((fn) => fn.code === order.functionCode),
  );
  const field =
    "min-h-11 rounded-xl border border-outline-variant bg-white px-3 font-normal";
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      if (housekeeping)
        await updateHousekeepingTask(order.id, {
          assignedToId: form.get("assignedToId") || null,
          priority: form.get("priority"),
          notes: form.get("description"),
          expectedMinutes: Number(form.get("expectedMinutes") || 30),
        });
      else {
        const payload = {
          description: form.get("description"),
          priority: form.get("priority"),
          dueAt: form.get("dueAt") || null,
          amount: Number(form.get("amount") || 0),
        };
        if (active) {
          payload.title = form.get("title");
          payload.assignedToId = form.get("assignedToId") || null;
        }
        await updateHospitalityWorkOrder(order.id, payload);
      }
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={onClose} title={`Editar orden · ${meta.label}`}>
      <form className="grid gap-4 p-4 sm:p-6" onSubmit={submit}>
        {error ? (
          <div className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}
        {!active ? (
          <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            La orden está en progreso. Solo se pueden ajustar datos operativos
            para conservar la trazabilidad.
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {!housekeeping ? (
            <label className="grid gap-1 text-sm font-bold sm:col-span-2">
              Orden
              <input
                className={field}
                defaultValue={order.title}
                disabled={!active}
                maxLength="160"
                minLength="3"
                name="title"
                required
              />
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-bold sm:col-span-2">
            Instrucciones
            <textarea
              className="min-h-24 rounded-xl border border-outline-variant p-3 font-normal"
              defaultValue={order.description || ""}
              maxLength="2000"
              name="description"
            />
          </label>
          {active ? (
            <label className="grid gap-1 text-sm font-bold">
              Responsable
              <select
                className={field}
                defaultValue={order.assignedTo?.id || ""}
                name="assignedToId"
              >
                <option value="">Sin asignar</option>
                {eligible.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-bold">
            Prioridad
            <select
              className={field}
              defaultValue={order.priority}
              name="priority"
            >
              <option value="low">Baja</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </label>
          {!housekeeping ? (
            <label className="grid gap-1 text-sm font-bold">
              Fecha límite
              <input
                className={field}
                defaultValue={toLocalInput(order.dueAt)}
                name="dueAt"
                type="datetime-local"
              />
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-bold">
            {meta.amount}
            <input
              className={field}
              defaultValue={
                housekeeping
                  ? order.expectedMinutes || 30
                  : Number(order.amount || 0)
              }
              min={housekeeping ? 5 : 0}
              name={housekeeping ? "expectedMinutes" : "amount"}
              step={housekeeping ? 1 : "0.01"}
              type="number"
            />
          </label>
        </div>
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} type="submit">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditableOperationRow(props) {
  const { order, onEdit } = props;
  const editable = ["pending", "assigned", "in_progress"].includes(
    order.status,
  );
  return (
    <div className="relative">
      {editable ? (
        <button
          aria-label="Editar y asignar orden"
          className="material-symbols-outlined absolute right-24 top-3 z-10 min-h-10 min-w-10 rounded-full text-primary hover:bg-primary-fixed"
          onClick={onEdit}
          type="button"
        >
          edit
        </button>
      ) : null}
      <OperationRow {...props} />
    </div>
  );
}

export default function HospitalityOperations() {
  const [orders, setOrders] = useState([]);
  const [cleaningTasks, setCleaningTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [expanded, setExpanded] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [cancel, setCancel] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [o, h, r, v, u] = await Promise.all([
        getHospitalityWorkOrders(),
        getHousekeepingTasks(),
        getRooms(),
        getReservations(),
        getUsers(),
      ]);
      setOrders(o);
      setCleaningTasks(h);
      setRooms(r);
      setReservations(v);
      setUsers(u);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible")
        Promise.all([getHospitalityWorkOrders(), getHousekeepingTasks()])
          .then(([o, h]) => {
            setOrders(o);
            setCleaningTasks(h);
          })
          .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, []);
  useLiveRefresh(load, ["/hospitality", "/users"]);
  const cleaningOrders = useMemo(
    () =>
      cleaningTasks.map((task) => ({
        id: task.id,
        functionCode: "housekeeping",
        title: `Habitación ${task.room.number}`,
        description: task.notes,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo,
        room: task.room,
        result: task.damageReport,
        createdAt: task.createdAt,
        source: "housekeeping",
      })),
    [cleaningTasks],
  );
  const allOrders = useMemo(
    () => [...cleaningOrders, ...orders],
    [cleaningOrders, orders],
  );
  const activeStatus =
    statusTabs.find((item) => item.id === statusFilter) || statusTabs[0];
  const byStatus = useMemo(
    () => allOrders.filter((order) => activeStatus.matches(order.status)),
    [activeStatus, allOrders],
  );
  const visible = useMemo(
    () =>
      (filter === "all"
        ? byStatus
        : byStatus.filter((order) => order.functionCode === filter)
      ).toSorted((a, b) => {
        const priority = { urgent: 0, high: 1, normal: 2, low: 3 };
        return (
          (priority[a.priority] ?? 2) - (priority[b.priority] ?? 2) ||
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );
      }),
    [byStatus, filter],
  );
  const cancelOrder = async () => {
    try {
      if (cancel.source === "housekeeping")
        await cancelHousekeepingTask(cancel.id);
      else await cancelHospitalityWorkOrder(cancel.id);
      setCancel(null);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <DashboardShell
      action={
        <Button icon="add_task" onClick={() => setOpen(true)}>
          Nueva orden
        </Button>
      }
      subtitle="Limpieza, mantenimiento, seguridad, lavandería, cocina, compras y atención coordinados."
      title="Servicios"
    >
      {error ? (
        <EmptyState
          action={{ children: "Reintentar", onClick: load }}
          description={error}
          icon="cloud_off"
          title="No se pudo cargar"
        />
      ) : null}
      <div
        className="mb-3 flex gap-1 overflow-x-auto border-b border-outline-variant"
        role="tablist"
      >
        {statusTabs.map((item) => {
          const count = allOrders.filter((order) =>
            item.matches(order.status),
          ).length;
          return (
            <button
              aria-selected={statusFilter === item.id}
              className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-bold transition ${statusFilter === item.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"}`}
              key={item.id}
              onClick={() => {
                setStatusFilter(item.id);
                setExpanded("");
              }}
              role="tab"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {item.icon}
              </span>
              {item.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${statusFilter === item.id ? "bg-primary-fixed" : "bg-surface-container-high"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        <button
          className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${filter === "all" ? "bg-primary text-white" : "bg-white text-on-surface-variant hover:bg-primary-fixed"}`}
          onClick={() => setFilter("all")}
          type="button"
        >
          Todas · {byStatus.length}
        </button>
        {Object.entries(departmentMeta).map(([code, meta]) => {
          const count = byStatus.filter(
            (order) => order.functionCode === code,
          ).length;
          return (
            <button
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-bold ${filter === code ? "bg-primary text-white" : "bg-white text-on-surface-variant hover:bg-primary-fixed"}`}
              key={code}
              onClick={() => setFilter(code)}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                {meta.icon}
              </span>
              {meta.label}
              {count ? ` · ${count}` : ""}
            </button>
          );
        })}
      </div>
      {visible.length ? (
        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white">
          <div className="hidden grid-cols-[minmax(250px,2fr)_minmax(130px,1fr)_minmax(130px,1fr)_150px_132px] gap-3 bg-surface-container-low px-4 py-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant md:grid">
            <span>Orden</span>
            <span>Ubicación</span>
            <span>Responsable</span>
            <span>Estado</span>
            <span className="text-right">Acciones</span>
          </div>
          <div className="divide-y divide-outline-variant">
            {visible.map((order) => (
              <EditableOperationRow
                expanded={expanded === order.id}
                key={`${order.source || "work"}-${order.id}`}
                onCancel={() => setCancel(order)}
                onEdit={() => setEdit(order)}
                onToggle={() =>
                  setExpanded((current) =>
                    current === order.id ? "" : order.id,
                  )
                }
                order={order}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          description="No hay órdenes para este estado y área. Cambia el filtro o crea una nueva orden."
          icon={activeStatus.icon}
          title={`Sin órdenes ${activeStatus.label.toLowerCase()}`}
        />
      )}
      {open ? (
        <WorkOrderModal
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            load();
          }}
          reservations={reservations}
          rooms={rooms}
          users={users}
        />
      ) : null}
      {edit ? (
        <EditWorkOrderModal
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
          order={edit}
          users={users}
        />
      ) : null}
      <ConfirmDialog
        description={`Se cancelará la orden “${cancel?.title || ""}”.`}
        onCancel={() => setCancel(null)}
        onConfirm={cancelOrder}
        open={Boolean(cancel)}
        title="Cancelar orden"
      />
    </DashboardShell>
  );
}

function OperationRow({ expanded, onCancel, onToggle, order }) {
  const meta = departmentMeta[order.functionCode];
  const cancellable = ["pending", "assigned"].includes(order.status);
  return (
    <article>
      <div className="grid gap-3 px-4 py-3 transition hover:bg-surface-container-low/60 md:grid-cols-[minmax(250px,2fr)_minmax(130px,1fr)_minmax(130px,1fr)_150px_88px] md:items-center">
        <button className="min-w-0 text-left" onClick={onToggle} type="button">
          <span className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
            <span className="material-symbols-outlined text-lg">
              {meta.icon}
            </span>
            {meta.label}
          </span>
          <b className="mt-1 block truncate">{order.title}</b>
          <span className="mt-0.5 block truncate text-xs text-on-surface-variant md:hidden">
            {order.description || "Sin instrucciones adicionales"}
          </span>
        </button>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-lg text-on-surface-variant">
            location_on
          </span>
          <span className="truncate">
            {order.room ? `Hab. ${order.room.number}` : "General"}
            {order.reservation ? ` · ${order.reservation.guest.name}` : ""}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-lg text-on-surface-variant">
            person
          </span>
          <span
            className={`truncate ${order.assignedTo ? "" : "text-amber-700"}`}
          >
            {order.assignedTo?.name || "Sin asignar"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[order.status]}`}
          >
            {statusLabel[order.status]}
          </span>
          <span className={`text-xs font-bold ${priorityTone[order.priority]}`}>
            {priorityLabel[order.priority] || order.priority}
          </span>
        </div>
        <div className="flex justify-end gap-1">
          <button
            aria-label={expanded ? "Ocultar detalle" : "Ver detalle"}
            className="material-symbols-outlined min-h-10 min-w-10 rounded-full text-primary hover:bg-primary-fixed"
            onClick={onToggle}
            type="button"
          >
            {expanded ? "expand_less" : "expand_more"}
          </button>
          {cancellable ? (
            <button
              aria-label="Cancelar orden"
              className="material-symbols-outlined min-h-10 min-w-10 rounded-full text-error hover:bg-error-container"
              onClick={onCancel}
              type="button"
            >
              cancel
            </button>
          ) : null}
        </div>
      </div>
      {expanded ? (
        <div className="grid gap-3 border-t border-dashed border-outline-variant bg-surface-container-low/70 px-4 py-4 text-sm md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Instrucciones
            </p>
            <p className="mt-1">
              {order.description || "Sin instrucciones adicionales"}
            </p>
            {order.result ? (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-emerald-900">
                <b>Resultado:</b> {order.result}
              </p>
            ) : null}
          </div>
          <div className="grid content-start gap-1 text-on-surface-variant">
            {order.dueAt ? (
              <p>
                <b>Fecha límite:</b>{" "}
                {new Date(order.dueAt).toLocaleString("es-PE")}
              </p>
            ) : null}
            {order.requestedBy ? (
              <p>
                <b>Solicitado por:</b> {order.requestedBy.name}
              </p>
            ) : null}
            {order.createdAt ? (
              <p>
                <b>Creada:</b>{" "}
                {new Date(order.createdAt).toLocaleString("es-PE")}
              </p>
            ) : null}
            {cancellable ? (
              <Button className="mt-2" onClick={onCancel} variant="danger">
                Cancelar orden
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
