import { apiRequest } from '../api/httpClient'

export const getOperatorSummary = () => apiRequest('/operator/summary')
export const getOperatorProducts = (search = '') => apiRequest(`/operator/products${search ? `?search=${encodeURIComponent(search)}` : ''}`)
export const getOperatorInvoices = () => apiRequest('/operator/invoices')
export const getOperatorHistory = () => apiRequest('/operator/history')
export const createOperatorSale = (data) => apiRequest('/operator/sales', { method: 'POST', body: JSON.stringify(data) })

