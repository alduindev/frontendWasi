import { useEffect, useRef, useState } from 'react'

export default function HorizontalScroller({ children, className = '', label = 'Contenido deslizable', pageStep = false }) {
  const railRef = useRef(null)
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0, lastX: 0, lastTime: 0, velocity: 0 })
  const snapTimerRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [edges, setEdges] = useState({ start: true, end: true, overflow: false })
  const move = direction => {
    const rail = railRef.current
    if (!rail) return
    if (!pageStep) { rail.scrollBy({ behavior: 'smooth', left: direction * Math.max(280, rail.clientWidth * 0.75) }); return }
    const items = [...rail.children]
    const origin = items[0]?.offsetLeft || 0
    const positions = items.map(child => child.offsetLeft - origin)
    const current = positions.reduce((best, position, index) => Math.abs(position - rail.scrollLeft) < Math.abs(positions[best] - rail.scrollLeft) ? index : best, 0)
    const target = Math.max(0, Math.min(positions.length - 1, current + direction))
    rail.scrollTo({ behavior: 'smooth', left: positions[target] })
  }
  const pointerDown = event => { const interactive=event.target.closest('a,button,input,select,textarea,label,[role="button"]');const noDrag=event.target.closest('[data-no-drag]');if(event.pointerType==='touch'||noDrag||(interactive&&!event.target.closest('[data-drag-card]')))return;const rail=railRef.current;clearTimeout(snapTimerRef.current);dragRef.current={active:true,moved:false,startX:event.clientX,scrollLeft:rail.scrollLeft,lastX:event.clientX,lastTime:performance.now(),velocity:0};setDragging(true);rail.setPointerCapture(event.pointerId) }
  const pointerMove = event => { const drag=dragRef.current;if(!drag.active)return;event.preventDefault();const now=performance.now();const elapsed=Math.max(1,now-drag.lastTime);const delta=event.clientX-drag.lastX;drag.velocity=drag.velocity*.65+(delta/elapsed)*.35;drag.lastX=event.clientX;drag.lastTime=now;const distance=event.clientX-drag.startX;if(Math.abs(distance)>4)drag.moved=true;railRef.current.scrollLeft=drag.scrollLeft-distance }
  const pointerUp = event => { const rail=railRef.current;const drag=dragRef.current;if(drag.active&&rail.hasPointerCapture(event.pointerId))rail.releasePointerCapture(event.pointerId);drag.active=false;if(drag.moved&&Math.abs(drag.velocity)>.08)rail.scrollBy({behavior:'smooth',left:-drag.velocity*260});snapTimerRef.current=setTimeout(()=>setDragging(false),220) }
  const clickCapture = event => { if(dragRef.current.moved){event.preventDefault();event.stopPropagation();dragRef.current.moved=false;return}if(event.target.closest('button,input,select,textarea,label'))dragRef.current.moved=false }
  const wheel = event => { const rail=railRef.current;if(!rail||rail.scrollWidth<=rail.clientWidth||Math.abs(event.deltaY)<=Math.abs(event.deltaX))return;event.preventDefault();rail.scrollLeft+=event.deltaY }
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return undefined
    const update = () => {
      const max = Math.max(0, rail.scrollWidth - rail.clientWidth)
      setEdges({ start: rail.scrollLeft <= 2, end: rail.scrollLeft >= max - 2, overflow: max > 2 })
    }
    update()
    rail.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(rail)
    for (const child of rail.children) observer.observe(child)
    return () => { rail.removeEventListener('scroll', update); observer.disconnect();clearTimeout(snapTimerRef.current) }
  }, [children])
  const control = 'flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full border border-outline-variant bg-white text-primary shadow-sm transition hover:bg-primary-fixed disabled:cursor-default disabled:opacity-25'
  return <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_36px] items-stretch gap-1"><button aria-label="Ver anteriores" className={`${control} ${edges.overflow?'':'invisible'}`} disabled={edges.start} onClick={() => move(-1)} type="button"><span className="material-symbols-outlined">chevron_left</span></button><div aria-label={label} className={`flex min-w-0 select-none cursor-grab gap-3 overflow-x-auto overscroll-x-contain px-1 pt-1 active:cursor-grabbing ${pageStep?'wasi-page-scroller pb-1 [&>*]:box-border [&>*]:w-full [&>*]:min-w-full [&>*]:max-w-full [&>*]:basis-full':'pb-3'} ${dragging?'snap-none':'snap-x snap-proximity'} ${className}`} onClickCapture={clickCapture} onDragStart={event=>event.preventDefault()} onPointerCancel={pointerUp} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onWheel={wheel} ref={railRef} tabIndex="0">{children}</div><button aria-label="Ver siguientes" className={`${control} ${edges.overflow?'':'invisible'}`} disabled={edges.end} onClick={() => move(1)} type="button"><span className="material-symbols-outlined">chevron_right</span></button></div>
}
