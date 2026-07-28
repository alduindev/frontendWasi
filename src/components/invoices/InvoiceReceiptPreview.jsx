import Badge from "../atoms/Badge";
import { formatCurrency } from "../../data/dashboard";

const documentLabels = {
  boleta: "Boleta de venta",
  factura: "Factura",
};

const paymentLabels = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  yape: "Yape",
  plin: "Plin",
  mixed: "Pago mixto",
};

const invoiceDocumentNumber = (invoice) =>
  `${invoice.series}-${String(invoice.number).padStart(8, "0")}`;

const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Sin fecha";

const lineCode = (line, index) =>
  line.sku || line.productSku || line.productId?.slice(0, 10) || `ITEM-${index + 1}`;

export default function InvoiceReceiptPreview({ business, invoice }) {
  const statusIssued = invoice.status === "issued";
  const documentLabel =
    documentLabels[invoice.documentType] || "Comprobante de venta";
  const businessName =
    business?.legalName || business?.name || "Negocio afiliado a Wasita";
  const commercialName =
    business?.legalName && business?.name !== business?.legalName
      ? business.name
      : "";

  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant bg-white text-on-surface">
      <header className="grid gap-4 border-b border-outline-variant bg-surface-container-low px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="material-symbols-outlined flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            receipt_long
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {commercialName || "Comprobante de venta"}
            </p>
            <h3 className="mt-1 break-words font-heading text-lg font-bold sm:text-xl">
              {businessName}
            </h3>
            <div className="mt-1 grid gap-0.5 text-xs text-on-surface-variant">
              <p>RUC: {business?.taxDocument || "Pendiente de configurar"}</p>
              {business?.address ? <p>{business.address}</p> : null}
              {business?.phone || business?.email ? (
                <p>
                  {[business?.phone, business?.email].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
            {documentLabel}
          </p>
          <p className="mt-1 font-heading text-xl font-bold text-primary">
            {invoiceDocumentNumber(invoice)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
            <Badge tone={statusIssued ? "success" : "danger"}>
              {statusIssued ? "Emitido" : "Anulado"}
            </Badge>
            <Badge tone="warning">No enviado a SUNAT</Badge>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:p-5">
        <section className="grid gap-3 rounded-xl border border-outline-variant p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Fecha de emisión
            </p>
            <p className="mt-1 font-semibold">{dateTime(invoice.issuedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Cliente
            </p>
            <p className="mt-1 break-words font-semibold">
              {invoice.customerName || "Cliente general"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              DNI / RUC
            </p>
            <p className="mt-1 font-semibold">
              {invoice.customerDocument || "Sin documento"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Forma de pago
            </p>
            <p className="mt-1 font-semibold">
              {paymentLabels[invoice.paymentMethod] ||
                invoice.paymentMethod ||
                "No especificada"}
            </p>
          </div>
          {invoice.customerAddress ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs font-bold uppercase text-on-surface-variant">
                Dirección del cliente
              </p>
              <p className="mt-1 break-words font-semibold">
                {invoice.customerAddress}
              </p>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-xl border border-outline-variant">
          <div className="hidden grid-cols-[100px_minmax(0,1fr)_70px_110px_110px] gap-2 bg-primary px-3 py-2 text-xs font-bold uppercase text-white md:grid">
            <span>Código</span>
            <span>Descripción</span>
            <span className="text-right">Cant.</span>
            <span className="text-right">P. unitario</span>
            <span className="text-right">Importe</span>
          </div>
          <div className="divide-y divide-outline-variant">
            {(invoice.lines || []).map((line, index) => (
              <div
                className="grid gap-2 px-3 py-3 text-sm md:grid-cols-[100px_minmax(0,1fr)_70px_110px_110px] md:items-center"
                key={line.id || `${line.productName}-${index}`}
              >
                <span className="text-xs font-bold text-on-surface-variant">
                  {lineCode(line, index)}
                </span>
                <span className="min-w-0 break-words font-semibold">
                  {line.productName}
                </span>
                <span className="flex justify-between md:block md:text-right">
                  <span className="text-on-surface-variant md:hidden">
                    Cantidad
                  </span>
                  {line.quantity}
                </span>
                <span className="flex justify-between md:block md:text-right">
                  <span className="text-on-surface-variant md:hidden">
                    P. unitario
                  </span>
                  {formatCurrency(line.unitPrice)}
                </span>
                <span className="flex justify-between font-bold md:block md:text-right">
                  <span className="font-normal text-on-surface-variant md:hidden">
                    Importe
                  </span>
                  {formatCurrency(line.total)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
          <section className="rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary">
                verified_user
              </span>
              <div>
                <p className="font-bold text-on-surface">
                  Verificación interna Wasita
                </p>
                <p className="mt-1">
                  ID: {invoice.id}. Este documento registra la operación dentro
                  de Wasita. No reemplaza la constancia CDR de SUNAT.
                </p>
                {invoice.issuedBy?.name ? (
                  <p className="mt-1">Emitido por: {invoice.issuedBy.name}</p>
                ) : null}
              </div>
            </div>
          </section>
          <section className="grid gap-1 rounded-xl border border-outline-variant p-3 text-sm">
            <p className="flex justify-between gap-4">
              <span>Op. gravada / subtotal</span>
              <b>{formatCurrency(invoice.subtotal)}</b>
            </p>
            <p className="flex justify-between gap-4">
              <span>IGV</span>
              <b>{formatCurrency(invoice.tax)}</b>
            </p>
            <p className="mt-1 flex justify-between gap-4 border-t border-outline-variant pt-2 text-lg">
              <span>Total</span>
              <b className="text-primary">{formatCurrency(invoice.total)}</b>
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
