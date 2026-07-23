import { apiRequest } from '../api/httpClient'
const suffix = (values) => { const params = new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value != null)); return params.toString() ? `?${params}` : '' }
export const getOperatorsPerformance = (params = {}) => apiRequest(`/admin/operators${suffix(params)}`)
export const getOperatorPerformance = (id) => apiRequest(`/admin/operators/${id}`)
export const getOperatorSales = (id, params = {}) => apiRequest(`/admin/operators/${id}/sales${suffix(params)}`)
export const getOperatorStatistics = (id) => apiRequest(`/admin/operators/${id}/statistics`)
