import { useCallback, useMemo, useState } from 'react'
import ToastViewport from '../components/molecules/ToastViewport'
import { ToastContext } from './toastStore'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((toast) => {
    const id = crypto.randomUUID()
    const nextToast = { id, tone: 'info', ...toast }
    setToasts((current) => [nextToast, ...current].slice(0, 4))
    window.setTimeout(() => removeToast(id), toast.duration || 3200)
  }, [removeToast])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport onClose={removeToast} toasts={toasts} />
    </ToastContext.Provider>
  )
}
