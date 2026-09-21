import { useEffect, useRef, useState } from 'react'
import Button from '../atoms/Button'
import Modal from '../ui/Modal'
import WasitaLoadingScreen from '../ui/WasitaLoadingScreen'
import { useAuth } from '../../context/authStore'
import { getSubscriptionAccess, requestSubscriptionReactivation } from '../../services/billingService'
import { formatSubscriptionRemaining, SUBSCRIPTION_ALERT_WINDOW_DAYS } from '../../utils/subscriptionTiming'

const REFRESH_MS = 60_000
const DAY_MS = 86_400_000

export default function SubscriptionExpiryAlert({ children }) {
  const { user } = useAuth()
  if (!user || user.role === 'super_admin' || user.mustChangePassword) return children
  return <SubscriptionGate key={user.id + ':' + user.businessId}>{children}</SubscriptionGate>
}

function SubscriptionGate({ children }) {
  const { logout } = useAuth()
  const [snapshot, setSnapshot] = useState(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [sending, setSending] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [warningDismissed, setWarningDismissed] = useState('')
  const refreshRef = useRef(() => {})

  useEffect(() => {
    let active = true
    let inFlight = null
    let deadlineTimer
    let revision = 0
    const load = () => {
      if (inFlight) return inFlight
      setChecking(true)
      const startedAt = performance.now()
      const currentRevision = revision
      inFlight = getSubscriptionAccess().then((value) => {
        if (!active || currentRevision !== revision) return
        window.clearTimeout(deadlineTimer)
        const remaining = value.accessUntil
          ? Date.parse(value.accessUntil) - Date.parse(value.serverNow) - (performance.now() - startedAt)
          : null
        const expired = remaining !== null && (!Number.isFinite(remaining) || remaining <= 0)
        setSnapshot({ ...value, accessMode: expired ? 'blocked' : value.accessMode, remaining })
        setError('')
        if (value.accessMode === 'full' && remaining > 0 && remaining <= 2_147_483_647) {
          deadlineTimer = window.setTimeout(() => {
            // Lock at the server deadline even if the network is unavailable.
            revision += 1
            setSnapshot((current) => ({ ...current, status: 'past_due', accessMode: 'blocked' }))
            Promise.resolve(inFlight).then(() => { if (active) void load() })
          }, Math.min(remaining, 2_147_483_647))
        }
      }).catch(() => {
        if (active) setError('No pudimos comprobar la suscripción. Revisa tu conexión y vuelve a intentarlo.')
      }).finally(() => {
        inFlight = null
        if (active) setChecking(false)
      })
      return inFlight
    }
    refreshRef.current = load
    void load()
    const timer = window.setInterval(load, REFRESH_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') void load() }
    const onBlocked = () => {
      revision += 1
      setSnapshot((current) => ({ ...current, accessMode: 'blocked' }))
      // Discard a snapshot fetched before the API rejection.
      Promise.resolve(inFlight).then(() => { if (active) void load() })
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', load)
    window.addEventListener('wasi:subscription-blocked', onBlocked)
    return () => {
      active = false
      window.clearInterval(timer)
      window.clearTimeout(deadlineTimer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', load)
      window.removeEventListener('wasi:subscription-blocked', onBlocked)
    }
  }, [])

  const requestReactivation = async () => {
    setSending(true)
    setRequestError('')
    try {
      const result = await requestSubscriptionReactivation()
      setSnapshot((current) => ({ ...current, requestPending: result.status === 'pending' }))
      void refreshRef.current()
    } catch (requestFailure) {
      setRequestError(requestFailure.message || 'No se pudo enviar la solicitud.')
    } finally {
      setSending(false)
    }
  }

  if (!snapshot && !error) return <WasitaLoadingScreen />

  if (error || snapshot?.accessMode !== 'full') {
    const title = error ? 'No se pudo verificar el acceso' : {
      suspended: 'Tu cuenta está suspendida',
      canceled: 'Tu suscripción fue cancelada',
      pending_payment: 'Tu suscripción está pendiente de activación',
      incomplete: 'Tu suscripción está pendiente de activación',
      missing: 'Tu empresa necesita una suscripción',
    }[snapshot?.status] || 'Tu suscripción ha vencido'
    return (
      <main className="min-h-svh bg-surface-container-low">
        <Modal dismissible={false} dialogClassName="sm:max-w-xl" title={title}>
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start gap-3 rounded-2xl bg-error-container p-4 text-on-error-container">
              <span aria-hidden="true" className="material-symbols-outlined text-3xl">lock</span>
              <div>
                <p className="font-bold">{snapshot?.businessName || 'Acceso a Wasita'}</p>
                <p className="mt-1 text-sm leading-6">{error || 'El acceso a los módulos está bloqueado. La habilitación se gestiona con el superadmin de Wasita.'}</p>
              </div>
            </div>
            {snapshot?.planName ? <p className="text-sm text-on-surface-variant">Plan: <strong>{snapshot.planName}</strong></p> : null}
            {snapshot?.requestPending ? (
              <p className="rounded-xl bg-primary-fixed p-4 text-sm text-on-primary-fixed" role="status">Solicitud enviada al panel del superadmin y pendiente de revisión. Si aprueba la reactivación, recuperarás el acceso automáticamente. También puedes pulsar «Comprobar acceso».</p>
            ) : !error ? (
              <p className="text-sm leading-6 text-on-surface-variant">Solicita la reactivación para que el superadmin revise tu cuenta. Enviar la solicitud no habilita el acceso por sí solo.</p>
            ) : null}
            {snapshot?.status === 'missing' ? <p className="text-sm">Contacta al superadmin para que asigne un plan a tu empresa.</p> : null}
            {requestError ? <p role="alert" className="text-sm text-error">{requestError}</p> : null}
            <div className="flex flex-col gap-2">
              {!error && snapshot?.status !== 'missing' ? <Button disabled={snapshot?.requestPending} loading={sending} onClick={requestReactivation} type="button">{snapshot?.requestPending ? 'Solicitud enviada' : 'Solicitar reactivación'}</Button> : null}
              <Button loading={checking} loadingLabel="Comprobando..." onClick={() => refreshRef.current()} type="button" variant="secondary">Comprobar acceso</Button>
              <Button onClick={logout} type="button" variant="ghost">Cerrar sesión</Button>
            </div>
          </div>
        </Modal>
      </main>
    )
  }

  const warningKey = snapshot.id + ':' + snapshot.accessUntil
  const daysRemaining = snapshot.remaining / DAY_MS
  const showWarning = snapshot.remaining > 0 && daysRemaining <= SUBSCRIPTION_ALERT_WINDOW_DAYS && warningDismissed !== warningKey
  return <>
    {children}
    {showWarning ? <Modal dialogClassName="sm:max-w-xl" onClose={() => setWarningDismissed(warningKey)} title="Tu suscripción vence pronto">
      <div className="space-y-5 p-5 sm:p-6">
        <p className="text-sm leading-6">Queda aproximadamente {formatSubscriptionRemaining(daysRemaining)}. Tu acceso vence el {new Date(snapshot.accessUntil).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })}. Coordina la renovación con el superadmin para mantener el acceso.</p>
        <Button onClick={() => setWarningDismissed(warningKey)} type="button">Entendido</Button>
      </div>
    </Modal> : null}
  </>
}
