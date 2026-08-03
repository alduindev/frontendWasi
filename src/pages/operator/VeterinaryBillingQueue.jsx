import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import VeterinaryPaymentModal from "../veterinary/VeterinaryPaymentModal";
import * as api from "../../services/veterinaryService";
import { matchesEntitySearch } from "../../utils/entitySearch";

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

export default function VeterinaryBillingQueue({ operator = false }) {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRecords(await api.getVeterinaryBilling("pending"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const visible = useMemo(
    () =>
      records.filter((record) =>
        matchesEntitySearch(record, query, (item) => [
          item.pet?.name,
          item.pet?.code,
          item.pet?.owner?.name,
          item.pet?.owner?.document,
          item.pet?.owner?.phone,
          item.pet?.owner?.email,
          item.diagnosis,
          item.recordType,
        ]),
      ),
    [query, records],
  );
  const total = visible.reduce(
    (sum, record) => sum + Number(record.amount || 0),
    0,
  );

  const Shell = operator ? OperatorShell : DashboardShell;
  return (
    <Shell
      subtitle="Confirma los datos del cliente, registra el método de pago y emite el comprobante."
      title={operator ? "Caja veterinaria" : "Finanzas veterinarias"}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-3">
          <span className="material-symbols-outlined text-primary">pending_actions</span>
          <b className="mt-2 block text-2xl">{records.length}</b>
          <p className="text-xs text-on-surface-variant">Atenciones por cobrar</p>
        </Card>
        <Card className="p-3 sm:col-span-2">
          <span className="material-symbols-outlined text-primary">payments</span>
          <b className="mt-2 block text-2xl">{money(total)}</b>
          <p className="text-xs text-on-surface-variant">Total de la vista actual</p>
        </Card>
      </div>
      <Card className="mt-3 p-3">
        <label className="relative block">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="min-h-11 w-full rounded-xl border border-outline-variant bg-white pl-11 pr-3 outline-none focus:border-primary"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar mascota, propietario, DNI, celular o atención"
            value={query}
          />
        </label>
      </Card>
      {error ? (
        <div className="mt-3">
          <EmptyState
            action={{ children: "Reintentar", onClick: load }}
            description={error}
            icon="cloud_off"
            title="No se pudo cargar la cola de cobros"
          />
        </div>
      ) : null}
      {loading ? <Card className="mt-3 h-44 animate-pulse" /> : null}
      {!loading && !error ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((record) => (
            <Card className="flex min-h-48 flex-col p-4" key={record.id}>
              <div className="flex items-start justify-between gap-3">
                <span className="material-symbols-outlined grid size-11 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary">
                  pets
                </span>
                <b className="text-xl text-primary">{money(record.amount)}</b>
              </div>
              <b className="mt-3 truncate text-lg">{record.pet.name}</b>
              <p className="truncate text-sm text-on-surface-variant">
                {record.pet.owner.name} · DNI {record.pet.owner.document}
              </p>
              <p className="mt-1 line-clamp-2 text-xs">
                {record.diagnosis || record.recordType || "Atención veterinaria"}
              </p>
              <button
                className="mt-auto flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-white shadow-sm"
                onClick={() => setSelected(record)}
                type="button"
              >
                <span className="material-symbols-outlined">receipt_long</span>
                Cobrar y emitir
              </button>
            </Card>
          ))}
          {!visible.length ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                description={query ? "Prueba con otro nombre o documento." : "Las atenciones con importe aparecerán aquí."}
                icon="price_check"
                title={query ? "Sin coincidencias" : "Caja al día"}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {selected ? (
        <VeterinaryPaymentModal
          onClose={() => setSelected(null)}
          onPaid={load}
          record={selected}
        />
      ) : null}
    </Shell>
  );
}
