import { apiBlob, apiRequest } from '../api/httpClient'

export const getAttachments = (entityType, entityId) => apiRequest(
  `/attachments?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`,
)

export const uploadAttachment = ({ category = 'other', entityId, entityType, file, notes = '' }) => {
  const body = new FormData()
  body.append('entity_type', entityType)
  body.append('entity_id', entityId)
  body.append('category', category)
  body.append('notes', notes)
  body.append('file', file, file.name)
  return apiRequest('/attachments', { method: 'POST', body })
}

export const previewAttachment = id => apiBlob(`/attachments/${id}/content`)
export const downloadAttachment = async (id, originalName = 'archivo') => {
  const blob = await apiBlob(`/attachments/${id}/content?download=true`)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = originalName
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export const deleteAttachment = id => apiRequest(`/attachments/${id}`, { method: 'DELETE' })
