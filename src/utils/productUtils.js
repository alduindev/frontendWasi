export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
}

export function getStockStatus(product) {
  if (Number(product.stock) <= 0) return 'out'
  if (Number(product.stock) <= Number(product.minStock || 0)) return 'low'
  if (Number(product.stock) <= Number(product.minStock || 0) * 2) return 'medium'
  return 'ok'
}

export function getProfit(product) {
  return Number(product.price || 0) - Number(product.cost || 0)
}

export function isExpiringSoon(product, days = 30) {
  if (!product.expirationDate) return false

  const today = new Date()
  const expiration = new Date(product.expirationDate)
  const diff = expiration.getTime() - today.getTime()

  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000
}

export function createProductId() {
  return `prod-${crypto.randomUUID()}`
}

export function createDefaultProduct(overrides = {}) {
  const now = new Date().toISOString()

  return {
    id: createProductId(),
    name: '',
    sku: '',
    barcode: '',
    category: 'Alimentos',
    brand: '',
    supplier: '',
    description: '',
    cost: 0,
    price: 0,
    tax: 18,
    stock: 0,
    minStock: 0,
    weight: '',
    unit: 'unidad',
    purchaseDate: '',
    expirationDate: '',
    location: '',
    color: '',
    model: '',
    notes: '',
    status: 'Activo',
    image: '',
    imageName: '',
    imageSize: '160 x 160',
    sold: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function hydrateProduct(product) {
  return createDefaultProduct({
    ...product,
    id: product.id || createProductId(),
    updatedAt: product.updatedAt || product.createdAt || new Date().toISOString(),
  })
}

export function productMatchesQuery(product, query) {
  const target = [
    product.name,
    product.sku,
    product.brand,
    product.supplier,
    product.description,
    product.category,
    product.barcode,
    product.location,
    product.model,
  ]
    .map(normalizeText)
    .join(' ')

  return target.includes(normalizeText(query))
}
