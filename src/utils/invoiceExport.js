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

export function printInvoice(invoice) {
  const lines = invoice.lines
    .map(
      (line) =>
        `<tr><td>${safe(line.productName)}</td><td>${line.quantity}</td><td>${money(line.unitPrice)}</td><td>${money(line.total)}</td></tr>`,
    )
    .join("");
  const body = `<header><p style="text-transform:uppercase;font-size:11px;font-weight:bold">Wasita · Comprobante interno</p><h1>${safe(invoice.documentType === "factura" ? "Factura" : "Boleta")} ${number(invoice)}</h1><p>${new Date(invoice.issuedAt).toLocaleString("es-PE")}</p></header><section style="margin:20px 0;padding:14px;background:#f4f5fc;border-radius:12px"><b>Cliente:</b> ${safe(invoice.customerName)}<br><b>Documento:</b> ${safe(invoice.customerDocument || "Sin documento")}<br><b>Dirección:</b> ${safe(invoice.customerAddress || "Sin dirección")}<br><b>Pago:</b> ${safe(invoice.paymentMethod || "")}</section><table><thead><tr><th>Detalle</th><th>Cant.</th><th>P. unitario</th><th>Total</th></tr></thead><tbody>${lines}</tbody></table><div style="margin:20px 0 0 auto;max-width:280px"><p>Subtotal: <b style="float:right">${money(invoice.subtotal)}</b></p><p>IGV: <b style="float:right">${money(invoice.tax)}</b></p><p style="font-size:20px;border-top:1px solid #ccc;padding-top:10px">Total: <b style="float:right">${money(invoice.total)}</b></p></div>`;
  return printDocument(`${invoice.documentType} ${number(invoice)}`, body);
}
