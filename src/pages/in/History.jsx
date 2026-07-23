import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/atoms/Badge'
import Button from '../../components/atoms/Button'
import Card from '../../components/atoms/Card'
import EmptyState from '../../components/molecules/EmptyState'
import Modal from '../../components/molecules/Modal'
import DashboardShell from '../../components/organisms/DashboardShell'
import { useAppConfig } from '../../context/appConfigStore'
import { getHistory } from '../../services/historyApi'
import { getDentalHistory } from '../../services/healthService'

const commerceFilters = [
  { icon: 'all_inclusive', label: 'Todo', value: 'all' },
  { icon: 'add_circle', label: 'Creados', value: 'created' },
  { icon: 'edit_square', label: 'Editados', value: 'updated' },
  { icon: 'inventory', label: 'Stock', value: 'stock' },
  { icon: 'point_of_sale', label: 'Ventas', value: 'sales' },
  { icon: 'receipt_long', label: 'Comprobantes', value: 'receipts' },
  { icon: 'folder', label: 'Archivos', value: 'document' },
  { icon: 'delete', label: 'Eliminados', value: 'deleted' },
]

const hospitalityFilters = [
  { icon: 'all_inclusive', label: 'Todo', value: 'all' },
  { icon: 'bed', label: 'Habitaciones', value: 'rooms' },
  { icon: 'person', label: 'Huéspedes', value: 'guests' },
  { icon: 'event_available', label: 'Reservas', value: 'reservations' },
  { icon: 'meeting_room', label: 'Recepción', value: 'reception' },
  { icon: 'cleaning_services', label: 'Limpieza', value: 'housekeeping' },
  { icon: 'room_service', label: 'Consumos', value: 'consumptions' },
  { icon: 'receipt_long', label: 'Comprobantes', value: 'receipts' },
  { icon: 'folder', label: 'Archivos', value: 'document' },
]
const dentalFilters = [
  { icon: 'all_inclusive', label: 'Todo', value: 'all' },
  { icon: 'clinical_notes', label: 'Evoluciones', value: 'clinical' },
  { icon: 'dentistry', label: 'Odontograma', value: 'odontogram' },
  { icon: 'medical_services', label: 'Tratamientos', value: 'treatment' },
  { icon: 'event', label: 'Citas', value: 'appointment' },
  { icon: 'payments', label: 'Pagos', value: 'payment' },
  { icon: 'receipt_long', label: 'Comprobantes', value: 'receipts' },
  { icon: 'description', label: 'Docs. y recetas', value: 'document' },
]
const veterinaryFilters = [
  { icon: 'all_inclusive', label: 'Todo', value: 'all' },
  { icon: 'pets', label: 'Mascotas', value: 'pets' },
  { icon: 'event', label: 'Citas', value: 'appointment' },
  { icon: 'medical_services', label: 'Atenciones', value: 'clinical' },
  { icon: 'vaccines', label: 'Vacunas', value: 'vaccine' },
  { icon: 'payments', label: 'Pagos', value: 'payment' },
  { icon: 'receipt_long', label: 'Comprobantes', value: 'receipts' },
  { icon: 'folder', label: 'Archivos', value: 'document' },
]
const healthFilters = [
  { icon: 'all_inclusive', label: 'Todo', value: 'all' },
  { icon: 'personal_injury', label: 'Pacientes', value: 'patients' },
  { icon: 'event', label: 'Citas', value: 'appointment' },
  { icon: 'clinical_notes', label: 'Atenciones', value: 'clinical' },
  { icon: 'payments', label: 'Pagos', value: 'payment' },
  { icon: 'receipt_long', label: 'Comprobantes', value: 'receipts' },
  { icon: 'folder', label: 'Archivos', value: 'document' },
]
const dentalEventLabels={
  'dental.appointment':'Cita dental',
  'dental.clinical':'Evolución clínica',
  'dental.odontogram':'Actualización del odontograma',
  'dental.treatment':'Tratamiento dental',
  'dental.payment':'Pago dental',
  'dental.prescription':'Receta médica',
  'dental.document':'Documento clínico',
}
const veterinaryEventLabels = {
  'veterinary.pet.created': 'Mascota registrada',
  'veterinary.pet.updated': 'Expediente actualizado',
  'veterinary.appointment.created': 'Cita veterinaria',
  'veterinary.appointment.status': 'Estado de la cita',
  'veterinary.record.created': 'Atención veterinaria',
  'veterinary.vaccine.created': 'Vacuna registrada',
  'veterinary.payment.created': 'Pago veterinario',
  'veterinary.document.created': 'Archivo veterinario',
  'veterinary.document.deleted': 'Archivo eliminado',
  'veterinary.export.created': 'Reporte veterinario',
}

function classifyAction(action = '') {
  const normalized = action.toLowerCase()
  if (normalized.includes('receipt') || normalized.includes('invoice') || normalized.includes('comprobante')) return 'receipts'
  if (normalized.includes('attachment') || normalized.includes('document')) return 'document'
  if (normalized.includes('sale') || normalized.includes('venta')) return 'sales'
  if (normalized.includes('veterinary.pet')) return 'pets'
  if (normalized.includes('veterinary.vaccine')) return 'vaccine'
  if (normalized.includes('veterinary.record')) return 'clinical'
  if (normalized.includes('veterinary.payment')) return 'payment'
  if (normalized.includes('veterinary.document') || normalized.includes('veterinary.export')) return 'document'
  if (normalized.includes('veterinary.appointment')) return 'appointment'
  if (normalized.includes('health.patient')) return 'patients'
  if (normalized.includes('health.appointment')) return 'appointment'
  if (normalized.includes('health.clinical')) return 'clinical'
  if (normalized.includes('health.payment')) return 'payment'
  if (normalized.includes('dental.clinical')) return 'clinical'
  if (normalized.includes('dental.odontogram')) return 'odontogram'
  if (normalized.includes('dental.treatment')) return 'treatment'
  if (normalized.includes('dental.appointment')) return 'appointment'
  if (normalized.includes('dental.payment')) return 'payment'
  if (normalized.includes('dental.document') || normalized.includes('dental.prescription')) return 'document'

  if (normalized.includes('housekeeping')) return 'housekeeping'
  if (normalized.includes('consumo')) return 'consumptions'
  if (normalized.includes('charge')) return 'reservations'
  if (normalized.includes('checked_in') || normalized.includes('checked_out')) return 'reception'
  if (normalized.includes('reservation')) return 'reservations'
  if (normalized.includes('guest')) return 'guests'
  if (normalized.includes('room')) return 'rooms'

  if (normalized.includes('creado') || normalized.includes('agregado')) return 'created'
  if (normalized.includes('eliminado') || normalized.includes('quitar')) return 'deleted'
  if (normalized.includes('stock') || normalized.includes('reposicion') || normalized.includes('agotado')) return 'stock'
  if (normalized.includes('precio')) return 'price'
  if (normalized.includes('editado') || normalized.includes('modificado') || normalized.includes('masiva') || normalized.includes('duplicado')) return 'updated'
  return 'updated'
}

function toneForType(type) {
  if (type === 'created') return 'success'
  if (type === 'deleted') return 'danger'
  if (type === 'stock' || type === 'price' || type === 'housekeeping') return 'warning'
  if (type === 'reception' || type === 'reservations') return 'info'
  return 'neutral'
}

function iconForType(type) {
  const icons = {
    created: 'add_circle',
    deleted: 'delete',
    price: 'payments',
    stock: 'inventory',
    updated: 'edit_square',
    rooms: 'bed',
    guests: 'person',
    reservations: 'event_available',
    reception: 'meeting_room',
    housekeeping: 'cleaning_services',
    consumptions: 'room_service',
    clinical: 'clinical_notes', odontogram: 'dentistry', treatment: 'medical_services', appointment: 'event', payment: 'payments', document: 'description',
    sales: 'point_of_sale', receipts: 'receipt_long',
    pets: 'pets', vaccine: 'vaccines', patients: 'personal_injury',
  }

  return icons[type] || 'history'
}

function eventLabel(action, filters) {
  return dentalEventLabels[action]
    || veterinaryEventLabels[action]
    || filters.find((item) => item.value === classifyAction(action))?.label
    || action?.replaceAll('.', ' · ')
    || 'Evento registrado'
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function getSummary(history, filters) {
  return filters
    .filter((filter) => filter.value !== 'all')
    .map((filter) => ({
      ...filter,
      count: history.filter((entry) => classifyAction(entry.action) === filter.value).length,
    }))
}

export default function History() {
  const { config } = useAppConfig()
  const dashboardKey = config?.template?.dashboardKey
  const isHospitality = dashboardKey === 'hospitality'
  const isDental = dashboardKey === 'dental'
  const isVeterinary = dashboardKey === 'veterinary'
  const isHealth = ['health', 'clinic', 'medical'].includes(dashboardKey)
  const actionFilters = isDental
    ? dentalFilters
    : isVeterinary
      ? veterinaryFilters
      : isHealth
        ? healthFilters
        : isHospitality
          ? hospitalityFilters
          : commerceFilters
  const [activeFilter, setActiveFilter] = useState('all')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEntry,setSelectedEntry]=useState(null)

  useEffect(() => {
    let active = true
    const request = isDental
      ? () => Promise.all([getDentalHistory(), getHistory()]).then(([clinical, activity]) => {
          const unique = new Map([...clinical, ...activity].map((entry) => [entry.id, entry]))
          return [...unique.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        })
      : getHistory
    request().then((entries) => { if (active) setHistory(entries) }).catch((requestError) => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [dashboardKey, isDental])

  const summary = useMemo(() => getSummary(history, actionFilters), [actionFilters, history])
  const filteredHistory = useMemo(
    () => (activeFilter === 'all' ? history : history.filter((entry) => classifyAction(entry.action) === activeFilter)),
    [activeFilter, history],
  )
  const lastEntry = history[0]

  const title = isDental ? 'Historial dental' : isVeterinary ? 'Historial veterinario' : isHealth ? 'Historial clínico' : 'Historial'
  const subtitle = isDental
    ? 'Línea de tiempo clínica de pacientes, citas, odontogramas, tratamientos y pagos.'
    : isVeterinary
      ? 'Línea de tiempo de mascotas, citas, atenciones, vacunas, archivos y comprobantes.'
      : isHealth
        ? 'Línea de tiempo de pacientes, citas, atenciones, archivos y pagos.'
        : isHospitality
          ? 'Línea de tiempo de habitaciones, huéspedes, reservas, recepción, servicios y comprobantes.'
          : 'Línea de tiempo de productos, ventas, comprobantes y movimientos del negocio.'

  return (
    <DashboardShell
      subtitle={subtitle}
      title={title}
    >
      {loading ? <Card className="p-6">Cargando historial...</Card> : null}
      {!loading && error ? <EmptyState description={error} icon="cloud_off" title="No se pudo cargar el historial" /> : null}
      {!loading && !error && history.length ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="grid gap-3 xl:hidden">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Movimientos</p>
                  <h2 className="mt-1 font-heading text-3xl font-bold text-primary">{history.length}</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                  <span className="material-symbols-outlined">history</span>
                </span>
              </div>
              {lastEntry ? (
                <div className="mt-3 rounded-2xl bg-surface-container-low p-3">
                  <p className="truncate text-sm font-bold text-on-surface">{lastEntry.action}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(lastEntry.createdAt)}</p>
                </div>
              ) : null}
            </Card>

            <Card className="p-3">
              <div className="interactive-scroll flex snap-x gap-2 overflow-x-auto pb-1">
                {summary.map((item) => (
                  <div className="min-w-36 snap-start rounded-2xl bg-surface-container-low p-3" key={item.value}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="material-symbols-outlined text-lg text-primary">{item.icon}</span>
                      <Badge tone={toneForType(item.value)}>{item.count}</Badge>
                    </div>
                    <p className="mt-2 truncate text-sm font-bold text-on-surface">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <div className="grid gap-4">
            <Card className="p-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {actionFilters.map((filter) => {
                  const active = activeFilter === filter.value

                  return (
                    <button
                      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
                        active
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary hover:text-primary'
                      }`}
                      key={filter.value}
                      onClick={() => setActiveFilter(filter.value)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">{filter.icon}</span>
                      {filter.label}
                    </button>
                  )
                })}
              </div>
            </Card>

            <div className="grid max-h-[68vh] gap-3 overflow-y-auto overscroll-contain pr-2">
              {filteredHistory.length ? filteredHistory.map((entry) => {
                const type = classifyAction(entry.action)

                return (
                  <button className="min-w-0 text-left" key={entry.id} onClick={()=>setSelectedEntry(entry)} type="button"><Card className="p-3 transition hover:border-primary hover:shadow-md sm:p-4">
                    <div className="flex min-w-0 gap-3 sm:gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                        <span className="material-symbols-outlined">{iconForType(type)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone={toneForType(type)}>{eventLabel(entry.action, actionFilters)}</Badge>
                              <span className="text-xs font-bold text-on-surface-variant">{formatDateTime(entry.createdAt)}</span>
                            </div>
                            <h2 className="mt-2 truncate text-base font-bold text-on-surface">{entry.productName || 'Movimiento general'}</h2>
                          </div>
                          <div className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface-variant">
                            {entry.user || 'Sistema'}
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-on-surface-variant">{entry.details || 'Cambio registrado correctamente.'}</p>
                      </div>
                    </div>
                    <p className="mt-3 flex items-center justify-end gap-1 text-xs font-bold text-primary">Ver detalle <span className="material-symbols-outlined text-base">chevron_right</span></p>
                  </Card></button>
                )
              }) : (
                <EmptyState description="Cambia el filtro para ver otros movimientos registrados." icon="filter_alt_off" title="Sin resultados" />
              )}
            </div>
          </div>

          <aside className="hidden h-max gap-4 xl:sticky xl:top-24 xl:grid">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-on-surface-variant">Movimientos</p>
                  <h2 className="mt-1 font-heading text-4xl font-bold text-primary">{history.length}</h2>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                  <span className="material-symbols-outlined">history</span>
                </span>
              </div>
              {lastEntry ? (
                <div className="mt-5 rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase text-on-surface-variant">Ultimo evento</p>
                  <p className="mt-2 text-sm font-bold text-on-surface">{lastEntry.action}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(lastEntry.createdAt)}</p>
                </div>
              ) : null}
            </Card>

            <Card className="p-4">
              <p className="mb-3 text-sm font-bold text-on-surface">Resumen por tipo</p>
              <div className="grid gap-2">
                {summary.map((item) => (
                  <div className="flex items-center justify-between rounded-2xl bg-surface-container-low px-3 py-2" key={item.value}>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant">
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                      {item.label}
                    </span>
                    <Badge tone={toneForType(item.value)}>{item.count}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      ) : !loading && !error ? (
        <EmptyState description={isDental
          ? 'Las citas, evoluciones y tratamientos aparecerán aquí automáticamente.'
          : isVeterinary
            ? 'Las mascotas, citas, atenciones, vacunas, pagos y archivos aparecerán aquí automáticamente.'
            : isHealth
              ? 'Los pacientes, citas, atenciones, pagos y archivos aparecerán aquí automáticamente.'
              : isHospitality
                ? 'Las reservas, ingresos, salidas, servicios y comprobantes aparecerán aquí automáticamente.'
                : 'Las ventas, comprobantes y movimientos del inventario aparecerán aquí automáticamente.'} icon="history" title="Sin historial" />
      ) : null}
      {selectedEntry ? (
        <Modal onClose={() => setSelectedEntry(null)} title="Detalle del historial">
          <div className="grid gap-3 p-4 sm:p-5">
            <div className="flex items-start gap-3 rounded-2xl bg-primary-fixed p-4">
              <span className="material-symbols-outlined grid size-11 shrink-0 place-items-center rounded-xl bg-white text-primary">
                {iconForType(classifyAction(selectedEntry.action))}
              </span>
              <div className="min-w-0">
                <Badge tone={toneForType(classifyAction(selectedEntry.action))}>{eventLabel(selectedEntry.action, actionFilters)}</Badge>
                <h2 className="mt-2 text-xl font-bold">{selectedEntry.subject?.label || selectedEntry.productName || selectedEntry.metadata?.entityName || 'Evento registrado'}</h2>
                {selectedEntry.subject?.detail ? <p className="text-sm text-on-surface-variant">{selectedEntry.subject.detail}</p> : null}
                <p className="text-xs text-on-surface-variant">{formatDateTime(selectedEntry.createdAt)}</p>
              </div>
            </div>
            {selectedEntry.patient ? (
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-fixed font-bold text-primary">
                      {selectedEntry.patient.name.split(' ').map((value) => value[0]).slice(0, 2).join('')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Paciente</p>
                      <b className="block truncate text-lg">{selectedEntry.patient.name}</b>
                      <p className="text-xs text-on-surface-variant">{selectedEntry.patient.documentType} {selectedEntry.patient.document}</p>
                    </div>
                  </div>
                  <Link className="rounded-xl border border-primary px-3 py-2 text-sm font-bold text-primary" onClick={() => setSelectedEntry(null)} to="/dashboard/patients">Abrir expediente</Link>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p><b>Teléfono:</b> {selectedEntry.patient.phone || 'No registrado'}</p>
                  <p className="truncate"><b>Correo:</b> {selectedEntry.patient.email || 'No registrado'}</p>
                  <p className={selectedEntry.patient.allergies ? 'rounded-lg bg-error-container p-2' : 'text-on-surface-variant'}><b>Alergias:</b> {selectedEntry.patient.allergies || 'Sin alergias registradas'}</p>
                  <p><b>Condiciones:</b> {selectedEntry.patient.chronicConditions || 'Sin condiciones registradas'}</p>
                </div>
              </Card>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="p-3"><p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Responsable</p><p className="mt-1 font-bold">{selectedEntry.user || 'Sistema'}</p></Card>
              <Card className="p-3"><p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Tipo de evento</p><p className="mt-1 font-bold">{eventLabel(selectedEntry.action, actionFilters)}</p></Card>
            </div>
            <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Detalle</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selectedEntry.details || 'Sin información adicional.'}</p></Card>
            {selectedEntry.subject?.receipt ? (
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Comprobante relacionado</p>
                  <p className="mt-1 font-bold">{selectedEntry.subject.receipt}</p>
                </div>
                <Link className="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary" onClick={() => setSelectedEntry(null)} to="/dashboard/invoices">Ver comprobantes</Link>
              </Card>
            ) : null}
            {selectedEntry.subject?.route ? <Link className="rounded-xl border border-primary px-4 py-3 text-center font-bold text-primary" onClick={() => setSelectedEntry(null)} to={selectedEntry.subject.route}>Abrir registro relacionado</Link> : null}
            <Button onClick={() => setSelectedEntry(null)} type="button">Cerrar detalle</Button>
          </div>
        </Modal>
      ) : null}
    </DashboardShell>
  )
}
