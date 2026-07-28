import { downloadSpreadsheet, printDocument, printTable } from "./exportUtils";

const number = (invoice) =>
  `${invoice.series}-${String(invoice.number).padStart(8, "0")}`;
const money = (value) => `S/ ${Number(value || 0).toFixed(2)}`;
const safe = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const invoiceRows = (invoices) =>
  invoices.map((invoice) => ({
    Número: number(invoice),
    Tipo: invoice.documentType,
    Estado: invoice.status,
    Cliente: invoice.customerName,
    Documento: invoice.customerDocument || "",
    Fecha: new Date(invoice.issuedAt).toLocaleString("es-PE"),
    Pago: invoice.paymentMethod || "",
    Subtotal: Number(invoice.subtotal || 0),
    IGV: Number(invoice.tax || 0),
    Total: Number(invoice.total || 0),
  }));

export const exportInvoicesExcel = (invoices) =>
  downloadSpreadsheet(
    "wasita-comprobantes.xls",
    invoiceRows(invoices),
    "Comprobantes",
  );
export const printInvoices = (invoices) =>
  printTable("Comprobantes Wasita", invoiceRows(invoices));

const paymentLabel = (value) =>
  ({
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    yape: "Yape",
    plin: "Plin",
    mixed: "Pago mixto",
  })[value] || value || "No especificada";

export function printInvoice(invoice, business = {}) {
  const lines = invoice.lines
    .map(
      (line, index) =>
        `<tr><td>${safe(line.sku || line.productSku || line.productId?.slice(0, 10) || `ITEM-${index + 1}`)}</td><td>${safe(line.productName)}</td><td style="text-align:center">UND</td><td style="text-align:right">${line.quantity}</td><td style="text-align:right">${money(line.unitPrice)}</td><td style="text-align:right">${money(line.total)}</td></tr>`,
    )
    .join("");
  const issuer =
    business.legalName || business.name || "Negocio afiliado a Wasita";
  const commercial =
    business.legalName && business.name !== business.legalName
      ? `<p style="margin:2px 0">${safe(business.name)}</p>`
      : "";
  const body = `<main style="max-width:850px;margin:auto;border:1px solid #d8dbea;border-radius:16px;overflow:hidden"><header style="display:flex;justify-content:space-between;gap:24px;padding:22px;background:#f4f5fc;border-bottom:1px solid #d8dbea"><div><p style="margin:0;text-transform:uppercase;font-size:11px;font-weight:bold;color:#5756f6">Comprobante de venta</p><h1 style="margin:7px 0 2px">${safe(issuer)}</h1>${commercial}<p style="margin:2px 0">RUC: ${safe(business.taxDocument || "Pendiente de configurar")}</p><p style="margin:2px 0">${safe(business.address || "")}</p><p style="margin:2px 0">${safe([business.phone, business.email].filter(Boolean).join(" · "))}</p></div><div style="text-align:right"><p style="margin:0;text-transform:uppercase;font-size:11px;font-weight:bold">${safe(invoice.documentType === "factura" ? "Factura" : "Boleta de venta")}</p><h2 style="margin:8px 0;color:#5756f6">${number(invoice)}</h2><p style="display:inline-block;margin:0;padding:5px 8px;border-radius:999px;background:#fff3cd;color:#7a5200;font-size:11px;font-weight:bold">NO ENVIADO A SUNAT</p></div></header><section style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin:20px;padding:14px;background:#f8f8fc;border-radius:12px"><p style="margin:0"><b>Fecha:</b> ${new Date(invoice.issuedAt).toLocaleString("es-PE")}</p><p style="margin:0"><b>Cliente:</b> ${safe(invoice.customerName || "Cliente general")}</p><p style="margin:0"><b>DNI / RUC:</b> ${safe(invoice.customerDocument || "Sin documento")}</p><p style="margin:0"><b>Pago:</b> ${safe(paymentLabel(invoice.paymentMethod))}</p><p style="grid-column:1/-1;margin:0"><b>Dirección:</b> ${safe(invoice.customerAddress || "Sin dirección registrada")}</p></section><section style="padding:0 20px"><table><thead><tr><th>Código</th><th>Descripción</th><th>U.M.</th><th style="text-align:right">Cant.</th><th style="text-align:right">P.U.</th><th style="text-align:right">Importe</th></tr></thead><tbody>${lines}</tbody></table><div style="margin:20px 0 0 auto;max-width:320px;padding:14px;border:1px solid #d8dbea;border-radius:12px"><p style="margin:5px 0">Op. gravada / subtotal: <b style="float:right">${money(invoice.subtotal)}</b></p><p style="margin:5px 0">IGV: <b style="float:right">${money(invoice.tax)}</b></p><p style="font-size:20px;border-top:1px solid #ccc;padding-top:10px;margin:10px 0 0">Total: <b style="float:right;color:#5756f6">${money(invoice.total)}</b></p></div></section><footer style="margin:20px;padding:14px;background:#f4f5fc;border-radius:12px;font-size:11px;color:#555"><b>Verificación interna Wasita</b><br>ID: ${safe(invoice.id)}. Este documento registra la operación dentro de Wasita y no reemplaza la constancia CDR de SUNAT.${invoice.issuedBy?.name ? `<br>Emitido por: ${safe(invoice.issuedBy.name)}` : ""}</footer></main>`;
  return printDocument(`${invoice.documentType} ${number(invoice)}`, body);
}
