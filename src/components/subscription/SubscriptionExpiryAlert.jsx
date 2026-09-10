import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../atoms/Button'
import Modal from '../ui/Modal'
import { useAuth } from '../../context/authStore'
import { getSubscription } from '../../services/billingService'
import { formatSubscriptionRemaining, getSubscriptionExpiryAlert } from '../../utils/subscriptionTiming'

const DISMISSED_ALERT_PREFIX = 'wasi:subscription-expiry-alert'
const ALERT_REFRESH_INTERVAL_MS = 15 * 60 * 1000

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

export default function SubscriptionExpiryAlert() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    if (!user || user.role === 'super_admin') return undefined

    let active = true
    const load = async () => {
      try {
        const subscription = await getSubscription()
        const timing = getSubscriptionExpiryAlert(subscription)
        if (!active) return
        if (!timing) {
          setAlert(null)
          return
        }

        const key = getDismissedKey(subscription, timing.endAt)
        setAlert(wasDismissed(key) ? null : { key, ...timing })
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

  const close = () => {
    dismiss(alert.key)
    setAlert(null)
  }
  const canManageSubscription = ['admin', 'admin_owner'].includes(user?.role)
  const isTrial = alert.kind === 'trial'
  const title = isTrial ? 'Tu periodo de prueba termina pronto' : 'Tu suscripción vence pronto'
  const endLabel = alert.endAt.toLocaleString('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  return (
    <Modal onClose={close} title={title}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <span aria-hidden="true" className="material-symbols-outlined text-2xl">schedule</span>
          <div>
            <p className="font-bold">Queda aproximadamente {formatSubscriptionRemaining(alert.daysRemaining)}.</p>
            <p className="mt-1 text-sm leading-6">{isTrial ? 'Tu periodo de prueba finalizará' : 'Tu periodo actual finalizará'} el {endLabel}. Revisa tu plan para mantener el acceso a Wasita.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={close} type="button" variant="secondary">Cerrar</Button>
          {canManageSubscription ? (
            <Button onClick={() => { close(); navigate('/dashboard/billing') }} type="button">
              Revisar suscripción
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}