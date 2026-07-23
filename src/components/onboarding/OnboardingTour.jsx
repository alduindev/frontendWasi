import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const GAP = 10

export default function OnboardingTour({ current, onBack, onFinish, onNext, onSkip, step, total }) {
  const dialogRef = useRef(null)
  const [rect, setRect] = useState(null)

  useLayoutEffect(() => {
    let frame
    const locate = () => {
      const target = step.selector
        ? [...document.querySelectorAll(step.selector)].find((element) => {
            const bounds = element.getBoundingClientRect()
            return bounds.width > 0 && bounds.height > 0
          })
        : null
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        frame = window.requestAnimationFrame(() => setRect(target.getBoundingClientRect()))
      } else setRect(null)
    }
    const timer = window.setTimeout(locate, 180)
    window.addEventListener('resize', locate)
    window.addEventListener('scroll', locate, true)
    return () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', locate)
      window.removeEventListener('scroll', locate, true)
    }
  }, [step])

  useEffect(() => {
    dialogRef.current?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') onSkip()
      if (event.key === 'ArrowRight') onNext()
      if (event.key === 'ArrowLeft' && current > 0) onBack()
      if (event.key === 'Tab') {
        const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')]
        if (!focusable.length) return
        const first = focusable[0]; const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [current, onBack, onNext, onSkip])

  const box = rect && rect.width > 0 && rect.height > 0 ? {
    left: Math.max(8, rect.left - GAP), top: Math.max(8, rect.top - GAP),
    width: Math.min(window.innerWidth - 16, rect.width + GAP * 2),
    height: Math.min(window.innerHeight - 16, rect.height + GAP * 2),
  } : null
  const dialogStyle = box
    ? { left: `clamp(12px, ${Math.min(box.left, window.innerWidth - 372)}px, calc(100vw - 360px))`, top: box.top + box.height + 14 < window.innerHeight - 250 ? box.top + box.height + 14 : Math.max(12, box.top - 238) }
    : undefined

  return (
    <div className="fixed inset-0 z-[200]" role="presentation">
      {!box ? <div className="absolute inset-0 bg-black/60" /> : null}
      {box ? <div aria-hidden="true" className="pointer-events-none fixed rounded-2xl border-2 border-primary-fixed bg-transparent shadow-[0_0_0_5px_rgba(255,214,255,.25),0_0_0_9999px_rgba(0,0,0,.60)]" style={box} /> : null}
      <section
        aria-describedby="onboarding-description"
        aria-labelledby="onboarding-title"
        aria-modal="true"
        className={`fixed z-10 w-[calc(100vw-24px)] max-w-[360px] rounded-3xl border border-outline-variant bg-white p-5 shadow-2xl ${box ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}
        ref={dialogRef}
        role="dialog"
        style={dialogStyle}
        tabIndex={-1}
      >
        <div className="mb-4 flex items-center justify-between gap-3"><span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">Paso {current + 1} de {total}</span><button className="min-h-10 rounded-full px-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-primary" onClick={onSkip} type="button">Omitir</button></div>
        <div aria-label={`Progreso ${Math.round(((current + 1) / total) * 100)}%`} className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(((current + 1) / total) * 100)}><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((current + 1) / total) * 100}%` }} /></div>
        <span aria-hidden="true" className="material-symbols-outlined flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">{step.icon}</span>
        <h2 className="mt-4 font-heading text-xl font-bold text-on-surface" id="onboarding-title">{step.title}</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant" id="onboarding-description">{step.description}</p>
        <div className="mt-5 flex items-center justify-between gap-3"><button className="min-h-11 rounded-xl border border-outline-variant px-4 text-sm font-bold text-on-surface disabled:invisible" disabled={current === 0} onClick={onBack} type="button">Anterior</button><button className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={current === total - 1 ? onFinish : onNext} type="button">{current === total - 1 ? 'Finalizar' : 'Siguiente'}</button></div>
      </section>
    </div>
  )
}
