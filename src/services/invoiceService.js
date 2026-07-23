import { apiRequest } from '../api/httpClient'

export const getInvoices = (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.documentType) params.set('document_type', filters.documentType)
  if (filters.domain) params.set('domain', filters.domain)
  if (filters.subjectType) params.set('subject_type', filters.subjectType)
  if (filters.subjectId) params.set('subject_id', filters.subjectId)
  const query = params.toString()
  return apiRequest(`/invoices${query ? `?${query}` : ''}`)
}
export const issueInvoice = (data) => apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) })
export const voidInvoice = (id) => apiRequest(`/invoices/${id}/void`, { method: 'POST' })
