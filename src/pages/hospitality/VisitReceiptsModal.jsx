import { useMemo, useState } from "react";
import Button from "../../components/atoms/Button";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import { formatCurrency } from "../../data/dashboard";
import { printInvoice } from "../../utils/invoiceExport";
import { downloadSpreadsheet } from "../../utils/exportUtils";

const documentNumber = (invoice) =>
  `${invoice.series}-${String(invoice.number).padStart(8, "0")}`;

export default function VisitReceiptsModal({ onClose, reservations }) {
  const [selected, setSelected] = useState(null);
  const visits = useMemo(
    () =>
      reservations.filter(
        (item) => item.status === "checked_out" && item.invoice,
      ),
    [reservations],
  );
  const invoice = selected?.invoice;
  const exportIncome = () =>
    downloadSpreadsheet(
      `ingresos-hoteleria-${new Date().toLocaleDateString("en-CA")}`,
      visits.map((visit) => ({
        Comprobante: documentNumber(visit.invoice),
        Fecha: new Date(visit.invoice.issuedAt).toLocaleString("es-PE"),
        Huesped: visit.guest.name,
        Documento: visit.invoice.customerDocument || "",
        Habitacion: visit.room.number,
        Ingreso: Number(visit.invoice.total),
        MedioPago: visit.invoice.paymentMethod,
      })),
      "Ingresos hoteleria",
    );

  return (
    <Modal
      onClose={onClose}
      title={
        invoice
          ? `Detalle · ${documentNumber(invoice)}`
          : "Comprobantes de visitas"
      }
    >
      <div className="grid max-h-[82vh] gap-4 overflow-y-auto p-4 sm:p-6">
        {invoice ? (
          <>
            <div>
              <Button
                icon="arrow_back"
                onClick={() => setSelected(null)}
                type="button"
                variant="ghost"
              >
                Volver a visitas
              </Button>
            </div>
            <section className="grid gap-3 rounded-2xl bg-primary-fixed p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase text-on-surface-variant">
                  {invoice.documentType}
                </p>
                <b className="text-xl text-primary">
                  {documentNumber(invoice)}
                </b>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-on-surface-variant">Total pagado</p>
                <b className="text-2xl text-primary">
                  {formatCurrency(invoice.total)}
                </b>
              </div>
              <p className="text-sm">
                <b>Huésped:</b> {selected.guest.name}
                <br />
                <span className="text-on-surface-variant">
                  {invoice.customerDocument || "Sin documento"}
                </span>
              </p>
              <p className="text-sm sm:text-right">
                <b>Habitación {selected.room.number}</b>
                <br />
                <span className="text-on-surface-variant">
                  {selected.checkInDate} → {selected.checkOutDate}
                </span>
              </p>
            </section>
            <section>
              <h3 className="mb-2 font-bold">Detalle facturado</h3>
              <div className="grid gap-2">
                {invoice.lines.map((line) => (
                  <div
                    className="flex justify-between gap-4 rounded-xl border border-outline-variant p-3 text-sm"
                    key={line.id}
                  >
                    <span>
                      {line.quantity} × {line.productName}
                    </span>
                    <b>{formatCurrency(line.total)}</b>
                  </div>
                ))}
              </div>
            </section>
            <section className="ml-auto grid w-full max-w-sm gap-2 rounded-2xl bg-surface-container-low p-4 text-sm">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <b>{formatCurrency(invoice.subtotal)}</b>
              </p>
              <p className="flex justify-between">
                <span>IGV</span>
                <b>{formatCurrency(invoice.tax)}</b>
              </p>
              <p className="flex justify-between border-t border-outline-variant pt-2 text-lg">
                <span>Total</span>
                <b className="text-primary">{formatCurrency(invoice.total)}</b>
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Emitido {new Date(invoice.issuedAt).toLocaleString("es-PE")} ·{" "}
                {invoice.issuedBy?.name || "Administración"} ·{" "}
                {invoice.paymentMethod}
              </p>
              <Button
                icon="print"
                onClick={() => printInvoice(invoice)}
                type="button"
                variant="secondary"
              >
                Imprimir / PDF
              </Button>
            </section>
          </>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-on-surface-variant">
                Boletas y facturas emitidas al finalizar cada estadía.
                Selecciona una visita para revisar alojamiento y consumos.
              </p>
              <Button
                disabled={!visits.length}
                icon="table_view"
                onClick={exportIncome}
                type="button"
                variant="secondary"
              >
                Exportar ingresos
              </Button>
            </div>
            <div className="grid gap-3">
              {visits.map((visit) => (
                <button
                  className="flex w-full flex-col gap-3 rounded-2xl border border-outline-variant p-4 text-left transition hover:border-primary hover:bg-primary-fixed/30 sm:flex-row sm:items-center sm:justify-between"
                  key={visit.id}
                  onClick={() => setSelected(visit)}
                  type="button"
                >
                  <div>
                    <b>
                      {visit.guest.name} · Habitación {visit.room.number}
                    </b>
                    <p className="text-sm text-on-surface-variant">
                      {visit.checkInDate} → {visit.checkOutDate}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase text-primary">
                      {visit.invoice.documentType}{" "}
                      {documentNumber(visit.invoice)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <b className="text-lg text-primary">
                      {formatCurrency(visit.invoice.total)}
                    </b>
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {!visits.length ? (
              <EmptyState
                description="Los comprobantes aparecerán automáticamente al completar el check-out."
                icon="receipt_long"
                title="Sin comprobantes emitidos"
              />
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
