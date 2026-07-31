import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import HorizontalScroller from "../../components/atoms/HorizontalScroller";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import EntityAttachments from "../../components/attachments/EntityAttachments";
import VeterinaryPetDirectoryList from "../../components/patients/VeterinaryPetDirectoryList";
import Tooltip from "../../components/ui/Tooltip";
import { useAppConfig } from "../../context/appConfigStore";
import { useAuth } from "../../context/authStore";
import * as api from "../../services/veterinaryService";
import VeterinaryAttentionForm from "./VeterinaryAttentionForm";
import VeterinaryPaymentModal from "./VeterinaryPaymentModal";
import { matchesEntitySearch } from "../../utils/entitySearch";
import EntitySearchSelect from "../../components/ui/EntitySearchSelect";

const speciesIcon = {
  dog: "pets",
  cat: "pets",
  bird: "flutter_dash",
  rabbit: "cruelty_free",
};
const statusLabel = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  in_attention: "En atención",
  completed: "Finalizada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};
const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary";
const local = (value) =>
  value
    ? new Date(value).toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";
function submitData(event) {
  return Object.fromEntries(new FormData(event.currentTarget).entries());
}
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const readDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
function PetAvatar({ pet, className = "size-12" }) {
  const photo = pet.photoUrl || pet.photo_url;
  return photo ? (
    <img
      alt={`Foto de ${pet.name}`}
      className={`${className} shrink-0 rounded-xl object-cover`}
      src={photo}
    />
  ) : (
    <span
      className={`material-symbols-outlined grid ${className} shrink-0 place-items-center rounded-xl bg-primary text-2xl text-white`}
    >
      {speciesIcon[pet.species] || "pets"}
    </span>
  );
}
function Metric({ icon, label, value, note }) {
  return (
    <Card className="relative min-h-32 overflow-hidden p-4">
      <span className="absolute -right-6 -top-6 size-20 rounded-full bg-primary-fixed" />
      <span className="material-symbols-outlined relative text-primary">
        {icon}
      </span>
      <p className="relative mt-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <b className="relative mt-1 block text-2xl">{value}</b>
      <small className="relative text-on-surface-variant">{note}</small>
    </Card>
  );
}
function PetForm({ close, done, pet = null }) {
  const [photo, setPhoto] = useState(pet?.photoUrl || ""),
    [fileError, setFileError] = useState(""),
    [formError, setFormError] = useState("");
  const selectPhoto = async (event) => {
    const file = event.target.files?.[0];
    setFileError("");
    if (!file) {
      setPhoto("");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setFileError("Selecciona una imagen JPG o PNG.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("La imagen debe pesar como máximo 2 MB.");
      event.target.value = "";
      return;
    }
    setPhoto(await readDataUrl(file));
  };
  const save = async (event) => {
    event.preventDefault();
    setFormError("");
    const x = submitData(event);
    const payload = {
      code: pet?.code || "",
      name: x.name,
      species: x.species,
      breed: x.breed,
      sex: x.sex,
      birth_date: x.birth_date || null,
      color: x.color,
      weight_kg: Number(x.weight_kg || 0),
      microchip: x.microchip,
      allergies: x.allergies,
      conditions: x.conditions,
      status: x.status || pet?.status || "active",
      photo_url: photo,
      owner: {
        name: x.owner_name,
        document: x.owner_document,
        phone: x.owner_phone,
        email: x.owner_email,
        address: x.owner_address,
        notes: pet?.owner?.notes || "",
      },
    };
    try {
      if (pet) await api.updatePet(pet.id, payload);
      else await api.createPet(payload);
      await done();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };
  return (
    <Modal
      dialogClassName="sm:max-w-3xl"
      onClose={close}
      title={pet ? `Editar mascota · ${pet.name}` : "Registrar mascota"}
    >
      <form className="grid gap-3 p-4 sm:grid-cols-2" onSubmit={save}>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low p-3">
          {photo ? (
            <img
              alt="Vista previa de la mascota"
              className="size-20 rounded-2xl object-cover"
              src={photo}
            />
          ) : (
            <span className="material-symbols-outlined grid size-20 place-items-center rounded-2xl bg-primary-fixed text-4xl text-primary">
              pets
            </span>
          )}
          <label className="min-w-0 flex-1 font-bold">
            Foto opcional
            <input
              accept="image/jpeg,image/png"
              className="mt-1 block w-full text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-white"
              onChange={selectPhoto}
              type="file"
            />
            <small className="block text-on-surface-variant">
              JPG o PNG, máximo 2 MB.
            </small>
            {fileError ? (
              <small className="block text-error">{fileError}</small>
            ) : null}
          </label>
          {photo ? (
            <button
              className="rounded-lg px-3 py-2 text-sm font-bold text-error hover:bg-error-container"
              onClick={() => setPhoto("")}
              type="button"
            >
              Quitar
            </button>
          ) : null}
        </div>
        <h3 className="sm:col-span-2 font-bold text-primary">
          Datos de la mascota
        </h3>
        <label>
          Nombre
          <input className={field} defaultValue={pet?.name || ""} name="name" required />
        </label>
        <label>
          Especie
          <select className={field} defaultValue={pet?.species || "dog"} name="species">
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="bird">Ave</option>
            <option value="rabbit">Conejo</option>
            <option value="other">Otra</option>
          </select>
        </label>
        <label>
          Raza
          <input className={field} defaultValue={pet?.breed || ""} name="breed" />
        </label>
        <label>
          Sexo
          <select className={field} defaultValue={pet?.sex || "unknown"} name="sex">
            <option value="unknown">Sin especificar</option>
            <option value="female">Hembra</option>
            <option value="male">Macho</option>
          </select>
        </label>
        <label>
          Nacimiento
          <input className={field} defaultValue={(pet?.birthDate || "").slice(0, 10)} name="birth_date" type="date" />
        </label>
        <label>
          Peso (kg)
          <input
            className={field}
            defaultValue={pet?.weightKg || ""}
            min="0"
            name="weight_kg"
            step="0.01"
            type="number"
          />
        </label>
        <label>
          Color
          <input className={field} defaultValue={pet?.color || ""} name="color" />
        </label>
        <label>
          Microchip
          <input className={field} defaultValue={pet?.microchip || ""} name="microchip" />
        </label>
        {pet ? (
          <label>
            Estado
            <select className={field} defaultValue={pet.status || "active"} name="status">
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
              <option value="deceased">Fallecida</option>
            </select>
          </label>
        ) : null}
        <label className="sm:col-span-2">
          Alergias
          <input className={field} defaultValue={pet?.allergies || ""} name="allergies" />
        </label>
        <label className="sm:col-span-2">
          Condiciones previas
          <input className={field} defaultValue={pet?.conditions || ""} name="conditions" />
        </label>
        <h3 className="sm:col-span-2 mt-2 font-bold text-primary">
          Propietario
        </h3>
        <label>
          Nombre completo
          <input className={field} defaultValue={pet?.owner?.name || ""} name="owner_name" required />
        </label>
        <label>
          DNI / documento
          <input
            className={field}
            defaultValue={pet?.owner?.document || ""}
            inputMode="numeric"
            maxLength="12"
            name="owner_document"
            pattern="[0-9]{8,12}"
            required
          />
        </label>
        <label>
          Teléfono
          <input
            className={field}
            defaultValue={pet?.owner?.phone || ""}
            inputMode="numeric"
            maxLength="15"
            name="owner_phone"
          />
        </label>
        <label>
          Correo
          <input className={field} defaultValue={pet?.owner?.email || ""} name="owner_email" type="email" />
        </label>
        <label className="sm:col-span-2">
          Dirección
          <input className={field} defaultValue={pet?.owner?.address || ""} name="owner_address" />
        </label>
        {formError ? <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2">{formError}</p> : null}
        <div className="sm:col-span-2 flex flex-wrap justify-end gap-2">
          <Button onClick={close} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={Boolean(fileError)} type="submit">
            {pet ? "Guardar cambios" : "Guardar mascota"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function PetActionsMenu({
  canEdit,
  canManageLifecycle,
  isOpen,
  onDeactivate,
  onDelete,
  onEdit,
  onOpenChange,
  onRestore,
  pet,
}) {
  if (!canEdit && !canManageLifecycle) return null;
  const closeAndRun = (action) => () => {
    onOpenChange(null);
    action(pet);
  };
  return (
    <div className="relative shrink-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onOpenChange(null); }} onKeyDown={(event) => { if (event.key === "Escape") onOpenChange(null); }}>
      <Tooltip label="Más acciones" placement="top-end">
        <button aria-expanded={isOpen} aria-haspopup="menu" aria-label={`Más acciones para ${pet.name}`} className="grid size-9 place-items-center rounded-lg border border-outline-variant bg-white text-on-surface-variant shadow-sm transition hover:border-primary hover:bg-primary-fixed hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30" onClick={() => onOpenChange(isOpen ? null : pet.id)} type="button"><span aria-hidden="true" className="material-symbols-outlined text-xl">more_vert</span></button>
      </Tooltip>
      {isOpen ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-60 rounded-xl border border-outline-variant bg-white p-1.5 shadow-xl" role="menu">
          {canEdit ? <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onEdit)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">edit</span>Editar ficha</button> : null}
          {canManageLifecycle ? <><div className="my-1 border-t border-outline-variant" />{pet.status === "active" ? <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onDeactivate)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">pets</span>Desactivar mascota</button> : null}{pet.status === "inactive" ? <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition hover:bg-surface-container-low" onClick={closeAndRun(onRestore)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">restore</span>Restaurar mascota</button> : null}<button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-error transition hover:bg-error-container" onClick={closeAndRun(onDelete)} role="menuitem" type="button"><span aria-hidden="true" className="material-symbols-outlined text-lg">delete_forever</span>Eliminar definitivamente</button></> : null}
        </div>
      ) : null}
    </div>
  );
}
function AppointmentForm({ pets, professionals, close, done }) {
  const [petId, setPetId] = useState("");
  const save = async (event) => {
    event.preventDefault();
    const x = submitData(event);
    await api.createVeterinaryAppointment({
      pet_id: x.pet_id,
      professional_id: x.professional_id || null,
      starts_at: x.starts_at,
      ends_at: x.ends_at,
      reason: x.reason,
      notes: x.notes,
    });
    done();
  };
  return (
    <Modal onClose={close} title="Agendar cita veterinaria">
      <form className="grid gap-3 p-4 sm:grid-cols-2" onSubmit={save}>
        <EntitySearchSelect
          getLabel={(pet) => pet.name}
          getMeta={(pet) =>
            [pet.owner?.name, pet.owner?.document, pet.owner?.phone]
              .filter(Boolean)
              .join(" · ")
          }
          getSearchValues={(pet) => [
            pet.name,
            pet.code,
            pet.owner?.name,
            pet.owner?.document,
            pet.owner?.phone,
            pet.owner?.email,
          ]}
          items={pets}
          label="Mascota o propietario"
          name="pet_id"
          onChange={setPetId}
          placeholder="Buscar mascota, propietario, DNI o celular"
          required
          value={petId}
        />
        <label>
          Veterinario
          <select className={field} name="professional_id">
            <option value="">Por asignar</option>
            {professionals.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Inicio
          <input
            className={field}
            name="starts_at"
            required
            type="datetime-local"
          />
        </label>
        <label>
          Fin
          <input
            className={field}
            name="ends_at"
            required
            type="datetime-local"
          />
        </label>
        <label className="sm:col-span-2">
          Motivo
          <input className={field} name="reason" required />
        </label>
        <label className="sm:col-span-2">
          Indicaciones
          <textarea className={`${field} min-h-20 py-2`} name="notes" />
        </label>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button onClick={close} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button type="submit">Agendar</Button>
        </div>
      </form>
    </Modal>
  );
}
function VaccineForm({ pet, close, done }) {
  const save = async (event) => {
    event.preventDefault();
    const x = submitData(event);
    await api.createVeterinaryVaccine({
      pet_id: pet.id,
      name: x.name,
      applied_at: x.applied_at,
      next_due_at: x.next_due_at || null,
      lot: x.lot,
      professional_name: x.professional_name,
      notes: x.notes,
    });
    done();
  };
  return (
    <Modal onClose={close} title={`Vacuna · ${pet.name}`}>
      <form className="grid gap-3 p-4 sm:grid-cols-2" onSubmit={save}>
        <label>
          Vacuna
          <input className={field} name="name" required />
        </label>
        <label>
          Lote
          <input className={field} name="lot" />
        </label>
        <label>
          Aplicada
          <input className={field} name="applied_at" required type="date" />
        </label>
        <label>
          Próxima dosis
          <input className={field} name="next_due_at" type="date" />
        </label>
        <label className="sm:col-span-2">
          Profesional
          <input className={field} name="professional_name" />
        </label>
        <label className="sm:col-span-2">
          Notas
          <textarea className={`${field} min-h-20 py-2`} name="notes" />
        </label>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button onClick={close} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button type="submit">Registrar vacuna</Button>
        </div>
      </form>
    </Modal>
  );
}
function VeterinaryDocuments({ petId }) {
  const [legacyItems, setLegacyItems] = useState([]);
  useEffect(() => {
    let active = true;
    api
      .getVeterinaryDocuments(petId)
      .then((items) => {
        if (active) setLegacyItems(items);
      })
      .catch(() => {
        if (active) setLegacyItems([]);
      });
    return () => {
      active = false;
    };
  }, [petId]);
  return (
    <EntityAttachments
      entityId={petId}
      entityType="veterinary_pet"
      legacyItems={legacyItems}
      title="Archivos de la mascota"
    />
  );
}
function VeterinaryReports({ pet }) {
  const [previewUrl, setPreviewUrl] = useState(""),
    [kind, setKind] = useState("clinical"),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  const preview = async (nextKind) => {
    setLoading(true);
    setError("");
    try {
      const blob = await api.previewVeterinaryReport(pet.id, nextKind);
      const nextUrl = URL.createObjectURL(blob);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
      setKind(nextKind);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };
  const download = async (nextKind) => {
    setError("");
    try {
      await api.downloadVeterinaryReport(pet.id, nextKind);
    } catch (requestError) {
      setError(requestError.message);
    }
  };
  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="grid content-start gap-3">
        <Card className="p-3">
          <span className="material-symbols-outlined text-primary">
            clinical_notes
          </span>
          <b className="mt-2 block">Expediente clínico</b>
          <p className="mb-3 text-xs text-on-surface-variant">
            Datos, propietario, consultas, tratamientos, vacunas y
            profesionales.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => preview("clinical")} variant="secondary">
              Vista previa
            </Button>
            <Button onClick={() => download("clinical")}>Descargar</Button>
          </div>
        </Card>
        <Card className="p-3">
          <span className="material-symbols-outlined text-primary">
            vaccines
          </span>
          <b className="mt-2 block">Carné de vacunación</b>
          <p className="mb-3 text-xs text-on-surface-variant">
            Dosis aplicadas, lotes y próximas fechas.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => preview("vaccination")} variant="secondary">
              Vista previa
            </Button>
            <Button onClick={() => download("vaccination")}>Descargar</Button>
          </div>
        </Card>
        {error ? (
          <p className="rounded-lg bg-error-container p-2 text-sm text-error">
            {error}
          </p>
        ) : null}
      </div>
      <div className="min-h-72 min-w-0 overflow-hidden rounded-2xl border bg-surface-container-low">
        {loading ? (
          <div className="grid h-72 place-items-center">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">
              progress_activity
            </span>
          </div>
        ) : previewUrl ? (
          <iframe
            className="h-[min(52vh,36rem)] w-full border-0"
            src={previewUrl}
            title={
              kind === "clinical"
                ? "Vista previa del expediente clínico"
                : "Vista previa del carné de vacunación"
            }
          />
        ) : (
          <div className="grid h-72 place-items-center p-6 text-center">
            <div>
              <span className="material-symbols-outlined text-4xl text-primary">
                preview
              </span>
              <b className="mt-2 block">Vista previa del PDF</b>
              <p className="text-sm text-on-surface-variant">
                Elige un reporte para revisarlo antes de descargar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function VeterinaryRecordEditForm({ close, done, record }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async (event) => {
    event.preventDefault();
    const values = submitData(event);
    setSaving(true);
    setError("");
    try {
      await api.updateVeterinaryRecord(record.id, {
        recordType: values.recordType,
        diagnosis: values.diagnosis,
        treatment: values.treatment,
        notes: values.notes,
        temperature: values.temperature ? Number(values.temperature) : null,
        weightKg: values.weightKg ? Number(values.weightKg) : null,
      });
      done();
    } catch (requestError) {
      setError(requestError.message || "No se pudo actualizar la atención");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={close} title="Editar atención clínica">
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={save}>
        <label className="text-sm font-bold">
          Tipo de atención
          <select className={`${field} mt-1`} defaultValue={record.recordType} name="recordType">
            <option value="consultation">Consulta</option>
            <option value="emergency">Emergencia</option>
            <option value="surgery">Cirugía</option>
            <option value="control">Control</option>
            <option value="laboratory">Laboratorio</option>
            <option value="grooming">Grooming</option>
          </select>
        </label>
        <label className="text-sm font-bold">Temperatura<input className={`${field} mt-1`} defaultValue={record.temperature ?? ""} max="45" min="30" name="temperature" step="0.1" type="number" /></label>
        <label className="text-sm font-bold sm:col-span-2">Diagnóstico<input className={`${field} mt-1`} defaultValue={record.diagnosis} name="diagnosis" /></label>
        <label className="text-sm font-bold sm:col-span-2">Tratamiento<textarea className={`${field} mt-1 min-h-24 py-2`} defaultValue={record.treatment} name="treatment" /></label>
        <label className="text-sm font-bold">Peso (kg)<input className={`${field} mt-1`} defaultValue={record.weightKg ?? ""} max="999" min="0" name="weightKg" step="0.01" type="number" /></label>
        <label className="text-sm font-bold sm:col-span-2">Notas<textarea className={`${field} mt-1 min-h-24 py-2`} defaultValue={record.notes} name="notes" /></label>
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2" role="alert">{error}</p> : null}
        <div className="flex justify-end gap-2 sm:col-span-2"><Button onClick={close} type="button" variant="outlined">Cancelar</Button><Button disabled={saving} icon="save" type="submit">{saving ? "Guardando..." : "Guardar cambios"}</Button></div>
      </form>
    </Modal>
  );
}

function PetRecord({ data, close, onAttention, onReload, onVaccine, canEdit = false }) {
  const [tab, setTab] = useState("summary");
  const [editingRecord, setEditingRecord] = useState(null);
  const p = data.pet;
  const tabs = [
    ["summary", "person", "Resumen"],
    ["history", "clinical_notes", "Historia"],
    ["vaccines", "vaccines", "Vacunas"],
    ["appointments", "calendar_month", "Citas"],
    ["documents", "folder", "Archivos"],
    ["reports", "picture_as_pdf", "Reportes"],
  ];
  return (
    <>
    <Modal
      contentClassName="min-h-0 overflow-hidden"
      dialogClassName="sm:max-w-6xl"
      fixedHeight
      onClose={close}
      title={`Expediente · ${p.name}`}
    >
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3 sm:p-4">
        <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-2xl bg-primary-fixed p-3">
          <PetAvatar className="size-14" pet={p} />
          <div className="min-w-0 flex-1">
            <b className="block truncate text-lg">
              {p.name} · {p.breed || p.species}
            </b>
            <p className="truncate text-sm text-on-surface-variant">
              {p.code} · Propietario: {p.owner.name} ·{" "}
              {p.owner.phone || "Sin teléfono"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon="medical_services" onClick={onAttention}>
              Atención
            </Button>
            <Button icon="vaccines" onClick={onVaccine} variant="secondary">
              Vacuna
            </Button>
          </div>
        </div>
        <div className="my-3 shrink-0 overflow-x-auto rounded-xl border p-1">
          <nav className="flex min-w-max gap-1">
            {tabs.map((x) => (
              <button
                className={`flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-bold ${tab === x[0] ? "bg-primary text-white" : "hover:bg-surface-container-low"}`}
                key={x[0]}
                onClick={() => setTab(x[0])}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">
                  {x[1]}
                </span>
                {x[2]}
              </button>
            ))}
          </nav>
        </div>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pr-1">
          {tab === "summary" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <small>Peso actual</small>
                <b className="block text-2xl">{p.weightKg} kg</b>
              </Card>
              <Card className="p-4">
                <small>Alergias</small>
                <b className="block">{p.allergies || "Sin alergias"}</b>
              </Card>
              <Card className="p-4">
                <small>Condiciones</small>
                <b className="block">{p.conditions || "Sin condiciones"}</b>
              </Card>
              <Card className="p-4 sm:col-span-3">
                <b>Propietario</b>
                <p>
                  {p.owner.name} · DNI {p.owner.document}
                </p>
                <p className="break-words text-sm text-on-surface-variant">
                  {p.owner.phone || "Sin teléfono"} ·{" "}
                  {p.owner.email || "Sin correo"} ·{" "}
                  {p.owner.address || "Sin dirección"}
                </p>
              </Card>
            </div>
          ) : null}
          {tab === "history" ? (
            <div className="grid gap-2">
              {data.records.map((x) => (
                <Card className="p-3" key={x.id}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Badge>{x.recordType}</Badge>
                      <b className="ml-2">
                        {x.diagnosis || "Atención clínica"}
                      </b>
                      <p className="mt-1 break-words text-sm">{x.treatment}</p>
                      {x.supplies?.length ? (
                        <p className="mt-2 text-xs text-primary">
                          <b>Inventario:</b>{" "}
                          {x.supplies
                            .map((supply) => `${supply.quantity} × ${supply.product.name}`)
                            .join(", ")}
                        </p>
                      ) : null}
                      <small className="text-on-surface-variant">
                        {local(x.createdAt)} ·{" "}
                        {x.professional?.name || "Equipo veterinario"}
                      </small>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                      <b>{money(x.amount)}</b>
                      <p className="text-xs">
                        {x.paymentStatus === "paid" ? "Pagado" : "Por cobrar"}
                      </p>
                      {canEdit ? <Button icon="edit" onClick={() => setEditingRecord(x)} size="small" variant="outlined">Editar</Button> : null}
                    </div>
                  </div>
                </Card>
              ))}
              {!data.records.length ? (
                <EmptyState
                  icon="clinical_notes"
                  title="Sin atenciones"
                  description="La historia se completará desde cada consulta."
                />
              ) : null}
            </div>
          ) : null}
          {tab === "vaccines" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.vaccines.map((x) => (
                <Card className="p-3" key={x.id}>
                  <b>{x.name}</b>
                  <p className="text-sm">Aplicada: {x.appliedAt}</p>
                  <p className="text-sm text-primary">
                    Próxima: {x.nextDueAt || "No indicada"}
                  </p>
                </Card>
              ))}
              {!data.vaccines.length ? (
                <EmptyState
                  icon="vaccines"
                  title="Sin vacunas"
                  description="Registra la primera vacuna de la mascota."
                />
              ) : null}
            </div>
          ) : null}
          {tab === "appointments" ? (
            <div className="grid gap-2">
              {data.appointments.map((x) => (
                <Card className="p-3" key={x.id}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <b>{x.reason}</b>
                      <p className="text-sm">
                        {local(x.startsAt)} ·{" "}
                        {x.professional?.name || "Por asignar"}
                      </p>
                    </div>
                    <Badge>{statusLabel[x.status] || x.status}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
          {tab === "documents" ? <VeterinaryDocuments petId={p.id} /> : null}
          {tab === "reports" ? <VeterinaryReports pet={p} /> : null}
        </div>
      </div>
    </Modal>
    {editingRecord ? <VeterinaryRecordEditForm close={() => setEditingRecord(null)} done={async () => { setEditingRecord(null); await onReload(); }} record={editingRecord} /> : null}
    </>
  );
}

export default function VeterinaryWorkspace({ dashboard = false }) {
  const { moduleKey } = useParams();
  const { user } = useAuth();
  const { config } = useAppConfig();
  const mode = dashboard
    ? "dashboard"
    : moduleKey === "appointments"
      ? "appointments"
      : moduleKey === "invoices"
        ? "billing"
        : "pets";
  const administrator = ["admin", "admin_owner"].includes(user?.role);
  const capabilities = new Set(config?.capabilities || []);
  const canEditPets = administrator || capabilities.has("pets.edit");
  const canManagePetLifecycle = administrator;
  const [summary, setSummary] = useState({}),
    [pets, setPets] = useState([]),
    [appointments, setAppointments] = useState([]),
    [billing, setBilling] = useState([]),
    [professionals, setProfessionals] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [modal, setModal] = useState(""),
    [selected, setSelected] = useState(null),
    [record, setRecord] = useState(null),
    [query, setQuery] = useState(""),
    [paymentRecord, setPaymentRecord] = useState(null);
  const [editingPet, setEditingPet] = useState(null);
  const [petStatus, setPetStatus] = useState("active");
  const [openPetActionsId, setOpenPetActionsId] = useState(null);
  const [petActionError, setPetActionError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, p, a, b, pro] = await Promise.all([
        api.getVeterinarySummary(),
        api.getPets(),
        api.getVeterinaryAppointments(),
        api.getVeterinaryBilling("all"),
        api.getVeterinaryProfessionals(),
      ]);
      setSummary(s);
      setPets(p);
      setAppointments(a);
      setBilling(b);
      setProfessionals(pro);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const done = async () => {
    setModal("");
    setEditingPet(null);
    setSelected(null);
    await load();
  };
  const openRecord = async (pet) => {
    setSelected(pet);
    setModal("record");
    try {
      setRecord(await api.getPetRecord(pet.id));
    } catch (e) {
      setError(e.message);
    }
  };
  const askDeactivate = (pet) => {
    setSelected(pet);
    setRecord(null);
    setPetActionError("");
    setModal("deactivate");
  };
  const askPermanentDelete = (pet) => {
    setSelected(pet);
    setRecord(null);
    setPetActionError("");
    setModal("permanent-delete");
  };
  const restorePet = async (pet) => {
    try {
      setError("");
      await api.restorePet(pet.id);
      await load();
    } catch (requestError) {
      setError(requestError.message || "No se pudo restaurar la mascota.");
    }
  };
  const filtered = useMemo(
    () =>
      pets.filter(
        (x) =>
          (petStatus === "all" || x.status === petStatus) &&
          matchesEntitySearch(x, query, (item) => [
            item.name,
            item.code,
            item.owner?.name,
            item.owner?.document,
            item.owner?.phone,
            item.owner?.email,
            item.allergies,
            item.conditions,
            item.microchip,
          ]),
      ),
    [petStatus, pets, query],
  );
  const today = new Date().toLocaleDateString("en-CA");
  const todayAppointments = appointments.filter(
    (x) => x.startsAt?.slice(0, 10) === today,
  );
  const action = (
    <div className="flex gap-2">
      {canEditPets ? <Button icon="pets" onClick={() => { setEditingPet(null); setModal("pet"); }}>Registrar mascota</Button> : null}
      <Button
        icon="event_available"
        onClick={() => setModal("appointment")}
        variant="secondary"
      >
        Agendar cita
      </Button>
    </div>
  );
  return (
    <DashboardShell
      action={action}
      subtitle="Mascotas, propietarios, agenda, historia clínica, vacunas y cobros conectados."
      title={
        dashboard
          ? "Panel veterinario"
          : mode === "appointments"
            ? "Agenda veterinaria"
            : mode === "billing"
              ? "Cobros veterinarios"
              : "Mascotas"
      }
    >
      {error ? (
        <EmptyState
          icon="cloud_off"
          title="No se pudo cargar"
          description={error}
        />
      ) : null}
      {loading ? <Card className="h-40 animate-pulse" /> : null}
      {!loading && dashboard ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              icon="pets"
              label="Mascotas"
              value={summary.pets || 0}
              note="Expedientes activos"
            />
            <Metric
              icon="calendar_month"
              label="Citas de hoy"
              value={summary.appointmentsToday || 0}
              note="Atenciones programadas"
            />
            <Metric
              icon="vaccines"
              label="Vacunas próximas"
              value={summary.vaccinesDue || 0}
              note="Durante los próximos 30 días"
            />
            <Metric
              icon="payments"
              label="Por cobrar"
              value={money(summary.pendingAmount)}
              note="Atenciones pendientes"
            />
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-bold">Agenda de hoy</h2>
                  <p className="text-xs text-on-surface-variant">
                    Llegadas y veterinarios asignados.
                  </p>
                </div>
                <Link
                  className="font-bold text-primary"
                  to="/dashboard/appointments"
                >
                  Ver agenda
                </Link>
              </div>
              <div className="mt-3 grid gap-2">
                {todayAppointments.map((x) => (
                  <button
                    className="rounded-xl bg-surface-container-low p-3 text-left"
                    key={x.id}
                    onClick={() => openRecord(x.pet)}
                    type="button"
                  >
                    <b>
                      {new Date(x.startsAt).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {x.pet.name}
                    </b>
                    <p className="text-sm">
                      {x.reason} · {x.professional?.name || "Por asignar"}
                    </p>
                  </button>
                ))}
                {!todayAppointments.length ? (
                  <p className="rounded-xl border border-dashed p-5 text-center">
                    Sin citas para hoy.
                  </p>
                ) : null}
              </div>
            </Card>
            <Card className="p-4">
              <h2 className="text-lg font-bold">Acciones clínicas</h2>
              <div className="mt-3 grid gap-2">
                <Button icon="pets" onClick={() => setModal("pet")}>
                  Nueva mascota
                </Button>
                <Button
                  icon="calendar_month"
                  onClick={() => setModal("appointment")}
                  variant="secondary"
                >
                  Nueva cita
                </Button>
                <Link
                  className="rounded-xl border px-4 py-3 text-center font-bold"
                  to="/dashboard/inventory"
                >
                  Inventario veterinario
                </Link>
                <Link
                  className="rounded-xl border px-4 py-3 text-center font-bold"
                  to="/dashboard/team"
                >
                  Equipo y asistencia
                </Link>
              </div>
            </Card>
          </div>
          <Card className="mt-4 p-4">
            <h2 className="mb-3 text-lg font-bold">Mascotas recientes</h2>
            <HorizontalScroller label="Mascotas recientes">
              {pets.slice(0, 10).map((x) => (
                <button
                  className="w-56 shrink-0 text-left"
                  key={x.id}
                  onClick={() => openRecord(x)}
                  type="button"
                >
                  <div className="rounded-2xl border p-3 hover:border-primary">
                    <PetAvatar className="size-14" pet={x} />
                    <b className="mt-2 block">{x.name}</b>
                    <p className="truncate text-xs">
                      {x.breed || x.species} · {x.owner.name}
                    </p>
                  </div>
                </button>
              ))}
            </HorizontalScroller>
          </Card>
        </>
      ) : null}
      {!loading && mode === "pets" && !dashboard ? (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-11 min-w-56 flex-[1_1_24rem] items-center gap-2 rounded-xl border border-outline-variant bg-white px-3"><span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">search</span><input className="min-w-0 flex-1 bg-transparent outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar mascota, propietario, DNI, celular, alergia o microchip" value={query} /></label>
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-white px-3 text-sm font-bold"><span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">filter_list</span><span className="sr-only">Estado</span><select aria-label="Filtrar mascotas por estado" className="bg-transparent outline-none" onChange={(event) => setPetStatus(event.target.value)} value={petStatus}><option value="active">Activas</option><option value="all">Todas</option><option value="inactive">Inactivas</option><option value="deceased">Fallecidas</option></select></label>
            <Badge>{filtered.length} mascotas</Badge>
          </div>
          {filtered.length ? <VeterinaryPetDirectoryList actionContent={(pet) => <PetActionsMenu canEdit={canEditPets} canManageLifecycle={canManagePetLifecycle} isOpen={openPetActionsId === pet.id} onDeactivate={askDeactivate} onDelete={askPermanentDelete} onEdit={(item) => { setEditingPet(item); setModal("pet"); }} onOpenChange={setOpenPetActionsId} onRestore={restorePet} pet={pet} />} onOpen={openRecord} pets={filtered} /> : <EmptyState description="Prueba con otro nombre, propietario, alerta o estado." icon="pets" title="No hay mascotas para mostrar" />}
        </section>
      ) : null}
      {!loading && mode === "appointments" && !dashboard ? (
        <div className="grid gap-3">
          {appointments.map((x) => (
            <Card className="p-4" key={x.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  className="text-left"
                  onClick={() => openRecord(x.pet)}
                  type="button"
                >
                  <b className="text-lg">
                    {x.pet.name} · {x.pet.owner.name}
                  </b>
                  <p className="text-sm">
                    {local(x.startsAt)} · {x.reason}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {x.professional?.name || "Profesional por asignar"}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <Badge>{statusLabel[x.status] || x.status}</Badge>
                  {["scheduled", "confirmed"].includes(x.status) ? (
                    <Button
                      onClick={async () => {
                        await api.updateVeterinaryAppointment(
                          x.id,
                          "confirmed",
                        );
                        load();
                      }}
                      variant="secondary"
                    >
                      Confirmar
                    </Button>
                  ) : null}
                  <Button
                    onClick={() => {
                      setSelected(x.pet);
                      setModal("attention");
                    }}
                  >
                    Atender
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
      {!loading && mode === "billing" && !dashboard ? (
        <div className="grid gap-3">
          {billing.map((x) => (
            <Card className="p-4" key={x.id}>
              <div className="flex items-center justify-between gap-3">
                <button
                  className="text-left"
                  onClick={() => openRecord(x.pet)}
                  type="button"
                >
                  <b>
                    {x.pet.name} · {x.pet.owner.name}
                  </b>
                  <p className="text-sm">
                    {x.diagnosis || x.recordType} · {local(x.createdAt)}
                  </p>
                </button>
                <div className="text-right">
                  <b className="text-xl">{money(x.amount)}</b>
                  <p className="text-xs">
                    {x.paymentStatus === "paid" ? "Pagado" : "Pendiente"}
                  </p>
                  {x.paymentStatus === "pending" ? (
                    <Button onClick={() => setPaymentRecord(x)}>
                      Cobrar y emitir
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
          {!billing.length ? (
            <EmptyState
              icon="payments"
              title="Sin cobros"
              description="Las atenciones con importe aparecerán aquí."
            />
          ) : null}
        </div>
      ) : null}
      {modal === "pet" ? (
        <PetForm close={() => { setModal(""); setEditingPet(null); }} done={done} pet={editingPet} />
      ) : null}
      {canManagePetLifecycle && modal === "deactivate" && selected ? <Modal onClose={() => setModal("")} title="Desactivar mascota"><div className="grid gap-4 p-5"><p>La ficha de <b>{selected.name}</b> se conservará junto con sus citas, vacunas e historia clínica. No se eliminarán datos de atención.</p>{petActionError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">{petActionError}</p> : null}<div className="flex justify-end gap-2"><Button onClick={() => setModal("")} type="button" variant="outlined">Cancelar</Button><Button icon="pets" onClick={async () => { try { setPetActionError(""); await api.deactivatePet(selected.id); setModal(""); await load(); } catch (requestError) { setPetActionError(requestError.message || "No se pudo desactivar la mascota."); } }}>Desactivar</Button></div></div></Modal> : null}
      {canManagePetLifecycle && modal === "permanent-delete" && selected ? <Modal onClose={() => setModal("")} title="Eliminar mascota definitivamente"><div className="grid gap-4 p-5"><p>Se eliminará definitivamente la ficha de <b>{selected.name}</b>. Solo se permite si no tiene citas, atenciones, vacunas, consumos, comprobantes ni archivos adjuntos.</p><p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">Esta acción no se puede deshacer. Si la mascota ya tiene atención registrada, usa Desactivar.</p>{petActionError ? <p className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">{petActionError}</p> : null}<div className="flex justify-end gap-2"><Button onClick={() => setModal("")} type="button" variant="outlined">Cancelar</Button><Button icon="delete_forever" onClick={async () => { try { setPetActionError(""); await api.permanentlyDeletePet(selected.id); setSelected(null); setRecord(null); setModal(""); await load(); } catch (requestError) { setPetActionError(requestError.message || "No se pudo eliminar la mascota."); } }} type="button" variant="danger">Eliminar definitivamente</Button></div></div></Modal> : null}
      {modal === "appointment" ? (
        <AppointmentForm
          close={() => setModal("")}
          done={done}
          pets={pets}
          professionals={professionals}
        />
      ) : null}
      {modal === "record" && record ? (
        <PetRecord
          canEdit={canEditPets}
          close={() => {
            setModal("");
            setRecord(null);
          }}
          data={record}
          onAttention={() => setModal("attention")}
          onReload={async () => {
            if (selected) setRecord(await api.getPetRecord(selected.id));
          }}
          onVaccine={() => setModal("vaccine")}
        />
      ) : null}
      {modal === "attention" && selected ? (
        <VeterinaryAttentionForm
          appointments={appointments}
          onClose={() => setModal("record")}
          onSaved={done}
          pet={selected}
          professionals={professionals}
        />
      ) : null}
      {modal === "vaccine" && selected ? (
        <VaccineForm
          close={() => setModal("record")}
          done={done}
          pet={selected}
        />
      ) : null}
      {paymentRecord ? (
        <VeterinaryPaymentModal
          onClose={() => setPaymentRecord(null)}
          onPaid={load}
          record={paymentRecord}
        />
      ) : null}
    </DashboardShell>
  );
}
