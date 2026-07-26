import { Link } from 'react-router-dom'
import { formatCurrency, getProductProfit } from '../../data/dashboard'
import { useI18n } from '../../hooks/useI18n'
import { getStockStatus } from '../../utils/productUtils'
import Badge from '../atoms/Badge'
import EmptyState from '../molecules/EmptyState'

function StockBar({ product }) {
  const { t } = useI18n()
  const status = getStockStatus(product)
  const percent = Math.min(100, Math.round((Number(product.stock) / Math.max(Number(product.minStock) * 4, 1)) * 100))
  const color = status === 'out' || status === 'low' ? 'bg-error' : status === 'medium' ? 'bg-tertiary-fixed-dim' : 'bg-emerald-500'

  return (
    <div className="min-w-0 sm:min-w-28">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`text-[11px] font-bold ${status === 'out' || status === 'low' ? 'text-error' : 'text-on-surface-variant'}`}>{t('plurals.units', { count: product.stock })}</span>
        <span className="text-[11px] font-bold text-on-surface-variant">{t('products.minStock')} {product.minStock}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-container-highest">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function ProductImage({ product }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low text-[8px] font-bold leading-tight text-outline">
      {product.image ? <img alt="" className="h-full w-full object-cover" src={product.image} /> : product.imageSize}
    </div>
  )
}

function ProductIdentity({ product }) {
  const { t } = useI18n()

  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProductImage product={product} />
      <div className="min-w-0">
        <Link className="block truncate text-sm font-bold text-on-surface hover:text-primary" to={`/dashboard/product/${product.id}`}>
          {product.name}
        </Link>
        <p className="truncate text-xs text-on-surface-variant">{t('products.sku')}: {product.sku}</p>
      </div>
    </div>
  )
}

function statusTone(status) {
  if (status === 'Descontinuado') return 'danger'
  if (status === 'Inactivo') return 'warning'
  return 'success'
}

export default function ProductList({
  canDelete = true,
  canEdit = true,
  canSelect = true,
  highlightedProductId = '',
  onDelete,
  onEdit,
  onSelectAll,
  onToggleSelected,
  products,
  selectedIds,
}) {
  const { t } = useI18n()

  if (!products.length) {
    return (
      <EmptyState
        description={t('inventory.emptyDescription')}
        icon="inventory_2"
        title={t('inventory.empty')}
      />
    )
  }

  const allSelected = products.length > 0 && products.every((product) => selectedIds.includes(product.id))

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm xl:max-h-[calc(100dvh-23.5rem)]" data-tour="product-list">
      <div className="hidden overflow-auto xl:block xl:max-h-[calc(100dvh-23.5rem)]">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-surface-container-low">
            <tr>
              {canSelect ? (
                <th className="px-3 py-2">
                  <input aria-label={t('inventory.table.selectAll')} checked={allSelected} className="h-4 w-4 accent-primary" onChange={onSelectAll} type="checkbox" />
                </th>
              ) : null}
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{t('inventory.table.product')}</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{t('inventory.table.brand')}</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{t('inventory.table.category')}</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{t('inventory.table.price')}</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{t('inventory.table.profit')}</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{t('inventory.table.stock')}</th>
              <th className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{t('inventory.table.status')}</th>
              <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{t('inventory.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {products.map((product) => {
              const highlighted = product.id === highlightedProductId

              return (
              <tr className={`transition hover:bg-surface-container-low ${highlighted ? 'bg-primary-container/35 ring-2 ring-inset ring-primary' : ''}`} key={product.id}>
                {canSelect ? (
                  <td className="px-3 py-2">
                    <input aria-label={t('inventory.selectProduct', { name: product.name })} checked={selectedIds.includes(product.id)} className="h-4 w-4 accent-primary" onChange={() => onToggleSelected(product.id)} type="checkbox" />
                  </td>
                ) : null}
                <td className="px-3 py-2">
                  <div className="grid gap-2">
                    {highlighted ? <Badge tone="success">{t('inventory.newBySimulation')}</Badge> : null}
                    <ProductIdentity product={product} />
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-on-surface-variant">{product.brand || t('products.noBrand')}</td>
                <td className="px-3 py-2"><Badge>{product.category}</Badge></td>
                <td className="px-3 py-2 text-xs text-on-surface">
                  <p>{formatCurrency(product.cost)}</p>
                  <p className="font-bold">{formatCurrency(product.price)}</p>
                </td>
                <td className="px-3 py-2 text-xs font-bold text-emerald-700">{formatCurrency(getProductProfit(product))}</td>
                <td className="px-3 py-2"><StockBar product={product} /></td>
                <td className="px-3 py-2"><Badge tone={statusTone(product.status)}>{product.status}</Badge></td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Link aria-label={t('common.detail')} className="material-symbols-outlined flex h-9 w-9 items-center justify-center rounded-lg text-xl text-on-surface-variant hover:bg-surface-container hover:text-primary" to={`/dashboard/product/${product.id}`}>open_in_new</Link>
                    {canEdit ? <button aria-label={t('actions.edit')} className="material-symbols-outlined h-9 w-9 rounded-lg text-xl text-primary hover:bg-surface-container" onClick={() => onEdit(product)} type="button">edit</button> : null}
                    {canDelete ? <button aria-label={t('actions.delete')} className="material-symbols-outlined h-9 w-9 rounded-lg text-xl text-error hover:bg-error-container" onClick={() => onDelete(product.id)} type="button">delete</button> : null}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:hidden">
        {canSelect ? (
          <label className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 text-sm font-bold text-on-surface-variant sm:col-span-2 lg:col-span-3">
            <input checked={allSelected} className="h-4 w-4 accent-primary" onChange={onSelectAll} type="checkbox" />
            {t('inventory.table.selectAll')}
          </label>
        ) : null}
        {products.map((product) => {
          const highlighted = product.id === highlightedProductId

          return (
          <article className={`flex min-w-0 flex-col rounded-2xl border bg-white p-3 ${highlighted ? 'border-primary shadow-lg shadow-primary/15 ring-2 ring-primary/20' : 'border-outline-variant'}`} key={product.id}>
            <div className="flex min-w-0 items-start gap-2">
              {canSelect ? (
                <input
                  aria-label={t('inventory.selectProduct', { name: product.name })}
                  checked={selectedIds.includes(product.id)}
                  className="mt-3 h-5 w-5 shrink-0 accent-primary"
                  onChange={() => onToggleSelected(product.id)}
                  type="checkbox"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <ProductIdentity product={product} />
              </div>
              <Badge tone={statusTone(product.status)}>{product.status}</Badge>
            </div>

            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
              <Badge>{product.category}</Badge>
              {highlighted ? <Badge tone="success">{t('inventory.newBySimulation')}</Badge> : null}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{t('inventory.table.brand')}</p>
                <p className="mt-0.5 truncate text-xs font-bold text-on-surface">{product.brand || t('products.noBrand')}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{t('inventory.table.price')}</p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {formatCurrency(product.cost)}
                  <span className="ml-2 font-bold text-on-surface">{formatCurrency(product.price)}</span>
                </p>
              </div>
              <div className="col-span-2">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">{t('inventory.table.stock')}</p>
                <StockBar product={product} />
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant pt-2">
              <p className="min-w-0 truncate text-xs font-bold text-emerald-700">
                {t('inventory.table.profit')}: {formatCurrency(getProductProfit(product))}
              </p>
              <div className="flex shrink-0 gap-1">
                <Link aria-label={t('common.detail')} className="material-symbols-outlined flex min-h-11 min-w-11 items-center justify-center rounded-xl text-xl text-on-surface-variant hover:bg-surface-container hover:text-primary" to={`/dashboard/product/${product.id}`}>open_in_new</Link>
                {canEdit ? <button aria-label={t('actions.edit')} className="material-symbols-outlined min-h-11 min-w-11 rounded-xl text-xl text-primary hover:bg-surface-container" onClick={() => onEdit(product)} type="button">edit</button> : null}
                {canDelete ? <button aria-label={t('actions.delete')} className="material-symbols-outlined min-h-11 min-w-11 rounded-xl text-xl text-error hover:bg-error-container" onClick={() => onDelete(product.id)} type="button">delete</button> : null}
              </div>
            </div>
          </article>
        )})}
      </div>
    </section>
  )
}
