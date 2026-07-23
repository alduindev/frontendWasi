export default function Card({ children, className = '', ...props }) {
  return (
    <section
      className={`min-w-0 rounded-3xl border border-outline-variant bg-white shadow-[0_12px_40px_rgba(31,24,39,0.06)] transition-colors ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}
