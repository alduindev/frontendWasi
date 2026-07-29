import { apiRequest } from '../api/httpClient'

export const getUsers = () => apiRequest('/users')
export const createUser = (data) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) })
export const updateUser = (id, data) => apiRequest(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteUser = (id) => apiRequest(`/users/${id}`, { method: 'DELETE' })
export const resetUserPassword = (id, reason) => apiRequest(`/users/${id}/password-reset`, {
  method: 'POST',
  body: JSON.stringify({ reason }),
  sensitiveResponse: true,
})
export const getAccessCatalog = () => apiRequest('/users/access/catalog')
