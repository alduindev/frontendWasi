import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const modalStack = []

export default function Modal({ children, closeOnBackdrop = false, contentClassName = '', dialogClassName = '', fixedHeight = false, onClose, overlayClassName = '', title }) {
  const id = useRef(Symbol('modal'))
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const [titleId] = useState(() => `modal-${crypto.randomUUID()}`)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    const modalId = id.current
    modalStack.push(modalId)
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && modalStack.at(-1) === modalId) onCloseRef.current?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => { window.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = previousOverflow; const index = modalStack.lastIndexOf(modalId); if (index >= 0) modalStack.splice(index, 1) }
  }, [])

  return createPortal(
    <div className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/35 p-2 backdrop-blur-sm sm:p-4 ${overlayClassName}`} onMouseDown={closeOnBackdrop ? onClose : undefined}>
      <motion.div
        aria-labelledby={titleId}
        aria-modal="true"
        animate={{ opacity: 1, y: 0 }}
        className={`mx-auto flex max-h-[calc(100svh-1rem)] w-full max-w-[min(64rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100svh-2rem)] ${fixedHeight ? 'h-[calc(100svh-1rem)] sm:h-[min(54rem,calc(100svh-2rem))]' : ''} ${dialogClassName}`}
        initial={{ opacity: 0, y: 20 }}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
        transition={{ duration: 0.18 }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-outline-variant bg-white px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="min-w-0 font-heading text-xl font-bold leading-tight text-on-surface sm:text-2xl" id={titleId}>{title}</h2>
          <button
            aria-label="Cerrar"
            className="material-symbols-outlined min-h-11 min-w-11 shrink-0 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
            onClick={onClose}
            type="button"
          >
            close
          </button>
        </div>
        <div className={contentClassName || 'min-h-0 overflow-y-auto'}>{children}</div>
      </motion.div>
    </div>,
    document.body,
  )
}
