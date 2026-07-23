import { useCallback, useEffect, useState } from 'react'
import { getOperatorProducts } from '../services/operatorService'
import { useLiveRefresh } from './useLiveRefresh'

export function useOperatorProducts() {
  const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const load = useCallback(async () => { setLoading(true); setError(''); try { setProducts(await getOperatorProducts()) } catch (e) { setError(e.message) } finally { setLoading(false) } }, [])
  useEffect(() => { queueMicrotask(load) }, [load])
  useLiveRefresh(load, ['/operator/sales', '/products', '/hospitality/charges', '/hospitality/work-orders'])
  return { products, loading, error, retry: load }
}
