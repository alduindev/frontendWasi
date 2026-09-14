import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../atoms/Button'
import Modal from '../ui/Modal'
import { useAuth } from '../../context/authStore'
import { getSubscription, requestSubscriptionReactivation } from '../../services/billingService'
import { formatSubscriptionRemaining, getSubscriptionExpiryAlert } from '../../utils/subscriptionTiming'

const DISMISSED_ALERT_PREFIX = 'wasi:subscription-expiry-alert'
const ALERT_REFRESH_INTERVAL_MS = 15 * 60 * 1000
const BLOCKED_STATES = new Set(['suspended', 'canceled', 'expired', 'pending_payment', 'incomplete'])

function getDismissedKey(subscription, endAt) {
  return `${DISMISSED_ALERT_PREFIX}:${subscription.id}:${endAt.toISOString()}`
}

function wasDismissed(key) {
  try {
    return window.sessionStorage.getItem(key) === 'dismissed'
  } catch {
    return false
  }
}

function dismiss(key) {
  try {
    window.sessionStorage.setItem(key, 'dismissed')
  } catch {
    // El aviso sigue funcionando aunque el navegador bloquee el almacenamiento de sesión.
  }
}

function hasPendingRequest(subscription) {
  return Boolean(subscription?.events?.some((event) => (
    event.eventType === 'reactivation_requested' && event.metadata?.status === 'pending'
  )))
}

function lifecycleCopy(status, limited) {
  if (limited) {
    return {
      icon: 'payments',
      title: 'El pago de tu suscripción está vencido',
      detail: 'Tu cuenta conserva únicamente el acceso clínico permitido. Regulariza el pago para recuperar todas las operaciones.',
    }
  }

  const copy = {
    expired: ['history_toggle_off', 'Tu suscripción terminó', 'El acceso operativo está bloqueado porque el periodo de servicio venció. Solicita la reactivación o revisa el pago.'],
    canceled: ['block', 'Tu suscripción fue cancelada', 'El acceso operativo está bloqueado. Solicita la reactivación para que Plataforma revise tu cuenta.'],
    suspended: ['lock', 'Tu cuenta está suspendida', 'El acceso operativo está bloqueado hasta que Plataforma valide la situación de tu suscripción.'],
    pending_payment: ['pending_actions', 'Tu pago está pendiente', 'El acceso espera la confirmación del pago. Puedes revisar la facturación o solicitar ayuda a Plataforma.'],
    incomplete: ['pending_actions', 'La activación está incompleta', 'El plan todavía no está confirmado. Revisa el pago o solicita ayuda para activar la cuenta.'],
  }
  const [icon, title, detail] = copy[status] || copy.expired
  return { icon, title, detail }
}

export default function SubscriptionExpiryAlert() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [requestState, setRequestState] = useState('idle')
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    if (!user || user.role === 'super_admin') return undefined

    let active = true
    const load = async () => {
      try {
        const subscription = await getSubscription()
        if (!active) return

        const blocked = BLOCKED_STATES.has(subscription.status)
        const limited = subscription.status === 'past_due' || subscription.diagnostics?.accessMode === 'limited'
        if (blocked || limited) {
          setRequestState(hasPendingRequest(subscription) ? 'pending' : 'idle')
          setRequestError('')
          setAlert({ blocked, limited, status: subscription.status, requestPending: hasPendingRequest(subscription), subscription })
          return
        }

        const timing = getSubscriptionExpiryAlert(subscription)
        if (!timing) {
          setAlert(null)
          setRequestState('idle')
          return
        }

        const key = getDismissedKey(subscription, timing.endAt)
        setRequestState('idle')
        setAlert(wasDismissed(key) ? null : { key, ...timing, subscription })
      } catch {
        // La alerta no debe bloquear el acceso si la suscripción no responde.
      }
    }

    void load()
    const timer = window.setInterval(load, ALERT_REFRESH_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user])

  if (!alert) return null

  const blocked = Boolean(alert.blocked)
  const limited = Boolean(alert.limited)
  const canManageSubscription = ['admin', 'admin_owner'].includes(user?.role)
  const close = () => {
    if (blocked) return
    if (alert.key) dismiss(alert.key)
    setAlert(null)
  }

  const requestReactivation = async () => {
    setRequestState('sending')
    setRequestError('')
    try {
      const result = await requestSubscriptionReactivation()
      setRequestState(result.status === 'pending' ? 'pending' : 'idle')
      setAlert((current) => current ? { ...current, requestPending: result.status === 'pending' } : current)
    } catch (error) {
      setRequestState('idle')
      setRequestError(error.message || 'No se pudo enviar la solicitud.')
    }
  }

  if (blocked || limited) {
    const copy = lifecycleCopy(alert.status, limited)
    return (
      <Modal dismissible={!blocked} onClose={blocked ? undefined : close} title={copy.title}>
        <div className="p-5 sm:p-6">
          <div className={`flex items-start gap-3 rounded-2xl border p-4 ${blocked ? 'border-error-container bg-error-container text-on-error-container' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
            <span aria-hidden="true" className="material-symbols-outlined text-2xl">{copy.icon}</span>
            <div>
              <p className="font-bold">{copy.title}</p>
              <p className="mt-1 text-sm leading-6">{copy.detail}</p>
            </div>
          </div>
          {requestState === 'pending' ? (
            <p className="mt-4 rounded-xl bg-primary-fixed p-3 text-sm font-semibold text-on-primary-fixed">
              Tu solicitud ya fue enviada. Un superadmin revisará el pago y habilitará el acceso.
            </p>
          ) : null}
          {requestError ? <p className="mt-4 rounded-xl bg-error-container p-3 text-sm font-semibold text-on-error-container" role="alert">{requestError}</p> : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {!blocked ? <Button onClick={close} type="button" variant="secondary">Cerrar</Button> : null}
            {canManageSubscription ? (
              <Button onClick={() => { if (!blocked) close(); navigate('/dashboard/billing') }} type="button" variant="secondary">Revisar facturación</Button>
            ) : null}
            <Button disabled={requestState === 'pending'} loading={requestState === 'sending'} onClick={requestReactivation} type="button">
              {requestState === 'pending' ? 'Solicitud enviada' : 'Solicitar reactivación'}
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  const closeWarning = () => {
    if (alert.key) dismiss(alert.key)
    setAlert(null)
  }
  const isTrial = alert.kind === 'trial'
  const title = isTrial ? 'Tu periodo de prueba termina pronto' : 'Tu suscripción vence pronto'
  const endLabel = alert.endAt.toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <Modal onClose={closeWarning} title={title}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">schedule</span>
          <div>
            <p className="font-bold">Queda aproximadamente {formatSubscriptionRemaining(alert.daysRemaining)}.</p>
            <p className="mt-1 text-sm leading-6">{isTrial ? 'Tu periodo de prueba finalizará' : 'Tu periodo actual finalizará'} el {endLabel}. Revisa tu plan para mantener el acceso a Wasita.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={closeWarning} type="button" variant="secondary">Cerrar</Button>
          {canManageSubscription ? <Button onClick={() => { closeWarning(); navigate('/dashboard/billing') }} type="button">Revisar suscripción</Button> : null}
        </div>
      </div>
    </Modal>
  )
}
