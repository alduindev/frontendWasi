import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import Tooltip from "../../components/ui/Tooltip";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";
import { useAppConfig } from "../../context/appConfigStore";
import * as api from "../../services/healthService";

const cls = "min-h-11 rounded-xl border border-outline-variant bg-surface px-3";
const serviceModalTypes = new Set([
  "procedure",
  "procedure-edit",
  "procedure-activate",
  "procedure-deactivate",
  "procedure-delete",
]);
const titles = {
  "dental-records": "Historia clínica dental",
  "dental-catalog": "Servicios dentales",
  "dental-billing": "Cobros dentales",
  "dental-reports": "Reportes dentales",
};

const procedureCode = (name) => {
  const slug = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "SERVICIO";
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
  return `DENT-${slug.slice(0, Math.max(1, 34 - suffix.length))}-${suffix}`;
};

function ServiceActionsMenu({
  canManage,
  isOpen,
  onActivate,
  onDeactivate,
  onDelete,
  onEdit,
  onOpenChange,
  service,
}) {
  if (!canManage) return <span className="text-sm text-on-surface-variant">—</span>;
  const closeAndRun = (action) => () => {
    onOpenChange(null);
    action(service);
  };

  return (
    <div
      className="relative flex justify-end"
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
          aria-label={`Más acciones para ${service.name}`}
          className="grid size-9 place-items-center rounded-lg border border-outline-variant bg-white text-on-surface-variant shadow-sm transition hover:border-primary hover:bg-primary-fixed hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          onClick={() => onOpenChange(isOpen ? null : service.id)}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">more_vert</span>
        </button>
      </Tooltip>
      {isOpen ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-outline-variant bg-white p-1.5 shadow-xl" role="menu">
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onEdit)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>Editar servicio</button>
          <div className="my-1 border-t border-outline-variant" />
          {service.status === "active" ? (
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onDeactivate)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">toggle_off</span>Desactivar servicio</button>
          ) : (
            <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onActivate)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">toggle_on</span>Activar servicio</button>
          )}
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-error transition hover:bg-error-container" onClick={closeAndRun(onDelete)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">delete_forever</span>Eliminar definitivamente</button>
        </div>
      ) : null}
    </div>
  );
}

function ServiceFields({ service }) {
  return (
    <>
      <label className="grid gap-1 text-sm font-bold">
        Código interno
        <input className={cls} defaultValue={service?.code || ""} maxLength="40" name="code" placeholder="Se generará automáticamente" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Nombre del servicio *
        <input className={cls} defaultValue={service?.name || ""} maxLength="160" name="name" required />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Categoría
        <input className={cls} defaultValue={service?.category || "General"} maxLength="80" name="category" />
      </label>
      <label className="grid gap-1 text-sm font-bold">
        Precio (S/) *
        <input className={cls} defaultValue={service?.price ?? "0"} min="0" name="price" required step="0.01" type="number" />
      </label>
      <label className="grid gap-1 text-sm font-bold sm:col-span-2">
        Duración (minutos) *
        <input className={cls} defaultValue={service?.durationMinutes ?? "30"} max="480" min="5" name="durationMinutes" required type="number" />
      </label>
    </>
  );
}

export default function DentalOperations({ operator = false }) {
  const { moduleKey } = useParams();
  const { config } = useAppConfig();
  const administrator = ["admin", "admin_owner"].includes(config?.user?.role);
  const capabilities = new Set(config?.capabilities || []);
  const canManageServices = administrator || capabilities.has("dental.catalog.manage");
  const requiredWritePermission = moduleKey === "dental-records" ? "dental.records.edit" : moduleKey === "dental-billing" ? "dental.billing.edit" : "";
  const canWrite = administrator || Boolean(requiredWritePermission && capabilities.has(requiredWritePermission));
  const requiresPatient = !["dental-catalog", "dental-reports"].includes(moduleKey);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState("");
  const [report, setReport] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [openServiceActionsId, setOpenServiceActionsId] = useState(null);
  const [serviceActionError, setServiceActionError] = useState("");
  const [serviceSaving, setServiceSaving] = useState(false);

  const load = useCallback(async () => {
    const ps = requiresPatient ? (patients.length ? patients : await api.getPatients()) : [];
    if (requiresPatient && !patients.length) setPatients(ps);
    const id = patientId || ps[0]?.id || "";
    if (requiresPatient && !patientId && id) setPatientId(id);
    if (moduleKey === "dental-records" && id) {
      const values = await Promise.all([
        api.getDentalClinicalEntries(id),
        api.getDentalPrescriptions(id),
        api.getDentalDocuments(id),
      ]);
      setRows(values.flat());
    } else if (moduleKey === "dental-catalog") {
      setRows(await api.getDentalProcedures({ includeInactive: true }));
    } else if (moduleKey === "dental-billing" && id) {
      setRows(await api.getDentalPayments(id));
    } else if (moduleKey === "dental-reports") {
      setReport(await api.getDentalReport());
    }
  }, [moduleKey, patientId, patients, requiresPatient]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name) => form.get(name);
    if (modal === "entry") {
      await api.createDentalClinicalEntry({
        patientId,
        entryType: value("entryType"),
        title: value("title"),
        content: value("content"),
        professionalName: value("professionalName"),
        vitalSigns: { bloodPressure: value("bloodPressure") },
      });
    }
    if (modal === "prescription") {
      await api.createDentalPrescription({
        patientId,
        medication: value("medication"),
        dose: value("dose"),
        frequency: value("frequency"),
        duration: value("duration"),
        instructions: value("instructions"),
        professionalName: value("professionalName"),
      });
    }
    if (modal === "document") {
      await api.createDentalDocument({
        patientId,
        documentType: value("documentType"),
        name: value("name"),
        url: value("url"),
        notes: value("notes"),
      });
    }
    if (modal === "payment") {
      await api.createDentalPayment({
        patientId,
        treatmentId: null,
        amount: Number(value("amount")),
        paymentMethod: value("paymentMethod"),
        reference: value("reference"),
        notes: value("notes"),
      });
    }
    setModal("");
    load();
  };

  const closeServiceModal = () => {
    setModal("");
    setSelectedService(null);
    setServiceActionError("");
  };

  const openServiceModal = (nextModal, service = null) => {
    setOpenServiceActionsId(null);
    setSelectedService(service);
    setServiceActionError("");
    setModal(nextModal);
  };

  const submitService = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const code = String(form.get("code") || procedureCode(name)).trim().toUpperCase();
    const payload = {
      code,
      name,
      category: String(form.get("category") || "General").trim() || "General",
      price: Number(form.get("price")),
      durationMinutes: Number(form.get("durationMinutes")),
    };
    setServiceSaving(true);
    setServiceActionError("");
    try {
      if (modal === "procedure") await api.createDentalProcedure(payload);
      else await api.updateDentalProcedure(selectedService.id, payload);
      await load();
      closeServiceModal();
    } catch (requestError) {
      setServiceActionError(requestError.message || "No se pudo guardar el servicio.");
    } finally {
      setServiceSaving(false);
    }
  };

  const runServiceAction = async () => {
    if (!selectedService) return;
    setServiceSaving(true);
    setServiceActionError("");
    try {
      if (modal === "procedure-activate") await api.activateDentalProcedure(selectedService.id);
      if (modal === "procedure-deactivate") await api.deactivateDentalProcedure(selectedService.id);
      if (modal === "procedure-delete") await api.deleteDentalProcedure(selectedService.id);
      await load();
      closeServiceModal();
    } catch (requestError) {
      setServiceActionError(requestError.message || "No se pudo actualizar el servicio.");
    } finally {
      setServiceSaving(false);
    }
  };

  const primary = moduleKey === "dental-records" ? "entry" : "payment";
  const serviceModalOpen = serviceModalTypes.has(modal);
  const activeServices = rows.filter((service) => service.status === "active").length;
  const Shell = operator ? OperatorShell : DashboardShell;

  return (
    <Shell
      title={titles[moduleKey]}
      subtitle={moduleKey === "dental-catalog" ? "Servicios disponibles para la agenda dental, con precio y duración." : "Operación odontológica conectada al expediente."}
      action={
        moduleKey === "dental-reports" || !(moduleKey === "dental-catalog" ? canManageServices : canWrite) ? null : (
          <Button disabled={moduleKey !== "dental-catalog" && !patientId} icon="add" onClick={() => moduleKey === "dental-catalog" ? openServiceModal("procedure") : setModal(primary)}>
            {moduleKey === "dental-catalog" ? "Nuevo servicio" : "Nuevo registro"}
          </Button>
        )
      }
    >
      {!['dental-catalog', 'dental-reports'].includes(moduleKey) ? (
        <Card className="mb-4 p-4">
          <EntitySearchSelect
            getLabel={(item) => `${item.lastName}, ${item.firstName}`}
            getMeta={(item) => [item.document, item.phone].filter(Boolean).join(" · ")}
            getSearchValues={(item) => [item.firstName, item.lastName, `${item.firstName} ${item.lastName}`, item.document, item.phone, item.email]}
            items={patients}
            label="Paciente"
            onChange={setPatientId}
            placeholder="Buscar por nombre, DNI o celular"
            value={patientId}
          />
        </Card>
      ) : null}

      {moduleKey === "dental-records" && canWrite ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button icon="clinical_notes" onClick={() => setModal("entry")}>Evolución</Button>
          <Button icon="prescriptions" onClick={() => setModal("prescription")}>Receta</Button>
          <Button icon="attach_file" onClick={() => setModal("document")}>Documento</Button>
        </div>
      ) : null}

      {moduleKey === "dental-catalog" ? (
        <section className="grid gap-4">
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold">Servicios de la clínica</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Los activos aparecen al agendar una cita dental. Gestiona cada servicio desde el menú de acciones.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-primary">{rows.length} total</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-900">{activeServices} activo{activeServices === 1 ? "" : "s"}</span>
            </div>
          </Card>

          {rows.length ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3 font-bold">Servicio</th>
                      <th className="px-4 py-3 font-bold">Categoría</th>
                      <th className="px-4 py-3 font-bold">Duración</th>
                      <th className="px-4 py-3 font-bold">Precio</th>
                      <th className="px-4 py-3 font-bold">Estado</th>
                      <th className="px-4 py-3 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {rows.map((service) => (
                      <tr className="transition hover:bg-surface-container-low/60" key={service.id}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-on-surface">{service.name}</p>
                          <p className="mt-0.5 font-mono text-xs text-on-surface-variant">{service.code}</p>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">{service.category || "General"}</td>
                        <td className="px-4 py-3 font-bold">{service.durationMinutes} min</td>
                        <td className="px-4 py-3 font-bold">S/ {Number(service.price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${service.status === "active" ? "bg-emerald-100 text-emerald-900" : "bg-surface-container-high text-on-surface-variant"}`}>
                            {service.status === "active" ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ServiceActionsMenu
                            canManage={canManageServices}
                            isOpen={openServiceActionsId === service.id}
                            onActivate={(item) => openServiceModal("procedure-activate", item)}
                            onDeactivate={(item) => openServiceModal("procedure-deactivate", item)}
                            onDelete={(item) => openServiceModal("procedure-delete", item)}
                            onEdit={(item) => openServiceModal("procedure-edit", item)}
                            onOpenChange={setOpenServiceActionsId}
                            service={service}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="grid min-h-52 place-items-center p-6 text-center">
              <div>
                <span aria-hidden="true" className="material-symbols-outlined text-4xl text-primary">medical_services</span>
                <h2 className="mt-3 text-lg font-bold">Aún no hay servicios</h2>
                <p className="mt-1 max-w-md text-sm text-on-surface-variant">Registra el primero para poder seleccionarlo al agendar citas.</p>
                {canManageServices ? <Button className="mt-4" icon="add" onClick={() => openServiceModal("procedure")}>Agregar servicio</Button> : null}
              </div>
            </Card>
          )}
        </section>
      ) : report ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(report).map(([key, value]) => (
            <Card className="p-4" key={key}>
              <p>{key}</p>
              <b className="text-2xl">{typeof value === "number" ? value.toFixed(2) : value}</b>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((item) => (
            <Card className="p-4" key={item.id}>
              <b>{item.title || item.medication || item.name || item.procedure || `${item.paymentMethod}: S/ ${item.amount}`}</b>
              <p className="text-sm text-on-surface-variant">{item.content || item.instructions || item.category || item.reference || item.documentType}</p>
            </Card>
          ))}
        </div>
      )}

      {serviceModalOpen ? (
        <Modal onClose={closeServiceModal} title={modal === "procedure" ? "Nuevo servicio dental" : modal === "procedure-edit" ? "Editar servicio dental" : modal === "procedure-activate" ? "Activar servicio" : modal === "procedure-deactivate" ? "Desactivar servicio" : "Eliminar servicio definitivamente"}>
          {modal === "procedure" || modal === "procedure-edit" ? (
            <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submitService}>
              <ServiceFields service={selectedService} />
              {serviceActionError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container sm:col-span-2">{serviceActionError}</p> : null}
              <div className="flex flex-col-reverse justify-end gap-2 sm:col-span-2 sm:flex-row">
                <Button onClick={closeServiceModal} type="button" variant="secondary">Cancelar</Button>
                <Button icon="save" loading={serviceSaving} type="submit">{modal === "procedure" ? "Guardar servicio" : "Guardar cambios"}</Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 p-5">
              <div className={`flex gap-3 rounded-2xl p-4 ${modal === "procedure-delete" ? "bg-error-container text-on-error-container" : "bg-primary-fixed text-on-primary-fixed"}`}>
                <span aria-hidden="true" className="material-symbols-outlined text-2xl">{modal === "procedure-delete" ? "delete_forever" : modal === "procedure-activate" ? "toggle_on" : "toggle_off"}</span>
                <div>
                  <p className="font-bold">{selectedService?.name}</p>
                  <p className="mt-1 text-sm">{modal === "procedure-activate" ? "Volverá a estar disponible para agendar nuevas citas." : modal === "procedure-deactivate" ? "Dejará de estar disponible para agendar nuevas citas." : "Se quitará definitivamente del catálogo."}</p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant">Las citas y tratamientos ya registrados conservan su propia descripción y no se modificarán.</p>
              {modal === "procedure-delete" ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">Esta acción no se puede deshacer. Si solo deseas ocultarlo de la agenda, usa Desactivar.</p> : null}
              {serviceActionError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">{serviceActionError}</p> : null}
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button onClick={closeServiceModal} type="button" variant="secondary">Cancelar</Button>
                <Button icon={modal === "procedure-delete" ? "delete_forever" : modal === "procedure-activate" ? "toggle_on" : "toggle_off"} loading={serviceSaving} onClick={runServiceAction} type="button" variant={modal === "procedure-delete" ? "danger" : "primary"}>{modal === "procedure-delete" ? "Eliminar definitivamente" : modal === "procedure-activate" ? "Activar servicio" : "Desactivar servicio"}</Button>
              </div>
            </div>
          )}
        </Modal>
      ) : null}

      {modal && !serviceModalOpen ? (
        <Modal onClose={() => setModal("")} title="Registro dental">
          <form className="grid gap-3 p-5 sm:grid-cols-2" onSubmit={submit}>
            {modal === "entry" ? <>
              <select className={cls} name="entryType"><option value="history">Historia</option><option value="evolution">Evolución</option><option value="examination">Examen</option><option value="consent">Consentimiento</option></select>
              <input className={cls} name="title" placeholder="Título" required />
              <input className={cls} name="professionalName" placeholder="Odontólogo" />
              <input className={cls} name="bloodPressure" placeholder="Presión arterial" />
              <textarea className={cls} name="content" placeholder="Detalle clínico" required />
            </> : null}
            {modal === "prescription" ? <>
              <input className={cls} name="medication" placeholder="Medicamento" required />
              <input className={cls} name="dose" placeholder="Dosis" />
              <input className={cls} name="frequency" placeholder="Frecuencia" />
              <input className={cls} name="duration" placeholder="Duración" />
              <input className={cls} name="professionalName" placeholder="Odontólogo" />
              <textarea className={cls} name="instructions" placeholder="Indicaciones" />
            </> : null}
            {modal === "document" ? <>
              <select className={cls} name="documentType"><option value="radiograph">Radiografía</option><option value="photo">Fotografía</option><option value="consent">Consentimiento</option><option value="other">Otro</option></select>
              <input className={cls} name="name" placeholder="Nombre" required />
              <input className={cls} name="url" placeholder="URL segura" required />
              <textarea className={cls} name="notes" placeholder="Notas" />
            </> : null}
            {modal === "payment" ? <>
              <input className={cls} min="0.01" name="amount" required step="0.01" type="number" />
              <select className={cls} name="paymentMethod"><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option><option value="yape">Yape</option></select>
              <input className={cls} name="reference" placeholder="Referencia" />
              <textarea className={cls} name="notes" placeholder="Notas" />
            </> : null}
            <Button icon="save" type="submit">Guardar</Button>
          </form>
        </Modal>
      ) : null}
    </Shell>
  );
}
