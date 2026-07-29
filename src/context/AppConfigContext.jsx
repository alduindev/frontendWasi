import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAppBootstrap } from '../services/bootstrapService'
import { useAuth } from './authStore'
import { AppConfigContext } from './appConfigStore'
import { useLiveRefresh } from '../hooks/useLiveRefresh'

export function AppConfigProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [config, setConfig] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true)
    try { const value = await getAppBootstrap(); setConfig(value); setError(''); return value }
    catch (requestError) { if (!silent) setError(requestError.message); throw requestError }
    finally { if (!silent) setIsLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    if (!isAuthenticated || user?.role === 'super_admin' || user?.mustChangePassword) { queueMicrotask(() => { if (active) { setConfig(null); setIsLoading(false) } }); return () => { active = false } }
    queueMicrotask(() => { if (active) refresh().catch(() => {}) })
    return () => { active = false }
  }, [isAuthenticated, refresh, user?.id, user?.mustChangePassword, user?.role])

  useEffect(() => {
    if (!isAuthenticated || user?.role === 'super_admin' || user?.mustChangePassword) return undefined
    const sync = () => { if (document.visibilityState === 'visible') refresh({ silent: true }).catch(() => {}) }
    const id = setInterval(sync, 3000); document.addEventListener('visibilitychange', sync)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', sync) }
  }, [isAuthenticated, refresh, user?.mustChangePassword, user?.role])
  useLiveRefresh(() => { if (isAuthenticated && user?.role !== 'super_admin' && !user?.mustChangePassword) refresh({ silent: true }).catch(() => {}) }, ['/users', '/business', '/platform'])

  const value = useMemo(() => ({ config, error, isLoading, hasModule: code => Boolean(config?.capabilities?.includes(code)), refresh }), [config, error, isLoading, refresh])
  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>
}
