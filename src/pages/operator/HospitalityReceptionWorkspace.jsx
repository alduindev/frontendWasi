import { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '../../components/atoms/Button'
import Card from '../../components/atoms/Card'
import EmptyState from '../../components/molecules/EmptyState'
import OperatorShell from '../../components/operator/OperatorShell'
import * as api from '../../services/hospitalityService'
import ReservationWizard from '../hospitality/forms/ReservationWizard'
import HotelCheckoutModal from '../hospitality/HotelCheckoutModal'

const labels = { confirmed: 'Por llegar', checked_in: 'Hospedado', checked_out: 'Finalizado', cancelled: 'Cancelado' }
const tabs = ['', 'confirmed', 'checked_in', 'checked_out']

export default function HospitalityReceptionWorkspace() {
  const [rooms, setRooms] = useState([]); const [guests, setGuests] = useState([]); const [reservations, setReservations] = useState([]); const [charges, setCharges] = useState([])
  const [tab, setTab] = useState(''); const [modal, setModal] = useState(null); const [working, setWorking] = useState(''); const [error, setError] = useState('')
  const load = useCallback(async () => { try { const [r,g,v,c]=await Promise.all([api.getRooms(),api.getGuests(),api.getReservations(),api.getRoomCharges()]);setRooms(r);setGuests(g);setReservations(v);setCharges(c);setError('') } catch (requestError) { setError(requestError.message) } }, [])
  useEffect(()=>{queueMicrotask(load);const timer=setInterval(()=>{if(document.visibilityState==='visible')load()},5000);return()=>clearInterval(timer)},[load])
  const visible=useMemo(()=>reservations.filter(item=>!tab||item.status===tab),[reservations,tab])
  const act=async(item,operation)=>{setWorking(item.id);setError('');try{await operation();await load()}catch(requestError){setError(requestError.message)}finally{setWorking('')}}
  return <OperatorShell action={<Button icon="event_available" onClick={()=>setModal({type:'reservation'})}>Nueva reserva</Button>} subtitle="Gestiona llegadas, huéspedes y salidas sin acceder a configuración administrativa." title="Recepción">
    {error?<div className="mb-4"><EmptyState action={{children:'Reintentar',onClick:load}} description={error} icon="cloud_off" title="No se pudo completar la operación"/></div>:null}
    <div className="mb-4 grid grid-cols-3 gap-3">{[['Llegadas',reservations.filter(x=>x.status==='confirmed').length,'login'],['Hospedados',reservations.filter(x=>x.status==='checked_in').length,'hotel'],['Salidas',reservations.filter(x=>x.status==='checked_out').length,'logout']].map(item=><Card className="p-4" key={item[0]}><span className="material-symbols-outlined text-primary">{item[2]}</span><b className="mt-2 block text-2xl">{item[1]}</b><span className="text-xs text-on-surface-variant">{item[0]}</span></Card>)}</div>
    <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-outline-variant bg-white p-2">{tabs.map(value=><button className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold ${tab===value?'bg-primary text-white':'text-on-surface-variant'}`} key={value||'all'} onClick={()=>setTab(value)} type="button">{value?labels[value]:'Todas'} · {reservations.filter(item=>!value||item.status===value).length}</button>)}</div>
    <div className="grid gap-3 lg:grid-cols-2">{visible.map(item=><Card className="p-4" key={item.id}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">Habitación {item.room.number}</p><h2 className="text-lg font-bold">{item.guest.name}</h2><p className="text-sm text-on-surface-variant">{item.checkInDate} → {item.checkOutDate}</p></div><span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-primary">{labels[item.status]}</span></div><div className="mt-4 flex flex-wrap gap-2">{item.status==='confirmed'?<Button disabled={working===item.id} icon="login" onClick={()=>act(item,()=>api.checkIn(item.id))}>Realizar check-in</Button>:null}{item.status==='checked_in'?<Button icon="payments" onClick={()=>setModal({type:'checkout',item})}>Cobrar y finalizar</Button>:null}</div></Card>)}{!visible.length?<EmptyState description="No hay estancias en este estado." icon="event_busy" title="Sin movimientos"/>:null}</div>
    {modal?.type==='reservation'?<ReservationWizard guests={guests} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}} rooms={rooms}/>:null}
    {modal?.type==='checkout'?<HotelCheckoutModal charges={charges.filter(charge=>charge.reservationId===modal.item.id)} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load()}} reservation={modal.item}/>:null}
  </OperatorShell>
}
