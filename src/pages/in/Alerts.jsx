import { useEffect, useMemo, useState } from 'react'
import AlertCard from '../../components/alerts/AlertCard'
import AlertSummary from '../../components/alerts/AlertSummary'
import Badge from '../../components/atoms/Badge'
import EmptyState from '../../components/molecules/EmptyState'
import DashboardShell from '../../components/organisms/DashboardShell'
import OperatorShell from '../../components/operator/OperatorShell'
import { getInventoryAlerts } from '../../data/dashboard'
import { useI18n } from '../../hooks/useI18n'
import { useInventory } from '../../hooks/useInventory'
import { useAppConfig } from '../../context/appConfigStore'
import { getDentalNotifications } from '../../services/healthService'
import { getVeterinaryAlerts } from '../../services/veterinaryService'

function dentalAlert(item) {
  const notificationType = item.notificationType || ''
  return {
    ...item,
    actionLabel: 'Abrir agenda',
    context: 'Agenda dental',
    severity: notificationType.includes('cancelled') || notificationType.includes('no_show')
      ? 'error'
      : notificationType.includes('confirmed') || notificationType.includes('completed')
        ? 'success'
        : notificationType.includes('billing')
          ? 'info'
          : 'warning',
  }
}

export default function Alerts({ operator = false }) {
  const { t } = useI18n()
  const { config } = useAppConfig()
  const capabilities = new Set(config?.capabilities || [])
  const administrator = ['admin', 'admin_owner'].includes(config?.user?.role)
  const dental = config?.template?.dashboardKey === 'dental'
  const veterinary = config?.template?.dashboardKey === 'veterinary'
  const canReadInventory = administrator || !operator || capabilities.has('inventory.read') || capabilities.has('inventory.read_safe')
  const inventory = useInventory({ enabled: canReadInventory })
  const [activeFilter, setActiveFilter] = useState('all')
  const [domainAlerts, setDomainAlerts] = useState([])
  const [domainError, setDomainError] = useState('')

  useEffect(() => {
    const request = dental
      ? getDentalNotifications
      : veterinary
        ? getVeterinaryAlerts
        : null
    if (!request) return undefined
    let active = true
    request()
      .then((rows) => {
        if (active) {
          setDomainAlerts(rows)
          setDomainError('')
        }
      })
      .catch((error) => {
        if (active) setDomainError(error.message || 'No se pudieron cargar las alertas operativas.')
      })
    return () => {
      active = false
    }
  }, [dental, veterinary])

  const filters = useMemo(
    () => [
      { label: t('alerts.filters.all'), value: 'all' },
      { label: t('alerts.filters.critical'), value: 'error' },
      { label: t('alerts.filters.warning'), value: 'warning' },
      { label: t('alerts.filters.info'), value: 'info' },
    ],
    [t],
  )
  const operationalAlerts = useMemo(
    () => dental ? domainAlerts.map(dentalAlert) : veterinary ? domainAlerts : [],
    [dental, domainAlerts, veterinary],
  )
  const alerts = useMemo(
    () => [
      ...operationalAlerts,
      ...(canReadInventory
        ? getInventoryAlerts(inventory.products, t).map((item) => (
            operator ? { ...item, route: '/pos/products' } : item
          ))
        : []),
    ],
    [canReadInventory, inventory.products, operationalAlerts, operator, t],
  )
  const filteredAlerts = useMemo(
    () => (activeFilter === 'all' ? alerts : alerts.filter((alert) => alert.severity === activeFilter)),
    [activeFilter, alerts],
  )
  const Shell = operator ? OperatorShell : DashboardShell
  const title = dental ? 'Alertas dentales' : veterinary ? 'Alertas veterinarias' : t('alerts.pageTitle')
  const subtitle = dental
    ? 'Cambios de agenda, cobros pendientes e inventario que requiere atención.'
    : veterinary
      ? 'Agenda, vacunas próximas o vencidas e inventario veterinario que requiere atención.'
      : t('alerts.pageSubtitle')

  return (
    <Shell subtitle={subtitle} title={title}>
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
            {(dental || veterinary) && domainError ? <p className="rounded-xl bg-error-container p-3 text-sm text-error">{domainError}</p> : null}
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
    </Shell>
  )
}
