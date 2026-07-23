import { useEffect } from 'react'
import { getSettings } from '../../services/settingsService'
import Button from './Button'
import Modal from './Modal'

export default function ConfirmDialog({ description, onCancel, onConfirm, open, title }) {
  const confirmationsEnabled = getSettings().confirmations

  useEffect(() => {
    if (open && !confirmationsEnabled) {
      onConfirm?.()
    }
  }, [confirmationsEnabled, onConfirm, open])

  if (!open || !confirmationsEnabled) return null

  return (
    <Modal onClose={onCancel} title={title}>
      <div className="p-4 sm:p-5">
        <p className="text-sm leading-6 text-on-surface-variant">{description}</p>
        <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
          <Button onClick={onCancel} type="button" variant="secondary">Cancelar</Button>
          <Button onClick={onConfirm} type="button" variant="danger">Confirmar</Button>
        </div>
      </div>
    </Modal>
  )
}
