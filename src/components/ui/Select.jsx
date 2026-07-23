export default function Select({ children, className = '', selectClassName = '', label, ...props }) {
  return (
    <label className={`grid min-w-0 gap-1.5 text-sm font-bold text-on-surface-variant ${className}`}>
      {label}
      <select
        className={`min-h-11 w-full min-w-0 rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-sm font-normal text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${selectClassName}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}
