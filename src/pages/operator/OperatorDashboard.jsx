import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/atoms/Card'
import Skeleton from '../../components/atoms/Skeleton'
import OperatorShell from '../../components/operator/OperatorShell'
import { useAuth } from '../../context/authStore'
import { useAppConfig } from '../../context/appConfigStore'
import { formatCurrency } from '../../data/dashboard'
import { getHousekeepingTasks } from '../../services/hospitalityService'
import { getOperatorInvoices, getOperatorSummary } from '../../services/operatorService'
import { useLiveRefresh } from '../../hooks/useLiveRefresh'
import DentalOperatorDashboard from './DentalOperatorDashboard'
import VeterinaryOperatorDashboard from './VeterinaryOperatorDashboard'

const shortcuts = [
  { functionCode: 'reception', icon: 'concierge', label: 'Recepción', note: 'Llegadas, huéspedes y salidas', to: '/pos/reception', primary: true },
  { functionCode: 'hospitality-supervisor', icon: 'manage_accounts', label: 'Supervisión', note: 'Monitorear toda la operación', to: '/pos/supervision', primary: true },
  { functionCode: 'cashier', icon: 'point_of_sale', label: 'Nueva venta', note: 'Abrir carrito y atender', to: '/pos/sale', primary: true },
  { functionCode: 'inventory', icon: 'inventory_2', label: 'Productos', note: 'Consultar precio y stock', to: '/pos/products' },
  { functionCode: 'cashier', icon: 'receipt_long', label: 'Mis comprobantes', note: 'Revisar ventas emitidas', to: '/pos/invoices' },
  { functionCode: 'cashier', icon: 'history', label: 'Mi historial', note: 'Ver mi actividad de ventas', to: '/pos/history' },
  { functionCode: 'housekeeping', icon: 'cleaning_services', label: 'Mis habitaciones', note: 'Revisar limpiezas asignadas', to: '/pos/housekeeping', primary: true },
]
const departments = { maintenance: ['home_repair_service','Mantenimiento'], security: ['security','Seguridad'], laundry: ['local_laundry_service','Lavandería'], kitchen: ['skillet','Cocina'], purchasing: ['shopping_cart','Compras'], 'customer-service': ['support_agent','Atención al cliente'], 'room-service': ['room_service','Room service'] }

export default function OperatorDashboard() {
  const { user } = useAuth()
  const { config, isLoading } = useAppConfig()
  const [summary, setSummary] = useState(null)
  const [sales, setSales] = useState([])
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState('')
  const functions = useMemo(() => new Set(config?.user?.functions?.map(item => item.code) || []), [config])
  const hospitality = config?.template?.dashboardKey === 'hospitality'
  const canSell = !hospitality ? (config?.capabilities || []).includes('sales.create') : functions.has('cashier')
  const canInventory = !hospitality ? (config?.capabilities || []).some(value => value.startsWith('inventory.')) : functions.has('inventory')
  const canClean = functions.has('housekeeping')
  const visibleShortcuts = [...shortcuts.filter(item => !hospitality || functions.has(item.functionCode)), ...Object.entries(departments).filter(([code]) => hospitality && functions.has(code)).map(([code,[icon,label]]) => ({ functionCode: code, icon, label, note: 'Ver órdenes asignadas', to: `/pos/functions/${code}` }))]

  useEffect(() => {
    let active = true
    if (canSell) Promise.all([getOperatorSummary(), getOperatorInvoices()]).then(([data, invoices]) => { if (active) { setSummary(data); setSales(invoices.slice(0, 3)) } }).catch(requestError => { if (active) setError(requestError.message) })
    else if (canInventory) getOperatorSummary().then(data => { if (active) setSummary(data) }).catch(requestError => { if (active) setError(requestError.message) })
    if (canClean) getHousekeepingTasks().then(data => { if (active) setTasks(data) }).catch(requestError => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [canClean, canInventory, canSell])

  useEffect(() => { if (!canClean) return undefined; const id = setInterval(() => { if (document.visibilityState === 'visible') getHousekeepingTasks().then(setTasks).catch(() => {}) }, 3000); return () => clearInterval(id) }, [canClean])
  useLiveRefresh(() => {
    if (canSell) Promise.all([getOperatorSummary(), getOperatorInvoices()]).then(([data, invoices]) => { setSummary(data); setSales(invoices.slice(0, 3)) }).catch(() => {})
    else if (canInventory) getOperatorSummary().then(setSummary).catch(() => {})
    if (canClean) getHousekeepingTasks().then(setTasks).catch(() => {})
  }, ['/operator', '/hospitality', '/products'])

  if (config?.template?.dashboardKey === 'dental') return <DentalOperatorDashboard />
  if (config?.template?.dashboardKey === 'veterinary') return <VeterinaryOperatorDashboard />

  if (!isLoading && config && !functions.size && hospitality) return <OperatorShell subtitle="Tu cuenta está activa, pero todavía no tienes funciones operativas asignadas." title={`Hola, ${user.name}`}><Card className="p-8 text-center"><span className="material-symbols-outlined text-5xl text-primary">lock_person</span><h2 className="mt-3 text-xl font-bold">Sin accesos asignados</h2><p className="mt-2 text-sm text-on-surface-variant">Solicita al administrador que te asigne una función.</p><Link className="mt-4 inline-block font-bold text-primary" to="/pos/profile">Ver mi perfil</Link></Card></OperatorShell>

  const activeTasks = tasks.filter(task => ['pending', 'assigned', 'in_progress'].includes(task.status))
  const primary = canClean ? { to: '/pos/housekeeping', eyebrow: 'Housekeeping', title: 'Mis habitaciones', note: `${activeTasks.length} tarea(s) activa(s)`, icon: 'cleaning_services' } : canSell ? { to: hospitality ? '/pos/hotel-cashier' : '/pos/sale', eyebrow: 'Caja', title: hospitality ? 'Cuentas hoteleras' : 'Nueva venta', note: hospitality ? 'Cobrar estancias y consumos' : 'Buscar productos y cobrar', icon: hospitality ? 'payments' : 'point_of_sale' } : canInventory ? { to: '/pos/products', eyebrow: 'Inventario', title: 'Consultar productos', note: 'Precios y existencias', icon: 'inventory_2' } : null

  return <OperatorShell subtitle="Herramientas habilitadas según tus funciones asignadas." title={`Hola, ${user.name}`}>{primary ? <Link className="group flex min-h-32 items-center justify-between rounded-3xl bg-primary p-5 text-white shadow-xl shadow-primary/20 transition hover:-translate-y-0.5 sm:p-7" to={primary.to}><div><p className="text-sm font-bold uppercase tracking-widest text-primary-fixed">{primary.eyebrow}</p><p className="mt-2 font-heading text-3xl font-bold">{primary.title}</p><p className="mt-1 text-sm text-primary-fixed">{primary.note}</p></div><span className="material-symbols-outlined text-5xl transition group-hover:scale-110">{primary.icon}</span></Link> : null}{error ? <div className="mt-4 rounded-2xl border border-error-container bg-error-container p-4 text-sm">{error}</div> : null}{canClean ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><Card className="p-4"><span className="material-symbols-outlined text-primary">pending_actions</span><p className="mt-3 text-3xl font-bold">{tasks.filter(task => ['pending', 'assigned'].includes(task.status)).length}</p><p className="text-sm text-on-surface-variant">Por iniciar</p></Card><Card className="p-4"><span className="material-symbols-outlined text-amber-600">cleaning_services</span><p className="mt-3 text-3xl font-bold">{tasks.filter(task => task.status === 'in_progress').length}</p><p className="text-sm text-on-surface-variant">En progreso</p></Card><Card className="p-4"><span className="material-symbols-outlined text-emerald-600">task_alt</span><p className="mt-3 text-3xl font-bold">{tasks.filter(task => task.status === 'completed').length}</p><p className="text-sm text-on-surface-variant">Completadas</p></Card></div> : null}{!canClean && (canSell || canInventory) ? <div className="mt-4 grid gap-3 sm:grid-cols-3">{summary ? <><Card className="p-4"><span className="material-symbols-outlined text-primary">inventory_2</span><p className="mt-3 text-3xl font-bold">{summary.availableProducts}</p><p className="text-sm text-on-surface-variant">Productos disponibles</p></Card><Card className="p-4"><span className="material-symbols-outlined text-amber-600">warning</span><p className="mt-3 text-3xl font-bold">{summary.lowStockProducts}</p><p className="text-sm text-on-surface-variant">Stock bajo</p></Card>{canSell ? <Card className="p-4"><span className="material-symbols-outlined text-emerald-600">shopping_bag</span><p className="mt-3 text-3xl font-bold">{summary.salesToday}</p><p className="text-sm text-on-surface-variant">Ventas hoy</p></Card> : null}</> : [1, 2, 3].map(item => <Skeleton className="h-32" key={item} />)}</div> : null}<h2 className="mt-7 font-heading text-xl font-bold">Accesos habilitados</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{visibleShortcuts.map(item => <Link className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${item.primary ? 'border-primary bg-primary/5' : 'border-outline-variant bg-white'}`} key={item.to} to={item.to}><span className="material-symbols-outlined text-2xl text-primary">{item.icon}</span><p className="mt-3 font-bold">{item.label}</p><p className="mt-1 text-sm text-on-surface-variant">{item.note}</p></Link>)}</div>{canSell ? <><div className="mt-7 flex items-center justify-between"><h2 className="font-heading text-xl font-bold">Mis últimas ventas</h2><Link className="text-sm font-bold text-primary" to="/pos/history">Ver historial</Link></div><div className="mt-3 grid gap-3">{sales.length ? sales.map(sale => <Card className="flex items-center justify-between gap-3 p-4" key={sale.id}><div><p className="font-bold">{sale.series}-{String(sale.number).padStart(8, '0')}</p><p className="text-xs text-on-surface-variant">{new Date(sale.issuedAt).toLocaleString('es-PE')} · {sale.customerName}</p></div><b className="text-primary">{formatCurrency(sale.total)}</b></Card>) : <p className="rounded-2xl border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">Aún no registraste ventas.</p>}</div></> : null}</OperatorShell>
}
