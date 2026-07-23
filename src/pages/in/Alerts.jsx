import { useMemo, useState } from 'react'
import AlertCard from '../../components/alerts/AlertCard'
import AlertSummary from '../../components/alerts/AlertSummary'
import Badge from '../../components/atoms/Badge'
import EmptyState from '../../components/molecules/EmptyState'
import DashboardShell from '../../components/organisms/DashboardShell'
import { getInventoryAlerts } from '../../data/dashboard'
import { useI18n } from '../../hooks/useI18n'
import { useInventory } from '../../hooks/useInventory'

export default function Alerts() {
  const { t } = useI18n()
  const inventory = useInventory()
  const [activeFilter, setActiveFilter] = useState('all')
  const filters = useMemo(
    () => [
      { label: t('alerts.filters.all'), value: 'all' },
      { label: t('alerts.filters.critical'), value: 'error' },
      { label: t('alerts.filters.warning'), value: 'warning' },
      { label: t('alerts.filters.info'), value: 'info' },
    ],
    [t],
  )
  const alerts = useMemo(() => getInventoryAlerts(inventory.products, t), [inventory.products, t])
  const filteredAlerts = useMemo(
    () => (activeFilter === 'all' ? alerts : alerts.filter((alert) => alert.severity === activeFilter)),
    [activeFilter, alerts],
  )

  return (
    <DashboardShell
      subtitle={t('alerts.pageSubtitle')}
      title={t('alerts.pageTitle')}
    >
      <div className="grid gap-5">
        <AlertSummary alerts={alerts} />

        <section className="min-w-0 rounded-3xl border border-outline-variant bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-on-surface">{t('header.alerts')}</h2>
                <Badge tone={alerts.length ? 'warning' : 'success'}>{alerts.length}</Badge>
              </div>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                {t('alerts.filterHelp')}
              </p>
            </div>

            <div className="interactive-scroll -mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
              {filters.map((filter) => {
                const active = activeFilter === filter.value

                return (
                  <button
                    className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
                      active
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {filteredAlerts.length ? filteredAlerts.map((alert) => (
              <AlertCard alert={alert} key={alert.id} />
            )) : (
              <EmptyState
                description={t('alerts.emptyDescription')}
                icon="notifications"
                title={t('alerts.emptyTitle')}
              />
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}
