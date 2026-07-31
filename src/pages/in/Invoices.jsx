import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Input from "../../components/atoms/Input";
import Select from "../../components/atoms/Select";
import ConfirmDialog from "../../components/molecules/ConfirmDialog";
import EmptyState from "../../components/molecules/EmptyState";
import Modal from "../../components/molecules/Modal";
import DashboardShell from "../../components/organisms/DashboardShell";
import InvoiceReceiptPreview from "../../components/invoices/InvoiceReceiptPreview";
import { useAuth } from "../../context/authStore";
import { useAppConfig } from "../../context/appConfigStore";
import { formatCurrency } from "../../data/dashboard";
import { useInventory } from "../../hooks/useInventory";
import { useToast } from "../../hooks/useToast";
import * as invoiceService from "../../services/invoiceService";
import { getMyBusiness } from "../../services/businessService";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import { matchesEntitySearch } from "../../utils/entitySearch";
import {
  exportInvoicesExcel,
  printInvoice,
  printInvoices,
} from "../../utils/invoiceExport";

function documentNumber(invoice) {
  return `${invoice.series}-${String(invoice.number).padStart(8, "0")}`;
}

const domainMeta = {
  commerce: { icon: "storefront", label: "Venta de productos" },
  dental: { icon: "dentistry", label: "Atención dental" },
  veterinary: { icon: "pets", label: "Atención veterinaria" },
  hospitality: { icon: "hotel", label: "Estadía hotelera" },
  health: { icon: "medical_services", label: "Atención médica" },
};

function invoiceContext(invoice) {
  return invoice.context || invoice.contexts?.[0] || null;
}

function invoiceDomain(invoice) {
  return (
    invoiceContext(invoice)?.domain ||
    (invoice.lines?.some((line) => line.productId) ? "commerce" : "")
  );
}

const digitsOnly = (event) => {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
};
const hasPermission = (user, required) =>
  (user?.permissions || []).some(
    (permission) =>
      permission === required ||
      (permission.endsWith(".*") &&
        required.startsWith(permission.slice(0, -1))),
  );

function SaleForm({ onClose, onIssued, products }) {
  const [documentType, setDocumentType] = useState("boleta");
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = useMemo(
    () => products.filter((product) => Number(quantities[product.id]) > 0),
    [products, quantities],
  );
  const total = selected.reduce(
    (sum, product) =>
      sum + Number(product.price) * Number(quantities[product.id]),
    0,
  );
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const invoice = await invoiceService.issueInvoice({
        documentType,
        customerName: form.get("customerName"),
        customerDocument: form.get("customerDocument"),
        customerAddress: form.get("customerAddress"),
        notes: form.get("notes"),
        lines: selected.map((product) => ({
          productId: product.id,
          quantity: Number(quantities[product.id]),
        })),
      });
      onIssued(invoice);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal onClose={onClose} title="Registrar venta">
      <form
        className="grid max-h-[82vh] gap-5 overflow-y-auto p-5"
        onSubmit={submit}
      >
        {error ? (
          <div className="rounded-xl bg-error-container p-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Comprobante"
            onChange={(event) => setDocumentType(event.target.value)}
            value={documentType}
          >
            <option value="boleta">Boleta</option>
            <option value="factura">Factura</option>
          </Select>
          <Input
            inputMode="numeric"
            label={
              documentType === "factura"
                ? "RUC (11 dígitos)"
                : "DNI (opcional, 8 dígitos)"
            }
            maxLength={documentType === "factura" ? 11 : 8}
            minLength={documentType === "factura" ? 11 : undefined}
            name="customerDocument"
            onInput={digitsOnly}
            pattern={documentType === "factura" ? "[0-9]{11}" : "[0-9]{8}"}
            required={documentType === "factura"}
          />
          <Input label="Cliente" maxLength="180" name="customerName" required />
          <Input
            label="Dirección"
            maxLength="240"
            name="customerAddress"
            required={documentType === "factura"}
          />
        </div>
        <section>
          <h3 className="font-bold text-on-surface">Productos vendidos</h3>
          <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto">
            {products
              .filter(
                (product) => product.status === "Activo" && product.stock > 0,
              )
              .map((product) => (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_90px] items-center gap-3 rounded-xl border border-outline-variant p-3"
                  key={product.id}
                >
                  <div>
                    <p className="truncate text-sm font-bold">{product.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {product.sku} · Stock {product.stock} ·{" "}
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <Input
                    aria-label={`Cantidad de ${product.name}`}
                    max={product.stock}
                    min="0"
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [product.id]: event.target.value,
                      }))
                    }
                    type="number"
                    value={quantities[product.id] || ""}
                  />
                </div>
              ))}
          </div>
        </section>
        <Input label="Observaciones" maxLength="500" name="notes" />
        <div className="flex flex-col gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-on-surface-variant">
              Total
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(total)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={saving || !selected.length} type="submit">
              {saving ? "Emitiendo..." : "Emitir comprobante"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function InvoiceDetail({ business, invoice, onClose }) {
  const context = invoiceContext(invoice);
  const domain = invoiceDomain(invoice);
  const meta = domainMeta[domain];
  return (
    <Modal
      dialogClassName="max-w-[58rem]"
      onClose={onClose}
      title={`${invoice.documentType === "factura" ? "Factura" : "Boleta"} ${documentNumber(invoice)}`}
    >
      <div className="grid gap-4 p-3 sm:p-5">
        {meta ? (
          <div className="flex items-center gap-3 rounded-xl bg-primary-fixed p-3 text-primary">
            <span className="material-symbols-outlined">{meta.icon}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide">
                Origen del comprobante
              </p>
              <b>{meta.label}</b>
              {context?.sourceType ? (
                <p className="text-xs text-on-surface-variant">
                  Referencia: {context.sourceType.replaceAll("_", " ")}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <InvoiceReceiptPreview business={business} invoice={invoice} />
        <div className="flex justify-end">
          <Button
            icon="print"
            onClick={() => printInvoice(invoice, business)}
            type="button"
            variant="secondary"
          >
            Vista previa / PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Invoices() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const inventory = useInventory();
  const { config } = useAppConfig();
  const dashboardKey = config?.template?.dashboardKey || "commerce";
  const serviceMode = [
    "dental",
    "veterinary",
    "hospitality",
    "health",
  ].includes(dashboardKey);
  const [invoices, setInvoices] = useState([]);
  const [business, setBusiness] = useState(config?.business || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState(null);
  const [voiding, setVoiding] = useState(null);
  const [query, setQuery] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setInvoices(
        await invoiceService.getInvoices(
          serviceMode ? { domain: dashboardKey } : undefined,
        ),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [dashboardKey, serviceMode]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);
  useEffect(() => {
    let active = true;
    getMyBusiness()
      .then((value) => {
        if (active) setBusiness(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useLiveRefresh(load, ["/invoices"]);
  const issued = async (invoice) => {
    setCreating(false);
    await load();
    showToast({
      message: documentNumber(invoice),
      title: "Venta registrada",
      tone: "success",
    });
  };
  const cancelInvoice = async () => {
    try {
      await invoiceService.voidInvoice(voiding.id);
      setVoiding(null);
      await load();
      showToast({ title: "Comprobante anulado", tone: "warning" });
    } catch (requestError) {
      showToast({
        message: requestError.message,
        title: "No se pudo anular",
        tone: "error",
      });
    }
  };
  const visibleInvoices = useMemo(
    () =>
      invoices.filter((invoice) =>
        matchesEntitySearch(invoice, query, (item) => [
          item.customerName,
          item.customerDocument,
          documentNumber(item),
          item.issuedBy?.name,
        ]),
      ),
    [invoices, query],
  );
  const subtitle =
    dashboardKey === "veterinary"
      ? "Boletas y facturas de consultas, vacunas, servicios y productos veterinarios."
      : dashboardKey === "dental"
        ? "Boletas y facturas conectadas a tratamientos, atenciones y productos dentales."
        : dashboardKey === "hospitality"
          ? "Comprobantes conectados a estadías, consumos, servicios y productos."
          : dashboardKey === "health"
            ? "Comprobantes conectados a consultas, procedimientos y productos."
            : "Emite boletas y facturas a partir del inventario real.";
  return (
    <DashboardShell
      action={
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!invoices.length}
            icon="table_view"
            onClick={() => exportInvoicesExcel(invoices)}
            type="button"
            variant="secondary"
          >
            Excel
          </Button>
          <Button
            disabled={!invoices.length}
            icon="picture_as_pdf"
            onClick={() => printInvoices(invoices)}
            type="button"
            variant="secondary"
          >
            PDF
          </Button>
          <Button
            icon="add_shopping_cart"
            onClick={() => setCreating(true)}
            type="button"
          >
            {serviceMode ? "Venta de producto" : "Registrar venta"}
          </Button>
        </div>
      }
      subtitle={subtitle}
      title="Comprobantes"
    >
      {loading ? <Card className="p-6">Cargando comprobantes...</Card> : null}
      {!loading && error ? (
        <EmptyState
          action={{ children: "Reintentar", onClick: load }}
          description={error}
          icon="cloud_off"
          title="No se pudieron cargar los comprobantes"
        />
      ) : null}
      {!loading && !error && !invoices.length ? (
        <EmptyState
          action={{
            children: serviceMode
              ? "Registrar venta de producto"
              : "Registrar primera venta",
            onClick: () => setCreating(true),
          }}
          description="Los comprobantes emitidos desde caja o desde una atención aparecerán aquí."
          icon="receipt_long"
          title="Sin comprobantes"
        />
      ) : null}
      {!loading && !error && invoices.length ? (
        <div className="mb-4 rounded-2xl border border-outline-variant bg-white p-3">
          <label className="relative block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              aria-label="Buscar comprobante o cliente"
              className="min-h-11 w-full rounded-xl border border-outline-variant pl-11 pr-3"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, DNI, RUC o comprobante"
              type="search"
              value={query}
            />
          </label>
        </div>
      ) : null}
      {!loading && !error ? (
        <div className="grid gap-3">
          {visibleInvoices.map((invoice) => {
            const domain = invoiceDomain(invoice);
            const meta = domainMeta[domain];
            return (
              <Card
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                key={invoice.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{documentNumber(invoice)}</p>
                    <Badge
                      tone={
                        invoice.documentType === "factura" ? "info" : "neutral"
                      }
                    >
                      {invoice.documentType}
                    </Badge>
                    <Badge
                      tone={invoice.status === "issued" ? "success" : "danger"}
                    >
                      {invoice.status === "issued" ? "Emitido" : "Anulado"}
                    </Badge>
                    {meta ? <Badge tone="info">{meta.label}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {invoice.customerName} ·{" "}
                    {new Date(invoice.issuedAt).toLocaleString("es-PE")} ·{" "}
                    {invoice.issuedBy.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <b className="mr-2 text-lg text-primary">
                    {formatCurrency(invoice.total)}
                  </b>
                  <Button
                    onClick={() => setDetail(invoice)}
                    type="button"
                    variant="secondary"
                  >
                    Ver
                  </Button>
                  {hasPermission(user, "sales.cancel") &&
                  invoice.status === "issued" ? (
                    <Button
                      onClick={() => setVoiding(invoice)}
                      type="button"
                      variant="danger"
                    >
                      Anular
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
          {invoices.length && !visibleInvoices.length ? (
            <EmptyState
              description="Prueba con el nombre, DNI, RUC o número de comprobante."
              icon="person_search"
              title="No se encontraron clientes"
            />
          ) : null}
        </div>
      ) : null}
      {creating ? (
        <SaleForm
          onClose={() => setCreating(false)}
          onIssued={issued}
          products={inventory.products}
        />
      ) : null}
      {detail ? (
        <InvoiceDetail
          business={business}
          invoice={detail}
          onClose={() => setDetail(null)}
        />
      ) : null}
      <ConfirmDialog
        description={
          invoiceContext(voiding || {})
            ? "Los comprobantes de servicios sólo pueden anularse si el backend valida la reversión del pago relacionado."
            : `Se repondrá el stock de ${voiding?.lines.length || 0} producto(s).`
        }
        onCancel={() => setVoiding(null)}
        onConfirm={cancelInvoice}
        open={Boolean(voiding)}
        title="Anular comprobante"
      />
    </DashboardShell>
  );
}
