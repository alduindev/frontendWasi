import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '../../context/authStore'
import * as api from '../../services/attachmentService'
import Button from '../atoms/Button'
import Card from '../atoms/Card'
import EmptyState from '../molecules/EmptyState'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const field = 'min-h-11 w-full rounded-xl border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
const categories = [
  ['clinical_report', 'Informe clínico'],
  ['laboratory', 'Análisis de laboratorio'],
  ['radiograph', 'Radiografía'],
  ['prescription', 'Receta'],
  ['consent', 'Consentimiento'],
  ['identity', 'Identidad'],
  ['payment', 'Pago o comprobante'],
  ['image', 'Imagen'],
  ['other', 'Otro'],
]
const unavailableAttachmentMessage = 'El archivo ya no está disponible. Adjunta nuevamente una copia para recuperarlo.'

function matchesPermission(user, required) {
  return (user?.permissions || []).some(permission => (
    permission === required || (permission.endsWith('.*') && required.startsWith(permission.slice(0, -1)))
  ))
}

function hasFunction(user, code) {
  return (user?.functions || []).some(item => (typeof item === 'string' ? item : item.code) === code)
}

function capabilities(user, entityType) {
  const admin = ['admin', 'admin_owner'].includes(user?.role)
  if (admin) return { remove: true, upload: true }
  if (entityType === 'dental_patient') return { remove: false, upload: matchesPermission(user, 'dental.records.edit') && hasFunction(user, 'dentist') }
  if (entityType === 'health_patient') return { remove: false, upload: matchesPermission(user, 'health.patients.edit') || matchesPermission(user, 'patients.edit') }
  if (entityType === 'veterinary_pet') return { remove: false, upload: matchesPermission(user, 'pets.edit') && hasFunction(user, 'veterinarian') }
  if (entityType === 'hospitality_guest') return { remove: false, upload: matchesPermission(user, 'hospitality.guests.manage') }
  if (entityType === 'hospitality_reservation') return { remove: false, upload: matchesPermission(user, 'hospitality.reservations.manage') }
  return { remove: false, upload: false }
}

function sizeLabel(value) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function dateLabel(value) {
  return value ? new Date(value).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : ''
}

function iconFor(mimeType) {
  if (mimeType === 'application/pdf') return 'picture_as_pdf'
  return 'image'
}

export default function EntityAttachments({
  allowDelete,
  allowUpload,
  description = 'PDF, JPG, PNG o WEBP de hasta 5 MB.',
  entityId,
  entityType,
  legacyItems = [],
  title = 'Archivos del expediente',
}) {
  const { user } = useAuth()
  const defaults = useMemo(() => capabilities(user, entityType), [entityType, user])
  const canUpload = allowUpload ?? defaults.upload
  const canDelete = allowDelete ?? defaults.remove
  const inputRef = useRef(null)
  const [attachments, setAttachments] = useState([])
  const [category, setCategory] = useState('clinical_report')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workingId, setWorkingId] = useState('')
  const [error, setError] = useState('')
  const [unavailableIds, setUnavailableIds] = useState(() => new Set())

  const markUnavailable = attachmentId => {
    setUnavailableIds(current => {
      if (current.has(attachmentId)) return current
      const next = new Set(current)
      next.add(attachmentId)
      return next
    })
  }

  const load = useCallback(async () => {
    if (!entityId || !entityType) return
    setLoading(true)
    setError('')
    try {
      setAttachments(await api.getAttachments(entityType, entityId))
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar los archivos.')
    } finally {
      setLoading(false)
    }
  }, [entityId, entityType])

  useEffect(() => { queueMicrotask(load) }, [load])

  const chooseFile = event => {
    const selected = event.target.files?.[0] || null
    setError('')
    if (!selected) { setFile(null); return }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Formato no permitido. Usa PDF, JPG, PNG o WEBP.')
      event.target.value = ''
      setFile(null)
      return
    }
    if (selected.size > MAX_BYTES) {
      setError('El archivo debe pesar como máximo 5 MB.')
      event.target.value = ''
      setFile(null)
      return
    }
    setFile(selected)
  }

  const submit = async event => {
    event.preventDefault()
    if (!file) { setError('Selecciona un archivo.'); return }
    setSaving(true)
    setError('')
    try {
      await api.uploadAttachment({ category, entityId, entityType, file, notes })
      setFile(null)
      setNotes('')
      setShowForm(false)
      if (inputRef.current) inputRef.current.value = ''
      await load()
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar el archivo.')
    } finally {
      setSaving(false)
    }
  }

  const preview = async attachment => {
    setWorkingId(attachment.id)
    setError('')
    const previewWindow = window.open('', '_blank')
    if (previewWindow) previewWindow.opener = null
    try {
      const blob = await api.previewAttachment(attachment.id)
      const url = URL.createObjectURL(blob)
      if (previewWindow) previewWindow.location.replace(url)
      else {
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer'
        anchor.click()
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (requestError) {
      previewWindow?.close()
      if (requestError.status === 410) markUnavailable(attachment.id)
      setError(requestError.status === 410 ? unavailableAttachmentMessage : (requestError.message || 'No se pudo abrir el archivo.'))
    } finally {
      setWorkingId('')
    }
  }

  const download = async attachment => {
    setWorkingId(attachment.id)
    setError('')
    try { await api.downloadAttachment(attachment.id, attachment.originalName) } catch (requestError) {
      if (requestError.status === 410) markUnavailable(attachment.id)
      setError(requestError.status === 410 ? unavailableAttachmentMessage : (requestError.message || 'No se pudo descargar el archivo.'))
    } finally { setWorkingId('') }
  }

  const remove = async attachment => {
    if (!window.confirm(`¿Eliminar ${attachment.originalName}?`)) return
    setWorkingId(attachment.id)
    setError('')
    try { await api.deleteAttachment(attachment.id); await load() } catch (requestError) {
      setError(requestError.message || 'No se pudo eliminar el archivo.')
    } finally { setWorkingId('') }
  }

  const openLegacy = item => {
    if (!item.url) return
    const anchor = document.createElement('a')
    anchor.href = item.url
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }

  return (
    <section className="min-w-0 rounded-2xl border border-outline-variant bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">{title}</h3>
          <p className="text-xs text-on-surface-variant">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Actualizar archivos" className="material-symbols-outlined grid min-h-10 min-w-10 place-items-center rounded-xl border border-outline-variant hover:bg-surface-container-low" onClick={load} type="button">refresh</button>
          {canUpload ? <Button icon={showForm ? 'close' : 'upload_file'} onClick={() => setShowForm(value => !value)} variant={showForm ? 'secondary' : 'primary'}>{showForm ? 'Cancelar' : 'Adjuntar'}</Button> : null}
        </div>
      </div>

      {showForm ? (
        <form className="mt-3 grid gap-3 rounded-2xl bg-surface-container-low p-3 sm:grid-cols-2" onSubmit={submit}>
          <label className="grid gap-1 text-xs font-bold">Tipo
            <select className={field} onChange={event => setCategory(event.target.value)} value={category}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
          <label className="grid gap-1 text-xs font-bold">Archivo
            <input accept="application/pdf,image/jpeg,image/png,image/webp" className="block min-h-11 w-full rounded-xl border border-outline-variant bg-white p-2 text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-white" onChange={chooseFile} ref={inputRef} required type="file" />
          </label>
          <label className="grid gap-1 text-xs font-bold sm:col-span-2">Notas
            <textarea className={`${field} min-h-16 py-2`} maxLength={2000} onChange={event => setNotes(event.target.value)} placeholder="Descripción opcional" value={notes} />
          </label>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <p className="truncate text-xs text-on-surface-variant">{file ? `${file.name} · ${sizeLabel(file.size)}` : 'Ningún archivo seleccionado'}</p>
            <Button disabled={saving || !file} icon="cloud_upload" type="submit">{saving ? 'Guardando…' : 'Guardar archivo'}</Button>
          </div>
        </form>
      ) : null}

      {error ? <p className="mt-3 rounded-xl bg-error-container p-3 text-sm text-error" role="alert">{error}</p> : null}
      {loading ? <div className="mt-3 h-24 animate-pulse rounded-2xl bg-surface-container-low" /> : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {attachments.map(attachment => {
            const unavailable = unavailableIds.has(attachment.id)
            return (
            <Card className="min-w-0 p-3" key={attachment.id}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-outlined grid size-10 shrink-0 place-items-center rounded-xl bg-primary-fixed text-primary">{iconFor(attachment.mimeType)}</span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{attachment.originalName}</b>
                  {unavailable ? <p className="truncate text-[11px] text-error">Archivo no disponible; adjunta una copia nueva.</p> : null}
                  <p className="truncate text-xs text-on-surface-variant">{sizeLabel(attachment.sizeBytes)} · {dateLabel(attachment.createdAt)}</p>
                  <p className="truncate text-[11px] text-on-surface-variant">{attachment.uploadedBy?.name || 'Equipo'}{attachment.notes ? ` · ${attachment.notes}` : ''}</p>
                </div>
                <button aria-label={`Ver ${attachment.originalName}`} className="material-symbols-outlined rounded-lg p-2 text-primary hover:bg-primary-fixed" disabled={workingId === attachment.id || unavailable} onClick={() => preview(attachment)} type="button">visibility</button>
                <button aria-label={`Descargar ${attachment.originalName}`} className="material-symbols-outlined rounded-lg p-2 text-primary hover:bg-primary-fixed" disabled={workingId === attachment.id || unavailable} onClick={() => download(attachment)} type="button">download</button>
                {canDelete ? <button aria-label={`Eliminar ${attachment.originalName}`} className="material-symbols-outlined rounded-lg p-2 text-error hover:bg-error-container" disabled={workingId === attachment.id} onClick={() => remove(attachment)} type="button">delete</button> : null}
              </div>
            </Card>
            )
          })}
          {legacyItems.map(item => (
            <Card className="min-w-0 p-3" key={`legacy-${item.id}`}>
              <div className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-outlined grid size-10 shrink-0 place-items-center rounded-xl bg-surface-container-low text-on-surface-variant">history</span>
                <div className="min-w-0 flex-1"><b className="block truncate text-sm">{item.name}</b><p className="truncate text-xs text-on-surface-variant">Archivo anterior · solo lectura</p></div>
                <button aria-label={`Abrir ${item.name}`} className="material-symbols-outlined rounded-lg p-2 text-primary hover:bg-primary-fixed" onClick={() => openLegacy(item)} type="button">open_in_new</button>
              </div>
            </Card>
          ))}
          {!attachments.length && !legacyItems.length ? <div className="sm:col-span-2"><EmptyState description="Adjunta documentos o imágenes al expediente sin salir de esta vista." icon="folder_open" title="Sin archivos" /></div> : null}
        </div>
      )}
    </section>
  )
}
