import Button from "../../components/atoms/Button";
import EntityAttachments from "../../components/attachments/EntityAttachments";
import Modal from "../../components/molecules/Modal";
import { formatCurrency } from "../../data/dashboard";

const statusData = {
  confirmed: [
    "Reserva confirmada",
    "event_available",
    "La habitación está reservada y espera el ingreso.",
  ],
  checked_in: [
    "Huésped alojado",
    "meeting_room",
    "La estadía está activa. Puedes registrar los consumos de la habitación.",
  ],
  checked_out: [
    "Visita finalizada",
    "task_alt",
    "El check-out fue completado. Este expediente es de solo lectura.",
  ],
  cancelled: [
    "Reserva cancelada",
    "event_busy",
    "La reserva se conserva únicamente como historial.",
  ],
};
const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Pendiente";
const number = (invoice) =>
  `${invoice.series}-${String(invoice.number).padStart(8, "0")}`;

export default function VisitDetailModal({
  charges,
  onAddCharge,
  onCheckIn,
  onCheckout,
  onClose,
  readonly = false,
  reservation,
  working,
}) {
  const [statusLabel, statusIcon, statusDescription] = statusData[
    reservation.status
  ] || [reservation.status, "info", ""];
  const consumption = charges.reduce(
    (sum, item) => sum + Number(item.total),
    0,
  );
  const invoice = reservation.invoice;
  return (
    <Modal
      onClose={onClose}
      title={`Visita · Habitación ${reservation.room.number}`}
    >
      <div className="grid max-h-[84vh] gap-5 overflow-y-auto p-4 sm:p-6">
        <section className="flex gap-3 rounded-2xl bg-primary-fixed p-4">
          <span className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary">
            {statusIcon}
          </span>
          <div>
            <h3 className="font-bold text-primary">{statusLabel}</h3>
            <p className="text-sm text-on-surface-variant">
              {statusDescription}
            </p>
          </div>
        </section>
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-outline-variant p-4">
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Huésped
            </p>
            <b>{reservation.guest.name}</b>
            <p className="text-sm text-on-surface-variant">
              {reservation.guest.documentType} {reservation.guest.document}
            </p>
            <p className="text-sm text-on-surface-variant">
              {reservation.adults} adulto(s) · {reservation.children} niño(s)
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant p-4">
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Estadía
            </p>
            <b>
              Habitación {reservation.room.number} · {reservation.room.roomType}
            </b>
            <p className="text-sm text-on-surface-variant">
              {reservation.checkInDate} → {reservation.checkOutDate}
            </p>
            <p className="text-sm font-bold text-primary">
              Alojamiento {formatCurrency(reservation.total)}
            </p>
          </div>
        </section>
        <section>
          <h3 className="font-bold">Seguimiento de la visita</h3>
          <div className="mt-3 grid gap-0">
            <Timeline
              icon="calendar_month"
              label="Reserva creada"
              text={dateTime(reservation.createdAt)}
              done
            />
            <Timeline
              icon="login"
              label="Check-in"
              text={
                reservation.checkedInAt
                  ? `${dateTime(reservation.checkedInAt)} · ${reservation.checkedInBy?.name || "Recepción"}`
                  : "Aún no realizado"
              }
              done={Boolean(reservation.checkedInAt)}
            />
            <Timeline
              icon="logout"
              label="Check-out"
              text={
                reservation.checkedOutAt
                  ? `${dateTime(reservation.checkedOutAt)} · ${reservation.checkedOutBy?.name || "Recepción"}`
                  : "Aún no realizado"
              }
              done={Boolean(reservation.checkedOutAt)}
              last
            />
          </div>
        </section>
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Consumos de habitación</h3>
              <p className="text-sm text-on-surface-variant">
                Productos registrados durante esta estadía.
              </p>
            </div>
            <b className="text-lg text-primary">
              {formatCurrency(consumption)}
            </b>
          </div>
          <div className="mt-3 grid gap-2">
            {charges.map((item) => (
              <div
                className="flex justify-between gap-3 rounded-xl bg-surface-container-low p-3 text-sm"
                key={item.id}
              >
                <div>
                  <b>
                    {item.quantity} × {item.itemName}
                  </b>
                  <p className="text-xs text-on-surface-variant">
                    {dateTime(item.createdAt)} ·{" "}
                    {item.createdBy?.name || "Operación hotelera"}
                  </p>
                </div>
                <b>{formatCurrency(item.total)}</b>
              </div>
            ))}
            {!charges.length ? (
              <p className="rounded-xl border border-dashed border-outline-variant p-4 text-center text-sm text-on-surface-variant">
                No se registraron consumos.
              </p>
            ) : null}
          </div>
        </section>
        {invoice ? (
          <section className="rounded-2xl border border-primary/30 bg-primary-fixed/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-primary">
                  Comprobante emitido
                </p>
                <b>
                  {invoice.documentType === "factura" ? "Factura" : "Boleta"}{" "}
                  {number(invoice)}
                </b>
                <p className="text-sm text-on-surface-variant">
                  {dateTime(invoice.issuedAt)} ·{" "}
                  {invoice.issuedBy?.name || "Administración"}
                </p>
              </div>
              <b className="text-xl text-primary">
                {formatCurrency(invoice.total)}
              </b>
            </div>
            <div className="mt-3 grid gap-1 border-t border-outline-variant pt-3 text-sm">
              {invoice.lines.map((line) => (
                <p className="flex justify-between" key={line.id}>
                  <span>
                    {line.quantity} × {line.productName}
                  </span>
                  <b>{formatCurrency(line.total)}</b>
                </p>
              ))}
            </div>
          </section>
        ) : null}
        <EntityAttachments
          entityId={reservation.id}
          entityType="hospitality_reservation"
          title="Archivos de la estancia"
        />
        {reservation.notes ? (
          <section className="rounded-2xl bg-surface-container-low p-4">
            <h3 className="font-bold">Observaciones</h3>
            <p className="mt-1 text-sm">{reservation.notes}</p>
          </section>
        ) : null}
        <div className="flex flex-col-reverse justify-end gap-2 border-t border-outline-variant pt-4 sm:flex-row">
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
          {!readonly && reservation.status === "confirmed" ? (
            <>
              <Button
                icon="add_shopping_cart"
                onClick={onAddCharge}
                variant="secondary"
              >
                Programar productos
              </Button>
              <Button disabled={working} icon="login" onClick={onCheckIn}>
                {working ? "Procesando..." : "Realizar check-in"}
              </Button>
            </>
          ) : null}
          {!readonly && reservation.status === "checked_in" ? (
            <>
              <Button
                icon="add_shopping_cart"
                onClick={onAddCharge}
                variant="secondary"
              >
                Agregar consumo
              </Button>
              <Button disabled={working} icon="logout" onClick={onCheckout}>
                {working ? "Procesando..." : "Realizar check-out"}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function Timeline({ done, icon, label, last, text }) {
  return (
    <div className="grid grid-cols-[32px_1fr] gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-full text-base ${done ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}
        >
          {icon}
        </span>
        {!last ? (
          <span
            className={`min-h-8 w-0.5 flex-1 ${done ? "bg-primary" : "bg-outline-variant"}`}
          />
        ) : null}
      </div>
      <div className="pb-4">
        <b className="text-sm">{label}</b>
        <p className="text-xs text-on-surface-variant">{text}</p>
      </div>
    </div>
  );
}
