import { apiRequest } from '../api/httpClient'
import { downloadSpreadsheet, downloadTextFile, parseCsv, printTable, toCsv } from '../utils/exportUtils'

function toApiProduct(product) {
  const data = { ...product, imageUrl: product.image || product.imageUrl || '' }
  delete data.id
  delete data.createdAt
  delete data.updatedAt
  delete data.image
  delete data.imageName
  delete data.imageSize
  return data
}

function fromApiProduct(product) {
  return { ...product, image: product.imageUrl || '', imageName: '', imageSize: '160 x 160' }
}

export async function getProducts(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return (await apiRequest(`/products${query}`)).map(fromApiProduct)
}

export async function createProduct(product) {
  return fromApiProduct(await apiRequest('/products', { method: 'POST', body: JSON.stringify(toApiProduct(product)) }))
}

export async function updateProduct(product) {
  return fromApiProduct(await apiRequest(`/products/${product.id}`, { method: 'PATCH', body: JSON.stringify(toApiProduct(product)) }))
}

export async function deleteProduct(id) {
  await apiRequest(`/products/${id}`, { method: 'DELETE' })
}

export function exportProducts(products, format = 'json') {
  if (format === 'excel') {
    downloadSpreadsheet('wasita-productos.xls', products, 'Productos')
    return
  }
  if (format === 'pdf') {
    printTable('Inventario de productos', products.map(product => ({ SKU: product.sku, Producto: product.name, Categoría: product.category, Estado: product.status, Stock: product.stock, Precio: Number(product.price), Costo: Number(product.cost) })))
    return
  }
  if (format === 'csv') {
    downloadTextFile('wasita-productos.csv', toCsv(products), 'text/csv;charset=utf-8')
    return
  }
  downloadTextFile('wasita-productos.json', JSON.stringify(products, null, 2), 'application/json')
}

export async function parseProductFile(file) {
  try {
    const text = await file.text()
    const imported = file.name.toLowerCase().endsWith('.csv') ? parseCsv(text) : JSON.parse(text)
    if (!Array.isArray(imported) || !imported.length) return { ok: false, message: 'El archivo no contiene productos validos.' }
    return { ok: true, products: imported }
  } catch {
    return { ok: false, message: 'No se pudo importar el archivo. Revisa el formato.' }
  }
}
