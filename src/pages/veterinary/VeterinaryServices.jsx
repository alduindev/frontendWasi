import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import Tooltip from "../../components/ui/Tooltip";
import { useAppConfig } from "../../context/appConfigStore";
import * as api from "../../services/veterinaryService";

const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary";

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

function serviceCode(name) {
  const slug = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "SERVICIO";
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
  return `VET-${slug.slice(0, Math.max(1, 34 - suffix.length))}-${suffix}`;
}

function ServiceActions({ isOpen, onChange, onEdit, onStatus, onDelete, service }) {
  const closeAndRun = (action) => () => {
    onChange(null);
    action(service);
  };
  return (
    <div
      className="relative flex justify-end"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onChange(null);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onChange(null);
      }}
    >
      <Tooltip label="Más acciones" placement="top-end">
        <button
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Más acciones para ${service.name}`}
          className="grid size-9 place-items-center rounded-lg border border-outline-variant bg-white text-on-surface-variant shadow-sm transition hover:border-primary hover:bg-primary-fixed hover:text-primary"
          onClick={() => onChange(isOpen ? null : service.id)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">more_vert</span>
        </button>
      </Tooltip>
      {isOpen ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-outline-variant bg-white p-1.5 shadow-xl" role="menu">
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-surface-container-low" onClick={closeAndRun(onEdit)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>Editar servicio</button>
          <div className="my-1 border-t border-outline-variant" />
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-surface-container-low" onClick={closeAndRun(onStatus)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">{service.status === "active" ? "toggle_off" : "toggle_on"}</span>{service.status === "active" ? "Desactivar servicio" : "Activar servicio"}</button>
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-error hover:bg-error-container" onClick={closeAndRun(onDelete)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">delete_forever</span>Eliminar definitivamente</button>
        </div>
      ) : null}
    </div>
  );
}

function ServiceForm({ error, onClose, onSubmit, saving, service }) {
  return (
    <form className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-bold">
        Código interno
        <input className={field} defaultValue={service?.code || ""} maxLength="40" name="code" placeholder="Se genera automáticamente" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Nombre del servicio *
        <input className={field} defaultValue={service?.name || ""} maxLength="160" name="name" required />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Categoría
        <input className={field} defaultValue={service?.category || "General"} maxLength="80" name="category" placeholder="Consulta, prevención, estética..." />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Precio (S/) *
        <input className={field} defaultValue={service?.price ?? "0"} min="0" name="price" required step="0.01" type="number" />
      </label>
      <label className="grid gap-1 text-sm font-bold sm:col-span-2">
        Duración estimada (minutos) *
        <input className={field} defaultValue={service?.durationMinutes ?? "30"} max="480" min="5" name="durationMinutes" required type="number" />
      </label>
      {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2" role="alert">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
        <Button onClick={onClose} type="button" variant="secondary">Cancelar</Button>
        <Button disabled={saving} icon="save" type="submit">{saving ? "Guardando..." : "Guardar servicio"}</Button>
      </div>
    </form>
  );
}

export default function VeterinaryServices({ operator = false }) {
  const { config } = useAppConfig();
  const admin = ["admin", "admin_owner"].includes(config?.user?.role);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(null);
  const [openActionsId, setOpenActionsId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setServices(await api.getVeterinaryServices({ includeInactive: admin }));
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar los servicios veterinarios.");
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const activeServices = useMemo(
    () => services.filter((service) => service.status === "active").length,
    [services],
  );
  const closeModal = () => {
    setModal("");
    setSelected(null);
    setError("");
  };
  const openModal = (nextModal, service = null) => {
    setOpenActionsId(null);
    setSelected(service);
    setError("");
    setModal(nextModal);
  };
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const payload = {
      code: String(form.get("code") || serviceCode(name)).trim().toUpperCase(),
      name,
      category: String(form.get("category") || "General").trim() || "General",
      price: Number(form.get("price")),
      duration_minutes: Number(form.get("durationMinutes")),
    };
    setSaving(true);
    setError("");
    try {
      if (modal === "create") await api.createVeterinaryService(payload);
      else await api.updateVeterinaryService(selected.id, payload);
      await load();
      closeModal();
    } catch (requestError) {
      setError(requestError.message || "No se pudo guardar el servicio.");
    } finally {
      setSaving(false);
    }
  };
  const updateStatus = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      if (selected.status === "active") await api.deactivateVeterinaryService(selected.id);
      else await api.activateVeterinaryService(selected.id);
      await load();
      closeModal();
    } catch (requestError) {
      setError(requestError.message || "No se pudo actualizar el servicio.");
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await api.deleteVeterinaryService(selected.id);
      await load();
      closeModal();
    } catch (requestError) {
      setError(requestError.message || "No se pudo eliminar el servicio.");
    } finally {
      setSaving(false);
    }
  };

  const Shell = operator ? OperatorShell : DashboardShell;
  return (
    <Shell
      action={admin ? <Button icon="add" onClick={() => openModal("create")}>Nuevo servicio</Button> : null}
      subtitle="Consultas, prevención, estética y otros servicios disponibles para agendar mascotas."
      title="Servicios veterinarios"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><span className="material-symbols-outlined text-primary">medical_services</span><b className="mt-2 block text-2xl">{services.length}</b><p className="text-sm text-on-surface-variant">Servicios registrados</p></Card>
        <Card className="p-4"><span className="material-symbols-outlined text-emerald-600">toggle_on</span><b className="mt-2 block text-2xl">{activeServices}</b><p className="text-sm text-on-surface-variant">Disponibles en agenda</p></Card>
        <Card className="p-4"><span className="material-symbols-outlined text-primary">schedule</span><b className="mt-2 block text-2xl">{services.length ? `${Math.round(services.reduce((sum, service) => sum + Number(service.durationMinutes || 0), 0) / services.length)} min` : "—"}</b><p className="text-sm text-on-surface-variant">Duración promedio</p></Card>
      </div>

      {error && !modal ? <div className="mt-4"><EmptyState action={{ children: "Reintentar", onClick: load }} description={error} icon="cloud_off" title="No se pudieron cargar los servicios" /></div> : null}
      {loading ? <Card className="mt-4 h-56 animate-pulse" /> : null}
      {!loading && !error && services.length ? (
        <>
          <div className="mt-4 grid gap-3 lg:hidden">
            {services.map((service) => (
              <Card className="p-4" key={service.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><b className="block truncate">{service.name}</b><p className="mt-1 font-mono text-xs text-on-surface-variant">{service.code}</p></div>
                  {admin ? <ServiceActions isOpen={openActionsId === service.id} onChange={setOpenActionsId} onDelete={(item) => openModal("delete", item)} onEdit={(item) => openModal("edit", item)} onStatus={(item) => openModal("status", item)} service={service} /> : null}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <span><small className="block text-on-surface-variant">Categoría</small><b className="block truncate">{service.category}</b></span>
                  <span><small className="block text-on-surface-variant">Duración</small><b>{service.durationMinutes} min</b></span>
                  <span><small className="block text-on-surface-variant">Precio</small><b>{money(service.price)}</b></span>
                </div>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${service.status === "active" ? "bg-emerald-100 text-emerald-900" : "bg-surface-container-high text-on-surface-variant"}`}>{service.status === "active" ? "Activo" : "Inactivo"}</span>
              </Card>
            ))}
          </div>
          <Card className="mt-4 hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-4 py-3 font-bold">Servicio</th><th className="px-4 py-3 font-bold">Categoría</th><th className="px-4 py-3 font-bold">Duración</th><th className="px-4 py-3 font-bold">Precio</th><th className="px-4 py-3 font-bold">Estado</th>{admin ? <th className="px-4 py-3 text-right font-bold">Acciones</th> : null}</tr></thead>
                <tbody className="divide-y divide-outline-variant">
                  {services.map((service) => (
                    <tr className="transition hover:bg-surface-container-low/60" key={service.id}>
                      <td className="px-4 py-3"><p className="font-bold">{service.name}</p><p className="mt-0.5 font-mono text-xs text-on-surface-variant">{service.code}</p></td>
                      <td className="px-4 py-3 text-on-surface-variant">{service.category}</td>
                      <td className="px-4 py-3 font-bold">{service.durationMinutes} min</td>
                      <td className="px-4 py-3 font-bold">{money(service.price)}</td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${service.status === "active" ? "bg-emerald-100 text-emerald-900" : "bg-surface-container-high text-on-surface-variant"}`}>{service.status === "active" ? "Activo" : "Inactivo"}</span></td>
                      {admin ? <td className="px-4 py-3"><ServiceActions isOpen={openActionsId === service.id} onChange={setOpenActionsId} onDelete={(item) => openModal("delete", item)} onEdit={(item) => openModal("edit", item)} onStatus={(item) => openModal("status", item)} service={service} /></td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
      {!loading && !error && !services.length ? <div className="mt-4"><EmptyState action={admin ? { children: "Crear servicio", onClick: () => openModal("create") } : null} description="Aún no hay servicios disponibles para la agenda veterinaria." icon="medical_services" title="Sin servicios veterinarios" /></div> : null}

      {modal === "create" || modal === "edit" ? <Modal onClose={closeModal} title={modal === "create" ? "Nuevo servicio veterinario" : "Editar servicio veterinario"}><ServiceForm error={error} onClose={closeModal} onSubmit={submit} saving={saving} service={selected} /></Modal> : null}
      {modal === "status" ? <Modal onClose={closeModal} title={selected?.status === "active" ? "Desactivar servicio" : "Activar servicio"}><div className="grid gap-4 p-5"><p>{selected?.status === "active" ? "El servicio dejará de estar disponible al agendar nuevas citas, pero se conservará en las citas ya registradas." : "El servicio volverá a estar disponible al agendar nuevas citas."}</p>{error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}<div className="flex justify-end gap-2"><Button onClick={closeModal} type="button" variant="secondary">Cancelar</Button><Button disabled={saving} icon={selected?.status === "active" ? "toggle_off" : "toggle_on"} onClick={updateStatus} type="button">{saving ? "Guardando..." : selected?.status === "active" ? "Desactivar" : "Activar"}</Button></div></div></Modal> : null}
      {modal === "delete" ? <Modal onClose={closeModal} title="Eliminar servicio definitivamente"><div className="grid gap-4 p-5"><p>Se eliminará <b>{selected?.name}</b>. Solo se permite si todavía no se utilizó en una cita.</p><p className="rounded-xl bg-error-container p-3 text-sm text-error">Esta acción no se puede deshacer. Si ya se utilizó, desactiva el servicio.</p>{error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}<div className="flex justify-end gap-2"><Button onClick={closeModal} type="button" variant="secondary">Cancelar</Button><Button disabled={saving} icon="delete_forever" onClick={remove} type="button" variant="danger">{saving ? "Eliminando..." : "Eliminar definitivamente"}</Button></div></div></Modal> : null}
    </Shell>
  );
}
