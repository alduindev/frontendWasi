import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/authStore'
import { getOperatorProducts } from '../services/operatorService'
import * as inventoryApi from '../services/inventoryService'
import { getProfit, getStockStatus, productMatchesQuery } from '../utils/productUtils'
import { useLiveRefresh } from './useLiveRefresh'

const inventoryResources = ['/products', '/operator/sales', '/hospitality/charges', '/hospitality/room-service', '/hospitality/work-orders']

export function useInventory() {
  const { user } = useAuth()
  const operatorView = user?.role === 'operator'
  const [products, setProducts] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setProducts(operatorView ? await getOperatorProducts() : await inventoryApi.getProducts())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [operatorView])

  useEffect(() => {
    queueMicrotask(refresh)
  }, [refresh])
  useLiveRefresh(refresh, inventoryResources)

  const mutate = useCallback(async (operation) => {
    setError('')
    try {
      const result = await operation()
      return result
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }, [])

  const addProduct = useCallback((product) => mutate(() => inventoryApi.createProduct(product)), [mutate])
  const editProduct = useCallback((product) => mutate(() => inventoryApi.updateProduct(product)), [mutate])
  const removeProducts = useCallback(async (ids) => mutate(async () => {
    for (const id of ids) await inventoryApi.deleteProduct(id)
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)))
  }), [mutate])
  const duplicateByIds = useCallback(async (ids) => mutate(async () => {
    for (const product of products.filter((item) => ids.includes(item.id))) {
      await inventoryApi.createProduct({ ...product, name: `${product.name} copia`, sku: `${product.sku}-COPY-${Date.now().toString().slice(-5)}` })
    }
  }), [mutate, products])
  const duplicateSelected = useCallback(async () => {
    await duplicateByIds(selectedIds)
    setSelectedIds([])
  }, [duplicateByIds, selectedIds])
  const bulkUpdateSelected = useCallback(async (patch) => mutate(async () => {
    for (const product of products.filter((item) => selectedIds.includes(item.id))) await inventoryApi.updateProduct({ ...product, ...patch })
    setSelectedIds([])
  }), [mutate, products, selectedIds])
  const importFile = useCallback(async (file) => {
    const parsed = await inventoryApi.parseProductFile(file)
    if (!parsed.ok) return parsed
    try {
      await mutate(async () => {
        for (const product of parsed.products) await inventoryApi.createProduct(product)
      })
      return { ok: true, message: `${parsed.products.length} producto(s) importados.` }
    } catch (requestError) {
      return { ok: false, message: requestError.message }
    }
  }, [mutate])
  const exportAll = useCallback((format) => inventoryApi.exportProducts(products, format), [products])
  const exportSelected = useCallback((format) => inventoryApi.exportProducts(products.filter((p) => selectedIds.includes(p.id)), format), [products, selectedIds])
  const toggleSelected = useCallback((id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]), [])
  const selectAll = useCallback((ids) => setSelectedIds((current) => current.length === ids.length ? [] : ids), [])
  const filterProducts = useCallback((options) => {
    const { category='all', hasImage='all', maxPrice='', maxStock='', minPrice='', minStock='', query='', sortBy='name', sortDirection='asc', status='all', stockStatus='all' } = options
    return products.filter((product) => (!query || productMatchesQuery(product, query)) && (category === 'all' || product.category === category) && (status === 'all' || product.status === status) && (stockStatus === 'all' || getStockStatus(product) === stockStatus) && (hasImage === 'all' || (hasImage === 'yes' ? Boolean(product.image) : !product.image)) && (minPrice === '' || Number(product.price) >= Number(minPrice)) && (maxPrice === '' || Number(product.price) <= Number(maxPrice)) && (minStock === '' || Number(product.stock) >= Number(minStock)) && (maxStock === '' || Number(product.stock) <= Number(maxStock))).toSorted((a,b) => {
      const left = sortBy === 'profit' ? getProfit(a) : a[sortBy]; const right = sortBy === 'profit' ? getProfit(b) : b[sortBy]; const direction = sortDirection === 'asc' ? 1 : -1
      return (typeof left === 'number' || typeof right === 'number') ? (Number(left || 0) - Number(right || 0)) * direction : String(left || '').localeCompare(String(right || '')) * direction
    })
  }, [products])
  const selectedProducts = useMemo(() => products.filter((p) => selectedIds.includes(p.id)), [products, selectedIds])
  return { addProduct, bulkUpdateSelected, duplicateSelected, duplicateByIds, editProduct, error, exportAll, exportSelected, filterProducts, importFile, isLoading, products, refresh, removeProducts, selectAll, selectedIds, selectedProducts, toggleSelected }
}
