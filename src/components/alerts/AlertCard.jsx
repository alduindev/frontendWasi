import { Link } from 'react-router-dom'
import Badge from '../atoms/Badge'

const severityMeta = {
  error: {
    icon: 'error',
    tone: 'danger',
    wrapper: 'border-error-container bg-error-container/35 hover:border-error',
  },
  info: {
    icon: 'info',
    tone: 'info',
    wrapper: 'border-outline-variant bg-white hover:border-primary',
  },
  success: {
    icon: 'check_circle',
    tone: 'success',
    wrapper: 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-400',
  },
  warning: {
    icon: 'warning',
    tone: 'warning',
    wrapper: 'border-tertiary-fixed bg-tertiary-fixed/30 hover:border-tertiary',
  },
}

export default function AlertCard({ alert }) {
  const meta = severityMeta[alert.severity] || severityMeta.info
  const route = alert.route || `/dashboard/product/${alert.productId}`
  const context = alert.context || 'Inventario'
  const actionLabel = alert.actionLabel || 'Ver producto'

  return (
    <Link
      className={`group block min-w-0 rounded-2xl border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-4 ${meta.wrapper}`}
      to={route}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <span className="material-symbols-outlined rounded-2xl bg-white/80 p-3 text-2xl text-primary shadow-sm">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{alert.title}</Badge>
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">{context}</span>
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-on-surface">{alert.message}</p>
          <div className="mt-3 flex min-h-11 items-center gap-2 text-sm font-bold text-primary">
            {actionLabel}
            <span className="material-symbols-outlined text-lg transition group-hover:translate-x-0.5">arrow_forward</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
