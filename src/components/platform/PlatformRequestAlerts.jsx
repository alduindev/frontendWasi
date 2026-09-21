import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authStore'
import { PlatformRequestsContext } from '../../context/platformRequestsStore'
import { getPlatformSubscriptionRequests } from '../../services/platformService'

function RequestAlerts({ children }) {
  const { pathname } = useLocation()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const refreshRef = useRef(() => Promise.resolve())
  useEffect(() => {
    let active = true
    let inFlight = null
    const refresh = () => {
      if (inFlight) return inFlight
      inFlight = getPlatformSubscriptionRequests().then((result) => {
        if (active) { setData(result); setError('') }
      }).catch(() => {
        if (active) setError('No se pudieron actualizar las solicitudes.')
      }).finally(() => { inFlight = null })
      return inFlight
    }
    refreshRef.current = refresh
    void refresh()
    const timer = window.setInterval(refresh, 30_000)
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', refresh)
    }
  }, [])
  const refresh = () => refreshRef.current()
  const count = data?.pendingCount ?? 0
  return <PlatformRequestsContext.Provider value={{ items: data?.items || [], count, loading: !data && !error, error, refresh }}>
    <aside className={`sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm sm:px-7 ${pathname === '/platform' ? 'lg:ml-64' : ''} ${count ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-outline-variant bg-white text-on-surface'}`} aria-label="Avisos de suscripciones">
      <div aria-live="polite" role="status">
        <b>{count ? `${count} ${count === 1 ? 'solicitud de reactivación pendiente' : 'solicitudes de reactivación pendientes'}` : 'Solicitudes de suscripción'}</b>
        {count ? <p className="mt-1">Hay empresas esperando tu revisión para recuperar el acceso.</p> : null}
        {error ? <p className="mt-1 text-error">{error} <button className="underline" onClick={refresh} type="button">Reintentar</button></p> : null}
      </div>
      <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-current px-4 font-bold" to="/platform/billing?tab=requests">
        <span aria-hidden="true" className="material-symbols-outlined">notifications_active</span>
        Ver solicitudes{data ? ` (${count})` : ''}
      </Link>
    </aside>
    {children}
  </PlatformRequestsContext.Provider>
}

export default function PlatformRequestAlerts({ children }) {
  const { user } = useAuth()
  return user?.role === 'super_admin' ? <RequestAlerts key={user.id}>{children}</RequestAlerts> : children
}
