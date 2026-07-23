export default function AuthButton({ children, icon = 'arrow_forward', variant = 'primary', className = '', ...props }) {
  const styles =
    variant === 'secondary'
      ? 'border-2 border-primary-container bg-white text-primary-container hover:bg-surface-container-low'
      : 'bg-primary-container text-white shadow-lg shadow-primary-container/20 hover:bg-primary'

  return (
    <button
      className={`flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-2xl px-5 py-4 text-center text-base font-bold transition active:scale-[0.99] ${styles} ${className}`}
      {...props}
    >
      {children}
      {icon ? <span className="material-symbols-outlined text-xl">{icon}</span> : null}
    </button>
  )
}
