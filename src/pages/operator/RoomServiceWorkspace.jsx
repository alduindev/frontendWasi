import OperatorShell from '../../components/operator/OperatorShell'
import RoomServiceOrder from './RoomServiceOrder'
import { Link } from 'react-router-dom'

export default function RoomServiceWorkspace() {
  return <OperatorShell title="Room service" subtitle="Pedidos, consumos y solicitudes asignadas a tu cuenta."><div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-outline-variant bg-primary-fixed p-4 sm:flex-row sm:items-center"><div><p className="font-bold text-on-primary-fixed">Órdenes asignadas</p><p className="text-sm text-on-primary-fixed-variant">Revisa solicitudes especiales, entregas pendientes y trabajos del área.</p></div><Link className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white" to="/pos/functions/room-service/tasks"><span className="material-symbols-outlined">assignment</span>Ver órdenes</Link></div><RoomServiceOrder /></OperatorShell>
}
