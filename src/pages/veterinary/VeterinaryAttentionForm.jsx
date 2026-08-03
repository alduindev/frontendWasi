import { useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import * as api from "../../services/veterinaryService";

const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary";

const recordTypes = [
  ["consultation", "Consulta"],
  ["emergency", "Emergencia"],
  ["surgery", "Cirugía"],
  ["control", "Control"],
  ["laboratory", "Laboratorio"],
  ["grooming", "Estética"],
];

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

export default function VeterinaryAttentionForm({
  appointments = [],
  initialAppointmentId = "",
  initialProfessionalId = "",
  initialServicePrice,
  onClose,
  onSaved,
  pet,
  professionals = [],
}) {
  const [supplies, setSupplies] = useState([]);
  const [cart, setCart] = useState({});
  const [appointmentId, setAppointmentId] = useState(initialAppointmentId);
  const [professionalId, setProfessionalId] = useState(initialProfessionalId);
  const [baseAmount, setBaseAmount] = useState(
    initialServicePrice === undefined || initialServicePrice === null
      ? ""
      : String(initialServicePrice),
  );
  const [query, setQuery] = useState("");
  const [loadingSupplies, setLoadingSupplies] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .getVeterinarySupplies()
      .then((items) => {
        if (active) setSupplies(items);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoadingSupplies(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedSupplies = useMemo(
    () =>
      supplies.filter((item) => cart[item.id]).map((item) => ({
        ...item,
        quantity: cart[item.id],
      })),
    [cart, supplies],
  );
  const matchingSupplies = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es-PE");
    if (!term) return supplies;
    return supplies.filter((item) =>
      [item.name, item.sku, item.category]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("es-PE").includes(term)),
    );
  }, [query, supplies]);
  const retailTotal = selectedSupplies.reduce(
    (total, item) =>
      item.usageType === "clinical"
        ? total
        : total + Number(item.price || 0) * item.quantity,
    0,
  );
  const total = Number(baseAmount || 0) + retailTotal;

  const changeQuantity = (item, delta) => {
    setCart((current) => {
      const quantity = Math.max(
        0,
        Math.min(item.stock, (current[item.id] || 0) + delta),
      );
      const next = { ...current };
      if (quantity) next[item.id] = quantity;
      else delete next[item.id];
      return next;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.createVeterinaryRecord({
        pet_id: pet.id,
        appointment_id: appointmentId || null,
        professional_id: professionalId || null,
        record_type: form.get("record_type"),
        diagnosis: form.get("diagnosis"),
        treatment: form.get("treatment"),
        notes: form.get("notes"),
        temperature: form.get("temperature")
          ? Number(form.get("temperature"))
          : null,
        weight_kg: form.get("weight_kg")
          ? Number(form.get("weight_kg"))
          : null,
        amount: Number(baseAmount || 0),
        supplies: selectedSupplies.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      });
      await onSaved(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal dialogClassName="sm:max-w-4xl" onClose={onClose} title={`Atención · ${pet.name}`}>
      <form className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5" onSubmit={save}>
        <section className={`grid gap-2 rounded-2xl border p-3 sm:col-span-2 ${pet.allergies || pet.conditions ? "border-error bg-error-container/30" : "border-primary/30 bg-primary-fixed"}`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">pets</span>
            <div>
              <h3 className="font-bold">Antes de atender: ficha de {pet.name}</h3>
              <p className="text-sm text-on-surface-variant">Verifica estos datos clínicos antes de registrar el diagnóstico o tratamiento.</p>
            </div>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <p><b>Alergias:</b> {pet.allergies || "No registradas"}</p>
            <p><b>Condiciones:</b> {pet.conditions || "No registradas"}</p>
            <p><b>Peso de ficha:</b> {pet.weightKg ? `${pet.weightKg} kg` : "No registrado"}</p>
          </div>
        </section>
        <label className="grid gap-1">
          Tipo
          <select className={field} name="record_type">
            {recordTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Cita vinculada
          <select
            className={field}
            onChange={(event) => {
              const nextAppointmentId = event.target.value;
              const linkedAppointment = appointments.find(
                (item) => String(item.id) === nextAppointmentId,
              );
              setAppointmentId(nextAppointmentId);
              if (linkedAppointment?.service?.price !== undefined)
                setBaseAmount(String(linkedAppointment.service.price));
            }}
            value={appointmentId}
          >
            <option value="">Sin cita</option>
            {appointments
              .filter(
                (item) =>
                  item.petId === pet.id &&
                  ["scheduled", "confirmed", "in_attention"].includes(item.status),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {new Date(item.startsAt).toLocaleString("es-PE")} · {item.reason}
                </option>
              ))}
          </select>
        </label>
        <label className="grid gap-1">
          Profesional
          <select
            className={field}
            onChange={(event) => setProfessionalId(event.target.value)}
            value={professionalId}
          >
            <option value="">Mi atención / sin asignar</option>
            {professionals.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Tarifa de atención
          <input
            className={field}
            min="0"
            onChange={(event) => setBaseAmount(event.target.value)}
            step="0.01"
            type="number"
            value={baseAmount}
          />
        </label>
        <label className="grid gap-1">
          Temperatura °C
          <input className={field} max="45" min="30" name="temperature" step="0.1" type="number" />
        </label>
        <label className="grid gap-1">
          Peso kg
          <input className={field} min="0" name="weight_kg" step="0.01" type="number" />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          Diagnóstico
          <input className={field} name="diagnosis" required />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          Tratamiento
          <textarea className={`${field} min-h-20 py-2`} name="treatment" required />
        </label>
        <section className="grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-3 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold">Productos e insumos</h3>
              <p className="text-sm text-on-surface-variant">
                Los insumos clínicos descuentan stock; los productos vendibles se agregan al cobro.
              </p>
            </div>
            <b className="text-primary">{selectedSupplies.length} seleccionados</b>
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-white px-3">
            <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant">search</span>
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por producto, SKU o categoría"
              value={query}
            />
          </label>
          <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
            {matchingSupplies.map((item) => {
              const selected = cart[item.id] || 0;
              const billable = item.usageType !== "clinical";
              return (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3" key={item.id}>
                  <div className="min-w-0">
                    <b className="block truncate">{item.name}</b>
                    <p className="truncate text-xs text-on-surface-variant">
                      {item.sku} · {item.stock} {item.unit} disponibles · {billable ? `${money(item.price)} c/u` : "Insumo clínico"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      aria-label={`Restar ${item.name}`}
                      className="grid size-9 place-items-center rounded-lg border border-outline-variant text-primary disabled:opacity-40"
                      disabled={!selected}
                      onClick={() => changeQuantity(item, -1)}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined">remove</span>
                    </button>
                    <b className="w-5 text-center">{selected}</b>
                    <button
                      aria-label={`Agregar ${item.name}`}
                      className="grid size-9 place-items-center rounded-lg bg-primary text-white disabled:opacity-40"
                      disabled={selected >= item.stock}
                      onClick={() => changeQuantity(item, 1)}
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {!loadingSupplies && !matchingSupplies.length ? (
              <EmptyState description="Registra o repone productos desde Inventario para usarlos en una atención." icon="inventory_2" title="Sin productos disponibles" />
            ) : null}
            {loadingSupplies ? <div className="h-24 animate-pulse rounded-xl bg-white" /> : null}
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-primary-fixed p-3 text-primary sm:grid-cols-3">
            <span><b className="block">{money(baseAmount)}</b>Atención</span>
            <span><b className="block">{money(retailTotal)}</b>Productos</span>
            <span className="col-span-2 sm:col-span-1"><b className="block">{money(total)}</b>Total por cobrar</span>
          </div>
        </section>
        <label className="grid gap-1 sm:col-span-2">
          Notas
          <textarea className={`${field} min-h-20 py-2`} name="notes" />
        </label>
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <Button disabled={saving} onClick={onClose} type="button" variant="secondary">Cancelar</Button>
          <Button disabled={saving || loadingSupplies} type="submit">{saving ? "Guardando..." : "Finalizar atención"}</Button>
        </div>
      </form>
    </Modal>
  );
}
