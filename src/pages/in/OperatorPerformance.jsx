import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../../components/atoms/Avatar";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import EmptyState from "../../components/molecules/EmptyState";
import DashboardShell from "../../components/organisms/DashboardShell";
import { formatCurrency } from "../../data/dashboard";
import {
  getOperatorPerformance,
  getOperatorSales,
  getOperatorStatistics,
} from "../../services/operatorPerformanceService";
import { printInvoice } from "../../utils/invoiceExport";

const dateTime = (value) =>
  value ? new Date(value).toLocaleString("es-PE") : "Sin registro";
const number = (sale) =>
  `${sale.series}-${String(sale.number).padStart(8, "0")}`;
function Metric({ label, value, note }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-bold text-primary">
        {value}
      </p>
      {note ? (
        <p className="mt-1 text-xs text-on-surface-variant">{note}</p>
      ) : null}
    </Card>
  );
}

export default function OperatorPerformance() {
  const { operatorId } = useParams();
  const [detail, setDetail] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [sales, setSales] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [info, charts, list] = await Promise.all([
        getOperatorPerformance(operatorId),
        getOperatorStatistics(operatorId),
        getOperatorSales(operatorId, { limit: 50 }),
      ]);
      setDetail(info);
      setStatistics(charts);
      setSales(list.items);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [operatorId]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  const visibleSales = useMemo(() => {
    const value = query.trim().toLowerCase();
    return sales.filter(
      (sale) =>
        !value ||
        `${number(sale)} ${sale.customerName} ${sale.documentType}`
          .toLowerCase()
          .includes(value),
    );
  }, [query, sales]);
  if (loading)
    return (
      <DashboardShell title="Rendimiento del operario">
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((x) => (
            <Card className="h-28 animate-pulse" key={x} />
          ))}
        </div>
      </DashboardShell>
    );
  if (error || !detail)
    return (
      <DashboardShell title="Rendimiento del operario">
        <EmptyState
          action={{ children: "Reintentar", onClick: load }}
          description={error}
          icon="cloud_off"
          title="No se pudo cargar"
        />
      </DashboardShell>
    );
  const { operator, metrics } = detail;
  const maxDaily = Math.max(
    ...(statistics?.dailySales || []).map((item) => item.value),
    1,
  );
  return (
    <DashboardShell
      action={
        <Link
          className="inline-flex min-h-11 items-center rounded-xl border border-outline-variant px-4 text-sm font-bold"
          to="/dashboard/team"
        >
          Volver al equipo
        </Link>
      }
      subtitle="Métricas calculadas exclusivamente con la actividad de este operario."
      title={operator.name}
    >
      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={operator.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-bold">
                {operator.name}
              </h2>
              <Badge tone={operator.isActive ? "success" : "neutral"}>
                {operator.isActive ? "Activo" : "Sin sesión activa"}
              </Badge>
              <Badge>Operador</Badge>
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">
              {operator.email} · {operator.phone} · {operator.site}
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">
              Creado: {dateTime(operator.createdAt)} · Último acceso:{" "}
              {dateTime(operator.lastLoginAt)}
            </p>
          </div>
        </div>
      </Card>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Ventas hoy"
          value={metrics.salesToday}
          note={`Ayer: ${metrics.salesYesterday}`}
        />
        <Metric
          label="Ventas semana"
          value={metrics.salesWeek}
          note={`Mes: ${metrics.salesMonth}`}
        />
        <Metric
          label="Monto vendido"
          value={formatCurrency(metrics.amountSold)}
          note={`${metrics.invoicesCount} comprobantes`}
        />
        <Metric
          label="Ticket promedio"
          value={formatCurrency(metrics.averageTicket)}
          note={`${metrics.productsSold} productos`}
        />
        <Metric
          label="Producto líder"
          value={metrics.topProduct || "Sin datos"}
        />
        <Metric
          label="Hora más activa"
          value={
            metrics.peakHour == null ? "Sin datos" : `${metrics.peakHour}:00`
          }
        />
        <Metric label="Día productivo" value={metrics.bestDay || "Sin datos"} />
        <Metric
          label="Anulaciones"
          value={metrics.voids}
          note="Devoluciones: preparadas para futuro"
        />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-heading text-lg font-bold">
            Alertas de supervisión
          </h2>
          <div className="mt-3 grid gap-2 text-sm">
            {metrics.lastSaleAt ? (
              <p className="rounded-xl bg-surface-container-low p-3">
                Última venta: <b>{dateTime(metrics.lastSaleAt)}</b>
              </p>
            ) : (
              <p className="rounded-xl bg-error-container p-3 text-on-error-container">
                Este operario todavía no registra ventas.
              </p>
            )}
            {metrics.voids > 0 ? (
              <p className="rounded-xl bg-tertiary-fixed p-3 text-on-tertiary-fixed">
                Registra {metrics.voids} comprobante(s) anulado(s). Conviene
                revisar el contexto.
              </p>
            ) : (
              <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
                Sin anulaciones registradas.
              </p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-heading text-lg font-bold">Observaciones</h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Las observaciones manuales no se simulan. La arquitectura queda
            preparada para incorporarlas cuando exista su política de permisos,
            edición y auditoría.
          </p>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-heading text-xl font-bold">Ventas por día</h2>
          <div className="mt-4 grid gap-3">
            {statistics.dailySales.slice(-10).map((item) => (
              <div key={item.date}>
                <div className="flex justify-between text-xs">
                  <span>{item.date}</span>
                  <b>{formatCurrency(item.value)}</b>
                </div>
                <div className="mt-1 h-2 rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.max(3, (item.value / maxDaily) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-heading text-xl font-bold">Actividad reciente</h2>
          <div className="mt-4 grid gap-0">
            {detail.recentActivity.map((event) => (
              <div
                className="relative border-l-2 border-primary-fixed pb-4 pl-5"
                key={event.id}
              >
                <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary" />
                <p className="text-xs text-on-surface-variant">
                  {dateTime(event.createdAt)}
                </p>
                <p className="font-bold">{event.description}</p>
              </div>
            ))}
            {!detail.recentActivity.length ? (
              <p className="text-sm text-on-surface-variant">
                Todavía no hay actividad auditada.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
      <Card className="mt-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold">
              Ventas del operario
            </h2>
            <p className="text-sm text-on-surface-variant">
              Busca por cliente, número o tipo de comprobante.
            </p>
          </div>
          <input
            className="min-h-11 rounded-xl border border-outline-variant px-3 outline-none focus:border-primary"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ventas"
            value={query}
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleSales.map((sale) => (
            <article
              className="rounded-2xl border border-outline-variant p-4"
              key={sale.id}
            >
              <div className="flex justify-between gap-2">
                <b>{number(sale)}</b>
                <Badge tone={sale.status === "issued" ? "success" : "danger"}>
                  {sale.status}
                </Badge>
              </div>
              <p className="mt-2 truncate text-sm">{sale.customerName}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {dateTime(sale.issuedAt)} · {sale.documentType}
              </p>
              <p className="mt-3 text-xl font-bold text-primary">
                {formatCurrency(sale.total)}
              </p>
              <Button
                className="mt-3"
                onClick={() => printInvoice(sale)}
                type="button"
                variant="secondary"
              >
                Reimprimir / PDF
              </Button>
            </article>
          ))}
        </div>
      </Card>
    </DashboardShell>
  );
}
