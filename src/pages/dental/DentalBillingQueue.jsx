import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import * as api from "../../services/healthService";
import { getInvoices } from "../../services/invoiceService";
import { exportInvoicesExcel, printInvoices } from "../../utils/invoiceExport";

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});
const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 outline-none focus:border-primary";
const tabs = [
  ["pending", "Por cobrar"],
  ["partial", "Pago parcial"],
  ["paid", "Pagados"],
  ["all", "Todos"],
];

function PaymentModal({ item, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      await api.createDentalPayment({
        patientId: item.patient.id,
        treatmentId: item.id,
        amount: Number(f.get("amount")),
        paymentMethod: f.get("paymentMethod"),
        documentType: f.get("documentType"),
        customerName: f.get("customerName"),
        customerDocument: f.get("customerDocument"),
        customerAddress: f.get("customerAddress"),
        amountReceived: f.get("amountReceived")
          ? Number(f.get("amountReceived"))
          : null,
        reference: f.get("reference"),
        notes: f.get("notes"),
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
      title={`Cobrar · ${item.patient.firstName} ${item.patient.lastName}`}
    >
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
        <div className="rounded-2xl bg-primary-fixed p-4 sm:col-span-2">
          <p className="text-sm">{item.procedure}</p>
          <div className="mt-2 flex justify-between">
            <span>Saldo pendiente</span>
            <b className="text-2xl text-primary">
              {money.format(item.balance)}
            </b>
          </div>
        </div>
        <label className="grid gap-1 text-sm font-bold">
          Monto
          <input
            autoFocus
            className={field}
            defaultValue={Number(item.balance).toFixed(2)}
            max={item.balance}
            min="0.01"
            name="amount"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Método
          <select className={field} name="paymentMethod">
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="transfer">Transferencia</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Comprobante
          <select className={field} name="documentType">
            <option value="boleta">Boleta</option>
            <option value="factura">Factura</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Efectivo recibido
          <input
            className={field}
            defaultValue={Number(item.balance).toFixed(2)}
            min="0"
            name="amountReceived"
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Cliente
          <input
            className={field}
            defaultValue={`${item.patient.firstName} ${item.patient.lastName}`}
            maxLength={180}
            name="customerName"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          DNI o RUC
          <input
            className={field}
            defaultValue={item.patient.document}
            inputMode="numeric"
            maxLength={11}
            name="customerDocument"
            pattern="[0-9]{8}|[0-9]{11}"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold sm:col-span-2">
          Dirección fiscal
          <input
            className={field}
            maxLength={240}
            name="customerAddress"
            placeholder="Obligatoria únicamente para factura"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold sm:col-span-2">
          Referencia
          <input
            className={field}
            name="reference"
            placeholder="Operación, voucher o referencia opcional"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold sm:col-span-2">
          Nota
          <textarea
            className="min-h-20 rounded-xl border border-outline-variant p-3"
            name="notes"
          />
        </label>
        {error ? (
          <p className="rounded-xl bg-error-container p-3 text-sm text-error sm:col-span-2">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button disabled={saving} icon="payments" type="submit">
            {saving ? "Procesando..." : "Confirmar cobro"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DentalBillingQueue({ operator = false }) {
  const [filter, setFilter] = useState("pending"),
    [section, setSection] = useState("charges"),
    [rows, setRows] = useState([]),
    [invoices, setInvoices] = useState([]),
    [report, setReport] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [invoiceDetail, setInvoiceDetail] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const [data, documents, summary] = await Promise.all([
        api.getDentalReceivables(filter),
        operator ? Promise.resolve([]) : getInvoices({ domain: 'dental' }),
        operator ? Promise.resolve(null) : api.getDentalReport(),
      ]);
      setRows(data);
      setInvoices(documents);
      setReport(summary);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, operator]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const totals = useMemo(
    () => ({
      total: rows.reduce((s, x) => s + Number(x.total), 0),
      paid: rows.reduce((s, x) => s + Number(x.paid), 0),
      balance: rows.reduce((s, x) => s + Number(x.balance), 0),
    }),
    [rows],
  );
  const Shell = operator ? OperatorShell : DashboardShell;
  const sections = operator
    ? [["charges", "Cobros"]]
    : [
        ["charges", "Cobros"],
        ["receipts", "Comprobantes"],
        ["reports", "Reportes"],
      ];
  return (
    <Shell
      title={operator ? "Cobros dentales" : "Finanzas dentales"}
      subtitle="Cobros, comprobantes y resultados del consultorio en un solo lugar."
    >
      <div className="mb-3 grid grid-cols-3 rounded-2xl border border-outline-variant bg-white p-1">
        {sections.map(([id, label]) => (
          <button
            className={`min-h-10 rounded-xl px-2 text-sm font-bold ${section === id ? "bg-primary text-white" : "text-on-surface-variant hover:bg-primary-fixed"}`}
            key={id}
            onClick={() => setSection(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="mb-3 rounded-2xl bg-error-container p-4 text-error">
          {error}
        </p>
      ) : null}
      {loading ? <Card className="h-40 animate-pulse" /> : null}
      {!loading && section === "charges" ? (
        <>
          <div className="mb-3 flex gap-1 overflow-x-auto rounded-2xl border border-outline-variant bg-white p-2">
            {tabs.map(([id, label]) => (
              <button
                className={`min-h-9 whitespace-nowrap rounded-xl px-4 text-sm font-bold ${filter === id ? "bg-primary-fixed text-primary" : "text-on-surface-variant"}`}
                key={id}
                onClick={() => setFilter(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <section className="mb-3 grid grid-cols-3 gap-2">
            <Card className="p-3">
              <p className="text-xs text-on-surface-variant">Atenciones</p>
              <b className="text-2xl">{rows.length}</b>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-on-surface-variant">Cobrado</p>
              <b className="text-xl text-emerald-700">
                {money.format(totals.paid)}
              </b>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-on-surface-variant">Pendiente</p>
              <b className="text-xl text-primary">
                {money.format(totals.balance)}
              </b>
            </Card>
          </section>
          <div className="grid max-h-[52vh] gap-2 overflow-y-auto pr-1">
            {rows.map((item) => (
              <Card className="p-3" key={item.id}>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <b>
                      {item.patient.firstName} {item.patient.lastName}
                    </b>
                    <p className="text-sm">
                      {item.procedure}
                      {item.toothNumber ? ` · Pieza ${item.toothNumber}` : ""}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {item.professionalName || "Clínica"} · DNI{" "}
                      {item.patient.document}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <b
                      className={
                        item.balance > 0
                          ? "text-lg text-primary"
                          : "text-emerald-700"
                      }
                    >
                      {item.balance > 0 ? money.format(item.balance) : "Pagado"}
                    </b>
                    {item.balance > 0 ? (
                      <Button icon="payments" onClick={() => setSelected(item)}>
                        Cobrar
                      </Button>
                    ) : (
                      <span className="material-symbols-outlined text-emerald-600">
                        check_circle
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {!rows.length ? (
              <Card className="p-8 text-center text-on-surface-variant">
                No hay atenciones en este estado.
              </Card>
            ) : null}
          </div>
        </>
      ) : null}
      {!loading && section === "receipts" ? (
        <>
          <div className="mb-3 flex justify-end gap-2">
            <Button
              disabled={!invoices.length}
              icon="table_view"
              onClick={() => exportInvoicesExcel(invoices)}
              variant="secondary"
            >
              Excel
            </Button>
            <Button
              disabled={!invoices.length}
              icon="picture_as_pdf"
              onClick={() => printInvoices(invoices)}
              variant="secondary"
            >
              PDF
            </Button>
          </div>
          <div className="grid max-h-[62vh] gap-2 overflow-y-auto pr-1">
            {invoices.map((item) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-white p-3 text-left hover:border-primary"
                key={item.id}
                onClick={() => setInvoiceDetail(item)}
                type="button"
              >
                <span className="min-w-0">
                  <b className="block">
                    {item.series}-{String(item.number).padStart(8, "0")}
                  </b>
                  <small className="block truncate text-on-surface-variant">
                    {item.customerName} ·{" "}
                    {new Date(item.issuedAt).toLocaleString("es-PE")}
                  </small>
                </span>
                <b className="shrink-0 text-primary">
                  {money.format(item.total)}
                </b>
              </button>
            ))}
            {!invoices.length ? (
              <Card className="p-8 text-center text-on-surface-variant">
                Aún no existen comprobantes emitidos.
              </Card>
            ) : null}
          </div>
        </>
      ) : null}
      {!loading && section === "reports" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(report || {}).map(([key, value]) => (
            <Card className="p-4" key={key}>
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                {key.replaceAll(/([A-Z])/g, " $1")}
              </p>
              <b className="mt-2 block text-2xl text-primary">
                {typeof value === "number" ? value.toFixed(2) : value}
              </b>
            </Card>
          ))}
        </div>
      ) : null}
      {selected ? (
        <PaymentModal
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            load();
          }}
        />
      ) : null}
      {invoiceDetail ? (
        <Modal
          onClose={() => setInvoiceDetail(null)}
          title={`Comprobante ${invoiceDetail.series}-${String(invoiceDetail.number).padStart(8, "0")}`}
        >
          <div className="grid gap-3 p-5">
            <div className="rounded-2xl bg-primary-fixed p-4">
              <p>{invoiceDetail.customerName}</p>
              <b className="text-3xl text-primary">
                {money.format(invoiceDetail.total)}
              </b>
            </div>
            <p className="text-sm text-on-surface-variant">
              Documento: {invoiceDetail.customerDocument || "Sin documento"}
            </p>
            <p className="text-sm text-on-surface-variant">
              Método: {invoiceDetail.paymentMethod || "No indicado"} · Estado:{" "}
              {invoiceDetail.status}
            </p>
          </div>
        </Modal>
      ) : null}
    </Shell>
  );
}
