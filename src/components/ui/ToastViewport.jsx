import { AnimatePresence, motion } from 'framer-motion'

const toneClass = {
  error: 'border-error-container bg-error-container text-on-error-container',
  info: 'border-outline-variant bg-white text-on-surface',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-tertiary-fixed bg-tertiary-fixed text-on-tertiary-fixed',
}

const toneIcon = {
  error: 'error',
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
}

export default function ToastViewport({ onClose, toasts }) {
  return (
    <div className="fixed left-3 right-3 top-3 z-[100] grid gap-3 sm:left-auto sm:right-4 sm:top-4 sm:w-[min(360px,calc(100vw-2rem))]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-2xl border p-4 shadow-xl shadow-primary/10 ${toneClass[toast.tone]}`}
            exit={{ opacity: 0, x: 20 }}
            initial={{ opacity: 0, x: 20 }}
            key={toast.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <span className="material-symbols-outlined mt-0.5 text-xl">{toneIcon[toast.tone] || toneIcon.info}</span>
                <div className="min-w-0">
                <p className="text-sm font-bold">{toast.title}</p>
                {toast.message ? <p className="mt-1 text-sm opacity-80">{toast.message}</p> : null}
                </div>
              </div>
              <button className="material-symbols-outlined min-h-11 min-w-11 text-lg opacity-70 hover:opacity-100" onClick={() => onClose(toast.id)} type="button">
                close
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
