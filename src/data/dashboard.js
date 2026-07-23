import { getSettings } from '../services/settingsService'
import { getProfit, getStockStatus, isExpiringSoon } from '../utils/productUtils'

export const navItems = [
  { icon: 'inventory_2', label: 'Inventario', to: '/dashboard' },
  { icon: 'notifications', label: 'Alertas', to: '/dashboard/alerts' },
  { icon: 'history', label: 'Historial', to: '/dashboard/history' },
  { icon: 'person', label: 'Perfil', to: '/dashboard/profile' },
  { icon: 'settings', label: 'Configuracion', to: '/dashboard/settings' },
]

export const productCategories = ['Alimentos', 'Bebidas', 'Snacks', 'Minibar', 'Amenities', 'Suministros hotel', 'Hogar', 'Limpieza', 'Textil']
export const productStatuses = ['Activo', 'Inactivo', 'Descontinuado']
export const productUnits = ['unidad', 'kg', 'g', 'litro', 'ml', 'caja', 'paquete']


export function formatCurrency(value, currency = getSettings().currency) {
  return new Intl.NumberFormat('es-PE', {
    currency,
    style: 'currency',
  }).format(Number(value || 0))
}

function translate(t, key, fallback, variables) {
  return typeof t === 'function' ? t(key, variables) : fallback
}

function comparisonNote(value, t) {
  if (value === null || value === undefined) return translate(t, 'dashboard.metrics.noComparison', 'Sin comparacion disponible')
  const number = Number(value)
  return `${number > 0 ? '+' : ''}${number.toFixed(1)}% vs mes anterior`
}

export function getInventoryStats(products, t, comparison = null) {
  const totalProducts = products.length
  const lowStock = products.filter((product) => getStockStatus(product) === 'low').length
  const outOfStock = products.filter((product) => getStockStatus(product) === 'out').length
  const totalValue = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0)
  const totalCost = products.reduce((sum, product) => sum + Number(product.cost || 0) * Number(product.stock || 0), 0)
  const potentialProfit = Math.max(0, totalValue - totalCost)
  const topCategory = getTopCategory(products)
  const mostExpensive = products.toSorted((a, b) => Number(b.price) - Number(a.price))[0]
  const bestSeller = products.toSorted((a, b) => Number(b.sold || 0) - Number(a.sold || 0))[0]

  return [
    {
      icon: 'inventory_2',
      label: translate(t, 'dashboard.metrics.totalProducts', 'Productos totales'),
      note: comparisonNote(comparison?.productsChangePercent, t),
      value: totalProducts,
    },
    {
      icon: 'payments',
      label: translate(t, 'dashboard.metrics.inventoryValue', 'Valor inventario'),
      note: comparisonNote(comparison?.valueChangePercent, t),
      value: formatCurrency(totalValue),
    },
    {
      icon: 'account_balance_wallet',
      label: 'Costo del inventario',
      note: 'Capital actualmente invertido',
      value: formatCurrency(totalCost),
    },
    {
      icon: 'trending_up',
      label: 'Ganancia potencial',
      note: totalValue ? `${((potentialProfit / totalValue) * 100).toFixed(1)}% de margen sobre ventas` : 'Sin productos valorizados',
      value: formatCurrency(potentialProfit),
    },
    {
      icon: 'warning',
      label: translate(t, 'dashboard.metrics.lowStock', 'Stock bajo'),
      note: lowStock ? translate(t, 'dashboard.metrics.needsAction', 'Requiere accion') : translate(t, 'dashboard.metrics.noAlerts', 'Sin alertas'),
      value: lowStock,
    },
    {
      icon: 'remove_shopping_cart',
      label: translate(t, 'dashboard.metrics.outOfStock', 'Agotados'),
      note: outOfStock ? translate(t, 'dashboard.metrics.reviewRestock', 'Revisar reposicion') : translate(t, 'dashboard.metrics.available', 'Todo disponible'),
      value: outOfStock,
    },
    {
      icon: 'category',
      label: translate(t, 'dashboard.metrics.topCategory', 'Categoria lider'),
      note: translate(t, 'plurals.products', `${topCategory?.count || 0} productos`, { count: topCategory?.count || 0 }),
      value: topCategory?.category || translate(t, 'common.noData', 'Sin datos'),
    },
    {
      icon: 'diamond',
      label: translate(t, 'dashboard.metrics.mostExpensive', 'Mas caro'),
      note: mostExpensive ? formatCurrency(mostExpensive.price) : '',
      value: mostExpensive?.name || translate(t, 'common.noData', 'Sin datos'),
    },
    {
      icon: 'local_fire_department',
      label: translate(t, 'dashboard.metrics.bestSeller', 'Mas vendido'),
      note: translate(t, 'dashboard.metrics.sales', `${bestSeller?.sold || 0} ventas`, { count: bestSeller?.sold || 0 }),
      value: bestSeller?.name || translate(t, 'common.noData', 'Sin datos'),
    },
    {
      icon: 'trending_up',
      label: translate(t, 'dashboard.metrics.monthlyVariation', 'Variacion mensual'),
      note: translate(t, 'dashboard.metrics.monthlyIndicator', 'Indicador mensual'),
      value: comparisonNote(comparison?.valueChangePercent, t).replace(' vs mes anterior', ''),
    },
  ]
}

export function getTopCategory(products) {
  const counts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .toSorted((a, b) => b.count - a.count)[0]
}

export function getCategoryAnalytics(products) {
  const categoryMap = products.reduce((acc, product) => {
    const current = acc[product.category] || { category: product.category, products: 0, revenue: 0, stock: 0, value: 0 }
    current.products += 1
    current.stock += Number(product.stock || 0)
    current.value += Number(product.stock || 0) * Number(product.price || 0)
    current.revenue += Number(product.sold || 0) * Number(product.price || 0)
    acc[product.category] = current
    return acc
  }, {})

  return Object.values(categoryMap)
}

export function getInventoryAlerts(products, t) {
  const duplicateSkus = products
    .map((product) => product.sku)
    .filter((sku, index, skus) => sku && skus.indexOf(sku) !== index)

  return [
    ...products.filter((product) => getStockStatus(product) === 'low').map((product) => ({
      id: `low-${product.id}`,
      message: translate(t, 'alerts.stockLowMessage', `${product.name} esta por debajo del minimo.`, { name: product.name }),
      productId: product.id,
      severity: 'warning',
      title: translate(t, 'alerts.stockLow', 'Stock bajo'),
    })),
    ...products.filter((product) => getStockStatus(product) === 'out').map((product) => ({
      id: `out-${product.id}`,
      message: translate(t, 'alerts.outOfStockMessage', `${product.name} no tiene unidades disponibles.`, { name: product.name }),
      productId: product.id,
      severity: 'error',
      title: translate(t, 'alerts.outOfStock', 'Producto agotado'),
    })),
    ...products.filter((product) => isExpiringSoon(product)).map((product) => ({
      id: `exp-${product.id}`,
      message: translate(t, 'alerts.expiringSoonMessage', `${product.name} vence pronto.`, { name: product.name }),
      productId: product.id,
      severity: 'warning',
      title: translate(t, 'alerts.expiringSoon', 'Proximo a vencer'),
    })),
    ...products.filter((product) => !product.image).map((product) => ({
      id: `img-${product.id}`,
      message: translate(t, 'alerts.missingImageMessage', `${product.name} aun no tiene imagen.`, { name: product.name }),
      productId: product.id,
      severity: 'info',
      title: translate(t, 'alerts.missingImage', 'Sin imagen'),
    })),
    ...products.filter((product) => duplicateSkus.includes(product.sku)).map((product) => ({
      id: `dup-${product.id}`,
      message: translate(t, 'alerts.duplicateSkuMessage', `${product.sku} esta repetido en el inventario.`, { sku: product.sku }),
      productId: product.id,
      severity: 'error',
      title: translate(t, 'alerts.duplicateSku', 'SKU duplicado'),
    })),
  ]
}

export function getProductProfit(product) {
  return getProfit(product)
}
