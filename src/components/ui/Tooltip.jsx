export default function Tooltip({ children, label }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden max-w-[min(220px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-on-surface px-2 py-1 text-center text-xs font-bold text-white shadow-lg group-hover:block">
        {label}
      </span>
    </span>
  )
}
