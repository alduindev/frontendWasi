import { apiRequest } from '../api/httpClient'
import { clearAccessToken, setAccessToken } from '../api/authToken'

async function confirmAuthenticatedSession(result) {
  const accessToken = String(result?.accessToken || '').trim()
  if (!accessToken) {
    clearAccessToken()
    throw new Error('El servidor no confirmó una sesión segura. Intenta nuevamente.')
  }

  setAccessToken(accessToken)
  try {
    return await apiRequest('/auth/me')
  } catch (error) {
    clearAccessToken()
    throw error
  }
}

export async function loginUser(credentials) {
  const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
  return confirmAuthenticatedSession(result)
}

export async function registerUser(data) {
  const result = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) })
  return confirmAuthenticatedSession(result)
}

export const requestPasswordRecovery = (identifier) => apiRequest('/auth/password-recovery/request', { method: 'POST', body: JSON.stringify({ identifier }) })
export const confirmPasswordRecovery = (data) => apiRequest('/auth/password-recovery/confirm', { method: 'POST', body: JSON.stringify(data) })

export function getSessionUser() {
  return apiRequest('/auth/me')
}

export function updateSessionUser(data) {
  return apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(data) })
}

export function changeSessionPassword(data) {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function clearSession() {
  try {
    return await apiRequest('/auth/logout', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
}
