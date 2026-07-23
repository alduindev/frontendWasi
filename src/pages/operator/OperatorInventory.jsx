import { useMemo, useState } from 'react'
import Card from '../../components/atoms/Card'
import EmptyState from '../../components/molecules/EmptyState'
import OperatorShell from '../../components/operator/OperatorShell'
import { useOperatorProducts } from '../../hooks/useOperatorProducts'
import { formatCurrency } from '../../data/dashboard'

export default function OperatorInventory() {
  const { products, loading, error, retry } = useOperatorProducts(); const [query, setQuery] = useState('')
  const visible = useMemo(() => { const q=query.trim().toLowerCase(); return q ? products.filter((p)=>[p.name,p.sku,p.barcode,p.category].some((value)=>String(value||'').toLowerCase().includes(q))) : products }, [products,query])
  return <OperatorShell subtitle="Consulta precio de venta y disponibilidad." title="Productos">
    <div className="relative mb-4"><span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span><input autoFocus className="min-h-14 w-full rounded-2xl border border-outline-variant bg-white pl-12 pr-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar por nombre, SKU, codigo o categoria" value={query} /></div>
    {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((x)=><Card className="h-44 animate-pulse" key={x} />)}</div> : null}
    {!loading && error ? <EmptyState action={{children:'Reintentar',onClick:retry}} description={error} icon="cloud_off" title="No se pudieron cargar los productos" /> : null}
    {!loading && !error && !visible.length ? <EmptyState description="Prueba otra busqueda." icon="search_off" title="Sin resultados" /> : null}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{visible.map((product)=><Card className="overflow-hidden p-0" key={product.id}><div className="flex aspect-[16/9] items-center justify-center bg-surface-container-low">{product.imageUrl ? <img alt={product.name} className="h-full w-full object-cover" src={product.imageUrl} /> : <span className="material-symbols-outlined text-5xl text-outline">inventory_2</span>}</div><div className="p-4"><p className="truncate font-bold">{product.name}</p><p className="mt-1 text-xs text-on-surface-variant">{product.sku} · {product.category}</p><div className="mt-4 flex items-end justify-between"><p className="text-xl font-bold text-primary">{formatCurrency(product.price)}</p><span className={`rounded-full px-2 py-1 text-xs font-bold ${product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-error-container text-error'}`}>Stock {product.stock}</span></div></div></Card>)}</div>
  </OperatorShell>
}
