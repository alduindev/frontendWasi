import { useRef, useState } from 'react'
import { useI18n } from '../../hooks/useI18n'

function handleHorizontalWheel(event) {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
  event.preventDefault()
  event.currentTarget.scrollLeft += event.deltaY
}

export default function Carousel({ ariaLabel, children, className = '', gridClassName = '', itemClassName = '', items = [], viewportClassName = '' }) {
  const { t } = useI18n()
  const viewportRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollByPage = (direction) => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollBy({ behavior: 'smooth', left: direction * viewport.clientWidth * 0.82 })
  }

  const updateIndex = () => {
    const viewport = viewportRef.current
    if (!viewport) return
    const itemWidth = viewport.querySelector('[data-carousel-item]')?.clientWidth || viewport.clientWidth
    setActiveIndex(Math.round(viewport.scrollLeft / Math.max(itemWidth, 1)))
  }

  const content = items.length ? items : children
  const count = items.length || 0

  return (
    <div className={`group relative ${className}`}>
      {count > 1 ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden items-center justify-between px-1 sm:flex">
          <button
            aria-label={t('actions.previous')}
            className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-full border border-outline-variant bg-white/95 text-xl font-black text-on-surface-variant shadow-lg shadow-primary/10 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => scrollByPage(-1)}
            type="button"
          >
            &lt;
          </button>
          <button
            aria-label={t('actions.next')}
            className="pointer-events-auto flex min-h-11 min-w-11 items-center justify-center rounded-full border border-outline-variant bg-white/95 text-xl font-black text-on-surface-variant shadow-lg shadow-primary/10 transition hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => scrollByPage(1)}
            type="button"
          >
            &gt;
          </button>
        </div>
      ) : null}

      <div
        aria-label={ariaLabel}
        className={`interactive-scroll -mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-12 ${viewportClassName}`}
        onScroll={updateIndex}
        onWheel={handleHorizontalWheel}
        ref={viewportRef}
        role="region"
      >
        <div className={`grid auto-cols-[minmax(min(230px,calc(100vw-2rem)),1fr)] grid-flow-col items-stretch gap-3 scroll-smooth sm:auto-cols-[minmax(260px,1fr)] lg:auto-cols-[minmax(280px,1fr)] ${gridClassName}`}>
          {items.length ? items.map((item, index) => (
            <div className={`snap-start ${itemClassName}`} data-carousel-item key={item.key || index}>
              {item.node}
            </div>
          )) : content}
        </div>
      </div>

      {count > 1 ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
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
          </div>
          <div className="flex gap-2 sm:hidden">
            <button
              aria-label={t('actions.previous')}
              className="min-h-11 min-w-11 rounded-full border border-outline-variant bg-white p-2 text-lg font-black text-on-surface-variant shadow-sm transition hover:border-primary hover:text-primary"
              onClick={() => scrollByPage(-1)}
              type="button"
            >
              &lt;
            </button>
            <button
              aria-label={t('actions.next')}
              className="min-h-11 min-w-11 rounded-full border border-outline-variant bg-white p-2 text-lg font-black text-on-surface-variant shadow-sm transition hover:border-primary hover:text-primary"
              onClick={() => scrollByPage(1)}
              type="button"
            >
              &gt;
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
