export function downloadTextFile(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const escapeXml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const escapeHtml = (value) => escapeXml(value).replaceAll("'", '&#39;')

export function downloadSpreadsheet(filename, rows, sheetName = 'Datos') {
  const headers = rows.length ? Object.keys(rows[0]) : []
  const cell = value => `<Cell><Data ss:Type="${typeof value === 'number' ? 'Number' : 'String'}">${escapeXml(value)}</Data></Cell>`
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${escapeXml(sheetName).slice(0, 31)}"><Table><Row>${headers.map(cell).join('')}</Row>${rows.map(row => `<Row>${headers.map(header => cell(row[header])).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`
  downloadTextFile(filename.endsWith('.xls') ? filename : `${filename}.xls`, xml, 'application/vnd.ms-excel;charset=utf-8')
}

export function printTable(title, rows) {
  const headers = rows.length ? Object.keys(rows[0]) : []
  const body = `<h1>${escapeHtml(title)}</h1><table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${headers.map(header => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  printDocument(title, body)
}

export function printDocument(title, body) {
  const popup = window.open('', '_blank')
  if (!popup) return false
  popup.opener = null
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#202238;margin:32px}h1{font-size:24px;margin:0 0 20px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d8dbea;padding:8px;text-align:left}th{background:#f0f1fb}@media print{body{margin:12mm}}</style></head><body>${body}</body></html>`)
  popup.document.close()
  window.setTimeout(() => { popup.focus(); popup.print() }, 250)
  return true
}

export function toCsv(rows) {
  if (!rows.length) return ''

  const headers = Object.keys(rows[0])
  const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ].join('\n')
}

export function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/)
  if (!headerLine) return []

  const headers = headerLine.split(',').map((header) => header.trim().replace(/^"|"$/g, ''))

  return lines
    .filter(Boolean)
    .map((line) => {
      const cells = line.match(/("([^"]|"")*"|[^,]+)/g) || []
      return headers.reduce((row, header, index) => {
        row[header] = String(cells[index] || '').trim().replace(/^"|"$/g, '').replaceAll('""', '"')
        return row
      }, {})
    })
}
