import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../hooks/useI18n'

function handleHorizontalWheel(event) {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  event.preventDefault()
  event.currentTarget.scrollLeft += event.deltaY
}

export default function Carousel({ ariaLabel, autoPlay = false, autoPlayInterval = 5500, children, className = '', forceMotion = false, fullWidth = false, gridClassName = '', itemClassName = '', items = [], loop = false, showIndicators = true, viewportClassName = '' }) {
  const { t } = useI18n()
  const viewportRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const scrollByPage = (direction) => {
    const viewport = viewportRef.current
    if (!viewport) return
    if (loop && count > 1) {
      const itemWidth = viewport.querySelector('[data-carousel-item]')?.clientWidth || viewport.clientWidth
      const currentIndex = Math.round(viewport.scrollLeft / Math.max(itemWidth, 1))
      const nextIndex = (currentIndex + direction + count) % count
      viewport.scrollTo({ behavior: 'smooth', left: nextIndex * itemWidth })
      return
    }
    viewport.scrollBy({ behavior: 'smooth', left: direction * viewport.clientWidth * (fullWidth ? 1 : 0.82) })
  }

  const updateIndex = () => {
    const viewport = viewportRef.current
    if (!viewport) return
    const itemWidth = viewport.querySelector('[data-carousel-item]')?.clientWidth || viewport.clientWidth
    setActiveIndex(Math.round(viewport.scrollLeft / Math.max(itemWidth, 1)))
  }

  const content = items.length ? items : children
  const count = items.length || 0

  useEffect(() => {
    if (!autoPlay || count < 2 || isPaused) return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion && !forceMotion) return undefined

    const timer = window.setInterval(() => {
      const viewport = viewportRef.current
      if (!viewport) return
      const itemWidth = viewport.querySelector('[data-carousel-item]')?.clientWidth || viewport.clientWidth
      const currentIndex = Math.round(viewport.scrollLeft / Math.max(itemWidth, 1))
      const nextIndex = loop ? (currentIndex + 1) % count : Math.min(currentIndex + 1, count - 1)
      viewport.scrollTo({ behavior: 'smooth', left: nextIndex * itemWidth })
    }, autoPlayInterval)
    return () => window.clearInterval(timer)
  }, [autoPlay, autoPlayInterval, count, forceMotion, fullWidth, isPaused, loop])

  const navigationButtonClass = fullWidth
    ? 'pointer-events-auto flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-full border border-white/70 bg-white/35 p-0 text-primary shadow-sm backdrop-blur-sm transition hover:bg-white/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
    : 'pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-full border border-outline-variant bg-white/95 text-xl font-black text-on-surface-variant shadow-lg shadow-primary/10 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'

  return (
    <div
      className={`group relative min-w-0 max-w-full ${forceMotion ? 'carousel-force-motion' : ''} ${className}`}
      onBlurCapture={() => setIsPaused(false)}
      onFocusCapture={() => autoPlay && setIsPaused(true)}
    >
      {count > 1 ? (
        <div className={fullWidth ? 'carousel-fullwidth-controls pointer-events-none absolute bottom-5 right-6 z-10 flex items-center gap-3 sm:bottom-6 sm:right-8' : 'pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-1 sm:flex'}>
          <button
            aria-label={t('actions.previous')}
            className={navigationButtonClass}
            onClick={() => { setIsPaused(false); scrollByPage(-1) }}
            type="button"
          ><span aria-hidden="true" className="material-symbols-outlined text-xl">arrow_back</span></button>
          <span className={fullWidth && autoPlay ? 'relative flex h-14 w-14 items-center justify-center' : ''} key={activeIndex}>
            {fullWidth && autoPlay ? (
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-14 w-14 overflow-visible"
                viewBox="0 0 40 40"
              >
                <circle className="text-primary/25" cx="20" cy="20" fill="none" pathLength="100" r="17" stroke="currentColor" strokeWidth="1.8" />
                <circle
                  className="carousel-autoplay-progress text-primary"
                  cx="20"
                  cy="20"
                  fill="none"
                  pathLength="100"
                  r="17"
                  stroke="currentColor"
                  strokeDasharray="100"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  strokeWidth="2.8"
                  style={{
                    animationDuration: `${autoPlayInterval}ms`,
                    animationPlayState: isPaused ? 'paused' : 'running',
                  }}
                  transform="rotate(-90 20 20)"
                />
              </svg>
            ) : null}
            <button
              aria-label={t('actions.next')}
              className={navigationButtonClass}
              onClick={() => { setIsPaused(false); scrollByPage(1) }}
              type="button"
            ><span aria-hidden="true" className="material-symbols-outlined text-xl">arrow_forward</span></button>
          </span>
        </div>
      ) : null}

      <div
        aria-label={ariaLabel}
        className={`${fullWidth ? 'carousel-fullwidth-viewport mx-0 h-full overflow-hidden px-0 pb-0' : 'interactive-scroll min-w-0 max-w-full -mx-4 px-4 sm:mx-0 sm:px-12 snap-x snap-mandatory overflow-x-auto pb-2'} ${viewportClassName}`}
        onScroll={updateIndex}
        onWheel={fullWidth ? undefined : handleHorizontalWheel}
        ref={viewportRef}
        role="region"
      >
        <div className={`grid min-w-0 ${fullWidth ? 'auto-cols-[100%] h-full gap-0' : 'auto-cols-[minmax(min(230px,calc(100vw-2rem)),1fr)] sm:auto-cols-[minmax(260px,1fr)] lg:auto-cols-[minmax(280px,1fr)] gap-3'} grid-flow-col items-stretch scroll-smooth ${gridClassName}`}>
          {items.length ? items.map((item, index) => (
            <div className={`min-w-0 snap-start ${fullWidth ? 'h-full' : ''} ${itemClassName}`} data-carousel-item key={item.key || index}>
              {item.node}
            </div>
          )) : content}
        </div>
      </div>

      {count > 1 && !fullWidth ? (
        <div className={`mt-2 flex items-center gap-3 ${showIndicators ? 'justify-between' : 'justify-end'}`}>
          {showIndicators ? <div className="flex gap-1.5">
            {items.map((item, index) => (
              <button
                aria-label={`Ir al elemento ${index + 1}`}
                className={`min-h-6 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-primary' : 'w-3 bg-outline-variant hover:bg-outline'}`}
                key={item.key || index}
                onClick={() => {
                  const viewport = viewportRef.current
                  const node = viewport?.querySelectorAll('[data-carousel-item]')[index]
                  node?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
                }}
                type="button"
              />
            ))}
          </div> : null}
          <div className="flex gap-2 sm:hidden">
            <button
              aria-label={t('actions.previous')}
              className={fullWidth ? navigationButtonClass : 'min-h-11 min-w-11 rounded-full border border-outline-variant bg-white p-2 text-lg font-black text-on-surface-variant shadow-sm transition hover:border-primary hover:text-primary'}
              onClick={() => scrollByPage(-1)}
              type="button"
            ><span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_back</span></button>
            <button
              aria-label={t('actions.next')}
              className={fullWidth ? navigationButtonClass : 'min-h-11 min-w-11 rounded-full border border-outline-variant bg-white p-2 text-lg font-black text-on-surface-variant shadow-sm transition hover:border-primary hover:text-primary'}
              onClick={() => scrollByPage(1)}
              type="button"
            ><span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span></button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
