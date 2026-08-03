const statusLabels = {
  trial: "En prueba",
  trialing: "En prueba",
  active: "Activa",
  grace_period: "En período de gracia",
  past_due: "Pago vencido",
  suspended: "Suspendida",
  canceled: "Cancelada",
  expired: "Vencida",
  pending_payment: "Pago pendiente",
  incomplete: "Incompleta",
};

const accessLabels = {
  full: "Acceso operativo",
  limited: "Acceso clínico limitado",
  blocked: "Acceso bloqueado",
};

const accessStyles = {
  full: "bg-emerald-100 text-emerald-800",
  limited: "bg-amber-100 text-amber-900",
  blocked: "bg-error-container text-on-error-container",
};

const eventLabels = {
  subscription_created: "Suscripción creada",
  payment_order_created: "Orden de pago creada",
  payment_succeeded: "Pago confirmado",
  payment_failed: "Pago rechazado",
  payment_pending: "Pago pendiente",
  addon_order_created: "Orden de complemento creada",
  addon_activated: "Complemento activado",
  cancellation_scheduled: "Cancelación programada",
  cancellation_revoked: "Cancelación revocada",
  platform_plan_assigned: "Plan aplicado por Plataforma",
  platform_subscription_reactivated: "Suscripción reactivada por Plataforma",
  platform_subscription_status_changed: "Estado actualizado por Plataforma",
  platform_subscription_updated: "Suscripción editada por Plataforma",
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const money = (value, currency = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(
    Number(value || 0),
  );

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Sin fecha" : dateFormatter.format(parsed);
};

const eventLabel = (value) =>
  eventLabels[value] || String(value || "sin evento").replaceAll("_", " ");

function HistoryColumn({ children, empty, title }) {
  return (
    <section className="rounded-xl bg-surface-container-low p-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {title}
      </h4>
      {children?.length ? (
        <ul className="mt-2 grid gap-2 text-xs">{children}</ul>
      ) : (
        <p className="mt-2 text-xs text-on-surface-variant">{empty}</p>
      )}
    </section>
  );
}

export default function SubscriptionDiagnostics({ subscription }) {
  if (!subscription) return null;

  const diagnostics = subscription.diagnostics || {};
  const accessMode = diagnostics.accessMode || "blocked";
  const days = diagnostics.daysUntilNextRelevantAt;
  const timing =
    typeof days !== "number"
      ? ""
      : days < 0
        ? `Hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`
        : days === 0
          ? "Hoy"
          : `En ${days} día${days === 1 ? "" : "s"}`;
  const dates = [
    ["Inicio del período", subscription.currentPeriodStart],
    ["Fin del período", subscription.currentPeriodEnd],
    ["Próximo cobro", subscription.nextBillingAt],
    ["Fin de gracia", subscription.graceEndsAt],
    ["Fin de prueba", subscription.trialEndsAt],
    ["Cancelada", subscription.canceledAt],
    ["Vencimiento histórico", subscription.expiresAt],
  ].filter(([, value]) => Boolean(value));
  const events = (subscription.events || []).slice(0, 5).map((event) => (
    <li className="border-b border-outline-variant pb-2 last:border-0 last:pb-0" key={event.id}>
      <b className="capitalize">{eventLabel(event.eventType)}</b>
      <span className="block text-on-surface-variant">{formatDate(event.createdAt)}</span>
      {event.fromStatus || event.toStatus ? (
        <span className="block text-on-surface-variant">
          {event.fromStatus || "sin estado"} → {event.toStatus || "sin estado"}
        </span>
      ) : null}
      {event.metadata?.reason || event.metadata?.plan ? (
        <span className="block text-on-surface-variant">
          {event.metadata.reason || `Plan ${event.metadata.plan}`}
        </span>
      ) : null}
    </li>
  ));
  const payments = (subscription.payments || []).slice(0, 5).map((payment) => (
    <li className="border-b border-outline-variant pb-2 last:border-0 last:pb-0" key={payment.id}>
      <b>{money(payment.amount, payment.currency)}</b>
      <span className="block text-on-surface-variant">
        {payment.provider} · {payment.status} · {formatDate(payment.createdAt)}
      </span>
      {payment.errorMessage ? (
        <span className="block text-error">{payment.errorMessage}</span>
      ) : null}
    </li>
  ));
  const invoices = (subscription.invoices || []).slice(0, 5).map((invoice) => (
    <li className="border-b border-outline-variant pb-2 last:border-0 last:pb-0" key={invoice.id}>
      <b>{invoice.number}</b>
      <span className="block text-on-surface-variant">
        {money(invoice.total, invoice.currency)} · {invoice.status} · {formatDate(invoice.issuedAt || invoice.createdAt)}
      </span>
    </li>
  ));

  return (
    <section className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Diagnóstico de suscripción
          </p>
          <h4 className="mt-1 font-bold">
            {diagnostics.statusLabel || statusLabels[subscription.status] || subscription.status}
          </h4>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${accessStyles[accessMode] || accessStyles.blocked}`}
        >
          {accessLabels[accessMode] || "Acceso por revisar"}
        </span>
      </div>
      <p className="mt-3 text-sm">{diagnostics.reason || "No hay diagnóstico disponible."}</p>
      {diagnostics.nextRelevantAt ? (
        <p className="mt-1 text-sm text-on-surface-variant">
          Próxima fecha relevante: {formatDate(diagnostics.nextRelevantAt)}
          {timing ? ` · ${timing}` : ""}
        </p>
      ) : null}
      {diagnostics.recommendedAction ? (
        <p className="mt-3 rounded-lg bg-primary-fixed px-3 py-2 text-sm text-primary">
          {diagnostics.recommendedAction}
        </p>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {dates.length ? (
          dates.map(([label, value]) => (
            <div className="rounded-lg bg-white px-3 py-2" key={label}>
              <span className="block text-xs text-on-surface-variant">{label}</span>
              <b className="text-sm">{formatDate(value)}</b>
            </div>
          ))
        ) : (
          <p className="text-sm text-on-surface-variant">No hay fechas de ciclo registradas.</p>
        )}
      </div>
      <details className="mt-4 rounded-lg border border-outline-variant bg-white p-3">
        <summary className="cursor-pointer text-sm font-bold text-primary">
          Historial de eventos, pagos y comprobantes
        </summary>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <HistoryColumn empty="No hay eventos registrados." title="Eventos">
            {events}
          </HistoryColumn>
          <HistoryColumn empty="No hay pagos registrados." title="Pagos">
            {payments}
          </HistoryColumn>
          <HistoryColumn empty="No hay comprobantes registrados." title="Comprobantes">
            {invoices}
          </HistoryColumn>
        </div>
        {subscription.items?.length ? (
          <p className="mt-3 text-xs text-on-surface-variant">
            Complementos: {subscription.items.map((item) => `${item.code} ×${item.quantity}`).join(", ")}
          </p>
        ) : null}
      </details>
    </section>
  );
}
