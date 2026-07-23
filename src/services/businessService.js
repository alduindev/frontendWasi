import { apiRequest } from '../api/httpClient'
export const getMyBusiness = () => apiRequest('/business/me')
export const updateMyBusiness = (data) => apiRequest('/business/me', { method:'PATCH', body:JSON.stringify(data) })
