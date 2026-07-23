import { useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Modal from "../../components/molecules/Modal";
import * as api from "../../services/healthService";

const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function DentalAttentionForm({
  attentionId,
  onClose: close,
  onSaved,
  patient,
}) {
  const [supplies, setSupplies] = useState([]);
  const [cart, setCart] = useState({});
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api
      .getDentalSupplies()
      .then((rows) => {
        if (active) setSupplies(rows);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const visible = useMemo(
    () =>
      supplies.filter(
        (x) =>
          !query ||
          `${x.name} ${x.sku} ${x.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, supplies],
  );
  const selected = supplies.filter((x) => cart[x.id]);
  const change = (item, delta) =>
    setCart((current) => {
      const quantity = Math.max(
        0,
        Math.min((current[item.id] || 0) + delta, item.stock),
      );
      const next = { ...current };
      if (quantity) next[item.id] = quantity;
      else delete next[item.id];
      return next;
    });
  const onClose = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (attentionId) await api.cancelDentalAttention(attentionId);
      close();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      await api.createDentalAttention({
        attentionId,
        patientId: patient.id,
        title: f.get("title"),
        content: f.get("content"),
        professionalName: f.get("professionalName"),
        toothNumber: f.get("toothNumber") ? Number(f.get("toothNumber")) : null,
        procedure: f.get("procedure"),
        diagnosis: f.get("diagnosis"),
        estimatedCost: Number(f.get("estimatedCost") || 0),
        supplies: selected.map((x) => ({
          productId: x.id,
          quantity: cart[x.id],
        })),
        nextStartsAt: f.get("nextStartsAt") || null,
        nextEndsAt: f.get("nextEndsAt") || null,
        nextReason: f.get("nextReason"),
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      onClose={onClose}
      title={`Registrar atención · ${patient.firstName} ${patient.lastName}`}
    >
      <form
        className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_340px]"
        onSubmit={submit}
      >
        <section className="grid content-start gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold sm:col-span-2">
              Título de la atención
              <input
                className={field}
                name="title"
                placeholder="Ej. Control y restauración"
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold sm:col-span-2">
              Evolución clínica
              <textarea
                className="min-h-28 rounded-xl border border-outline-variant p-3 font-normal"
                name="content"
                placeholder="Diagnóstico, hallazgos y evolución..."
                required
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Odontólogo
              <input
                className={field}
                name="professionalName"
                placeholder="Se usará tu nombre si queda vacío"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Pieza
              <input
                className={field}
                min="11"
                max="85"
                name="toothNumber"
                type="number"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Tratamiento realizado
              <input
                className={field}
                name="procedure"
                placeholder="Opcional"
              />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Diagnóstico
              <input className={field} name="diagnosis" />
            </label>
            <label className="grid gap-1 text-sm font-bold">
              Costo estimado
              <input
                className={field}
                min="0"
                name="estimatedCost"
                step="0.01"
                type="number"
              />
            </label>
          </div>
          <div className="rounded-2xl border border-outline-variant p-4">
            <h3 className="font-bold">Próxima cita</h3>
            <p className="mb-3 text-xs text-on-surface-variant">
              Opcional; se añadirá directamente a la agenda.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Inicio
                <input
                  className={field}
                  min={new Date().toISOString().slice(0, 16)}
                  name="nextStartsAt"
                  type="datetime-local"
                />
              </label>
              <label className="grid gap-1 text-sm">
                Fin
                <input
                  className={field}
                  min={new Date().toISOString().slice(0, 16)}
                  name="nextEndsAt"
                  type="datetime-local"
                />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                Motivo
                <input
                  className={field}
                  name="nextReason"
                  placeholder="Control dental"
                />
              </label>
            </div>
          </div>
        </section>
        <aside className="h-fit rounded-2xl bg-surface-container-low p-4 lg:sticky lg:top-0">
          <h3 className="font-bold">Insumos utilizados</h3>
          <p className="text-xs text-on-surface-variant">
            Sólo registras consumo; el stock se descuenta automáticamente.
          </p>
          <input
            className={`${field} mt-3`}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar resina, anestesia..."
            value={query}
          />
          <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto">
            {visible.map((item) => (
              <div
                className="flex items-center justify-between gap-2 rounded-xl bg-white p-2"
                key={item.id}
              >
                <div className="min-w-0">
                  <b className="block truncate text-sm">{item.name}</b>
                  <span className="text-xs text-on-surface-variant">
                    Disponible: {item.stock}
                  </span>
                </div>
                <button
                  className="material-symbols-outlined h-9 w-9 rounded-lg bg-primary-fixed text-primary"
                  disabled={cart[item.id] >= item.stock}
                  onClick={() => change(item, 1)}
                  type="button"
                >
                  add
                </button>
              </div>
            ))}
            {!visible.length ? (
              <p className="p-4 text-center text-xs text-on-surface-variant">
                Sin insumos disponibles.
              </p>
            ) : null}
          </div>
          <div className="mt-3 grid max-h-40 gap-2 overflow-y-auto border-t border-outline-variant pt-3">
            {selected.map((item) => (
              <div
                className="flex items-center justify-between rounded-xl bg-white p-2"
                key={item.id}
              >
                <span className="truncate text-sm font-bold">{item.name}</span>
                <span className="flex items-center gap-2">
                  <button
                    className="material-symbols-outlined h-7 w-7 rounded bg-surface-container-low"
                    onClick={() => change(item, -1)}
                    type="button"
                  >
                    remove
                  </button>
                  <b>{cart[item.id]}</b>
                  <button
                    className="material-symbols-outlined h-7 w-7 rounded bg-surface-container-low"
                    onClick={() => change(item, 1)}
                    type="button"
                  >
                    add
                  </button>
                </span>
              </div>
            ))}
          </div>
          {error ? (
            <p className="mt-3 rounded-xl bg-error-container p-3 text-sm text-error">
              {error}
            </p>
          ) : null}
          <div className="mt-4 grid gap-2">
            <Button disabled={saving} type="submit">
              {saving ? "Guardando atención..." : "Guardar atención completa"}
            </Button>
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </aside>
      </form>
    </Modal>
  );
}
