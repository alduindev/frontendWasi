import { useEffect, useRef, useState } from 'react'
import { getSettings } from '../../services/settingsService'
import { useI18n } from '../../hooks/useI18n'
import Button from './Button'
import Modal from './Modal'
import WasitaLoadingScreen from './WasitaLoadingScreen'

export default function ConfirmDialog({ description, logoutTransition = false, onCancel, onConfirm, open, title }) {
  const confirmationsEnabled = getSettings().confirmations
  const { t } = useI18n()
  const onConfirmRef = useRef(onConfirm)
  const logoutStartedRef = useRef(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    onConfirmRef.current = onConfirm
  }, [onConfirm])

  useEffect(() => {
    if (!open) {
      logoutStartedRef.current = false
      return undefined
    }
    if (logoutTransition) {
      if (logoutStartedRef.current) return undefined
      logoutStartedRef.current = true
      setPending(true)
      const timer = window.setTimeout(() => { void onConfirmRef.current?.() }, 620)
      return () => window.clearTimeout(timer)
    }
    if (!confirmationsEnabled) onConfirmRef.current?.()
    return undefined
  }, [confirmationsEnabled, logoutTransition, open])

  if (!open) return null
  if (logoutTransition || pending) {
    return (
      <WasitaLoadingScreen
        accessibleLabel={t('auth.logoutPendingTitle')}
        statusText={t('auth.logoutPendingDescription')}
        variant="logout"
        welcomeText={t('auth.logoutPendingTitle').toUpperCase()}
      />
    )
  }
  if (!confirmationsEnabled) return null

  const confirm = async () => {
    await onConfirmRef.current?.()
  }

  return (
    <Modal onClose={onCancel} title={title}>
      <div className="p-4 sm:p-5">
        <p className="text-sm leading-6 text-on-surface-variant">{description}</p>
        <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
          <Button onClick={onCancel} type="button" variant="secondary">Cancelar</Button>
          <Button onClick={confirm} type="button" variant="danger">Confirmar</Button>
        </div>
      </div>
    </Modal>
  )
}
