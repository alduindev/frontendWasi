import { apiRequest } from '../api/httpClient'
export const createSupportTicket = (data) => apiRequest('/support/tickets', { method: 'POST', body: JSON.stringify(data) })
