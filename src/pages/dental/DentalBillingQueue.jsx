import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import OperatorShell from "../../components/operator/OperatorShell";
import { MonthCalendarGrid } from "../../components/scheduling/MonthlyAgenda";
import { calendarDateKey, dayLabel } from "../../components/scheduling/calendarUtils";
import { useAppConfig } from "../../context/appConfigStore";
import { useAuth } from "../../context/authStore";
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
const paymentMethodLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transfer: "Transferencia",
};

const formatMoney = (value) => money.format(Number(value || 0));
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

function currentCashDate() {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDateTime(value) {
  if (!value) return "Sin hora registrada";
  const normalized =
    typeof value === "string" &&
    !/[zZ]$/.test(value) &&
    !/[+-]\d{2}:?\d{2}$/.test(value)
      ? `${value}Z`
      : value;
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(normalized));
}

function PaymentModal({ item, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api.createDentalPayment({
        patientId: item.patient.id,
        treatmentId: item.id,
        amount: Number(form.get("amount")),
        paymentMethod: form.get("paymentMethod"),
        documentType: form.get("documentType"),
        customerName: form.get("customerName"),
        customerDocument: form.get("customerDocument"),
        customerAddress: form.get("customerAddress"),
        amountReceived: form.get("amountReceived")
          ? Number(form.get("amountReceived"))
          : null,
        reference: form.get("reference"),
        notes: form.get("notes"),
      });
      await onSaved();
    } catch (requestError) {
      setError(requestError.message || "No se pudo registrar el cobro.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Cobrar · ${item.patient.firstName} ${item.patient.lastName}`}>
      <form className="grid gap-4 p-5 sm:grid-cols-2" onSubmit={submit}>
        <div className="rounded-2xl bg-primary-fixed p-4 sm:col-span-2">
          <p className="text-sm">{item.procedure}</p>
          {Number(item.originalTotal ?? item.total) > Number(item.total) ? (
            <p className="mt-1 text-xs text-on-surface-variant">
              Tarifa inicial: {formatMoney(item.originalTotal)} · Precio acordado: {formatMoney(item.total)}
            </p>
          ) : null}
          <div className="mt-2 flex justify-between gap-3">
            <span>Saldo pendiente</span>
            <b className="text-2xl text-primary">{formatMoney(item.balance)}</b>
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

function PriceAdjustmentModal({ item, onClose, onSaved }) {
  const [agreedPrice, setAgreedPrice] = useState(String(Number(item.total || 0)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const referencePrice = Number(item.originalTotal ?? item.total ?? 0);
  const paid = Number(item.paid || 0);
  const nextPrice = Number(agreedPrice || 0);
  const discount = Math.max(0, referencePrice - (Number.isFinite(nextPrice) ? nextPrice : 0));

  const submit = async (event) => {
    event.preventDefault();
    if (!Number.isFinite(nextPrice) || nextPrice < paid) {
      setError(`El precio acordado no puede ser menor que lo ya cobrado (${formatMoney(paid)}).`);
      return;
    }
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api.adjustDentalTreatmentPrice(item.id, {
        agreedPrice: nextPrice,
        reason: form.get("reason"),
      });
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError.message || "No se pudo actualizar el precio acordado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Acordar precio · ${item.patient.firstName} ${item.patient.lastName}`}>
      <form className="grid gap-4 p-5" onSubmit={submit}>
        <div className="grid gap-2 rounded-2xl bg-primary-fixed p-4 text-sm sm:grid-cols-2">
          <span className="text-on-surface-variant">Tarifa inicial</span>
          <b className="text-right">{formatMoney(referencePrice)}</b>
          <span className="text-on-surface-variant">Ya cobrado</span>
          <b className="text-right">{formatMoney(paid)}</b>
        </div>
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          Este ajuste solo aplica a esta atención. No modifica el precio del catálogo para otros pacientes.
        </p>
        <label className="grid gap-1 text-sm font-bold">
          Precio acordado para este paciente
          <input
            autoFocus
            className={field}
            min={paid}
            name="agreedPrice"
            onChange={(event) => setAgreedPrice(event.target.value)}
            required
            step="0.01"
            type="number"
            value={agreedPrice}
          />
        </label>
        <div className="rounded-xl bg-surface-container-low p-3 text-sm">
          <span className="text-on-surface-variant">Descuento sobre la tarifa inicial</span>
          <b className="mt-1 block text-lg text-primary">{formatMoney(discount)}</b>
        </div>
        <label className="grid gap-1 text-sm font-bold">
          Motivo del ajuste
          <textarea
            className="min-h-24 rounded-xl border border-outline-variant p-3"
            maxLength={1000}
            minLength={3}
            name="reason"
            placeholder="Ej.: apoyo económico aprobado para el paciente"
            required
          />
        </label>
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button icon="sell" loading={saving} type="submit">
            Guardar precio acordado
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CashOpeningModal({ onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api.openDentalCashSession({
        openingAmount: Number(form.get("openingAmount")),
        notes: form.get("notes"),
      });
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError.message || "No se pudo abrir la caja.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Abrir caja dental">
      <form className="grid gap-4 p-5" onSubmit={submit}>
        <div className="rounded-2xl bg-primary-fixed p-4 text-sm text-on-surface-variant">
          Registra el fondo inicial. Desde esta apertura, todos los cobros,
          ingresos y egresos de hoy quedarán en el arqueo.
        </div>
        <label className="grid gap-1 text-sm font-bold">
          Fondo inicial en efectivo
          <input
            autoFocus
            className={field}
            defaultValue="0.00"
            min="0"
            name="openingAmount"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Observación de apertura
          <textarea
            className="min-h-24 rounded-xl border border-outline-variant p-3"
            maxLength={1000}
            name="notes"
            placeholder="Ej.: fondo entregado por administración"
          />
        </label>
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button icon="lock_open" loading={saving} type="submit">
            Abrir caja
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CashMovementModal({ defaultType, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api.createDentalCashMovement({
        movementType: form.get("movementType"),
        amount: Number(form.get("amount")),
        category: form.get("category"),
        reference: form.get("reference"),
        notes: form.get("notes"),
      });
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError.message || "No se pudo registrar el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={defaultType === "expense" ? "Registrar egreso" : "Registrar ingreso"}
    >
      <form className="grid gap-4 p-5" onSubmit={submit}>
        <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
          Los movimientos manuales afectan únicamente el efectivo esperado de la
          caja abierta hoy.
        </div>
        <label className="grid gap-1 text-sm font-bold">
          Tipo de movimiento
          <select className={field} defaultValue={defaultType} name="movementType">
            <option value="income">Ingreso</option>
            <option value="expense">Egreso</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Monto
          <input
            autoFocus
            className={field}
            min="0.01"
            name="amount"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Concepto
          <input
            className={field}
            maxLength={120}
            name="category"
            placeholder="Ej.: compra de insumo urgente"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Referencia opcional
          <input className={field} maxLength={120} name="reference" />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Nota
          <textarea
            className="min-h-24 rounded-xl border border-outline-variant p-3"
            maxLength={1000}
            name="notes"
          />
        </label>
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button
            icon={defaultType === "expense" ? "north_east" : "south_west"}
            loading={saving}
            type="submit"
          >
            Guardar movimiento
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CashClosingModal({ summary, onClose, onSaved }) {
  const [counted, setCounted] = useState(String(summary.expectedCash ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const countedValue = Number(counted || 0);
  const difference = countedValue - Number(summary.expectedCash || 0);

  const submit = async (event) => {
    event.preventDefault();
    if (!Number.isFinite(countedValue) || countedValue < 0) {
      setError("Ingresa el efectivo contado en caja.");
      return;
    }
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api.closeDentalCashSession({
        closingAmount: countedValue,
        notes: form.get("notes"),
      });
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(requestError.message || "No se pudo cerrar la caja.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Cerrar y cuadrar caja">
      <form className="grid gap-4 p-5" onSubmit={submit}>
        <div className="grid gap-2 rounded-2xl bg-primary-fixed p-4 text-sm sm:grid-cols-2">
          <span className="text-on-surface-variant">Efectivo esperado</span>
          <b className="text-right text-lg text-primary">{formatMoney(summary.expectedCash)}</b>
          <span className="text-on-surface-variant">Ventas en efectivo</span>
          <b className="text-right">{formatMoney(summary.cashSales)}</b>
          <span className="text-on-surface-variant">Egresos</span>
          <b className="text-right text-error">− {formatMoney(summary.expenseTotal)}</b>
        </div>
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          Los saldos pendientes de pacientes no se incluyen en este efectivo; se muestran por separado como cuentas por cobrar.
        </p>
        <label className="grid gap-1 text-sm font-bold">
          Efectivo contado
          <input
            autoFocus
            className={field}
            min="0"
            name="closingAmount"
            onChange={(event) => setCounted(event.target.value)}
            required
            step="0.01"
            type="number"
            value={counted}
          />
        </label>
        <div
          className={`rounded-xl p-3 text-sm ${difference === 0 ? "bg-emerald-50 text-emerald-800" : difference > 0 ? "bg-amber-50 text-amber-900" : "bg-error-container text-error"}`}
        >
          {difference === 0
            ? "La caja cuadra exactamente."
            : `${difference > 0 ? "Sobrante" : "Faltante"}: ${formatMoney(Math.abs(difference))}`}
        </div>
        <label className="grid gap-1 text-sm font-bold">
          Observación de cierre
          <textarea
            className="min-h-24 rounded-xl border border-outline-variant p-3"
            maxLength={1000}
            name="notes"
            placeholder="Obligatoria si necesitas explicar una diferencia"
          />
        </label>
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button icon="lock" loading={saving} type="submit">
            Confirmar cierre
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CashChargePickerModal({ onClose, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    api
      .getDentalReceivables("all")
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "No se pudieron cargar las cuentas por cobrar.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const candidates = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items
      .filter((item) => Number(item.balance) > 0)
      .filter((item) => {
        if (!term) return true;
        return [
          item.patient?.firstName,
          item.patient?.lastName,
          item.patient?.document,
          item.procedure,
          item.toothNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      });
  }, [items, query]);

  return (
    <Modal onClose={onClose} title="Cobrar desde caja">
      <div className="grid gap-3 p-5">
        <p className="rounded-2xl bg-primary-fixed p-3 text-sm text-on-surface-variant">
          Selecciona la cuenta del paciente y registra el pago sin salir de Caja. El cobro se incluye de inmediato en el arqueo de hoy.
        </p>
        <input
          autoFocus
          className={field}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar paciente, DNI o servicio"
          type="search"
          value={query}
        />
        {error ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{error}</p> : null}
        {loading ? <Card className="h-36 animate-pulse bg-surface-container-low" /> : null}
        {!loading ? (
          <div className="grid max-h-[48vh] gap-2 overflow-y-auto pr-1">
            {candidates.map((item) => (
              <button
                className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-white p-3 text-left hover:border-primary hover:bg-primary-fixed/40"
                key={item.id}
                onClick={() => onSelect(item)}
                type="button"
              >
                <span className="min-w-0">
                  <b className="block truncate">{item.patient?.firstName} {item.patient?.lastName}</b>
                  <small className="block truncate text-on-surface-variant">
                    {item.procedure}{item.toothNumber ? ` · Pieza ${item.toothNumber}` : ""} · DNI {item.patient?.document || "sin dato"}
                  </small>
                </span>
                <span className="shrink-0 text-right">
                  <small className="block text-on-surface-variant">Saldo</small>
                  <b className="text-primary">{formatMoney(item.balance)}</b>
                </span>
              </button>
            ))}
            {!candidates.length ? (
              <p className="rounded-xl bg-surface-container-low p-4 text-center text-sm text-on-surface-variant">
                No hay cuentas pendientes que coincidan con la búsqueda.
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button onClick={onClose} type="button" variant="secondary">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function formatReportRange(report) {
  if (!report?.startDate || !report?.endDate) return "";
  const formatter = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" });
  return `${formatter.format(new Date(`${report.startDate}T12:00:00`))} — ${formatter.format(new Date(`${report.endDate}T12:00:00`))}`;
}

function formatTrendLabel(key, period) {
  const value = String(key || "");
  const source = /^\d{4}-\d{2}$/.test(value)
    ? `${value}-01`
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value
      : "";
  const date = source ? new Date(`${source}T12:00:00`) : null;
  if (!date || Number.isNaN(date.getTime())) return value || "—";
  const annual = period === "annual" || /^\d{4}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat("es-PE", annual ? { month: "short" } : { day: "2-digit", month: "short" }).format(date);
}

function FinancialReportsPanel({ date, error, loading, onDateChange, onPeriodChange, onRetry, period, report }) {
  const methods = (report?.paymentMethods || []).filter((item) => Number(item.amount) > 0);
  const trend = report?.trend || [];
  const maxMethod = Math.max(1, ...methods.map((item) => Number(item.amount || 0)));
  const maxTrend = Math.max(
    1,
    ...trend.flatMap((item) => [Number(item.billed || 0), Number(item.collected || 0), Number(item.expenses || 0)]),
  );
  const cashControl = report?.cashControl || {};
  const metrics = report
    ? [
        ["payments", "Cobrado", report.paymentTotal, "text-emerald-700"],
        ["receipt_long", "Facturado", report.billedAmount, "text-primary"],
        ["schedule", "Pendiente del período", report.pendingAmount, "text-amber-800"],
        ["trending_up", "Resultado neto", report.netTotal, report.netTotal >= 0 ? "text-emerald-700" : "text-error"],
        ["sell", "Descuentos acordados", report.discountAmount, "text-on-surface"],
        ["person", "Ticket promedio", report.averageTicket, "text-on-surface"],
      ]
    : [];

  return (
    <section className="grid gap-3">
      <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Análisis financiero</p>
          <h2 className="mt-1 text-xl font-bold">Reportes diario, mensual y anual</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Compara lo facturado, lo efectivamente cobrado, los egresos y las cuentas pendientes.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(10rem,1fr)] sm:items-end">
          <div className="flex rounded-xl bg-surface-container-low p-1">
            {[
              ["daily", "Diario"],
              ["monthly", "Mensual"],
              ["annual", "Anual"],
            ].map(([id, label]) => (
              <button
                className={`rounded-lg px-3 py-2 text-sm font-bold ${period === id ? "bg-primary text-white" : "text-on-surface-variant"}`}
                key={id}
                onClick={() => onPeriodChange(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <label className="grid gap-1 text-xs font-bold text-on-surface-variant">
            {period === "daily" ? "Fecha" : period === "monthly" ? "Mes" : "Año"}
            {period === "daily" ? (
              <input className={field} onChange={(event) => event.target.value && onDateChange(event.target.value)} type="date" value={date} />
            ) : period === "monthly" ? (
              <input className={field} onChange={(event) => event.target.value && onDateChange(`${event.target.value}-01`)} type="month" value={date.slice(0, 7)} />
            ) : (
              <input className={field} max="2100" min="2020" onChange={(event) => event.target.value && onDateChange(`${event.target.value}-01-01`)} type="number" value={date.slice(0, 4)} />
            )}
          </label>
        </div>
      </Card>

      {loading ? <Card className="h-72 animate-pulse bg-surface-container-low" /> : null}
      {error ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 border border-error/30 bg-error-container p-4 text-error">
          <span>{error}</span>
          <Button onClick={onRetry} type="button" variant="secondary">Reintentar</Button>
        </Card>
      ) : null}

      {report && !loading ? (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="font-bold">Período consultado</span>
            <span className="text-on-surface-variant">{formatReportRange(report)}</span>
            <span className="rounded-full bg-primary-fixed px-3 py-1 font-bold text-primary">
              Recuperación {formatPercent(report.collectionRate)}
            </span>
          </Card>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map(([icon, label, value, tone]) => (
              <Card className="p-4" key={label}>
                <span className={`material-symbols-outlined ${tone}`}>{icon}</span>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
                <b className={`mt-1 block text-2xl ${tone}`}>{formatMoney(value)}</b>
              </Card>
            ))}
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold">Cobros por medio de pago</h3>
                <span className="text-sm text-on-surface-variant">{report.paymentCount} operación(es)</span>
              </div>
              <div className="mt-4 grid gap-3">
                {methods.map((item) => (
                  <div key={item.method}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span>{paymentMethodLabels[item.method] || item.method}</span>
                      <b>{formatMoney(item.amount)}</b>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-container-low">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(Number(item.amount || 0) / maxMethod) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {!methods.length ? <p className="text-sm text-on-surface-variant">No se registraron cobros en este período.</p> : null}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-outline-variant pt-3 text-sm">
                <span className="text-on-surface-variant">Efectivo</span><b className="text-right">{formatMoney(report.cashSales)}</b>
                <span className="text-on-surface-variant">Digital</span><b className="text-right">{formatMoney(report.digitalSales)}</b>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-bold">Control operativo</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-container-low p-3">
                  <p className="text-xs text-on-surface-variant">Pacientes atendidos</p>
                  <b className="mt-1 block text-2xl text-primary">{report.uniquePatients}</b>
                  <p className="mt-1 text-xs text-on-surface-variant">{report.generatedTreatmentCount} tratamiento(s) generados</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs text-amber-900">Saldo pendiente acumulado</p>
                  <b className="mt-1 block text-2xl text-amber-900">{formatMoney(report.outstandingAmount)}</b>
                  <p className="mt-1 text-xs text-amber-900">{report.outstandingPatientCount} paciente(s) por cobrar</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-outline-variant pt-3 text-sm">
                <span className="text-on-surface-variant">Cajas cerradas</span><b className="text-right">{cashControl.closedSessions || 0} / {cashControl.sessions || 0}</b>
                <span className="text-on-surface-variant">Cierres cuadrados</span><b className="text-right">{cashControl.balancedSessions || 0}</b>
                <span className="text-on-surface-variant">Diferencia de caja</span><b className={`text-right ${Number(cashControl.differenceTotal || 0) === 0 ? "text-emerald-700" : "text-error"}`}>{formatMoney(cashControl.differenceTotal)}</b>
                <span className="text-on-surface-variant">Otros ingresos</span><b className="text-right">{formatMoney(report.manualIncome)}</b>
                <span className="text-on-surface-variant">Egresos</span><b className="text-right text-error">− {formatMoney(report.expenseTotal)}</b>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">Evolución del período</h3>
              <span className="text-xs text-on-surface-variant">Azul: facturado · Verde: cobrado · Rojo: egresos</span>
            </div>
            <div className="mt-4 grid max-h-[34rem] gap-3 overflow-y-auto pr-1">
              {trend.map((item) => (
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3" key={item.key}>
                  <span className="truncate text-xs text-on-surface-variant">{formatTrendLabel(item.key, report.period || period)}</span>
                  <div className="grid gap-1">
                    <div className="h-2 overflow-hidden rounded-full bg-surface-container-low"><div className="h-full rounded-full bg-primary" style={{ width: `${(Number(item.billed || 0) / maxTrend) * 100}%` }} /></div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-container-low"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${(Number(item.collected || 0) / maxTrend) * 100}%` }} /></div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface-container-low"><div className="h-full rounded-full bg-error" style={{ width: `${(Number(item.expenses || 0) / maxTrend) * 100}%` }} /></div>
                  </div>
                  <b className="text-right text-xs">{formatMoney(item.collected)}</b>
                </div>
              ))}
            </div>
          </Card>

          {report.insights?.length ? (
            <div className="grid gap-2 lg:grid-cols-2">
              {report.insights.map((item) => (
                <Card className={`p-4 ${item.tone === "warning" ? "border border-amber-300 bg-amber-50" : item.tone === "success" ? "border border-emerald-200 bg-emerald-50" : "bg-primary-fixed/50"}`} key={item.title}>
                  <b className="block">{item.title}</b>
                  <p className="mt-1 text-sm text-on-surface-variant">{item.detail}</p>
                </Card>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function CashDayPanel({ canEdit, loading, summary, onCharge, onClose, onMovement, onOpen }) {
  if (loading && !summary) {
    return <Card className="h-[42rem] animate-pulse bg-surface-container-low" />;
  }

  const session = summary?.session;
  const isOpen = session?.status === "open";
  const isClosed = session?.status === "closed";
  const historical = summary && !summary.isToday;
  const cashSchedule = summary?.cashSchedule || {};
  const cutoffReached = Boolean(cashSchedule.cutoffReached);
  const canOperate = canEdit && isOpen && !historical && !cutoffReached;
  const difference = Number(summary?.difference || 0);
  const accounts = summary?.accountsReceivable || {
    totalBalance: 0,
    totalPatientCount: 0,
    dayBalance: 0,
    dayPatientCount: 0,
    items: [],
  };
  const metrics = [
    ["payments", "Ventas del día", summary?.salesTotal, "text-primary"],
    ["add_card", "Otros ingresos", summary?.manualIncome, "text-emerald-700"],
    ["remove_circle", "Egresos", summary?.expenseTotal, "text-error"],
    [
      "account_balance_wallet",
      isClosed ? "Efectivo contado" : "Efectivo esperado",
      isClosed ? summary?.countedCash : summary?.expectedCash,
      "text-on-surface",
    ],
  ];

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden xl:h-[42rem]">
      <div className="shrink-0 bg-primary p-3 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70">
              Control de caja
            </p>
            <h2 className="mt-0.5 text-lg font-bold capitalize">{summary ? dayLabel(summary.date) : "Caja dental"}</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${isOpen && cutoffReached ? "bg-amber-300 text-amber-950" : isOpen ? "bg-emerald-400 text-emerald-950" : isClosed ? "bg-white/20 text-white" : "bg-white/15 text-white"}`}
          >
            {isOpen && cutoffReached ? "Cierre pendiente" : isOpen ? "Caja abierta" : isClosed ? "Caja cerrada" : "Sin apertura"}
          </span>
        </div>
        <p className="mt-1 text-xs text-white/80">
          {historical
            ? "Consulta histórica: los importes de esta fecha ya no se pueden modificar."
            : !canEdit
              ? "Tu perfil puede consultar los movimientos, pero no abrir, cobrar ni cerrar caja."
            : isOpen && cutoffReached
              ? `El horario de caja terminó a las ${cashSchedule.endTime}. Realiza el arqueo y cierre para conservar el control del día.`
            : isOpen
              ? "Registra movimientos y cuadra el efectivo antes de cerrar."
              : "Abre la caja antes de registrar cobros del día."}
        </p>
        {cashSchedule.startTime && cashSchedule.endTime ? (
          <p className="mt-1 text-[11px] text-white/70">
            Horario configurado: {cashSchedule.startTime} – {cashSchedule.endTime}
          </p>
        ) : null}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-px bg-outline-variant xl:grid-cols-4">
        {metrics.map(([icon, label, value, tone]) => (
          <div className="bg-white p-2.5" key={label}>
            <span aria-hidden="true" className={`material-symbols-outlined text-base ${tone}`}>
              {icon}
            </span>
            <p className="mt-0.5 text-[11px] leading-tight text-on-surface-variant">{label}</p>
            <b className={`mt-0.5 block text-base ${tone}`}>{formatMoney(value)}</b>
          </div>
        ))}
      </div>

      {!historical && !session ? (
        <div className="m-3 shrink-0 rounded-2xl border border-dashed border-primary/40 bg-primary-fixed/50 p-3">
          <h3 className="font-bold">Empieza el día con una apertura</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Registra el fondo en efectivo para que el arqueo calcule la venta, los ingresos y los egresos.
          </p>
          {cashSchedule.canOpen === false ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              {!cashSchedule.isWorkday
                ? "Hoy no está configurado como día laborable."
                : cashSchedule.beforeOpening
                  ? `La caja estará disponible desde las ${cashSchedule.startTime}.`
                  : `El horario de caja terminó a las ${cashSchedule.endTime}. Configúralo en Equipo → Horario general del negocio.`}
            </p>
          ) : null}
          {!canEdit ? (
            <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs text-on-surface-variant">
              Acceso de consulta: solicita a recepción o administración que abra la caja.
            </p>
          ) : null}
          <Button className="mt-4 w-full" disabled={!canEdit || cashSchedule.canOpen === false} icon="lock_open" onClick={onOpen}>
            Abrir caja de hoy
          </Button>
        </div>
      ) : null}

      {!canOperate && isOpen && !historical && cutoffReached ? (
        <div className="mx-3 my-2 shrink-0 rounded-2xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
          <b className="block">{canEdit ? "Cierre requerido por horario" : "Caja pendiente de cierre"}</b>
          {canEdit
            ? "Ya no se permiten cobros, ingresos ni egresos. Ingresa el efectivo contado y confirma el cierre de caja."
            : "Ya no se permiten cobros, ingresos ni egresos. Un perfil con permiso de caja debe realizar el arqueo y cierre."}
        </div>
      ) : null}

      {session ? (
        <div className="mx-3 my-2 shrink-0 rounded-2xl bg-surface-container-low p-3 text-xs">
          <div className="flex justify-between gap-3">
            <span className="text-on-surface-variant">Apertura</span>
            <b>{formatMoney(session.openingAmount)}</b>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            {formatDateTime(session.openedAt)}{session.openedBy ? ` · ${session.openedBy}` : ""}
          </p>
          {session.openingNotes ? <p className="mt-2 text-xs">{session.openingNotes}</p> : null}
          {isClosed ? (
            <>
              <div className="mt-2 flex justify-between gap-3 border-t border-outline-variant pt-2">
                <span className="text-on-surface-variant">Cierre</span>
                <b>{formatMoney(session.closingAmount)}</b>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">
                {formatDateTime(session.closedAt)}{session.closedBy ? ` · ${session.closedBy}` : ""}
              </p>
              <p
                className={`mt-1 rounded-lg px-2 py-1 text-xs font-bold ${difference === 0 ? "bg-emerald-100 text-emerald-800" : difference > 0 ? "bg-amber-100 text-amber-900" : "bg-error-container text-error"}`}
              >
                {difference === 0
                  ? "Caja cuadrada"
                  : `${difference > 0 ? "Sobrante" : "Faltante"}: ${formatMoney(Math.abs(difference))}`}
              </p>
              {session.closingNotes ? <p className="mt-2 text-xs">{session.closingNotes}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="shrink-0 border-y border-outline-variant p-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold">Ventas por medio de pago</h3>
          <b className="text-sm text-primary">{formatMoney(summary?.salesTotal)}</b>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(summary?.paymentMethods || [])
            .filter((item) => Number(item.amount) > 0)
            .map((item) => (
              <span
                className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-bold text-primary"
                key={item.method}
              >
                {paymentMethodLabels[item.method] || item.method}: {formatMoney(item.amount)}
              </span>
            ))}
          {!summary?.paymentMethods?.some((item) => Number(item.amount) > 0) ? (
            <span className="text-xs text-on-surface-variant">Aún no hay cobros en esta fecha.</span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-b border-outline-variant bg-amber-50/60 p-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Pacientes a cuenta</h3>
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">
              Saldo que resta cobrar; no suma al efectivo hasta registrar el pago.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <b className="block text-sm text-amber-900">{formatMoney(accounts.dayBalance)}</b>
            <span className="text-xs text-on-surface-variant">
              {accounts.dayPatientCount} paciente(s)
            </span>
          </div>
        </div>

        {accounts.totalPatientCount ? (
          <p className="mt-1 truncate text-xs text-on-surface-variant">
            Saldo pendiente acumulado al cierre de esta fecha: {formatMoney(accounts.totalBalance)} · {accounts.totalPatientCount} paciente(s).
          </p>
        ) : null}

        <div className="mt-2 grid max-h-28 gap-1.5 overflow-y-auto pr-1">
          {accounts.items.map((item) => (
            <div className="rounded-xl border border-amber-200 bg-white/80 p-2.5" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <b className="block truncate text-sm">{item.patientName}</b>
                  <p className="mt-0.5 truncate text-xs text-on-surface-variant">{item.procedure}</p>
                </div>
                <b className="shrink-0 text-sm text-amber-900">Resta {formatMoney(item.balance)}</b>
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">
                {Number(item.paidToday) > 0 ? `Abonó esta fecha: ${formatMoney(item.paidToday)} · ` : ""}
                Abonado acumulado: {formatMoney(item.paid)} de {formatMoney(item.total)}
              </p>
              {Number(item.originalTotal ?? item.total) > Number(item.total) ? (
                <p className="mt-1 text-xs text-amber-900">
                  Tarifa inicial: {formatMoney(item.originalTotal)} · Precio acordado: {formatMoney(item.total)} · Descuento: {formatMoney(item.discount)}
                </p>
              ) : null}
            </div>
          ))}
          {!accounts.items.length ? (
            <p className="rounded-xl bg-white/70 p-2 text-center text-xs text-on-surface-variant">
              No hay saldos pendientes asociados a esta fecha.
            </p>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold">Detalle del día</h3>
          <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-xs font-bold text-on-surface-variant">
            {summary?.transactions?.length || 0}
          </span>
        </div>
        <div className="grid gap-2">
          {(summary?.transactions || []).map((item) => {
            const expense = item.direction === "expense";
            return (
              <div className="rounded-xl border border-outline-variant p-2.5" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block truncate text-sm">{item.title}</b>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      {item.kind === "sale"
                        ? paymentMethodLabels[item.paymentMethod] || item.paymentMethod
                        : expense
                          ? "Egreso en efectivo"
                          : "Ingreso en efectivo"}
                      {item.reference ? ` · ${item.reference}` : ""}
                    </p>
                  </div>
                  <b className={`shrink-0 text-sm ${expense ? "text-error" : "text-emerald-700"}`}>
                    {expense ? "− " : "+ "}
                    {formatMoney(item.amount)}
                  </b>
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {formatDateTime(item.occurredAt)}
                  {item.createdBy ? ` · ${item.createdBy}` : ""}
                </p>
                {item.notes ? <p className="mt-1 text-xs">{item.notes}</p> : null}
              </div>
            );
          })}
          {!summary?.transactions?.length ? (
            <p className="rounded-xl bg-surface-container-low p-4 text-center text-sm text-on-surface-variant">
              No hay ventas ni movimientos registrados para este día.
            </p>
          ) : null}
        </div>
      </div>

      {isOpen && !historical && canEdit ? (
        cutoffReached ? (
          <div className="shrink-0 border-t border-outline-variant p-2">
            <Button className="w-full" icon="lock" onClick={onClose}>
              Cerrar y cuadrar caja
            </Button>
          </div>
        ) : (
          <div className="grid shrink-0 grid-cols-4 gap-1.5 border-t border-outline-variant p-2">
            <Button className="!w-full !px-2 !py-2 text-xs whitespace-nowrap" icon="payments" onClick={onCharge}>
              Cobrar
            </Button>
            <Button className="!w-full !px-2 !py-2 text-xs whitespace-nowrap" icon="add_circle" onClick={() => onMovement("income")} variant="secondary">
              Ingreso
            </Button>
            <Button className="!w-full !px-2 !py-2 text-xs whitespace-nowrap" icon="remove_circle" onClick={() => onMovement("expense")} variant="secondary">
              Egreso
            </Button>
            <Button className="!w-full !px-2 !py-2 text-xs whitespace-nowrap" icon="lock" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )
      ) : null}
    </Card>
  );
}

export default function DentalBillingQueue({ operator = false }) {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const today = useMemo(() => currentCashDate(), []);
  const [filter, setFilter] = useState("pending");
  const [section, setSection] = useState("cash");
  const [rows, setRows] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(today);
  const [financialReport, setFinancialReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const reportRequestRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [priceAdjustment, setPriceAdjustment] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [cashDate, setCashDate] = useState(today);
  const [cashCursor, setCashCursor] = useState(
    () => {
      const date = currentCashDate();
      return new Date(`${date}T12:00:00`);
    },
  );
  const [cashSummary, setCashSummary] = useState(null);
  const [todayCashSummary, setTodayCashSummary] = useState(null);
  const [cashCalendar, setCashCalendar] = useState([]);
  const [cashLoading, setCashLoading] = useState(true);
  const [cashCalendarLoading, setCashCalendarLoading] = useState(true);
  const [cashError, setCashError] = useState("");
  const [cashModal, setCashModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const [data, documents] = await Promise.all([
        api.getDentalReceivables(filter),
        operator ? Promise.resolve([]) : getInvoices({ domain: "dental" }),
      ]);
      setRows(data);
      setInvoices(documents);
    } catch (requestError) {
      setError(requestError.message || "No se pudo cargar Finanzas dentales.");
    } finally {
      setLoading(false);
    }
  }, [filter, operator]);

  const loadFinancialReport = useCallback(async () => {
    if (operator) return;
    const requestId = ++reportRequestRef.current;
    setReportLoading(true);
    try {
      setReportError("");
      const summary = await api.getDentalFinancialReport(reportPeriod, reportDate);
      if (requestId === reportRequestRef.current) setFinancialReport(summary);
    } catch (requestError) {
      if (requestId === reportRequestRef.current) {
        setReportError(requestError.message || "No se pudo cargar el reporte financiero.");
      }
    } finally {
      if (requestId === reportRequestRef.current) setReportLoading(false);
    }
  }, [operator, reportDate, reportPeriod]);

  const loadCash = useCallback(async () => {
    setCashLoading(true);
    try {
      setCashError("");
      const [selectedDay, currentDay] = await Promise.all([
        api.getDentalCashSummary(cashDate),
        cashDate === today ? Promise.resolve(null) : api.getDentalCashSummary(today),
      ]);
      setCashSummary(selectedDay);
      setTodayCashSummary(currentDay || selectedDay);
    } catch (requestError) {
      setCashError(requestError.message || "No se pudo cargar la caja dental.");
    } finally {
      setCashLoading(false);
    }
  }, [cashDate, today]);

  const loadCashCalendar = useCallback(async () => {
    setCashCalendarLoading(true);
    try {
      const data = await api.getDentalCashCalendar(monthKey(cashCursor));
      setCashCalendar(data);
    } catch (requestError) {
      setCashError(requestError.message || "No se pudo cargar el calendario de caja.");
    } finally {
      setCashCalendarLoading(false);
    }
  }, [cashCursor]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useEffect(() => {
    if (!operator) queueMicrotask(loadFinancialReport);
  }, [loadFinancialReport, operator]);
  useEffect(() => {
    queueMicrotask(loadCash);
  }, [loadCash]);
  useEffect(() => {
    queueMicrotask(loadCashCalendar);
  }, [loadCashCalendar]);
  useEffect(() => {
    const closeAt = todayCashSummary?.cashSchedule?.closeAt;
    if (!todayCashSummary?.session?.id || todayCashSummary?.cashSchedule?.cutoffReached || !closeAt) {
      return undefined;
    }
    const delay = new Date(closeAt).getTime() - Date.now();
    if (!Number.isFinite(delay)) return undefined;
    const timer = window.setTimeout(() => {
      void loadCash();
      void loadCashCalendar();
    }, Math.max(0, delay) + 300);
    return () => window.clearTimeout(timer);
  }, [loadCash, loadCashCalendar, todayCashSummary]);

  const refreshAfterCashChange = useCallback(async () => {
    await Promise.all([load(), loadCash(), loadCashCalendar(), loadFinancialReport()]);
  }, [load, loadCash, loadCashCalendar, loadFinancialReport]);

  const totals = useMemo(
    () => ({
      total: rows.reduce((sum, item) => sum + Number(item.total), 0),
      paid: rows.reduce((sum, item) => sum + Number(item.paid), 0),
      balance: rows.reduce((sum, item) => sum + Number(item.balance), 0),
    }),
    [rows],
  );
  const eventsByDate = useMemo(
    () =>
      cashCalendar.reduce((result, item) => {
        result[item.date] = [item];
        return result;
      }, {}),
    [cashCalendar],
  );
  const cashIsOpen = todayCashSummary?.session?.status === "open" && !todayCashSummary?.cashSchedule?.cutoffReached;
  const billingAdministrator = ["admin", "admin_owner"].includes(user?.role);
  const canEditBilling = billingAdministrator || (config?.capabilities || []).includes("dental.billing.edit");
  const canAdjustPrices = !operator && billingAdministrator;
  const Shell = operator ? OperatorShell : DashboardShell;
  const sections = operator
    ? [
        ["cash", "Caja"],
        ["charges", "Cobros"],
      ]
    : [
        ["cash", "Caja"],
        ["charges", "Cobros"],
        ["receipts", "Comprobantes"],
        ["reports", "Reportes"],
      ];

  const selectCashDate = (date) => {
    const nextDate = calendarDateKey(date);
    setCashDate(nextDate);
    if (
      date.getFullYear() !== cashCursor.getFullYear() ||
      date.getMonth() !== cashCursor.getMonth()
    ) {
      setCashCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  return (
    <Shell
      title={operator ? "Cobros y caja dental" : "Finanzas dentales"}
      subtitle="Caja diaria, cobros, comprobantes y resultados del consultorio en un solo lugar."
    >
      <div
        className="mb-3 grid rounded-2xl border border-outline-variant bg-white p-1"
        style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
      >
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
      {error ? <p className="mb-3 rounded-2xl bg-error-container p-4 text-error">{error}</p> : null}

      {section === "cash" ? (
        <>
          {cashError ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-error-container p-4 text-error">
              <span>{cashError}</span>
              <Button onClick={refreshAfterCashChange} variant="secondary">
                Reintentar
              </Button>
            </div>
          ) : null}
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.9fr)]">
            <MonthCalendarGrid
              canViewPast
              compact
              cursor={cashCursor}
              eventsByDate={eventsByDate}
              filters={[]}
              getEventLabel={(item) =>
                `${item.status === "closed" ? "Cerrada" : item.status === "open" ? "Abierta" : "Ventas"} · ${formatMoney(item.salesTotal)}`
              }
              loading={cashCalendarLoading}
              onFilter={() => {}}
              onMoveMonth={(direction) =>
                setCashCursor(
                  (current) => new Date(current.getFullYear(), current.getMonth() + direction, 1),
                )
              }
              onSelectDate={selectCashDate}
              selectedDate={cashDate}
              selectedFilter=""
              showFilters={false}
              statusMeta={{
                open: { tone: "bg-emerald-100 text-emerald-800" },
                closed: { tone: "bg-slate-200 text-slate-700" },
                recorded: { tone: "bg-primary-fixed text-primary" },
                default: { tone: "bg-primary-fixed text-primary" },
              }}
              today={today}
            />
            <CashDayPanel
              canEdit={canEditBilling}
              loading={cashLoading}
              onCharge={() => canEditBilling && setCashModal("charge")}
              onClose={() => canEditBilling && setCashModal("close")}
              onMovement={(type) => canEditBilling && setCashModal(type)}
              onOpen={() => canEditBilling && setCashModal("open")}
              summary={cashSummary}
            />
          </div>
        </>
      ) : null}

      {loading && section !== "cash" && section !== "reports" ? <Card className="h-40 animate-pulse" /> : null}

      {!loading && section === "charges" ? (
        <>
          {!canEditBilling ? (
            <Card className="mb-3 flex gap-3 border border-primary/25 bg-primary-fixed/50 p-4 text-sm">
              <span className="material-symbols-outlined h-fit text-primary">visibility</span>
              <p>Tu perfil tiene acceso de consulta a cobros. Los saldos y comprobantes se muestran, pero solo un usuario con permiso de caja puede registrar pagos.</p>
            </Card>
          ) : null}
          {!cashIsOpen ? (
            <Card className="mb-3 flex flex-col justify-between gap-3 border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-2xl text-amber-700">lock</span>
                <div>
                  <b className="block text-amber-950">
                    {todayCashSummary?.cashSchedule?.cutoffReached && todayCashSummary?.session?.status === "open"
                      ? `El horario de caja terminó a las ${todayCashSummary.cashSchedule.endTime}`
                      : todayCashSummary?.session?.status === "closed"
                      ? "La caja de hoy ya está cerrada"
                      : "Primero abre la caja de hoy"}
                  </b>
                  <p className="text-sm text-amber-900">
                    {todayCashSummary?.cashSchedule?.cutoffReached && todayCashSummary?.session?.status === "open"
                      ? "Realiza el arqueo y cierre para volver a operar en la siguiente jornada configurada."
                      : "Los cobros se habilitan al abrir caja para que cada venta quede incluida en el arqueo diario."}
                  </p>
                </div>
              </div>
              <Button icon="account_balance_wallet" onClick={() => setSection("cash")}>
                Ir a caja
              </Button>
            </Card>
          ) : null}
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
              <b className="text-xl text-emerald-700">{formatMoney(totals.paid)}</b>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-on-surface-variant">Pendiente</p>
              <b className="text-xl text-primary">{formatMoney(totals.balance)}</b>
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
                      {item.professionalName || "Clínica"} · DNI {item.patient.document}
                    </p>
                    {Number(item.originalTotal ?? item.total) > Number(item.total) ? (
                      <p className="mt-1 text-xs text-amber-900">
                        Tarifa inicial {formatMoney(item.originalTotal)} · Precio acordado {formatMoney(item.total)} · Descuento {formatMoney(item.discount)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <b className={item.balance > 0 ? "text-lg text-primary" : "text-emerald-700"}>
                      {item.balance > 0 ? formatMoney(item.balance) : "Pagado"}
                    </b>
                    {canAdjustPrices && item.balance > 0 ? (
                      <Button icon="sell" onClick={() => setPriceAdjustment(item)} variant="secondary">
                        Ajustar precio
                      </Button>
                    ) : null}
                    {item.balance > 0 ? (
                      <Button
                        disabled={!cashIsOpen || !canEditBilling}
                        icon="payments"
                        onClick={() => setSelected(item)}
                        title={canEditBilling ? cashIsOpen ? "Registrar cobro" : "Abre la caja para cobrar" : "Tu perfil solo puede consultar cobros"}
                      >
                        Cobrar
                      </Button>
                    ) : (
                      <span className="material-symbols-outlined text-emerald-600">check_circle</span>
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
                    {item.customerName} · {formatDateTime(item.issuedAt)}
                  </small>
                </span>
                <b className="shrink-0 text-primary">{formatMoney(item.total)}</b>
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

      {section === "reports" ? (
        <FinancialReportsPanel
          date={reportDate}
          error={reportError}
          loading={reportLoading}
          onDateChange={(nextDate) => {
            setFinancialReport(null);
            setReportError("");
            setReportDate(nextDate);
          }}
          onPeriodChange={(nextPeriod) => {
            setFinancialReport(null);
            setReportError("");
            setReportPeriod(nextPeriod);
          }}
          onRetry={loadFinancialReport}
          period={reportPeriod}
          report={financialReport}
        />
      ) : null}

      {selected && canEditBilling ? (
        <PaymentModal
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            setSelected(null);
            await refreshAfterCashChange();
          }}
        />
      ) : null}
      {priceAdjustment ? (
        <PriceAdjustmentModal
          item={priceAdjustment}
          onClose={() => setPriceAdjustment(null)}
          onSaved={async () => {
            setPriceAdjustment(null);
            await refreshAfterCashChange();
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
              <b className="text-3xl text-primary">{formatMoney(invoiceDetail.total)}</b>
            </div>
            <p className="text-sm text-on-surface-variant">
              Documento: {invoiceDetail.customerDocument || "Sin documento"}
            </p>
            <p className="text-sm text-on-surface-variant">
              Método: {paymentMethodLabels[invoiceDetail.paymentMethod] || "No indicado"} · Estado: {invoiceDetail.status}
            </p>
          </div>
        </Modal>
      ) : null}
      {canEditBilling && cashModal === "charge" ? (
        <CashChargePickerModal
          onClose={() => setCashModal(null)}
          onSelect={(item) => {
            setCashModal(null);
            setSelected(item);
          }}
        />
      ) : null}
      {canEditBilling && cashModal === "open" ? (
        <CashOpeningModal onClose={() => setCashModal(null)} onSaved={refreshAfterCashChange} />
      ) : null}
      {canEditBilling && (cashModal === "income" || cashModal === "expense") ? (
        <CashMovementModal
          defaultType={cashModal}
          onClose={() => setCashModal(null)}
          onSaved={refreshAfterCashChange}
        />
      ) : null}
      {canEditBilling && cashModal === "close" && cashSummary ? (
        <CashClosingModal
          onClose={() => setCashModal(null)}
          onSaved={refreshAfterCashChange}
          summary={cashSummary}
        />
      ) : null}
    </Shell>
  );
}
