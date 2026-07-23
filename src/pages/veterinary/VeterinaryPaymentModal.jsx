import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Modal from "../../components/molecules/Modal";
import * as api from "../../services/veterinaryService";

const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary";

const methodLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  yape: "Yape",
  plin: "Plin",
};

const digitsOnly = (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
};

const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

export default function VeterinaryPaymentModal({ onClose, onPaid, record }) {
  const total = Number(record.amount || 0);
  const [documentType, setDocumentType] = useState("boleta");
  const [method, setMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const owner = record.pet?.owner || {};
  const receipt = result?.receipt || null;
  const receiptLabel = useMemo(() => {
    if (!receipt) return "";
    const number = String(receipt.number || 0).padStart(8, "0");
    return `${receipt.series || (documentType === "factura" ? "F001" : "B001")}-${number}`;
  }, [documentType, receipt]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const customerDocument = String(values.customer_document || "").replace(
      /\D/g,
      "",
    );
    const received =
      method === "cash" ? Number(values.amount_received || 0) : total;
    try {
      if (documentType === "factura" && customerDocument.length !== 11)
        throw new Error("La factura requiere un RUC de 11 dígitos.");
      if (documentType === "factura" && !values.customer_address?.trim())
        throw new Error("La factura requiere una dirección fiscal.");
      if (
        documentType === "boleta" &&
        customerDocument &&
        customerDocument.length !== 8
      )
        throw new Error("El DNI debe tener exactamente 8 dígitos.");
      if (method === "cash" && received < total)
        throw new Error("El efectivo recibido no cubre el total.");
      if (
        ["transfer", "yape", "plin"].includes(method) &&
        !values.payment_reference?.trim()
      )
        throw new Error("Ingresa el número de operación o referencia.");

      setSaving(true);
      const response = await api.updateVeterinaryPayment(record.id, {
        amount_received: received,
        customer_address: values.customer_address?.trim() || "",
        customer_document: customerDocument,
        customer_name: values.customer_name?.trim() || owner.name || "Cliente",
        document_type: documentType,
        notes: values.notes?.trim() || "",
        payment_method: method,
        payment_reference: values.payment_reference?.trim() || "",
        payment_status: "paid",
      });
      setResult(response);
      await onPaid?.(response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      dialogClassName="sm:max-w-2xl"
      onClose={onClose}
      title={result ? "Cobro registrado" : `Cobrar atención · ${record.pet?.name || "Mascota"}`}
    >
      {result ? (
        <div className="grid gap-4 p-4 sm:p-5">
          <div className="rounded-2xl bg-emerald-50 p-5 text-center text-emerald-900">
            <span className="material-symbols-outlined text-5xl">task_alt</span>
            <h3 className="mt-2 text-xl font-bold">Pago y comprobante emitidos</h3>
            <p className="mt-1 text-sm">
              {receiptLabel || "El comprobante quedó registrado correctamente."}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-outline-variant p-3">
              <small className="text-on-surface-variant">Total</small>
              <b className="block text-lg">{money(receipt?.total || total)}</b>
            </div>
            <div className="rounded-xl border border-outline-variant p-3">
              <small className="text-on-surface-variant">Método</small>
              <b className="block">{methodLabels[receipt?.paymentMethod || method]}</b>
            </div>
            <div className="rounded-xl border border-outline-variant p-3">
              <small className="text-on-surface-variant">Vuelto</small>
              <b className="block">{money(receipt?.changeAmount || 0)}</b>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              className="flex min-h-11 items-center rounded-xl border border-primary px-4 font-bold text-primary"
              onClick={onClose}
              to="/dashboard/invoices"
            >
              Ver comprobantes
            </Link>
            <Button onClick={onClose} type="button">
              Finalizar
            </Button>
          </div>
        </div>
      ) : (
        <form className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5" onSubmit={submit}>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-primary-fixed p-3 sm:col-span-2">
            <div className="min-w-0">
              <b className="block truncate">{record.pet?.name} · {owner.name}</b>
              <p className="truncate text-xs text-on-surface-variant">
                {record.diagnosis || record.recordType || "Atención veterinaria"}
              </p>
            </div>
            <b className="shrink-0 text-xl text-primary">{money(total)}</b>
          </div>
          <label>
            Comprobante
            <select
              className={field}
              onChange={(event) => setDocumentType(event.target.value)}
              value={documentType}
            >
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
            </select>
          </label>
          <label>
            Método de pago
            <select
              className={field}
              onChange={(event) => setMethod(event.target.value)}
              value={method}
            >
              {Object.entries(methodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cliente / razón social
            <input
              className={field}
              defaultValue={owner.name || ""}
              maxLength="180"
              name="customer_name"
              required
            />
          </label>
          <label>
            {documentType === "factura" ? "RUC" : "DNI (opcional)"}
            <input
              className={field}
              defaultValue={owner.document || ""}
              inputMode="numeric"
              maxLength={documentType === "factura" ? 11 : 8}
              name="customer_document"
              onInput={digitsOnly}
              pattern={documentType === "factura" ? "[0-9]{11}" : "[0-9]{8}|^$"}
              required={documentType === "factura"}
            />
          </label>
          {documentType === "factura" ? (
            <label className="sm:col-span-2">
              Dirección fiscal
              <input
                className={field}
                defaultValue={owner.address || ""}
                maxLength="240"
                name="customer_address"
                required
              />
            </label>
          ) : (
            <input name="customer_address" type="hidden" value={owner.address || ""} />
          )}
          {method === "cash" ? (
            <label>
              Efectivo recibido
              <input
                className={field}
                defaultValue={total.toFixed(2)}
                min={total}
                name="amount_received"
                required
                step="0.01"
                type="number"
              />
            </label>
          ) : (
            <input name="amount_received" type="hidden" value={total} />
          )}
          {method !== "cash" ? (
            <label>
              Operación / referencia
              <input
                className={field}
                maxLength="80"
                name="payment_reference"
                required={["transfer", "yape", "plin"].includes(method)}
              />
            </label>
          ) : (
            <input name="payment_reference" type="hidden" value="" />
          )}
          <label className="sm:col-span-2">
            Nota del cobro
            <textarea className={`${field} min-h-20 py-2`} maxLength="500" name="notes" />
          </label>
          {error ? (
            <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={saving} icon="receipt_long" type="submit">
              {saving ? "Procesando…" : `Cobrar ${money(total)}`}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
