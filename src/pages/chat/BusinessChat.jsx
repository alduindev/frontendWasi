import { useEffect, useRef, useState } from 'react'
import DashboardShell from '../../components/organisms/DashboardShell'
import OperatorShell from '../../components/operator/OperatorShell'
import { useAuth } from '../../context/authStore'
import { chatSocketUrl, getMessages } from '../../services/chatService'

const RETRY_DELAY = 2000
const SYNC_INTERVAL = 5000

function mergeMessages(current, incoming) {
  const known = new Set(current.map((message) => message.id))
  return [...current, ...incoming.filter((message) => !known.has(message.id))]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function ChatPanel({ className = '' }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('Conectando…')
  const socketRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true
    let retryTimer
    let connectTimer

    const merge = (incoming) => {
      if (active) setMessages((current) => mergeMessages(current, incoming))
    }
    const refresh = async () => {
      try {
        merge(await getMessages())
      } catch {
        // El WebSocket puede seguir activo aunque una sincronización falle.
      }
    }
    const connect = () => {
      if (!active) return
      const socket = new WebSocket(chatSocketUrl())
      socketRef.current = socket
      socket.onopen = () => { if (active) setStatus('En línea') }
      socket.onmessage = (event) => merge([JSON.parse(event.data)])
      socket.onerror = () => { if (active) setStatus('Sin conexión') }
      socket.onclose = () => {
        if (!active) return
        setStatus('Reconectando…')
        retryTimer = window.setTimeout(connect, RETRY_DELAY)
      }
    }

    refresh()
    const pollTimer = window.setInterval(refresh, SYNC_INTERVAL)
    // Evita abrir y cerrar un socket fantasma durante la comprobación doble de StrictMode.
    connectTimer = window.setTimeout(connect, 0)

    return () => {
      active = false
      window.clearInterval(pollTimer)
      window.clearTimeout(connectTimer)
      window.clearTimeout(retryTimer)
      const socket = socketRef.current
      socketRef.current = null
      if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) socket.close()
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = (event) => {
    event.preventDefault()
    const value = body.trim()
    if (!value || socketRef.current?.readyState !== WebSocket.OPEN) return
    socketRef.current.send(JSON.stringify({ body: value }))
    setBody('')
  }

  return <div className={`flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-sm ${className}`}>
      <header className="flex items-center justify-between border-b bg-surface-container-low p-4">
        <div><b>Canal general</b><p className="text-xs text-on-surface-variant">Sólo integrantes de esta empresa</p></div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{status}</span>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        {messages.map((message) => {
          const mine = message.user.id === user.id
          return <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`} key={message.id}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${mine ? 'bg-primary text-white' : 'bg-surface-container-low'}`}>
              <div className="mb-1 flex items-center gap-2 text-xs font-bold"><span>{mine ? 'Tú' : message.user.name}</span><span className="opacity-60">{new Date(message.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span></div>
              <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
            </div>
          </div>
        })}
        {!messages.length ? <div className="grid h-full place-items-center text-center text-on-surface-variant"><span><span className="material-symbols-outlined block text-5xl">forum</span>Inicia la conversación del equipo.</span></div> : null}
        <div ref={bottomRef} />
      </div>
      <form className="flex gap-2 border-t p-3 sm:p-4" onSubmit={submit}>
        <textarea aria-label="Mensaje" className="min-h-12 flex-1 resize-none rounded-2xl border border-outline-variant px-4 py-3 focus:border-primary focus:outline-none" maxLength="4000" onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit() } }} placeholder="Escribe un mensaje…" rows="1" value={body} />
        <button aria-label="Enviar" className="material-symbols-outlined min-h-12 min-w-12 rounded-2xl bg-primary text-white disabled:opacity-50" disabled={!body.trim() || status !== 'En línea'} type="submit">send</button>
      </form>
    </div>
}

export default function BusinessChat({ operator = false }) {
  const Shell = operator ? OperatorShell : DashboardShell
  return <Shell title="Chat del negocio" subtitle="Canal interno en tiempo real para coordinar administración, recepción y equipo clínico.">
    <ChatPanel className="mx-auto h-[calc(100svh-190px)] max-w-5xl" />
  </Shell>
}
