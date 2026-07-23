import { apiRequest } from '../api/httpClient'

export const getHistory = (scope = 'all') => apiRequest(`/history/timeline?scope=${encodeURIComponent(scope)}`)
export const getActivityHistory = () => getHistory('hospitality')
export const clearHistory = () => apiRequest('/history', { method: 'DELETE' })
