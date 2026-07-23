import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Badge from '../../components/atoms/Badge'
import Button from '../../components/atoms/Button'
import Card from '../../components/atoms/Card'
import Skeleton from '../../components/atoms/Skeleton'
import Carousel from '../../components/molecules/Carousel'
import Modal from '../../components/molecules/Modal'
import DashboardShell from '../../components/organisms/DashboardShell'
import { useAuth } from '../../context/authStore'
import { formatCurrency, getInventoryAlerts, getInventoryStats, getProductProfit } from '../../data/dashboard'
import { useInventory } from '../../hooks/useInventory'
import { useI18n } from '../../hooks/useI18n'
import { getStockStatus } from '../../utils/productUtils'
import { getInventoryComparison } from '../../services/dashboardService'
import { getMyBusiness } from '../../services/businessService'
import { getBusinessTypes } from '../../services/businessTypeService'

const InventoryCharts = lazy(() => import('../../components/organisms/InventoryCharts'))

function toneForStock(product) {
  const status = getStockStatus(product)
  if (status === 'out') return 'danger'
  if (status === 'low') return 'warning'
  return 'success'
}

function ProductInsightCard({ product }) {
  const { t } = useI18n()

  return (
    <Link
      className="group min-w-0 rounded-2xl border border-outline-variant bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10 sm:p-4"
      to={`/dashboard/product/${product.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low text-[10px] font-bold text-outline">
          {product.image ? <img alt="" className="h-full w-full object-cover" src={product.image} /> : product.imageSize}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-on-surface group-hover:text-primary">{product.name}</p>
              <p className="mt-1 text-xs text-on-surface-variant">{product.sku} / {product.category}</p>
            </div>
            <Badge tone={toneForStock(product)}>{product.status}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2 text-xs">
            <div>
              <p className="font-bold uppercase text-on-surface-variant">{t('inventory.table.stock')}</p>
              <p className="mt-1 font-bold text-on-surface">{product.stock}</p>
            </div>
            <div>
              <p className="font-bold uppercase text-on-surface-variant">{t('inventory.table.price')}</p>
              <p className="mt-1 font-bold text-on-surface">{formatCurrency(product.price)}</p>
            </div>
            <div>
              <p className="font-bold uppercase text-on-surface-variant">{t('inventory.table.profit')}</p>
              <p className="mt-1 font-bold text-emerald-700">{formatCurrency(getProductProfit(product))}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function getMetricProducts(metric, products) {
  if (!metric) return []

  if (metric.icon === 'inventory_2') return products
  if (metric.icon === 'warning') return products.filter((product) => getStockStatus(product) === 'low')
  if (metric.icon === 'remove_shopping_cart') return products.filter((product) => getStockStatus(product) === 'out')
  if (metric.icon === 'category') return products.filter((product) => product.category === metric.value)
  if (metric.icon === 'diamond') return products.toSorted((a, b) => Number(b.price || 0) - Number(a.price || 0)).slice(0, 1)
  if (metric.icon === 'local_fire_department') return products.toSorted((a, b) => Number(b.sold || 0) - Number(a.sold || 0)).slice(0, 5)
  if (metric.icon === 'payments') {
    return products
      .toSorted((a, b) => Number(b.price || 0) * Number(b.stock || 0) - Number(a.price || 0) * Number(a.stock || 0))
      .slice(0, 5)
  }

  return products.toSorted((a, b) => Number(b.sold || 0) - Number(a.sold || 0)).slice(0, 5)
}

function MetricDetailModal({ metric, onClose, products }) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const relatedProducts = useMemo(() => getMetricProducts(metric, products), [metric, products])
  const isTotalProducts = metric?.icon === 'inventory_2'

  if (!metric) return null

  return (
    <Modal onClose={onClose} title={metric.label}>
      <div className="grid gap-5 p-5">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">{t('common.detail')}</p>
              <p className="mt-2 font-heading text-3xl font-bold text-primary">{metric.value}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{metric.note}</p>
            </div>
            <span className="material-symbols-outlined rounded-2xl bg-white p-4 text-3xl text-primary">{metric.icon}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button icon="arrow_back" onClick={onClose} type="button" variant="secondary">
            {t('actions.back')}
          </Button>
          <Button icon="inventory_2" onClick={() => navigate('/dashboard/inventory')} type="button" variant="secondary">
            {t('actions.openInventory')}
          </Button>
          {isTotalProducts ? (
            <Button icon="add" onClick={() => navigate('/dashboard/inventory')} type="button">
              {t('inventory.actions.addProduct')}
            </Button>
          ) : (
            <Button icon="add" onClick={() => navigate('/dashboard/inventory')} type="button">
              {t('inventory.actions.addProduct')}
            </Button>
          )}
        </div>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-xl font-bold text-on-surface">{t('dashboard.relatedProducts')}</h3>
            <Badge tone={relatedProducts.length ? 'info' : 'neutral'}>{relatedProducts.length}</Badge>
          </div>

          {relatedProducts.length ? relatedProducts.map((product) => (
            <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between" key={product.id}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low text-[10px] font-bold text-outline">
                  {product.image ? <img alt="" className="h-full w-full object-cover" src={product.image} /> : product.imageSize}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-on-surface">{product.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {product.sku} / {product.category} / {t('inventory.table.stock')} {product.stock}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button icon="open_in_new" onClick={() => navigate(`/dashboard/product/${product.id}`)} type="button" variant="secondary">
                  {t('common.detail')}
                </Button>
                <Button icon="edit" onClick={() => navigate('/dashboard/inventory')} type="button" variant="ghost">
                  {t('actions.edit')}
                </Button>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
              {t('dashboard.metricEmpty')}
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}

export default function HomeIn() {
  const { user } = useAuth()
  const { t } = useI18n()
  const inventory = useInventory(user?.name)
  const navigate = useNavigate()
  const [activeMetricLabel, setActiveMetricLabel] = useState(null)
  const [activeTab, setActiveTab] = useState('charts')
  const [comparison, setComparison] = useState(null)
  const [businessProfile, setBusinessProfile] = useState(null)
  const [businessTypes, setBusinessTypes] = useState([])

  useEffect(() => { let active = true; getInventoryComparison().then((value) => { if (active) setComparison(value) }).catch(() => { if (active) setComparison(null) }); return () => { active = false } }, [])
  useEffect(() => { let active = true; Promise.all([getMyBusiness(), getBusinessTypes()]).then(([company, types]) => { if (active) { setBusinessProfile(company); setBusinessTypes(types) } }).catch(() => {}); return () => { active = false } }, [])

  const stats = useMemo(() => getInventoryStats(inventory.products, t, comparison), [comparison, inventory.products, t])
  const activeMetric = useMemo(
    () => stats.find((stat) => stat.label === activeMetricLabel) || null,
    [activeMetricLabel, stats],
  )
  const alerts = useMemo(() => getInventoryAlerts(inventory.products, t), [inventory.products, t])
  const highlightedProducts = useMemo(
    () =>
      inventory.products
        .toSorted((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
        .slice(0, 4),
    [inventory.products],
  )

  return (
    <DashboardShell
      action={<Button icon="inventory_2" type="button" onClick={() => navigate('/dashboard/inventory')}>{t('actions.openInventory')}</Button>}
      searchPlaceholder={t('dashboard.searchPlaceholder')}
      subtitle={t('dashboard.subtitle')}
      title={t('dashboard.executiveSummary')}
    >
      {businessProfile ? <Card className="mb-3 flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-2xl text-primary">{businessTypes.find((type) => type.id === businessProfile.businessTypeId)?.icon || 'domain'}</span><div><p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Empresa</p><h2 className="font-heading text-xl font-bold">{businessProfile.name}</h2><p className="text-sm text-on-surface-variant">Tipo: {businessTypes.find((type) => type.id === businessProfile.businessTypeId)?.name || 'Sin clasificar'}</p></div></Card> : null}
      <div data-tour="metrics">
        <Carousel
          ariaLabel={t('dashboard.metrics.totalProducts')}
          gridClassName="sm:auto-cols-[minmax(240px,1fr)] 2xl:auto-cols-[minmax(210px,1fr)]"
          items={stats.map((stat) => ({
            key: stat.label,
            node: (
              <button
                className="h-full w-full rounded-2xl text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                onClick={() => setActiveMetricLabel(stat.label)}
                type="button"
              >
                <div className="h-full rounded-2xl border border-outline-variant bg-white p-3 shadow-sm transition hover:border-primary hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{stat.label}</p>
                      <p className="mt-2 truncate font-heading text-xl font-bold text-primary">{stat.value}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{stat.note}</p>
                      <p className="mt-2 text-xs font-bold text-primary">{t('actions.open')}</p>
                    </div>
                    <span className="material-symbols-outlined rounded-xl bg-surface-container-low p-2 text-primary">{stat.icon}</span>
                  </div>
                </div>
              </button>
            ),
          }))}
        />
      </div>

      <Card className="mt-3 overflow-hidden" data-tour="visual-tabs">
        <div className="flex flex-col gap-3 border-b border-outline-variant bg-surface-container-low p-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-on-surface">{t('dashboard.visualization')}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t('dashboard.visualizationHelp')}</p>
          </div>
          <div className="grid grid-cols-3 rounded-2xl border border-outline-variant bg-white p-1">
            {[
              { icon: 'bar_chart', label: t('dashboard.tabs.charts'), value: 'charts' },
              { icon: 'notifications', label: t('dashboard.tabs.alerts'), value: 'alerts' },
              { icon: 'inventory_2', label: t('dashboard.tabs.products'), value: 'products' },
            ].map((tab) => {
              const active = activeTab === tab.value

              return (
                <button
                  className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-bold transition sm:gap-2 sm:px-3 sm:text-sm ${
                    active ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                  }`}
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-3">
          {activeTab === 'charts' ? (
            <Suspense fallback={<div className="grid gap-3 xl:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>}>
              <InventoryCharts products={inventory.products} />
            </Suspense>
          ) : null}

          {activeTab === 'alerts' ? (
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1">
                {alerts.slice(0, 8).map((alert) => (
                  <Link className="rounded-xl border border-outline-variant p-3 transition hover:border-primary hover:bg-surface-container-low" key={alert.id} to={`/dashboard/product/${alert.productId}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge tone={alert.severity === 'error' ? 'danger' : alert.severity}>{alert.title}</Badge>
                        <p className="mt-2 text-sm font-semibold text-on-surface">{alert.message}</p>
                      </div>
                      <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    </div>
                  </Link>
                ))}
                {!alerts.length ? <p className="rounded-xl border border-dashed border-outline-variant p-4 text-sm text-on-surface-variant">{t('dashboard.noAlerts')}</p> : null}
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 lg:w-56">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">{t('common.active')}</p>
                <p className="mt-2 font-heading text-4xl font-bold text-primary">{alerts.length}</p>
                <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" to="/dashboard/alerts">
                  {t('actions.showMore')}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
            </div>
          ) : null}

          {activeTab === 'products' ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-on-surface-variant">{t('dashboard.featuredActivity')}</p>
                <Link className="text-sm font-bold text-primary hover:underline" to="/dashboard/inventory">{t('dashboard.viewAll')}</Link>
              </div>
              <Carousel
                ariaLabel={t('dashboard.featuredActivity')}
                gridClassName="auto-cols-[minmax(min(280px,calc(100vw-2rem)),1fr)] lg:auto-cols-[minmax(330px,1fr)]"
                items={highlightedProducts.map((product) => ({
                  key: product.id,
                  node: <ProductInsightCard product={product} />,
                }))}
                viewportClassName="-mx-3 px-3 sm:px-12"
              />
            </div>
          ) : null}
        </div>
      </Card>

      {activeMetric ? (
        <MetricDetailModal
          metric={activeMetric}
          onClose={() => setActiveMetricLabel(null)}
          products={inventory.products}
        />
      ) : null}
    </DashboardShell>
  )
}
