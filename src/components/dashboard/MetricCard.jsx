export default function MetricCard({ metric, onClick }) {
  return (
    <button
      className="group h-full w-full rounded-3xl text-left transition focus:outline-none focus:ring-2 focus:ring-primary/30"
      onClick={onClick}
      type="button"
    >
      <div className="flex h-full min-h-36 flex-col justify-between rounded-3xl border border-outline-variant bg-white p-4 shadow-[0_12px_40px_rgba(31,24,39,0.06)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">{metric.label}</p>
            <p className="mt-2 truncate font-heading text-2xl font-bold text-primary">{metric.value}</p>
          </div>
          <span className="material-symbols-outlined rounded-2xl bg-surface-container-low p-2.5 text-primary transition group-hover:scale-105">{metric.icon}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="truncate text-sm text-on-surface-variant">{metric.note}</p>
          <span className="material-symbols-outlined text-lg text-primary transition group-hover:translate-x-0.5">arrow_forward</span>
        </div>
      </div>
    </button>
  )
}
