export default function Badge({ children, tone = 'neutral' }) {
  const tones = {
    danger: 'bg-error-container text-on-error-container ring-error/15',
    info: 'bg-primary-container text-on-primary-container ring-primary/15',
    neutral: 'bg-secondary-container text-on-secondary-container ring-outline-variant',
    success: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    warning: 'bg-tertiary-fixed text-on-tertiary-fixed ring-amber-200',
  }

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tones[tone]}`}>{children}</span>
}
