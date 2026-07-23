import { useEffect, useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import Modal from "../../components/molecules/Modal";
import { formatCurrency } from "../../data/dashboard";
import {
  checkOut,
  getHospitalityWorkOrders,
} from "../../services/hospitalityService";
import { printInvoice } from "../../utils/invoiceExport";

const billable = ["laundry", "kitchen", "room-service"];
const steps = [
  { icon: "receipt_long", label: "Cuenta" },
  { icon: "badge", label: "Comprobante" },
  { icon: "payments", label: "Pago" },
  { icon: "task_alt", label: "Confirmar" },
];
const field =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function HotelCheckoutModal({
  charges,
  onClose,
  onSaved,
  reservation,
}) {
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    documentType: "boleta",
    customerName: reservation.guest.name,
    customerDocument: reservation.guest.document || "",
    customerAddress: "",
    paymentMethod: "cash",
    amountReceived: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    getHospitalityWorkOrders()
      .then((items) =>
        setServices(
          items.filter(
            (item) =>
              item.reservation?.id === reservation.id &&
              billable.includes(item.functionCode),
          ),
        ),
      )
      .catch((requestError) => setError(requestError.message));
  }, [reservation.id]);
  const completed = useMemo(
    () =>
      services.filter(
        (item) => item.status === "completed" && Number(item.amount) > 0,
      ),
    [services],
  );
  const pending = useMemo(
    () =>
      services.filter((item) =>
        ["pending", "assigned", "in_progress"].includes(item.status),
      ),
    [services],
  );
  const total =
    Number(reservation.total) +
    charges.reduce((sum, item) => sum + Number(item.total), 0) +
    completed.reduce((sum, item) => sum + Number(item.amount), 0);
  const change = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const next = () => {
    setError("");
    if (step === 0 && pending.length) {
      setError(
        "Completa o cancela los servicios pendientes antes de continuar.",
      );
      return;
    }
    if (step === 1 && !form.customerName.trim()) {
      setError("Ingresa el nombre del cliente o la razón social.");
      return;
    }
    if (
      step === 1 &&
      form.documentType === "factura" &&
      !/^\d{11}$/.test(form.customerDocument.trim())
    ) {
      setError("Para una factura ingresa un RUC válido de 11 dígitos.");
      return;
    }
    if (
      step === 2 &&
      form.paymentMethod === "cash" &&
      Number(form.amountReceived || 0) < total
    ) {
      setError(
        `El efectivo recibido debe ser al menos ${formatCurrency(total)}.`,
      );
      return;
    }
    setStep((current) => Math.min(steps.length - 1, current + 1));
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await checkOut(reservation.id, {
        ...form,
        amountReceived: Number(form.amountReceived || 0),
      });
      setResult(response.invoice);
      await onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (result)
    return (
      <Modal onClose={onClose} title="Check-out completado">
        <div className="grid gap-4 p-5 text-center">
          <span className="material-symbols-outlined mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-700">
            receipt_long
          </span>
          <div>
            <p>
              {result.documentType === "factura" ? "Factura" : "Boleta"} emitida
            </p>
            <h3 className="text-2xl font-bold">
              {result.series}-{String(result.number).padStart(8, "0")}
            </h3>
          </div>
          <InvoiceLines invoice={result} />
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              icon="print"
              onClick={() => printInvoice(result)}
              type="button"
              variant="secondary"
            >
              Imprimir / PDF
            </Button>
            <Button onClick={onClose}>Finalizar</Button>
          </div>
        </div>
      </Modal>
    );

  return (
    <Modal
      onClose={onClose}
      title={`Cuenta final · Habitación ${reservation.room.number}`}
    >
      <form
        className="flex max-h-[84vh] min-h-[34rem] flex-col"
        onSubmit={submit}
      >
        <StepNavigation
          current={step}
          onSelect={(index) => {
            if (index < step) {
              setError("");
              setStep(index);
            }
          }}
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {error ? (
            <p className="mb-4 rounded-xl bg-error-container p-3 text-sm font-bold text-on-error-container">
              {error}
            </p>
          ) : null}
          {step === 0 ? (
            <AccountStep
              charges={charges}
              completed={completed}
              pending={pending}
              reservation={reservation}
              total={total}
            />
          ) : null}
          {step === 1 ? <DocumentStep form={form} onChange={change} /> : null}
          {step === 2 ? (
            <PaymentStep form={form} onChange={change} total={total} />
          ) : null}
          {step === 3 ? (
            <ConfirmationStep
              charges={charges}
              completed={completed}
              form={form}
              reservation={reservation}
              total={total}
            />
          ) : null}
        </div>
        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-outline-variant bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            onClick={
              step
                ? () => {
                    setError("");
                    setStep((current) => current - 1);
                  }
                : onClose
            }
            type="button"
            variant="secondary"
          >
            {step ? "Atrás" : "Cancelar"}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next} type="button">
              Continuar
            </Button>
          ) : (
            <Button disabled={saving || pending.length > 0} type="submit">
              {saving ? "Emitiendo..." : "Emitir comprobante y finalizar"}
            </Button>
          )}
        </footer>
      </form>
    </Modal>
  );
}

function StepNavigation({ current, onSelect }) {
  return (
    <nav
      aria-label="Progreso del check-out"
      className="grid grid-cols-4 gap-1 border-b border-outline-variant bg-surface-container-low p-2 sm:gap-2 sm:p-3"
    >
      {steps.map((item, index) => (
        <button
          aria-current={current === index ? "step" : undefined}
          className={`flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-bold transition sm:gap-2 sm:text-sm ${current === index ? "bg-primary text-white shadow-sm" : index < current ? "bg-primary-fixed text-primary" : "text-on-surface-variant"}`}
          disabled={index > current}
          key={item.label}
          onClick={() => onSelect(index)}
          type="button"
        >
          <span className="material-symbols-outlined text-lg">
            {index < current ? "check_circle" : item.icon}
          </span>
          <span className="hidden sm:inline">{item.label}</span>
          <span className="sm:hidden">{index + 1}</span>
        </button>
      ))}
    </nav>
  );
}
function AccountStep({ charges, completed, pending, reservation, total }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        Paso 1 de 4
      </p>
      <h3 className="mt-1 text-xl font-bold">Revisa la cuenta</h3>
      <p className="text-sm text-on-surface-variant">
        {reservation.guest.name} · {reservation.checkInDate} →{" "}
        {reservation.checkOutDate}
      </p>
      {pending.length ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
          Hay {pending.length} servicio(s) pendiente(s). Complétalos o
          cancélalos antes de continuar.
        </p>
      ) : null}
      <div className="mt-4 grid gap-2 rounded-2xl bg-surface-container-low p-4">
        <div className="flex justify-between">
          <span>Alojamiento</span>
          <b>{formatCurrency(reservation.total)}</b>
        </div>
        {charges.map((item) => (
          <div className="flex justify-between text-sm" key={item.id}>
            <span>
              {item.quantity} × {item.itemName}
            </span>
            <b>{formatCurrency(item.total)}</b>
          </div>
        ))}
        {completed.map((item) => (
          <div className="flex justify-between text-sm" key={item.id}>
            <span>Servicio · {item.title}</span>
            <b>{formatCurrency(item.amount)}</b>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-outline-variant pt-3 text-xl">
          <span>Total</span>
          <b className="text-primary">{formatCurrency(total)}</b>
        </div>
      </div>
    </section>
  );
}
function DocumentStep({ form, onChange }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        Paso 2 de 4
      </p>
      <h3 className="mt-1 text-xl font-bold">Datos del comprobante</h3>
      <p className="text-sm text-on-surface-variant">
        Elige boleta o factura y confirma los datos fiscales.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          Tipo
          <select
            className={field}
            onChange={(event) => onChange("documentType", event.target.value)}
            value={form.documentType}
          >
            <option value="boleta">Boleta</option>
            <option value="factura">Factura</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Nombre o razón social
          <input
            className={field}
            onChange={(event) => onChange("customerName", event.target.value)}
            value={form.customerName}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {form.documentType === "factura" ? "RUC" : "Documento"}
          <input
            className={field}
            inputMode="numeric"
            maxLength={form.documentType === "factura" ? 11 : 20}
            onChange={(event) =>
              onChange("customerDocument", event.target.value)
            }
            value={form.customerDocument}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Dirección
          <input
            className={field}
            onChange={(event) =>
              onChange("customerAddress", event.target.value)
            }
            placeholder={
              form.documentType === "factura" ? "Dirección fiscal" : "Opcional"
            }
            value={form.customerAddress}
          />
        </label>
      </div>
    </section>
  );
}
function PaymentStep({ form, onChange, total }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        Paso 3 de 4
      </p>
      <h3 className="mt-1 text-xl font-bold">Registra el pago</h3>
      <p className="text-sm text-on-surface-variant">
        Total por cobrar:{" "}
        <b className="text-primary">{formatCurrency(total)}</b>
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          Medio
          <select
            className={field}
            onChange={(event) => onChange("paymentMethod", event.target.value)}
            value={form.paymentMethod}
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
          </select>
        </label>
        {form.paymentMethod === "cash" ? (
          <label className="grid gap-1 text-sm font-bold">
            Efectivo recibido
            <input
              className={field}
              min={total}
              onChange={(event) =>
                onChange("amountReceived", event.target.value)
              }
              placeholder={total.toFixed(2)}
              step="0.01"
              type="number"
              value={form.amountReceived}
            />
          </label>
        ) : null}
        <label className="grid gap-1 text-sm font-bold sm:col-span-2">
          Observaciones
          <textarea
            className={`${field} min-h-28 py-3`}
            maxLength="500"
            onChange={(event) => onChange("notes", event.target.value)}
            placeholder="Detalle adicional del cierre"
            value={form.notes}
          />
        </label>
      </div>
    </section>
  );
}
function ConfirmationStep({ charges, completed, form, reservation, total }) {
  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        Paso 4 de 4
      </p>
      <h3 className="mt-1 text-xl font-bold">Confirma y emite</h3>
      <p className="text-sm text-on-surface-variant">
        Revisa una última vez. Al emitir se cerrará la estancia.
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-low p-4">
          <p className="text-xs font-bold uppercase text-on-surface-variant">
            Cuenta
          </p>
          <p className="mt-2 font-bold">
            Habitación {reservation.room.number} · {reservation.guest.name}
          </p>
          <p className="text-sm text-on-surface-variant">
            {charges.length} consumo(s) · {completed.length} servicio(s)
          </p>
          <p className="mt-4 text-2xl font-bold text-primary">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant p-4">
          <p className="text-xs font-bold uppercase text-on-surface-variant">
            Comprobante y pago
          </p>
          <p className="mt-2 font-bold capitalize">
            {form.documentType} · {form.customerName}
          </p>
          <p className="text-sm text-on-surface-variant">
            {form.customerDocument || "Sin documento"}
          </p>
          <p className="mt-3 text-sm font-bold">
            {paymentLabels[form.paymentMethod]}
          </p>
          {form.paymentMethod === "cash" ? (
            <p className="text-sm text-on-surface-variant">
              Recibido {formatCurrency(form.amountReceived)} · Vuelto{" "}
              {formatCurrency(Math.max(0, Number(form.amountReceived) - total))}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
function InvoiceLines({ invoice }) {
  return (
    <div className="grid gap-2 rounded-2xl bg-surface-container-low p-4 text-left">
      {invoice.lines.map((line) => (
        <div className="flex justify-between gap-3 text-sm" key={line.id}>
          <span>
            {line.quantity} × {line.productName}
          </span>
          <b>{formatCurrency(line.total)}</b>
        </div>
      ))}
      <div className="flex justify-between border-t border-outline-variant pt-3 text-xl">
        <span>Total</span>
        <b className="text-primary">{formatCurrency(invoice.total)}</b>
      </div>
      {Number(invoice.changeAmount) > 0 ? (
        <div className="flex justify-between">
          <span>Vuelto</span>
          <b>{formatCurrency(invoice.changeAmount)}</b>
        </div>
      ) : null}
    </div>
  );
}
const paymentLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  yape: "Yape",
  plin: "Plin",
};
