import Card from '../atoms/Card'

const summaryConfig = [
  { icon: 'error', key: 'error', label: 'Criticas', tone: 'text-error' },
  { icon: 'warning', key: 'warning', label: 'Advertencias', tone: 'text-amber-700' },
  { icon: 'info', key: 'info', label: 'Informativas', tone: 'text-primary' },
]

export default function AlertSummary({ alerts }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
      {summaryConfig.map((item) => {
        const value = alerts.filter((alert) => alert.severity === item.key).length

        return (
          <Card className="p-4" key={item.key}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">{item.label}</p>
                <p className={`mt-2 font-heading text-3xl font-bold ${item.tone}`}>{value}</p>
              </div>
              <span className={`material-symbols-outlined rounded-2xl bg-surface-container-low p-3 text-2xl ${item.tone}`}>{item.icon}</span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
