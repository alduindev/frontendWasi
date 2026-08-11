import { apiRequest } from '../api/httpClient'
import { clearAccessToken, setAccessToken } from '../api/authToken'

export async function confirmAuthenticatedSession(result) {
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
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    sensitiveResponse: true,
  })
  return confirmAuthenticatedSession(result)
}

export function startQrLogin() {
  return apiRequest('/auth/qr/start', {
    method: 'POST',
    sensitiveResponse: true,
  })
}

export function pollQrLogin(data) {
  return apiRequest('/auth/qr/poll', {
    method: 'POST',
    body: JSON.stringify(data),
    sensitiveResponse: true,
  })
}

export function scanQrLogin(data) {
  return apiRequest('/auth/qr/scan', {
    method: 'POST',
    body: JSON.stringify(data),
    sensitiveResponse: true,
  })
}

export function respondQrLogin(data) {
  return apiRequest('/auth/qr/respond', {
    method: 'POST',
    body: JSON.stringify(data),
    sensitiveResponse: true,
  })
}

export async function registerUser(data) {
  const result = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    sensitiveResponse: true,
  })
  return confirmAuthenticatedSession(result)
}

export const requestPasswordRecovery = (identifier) => apiRequest('/auth/password-recovery/request', {
  method: 'POST',
  body: JSON.stringify({ identifier }),
  sensitiveResponse: true,
})
export const confirmPasswordRecovery = (data) => apiRequest('/auth/password-recovery/confirm', {
  method: 'POST',
  body: JSON.stringify(data),
  sensitiveResponse: true,
})

export function getSessionUser() {
  return apiRequest('/auth/me')
}

export function updateSessionUser(data) {
  return apiRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(data) })
}

export async function changeSessionPassword(data) {
  const result = await apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
    sensitiveResponse: true,
  })
  const user = await confirmAuthenticatedSession(result)
  return {
    message: result?.message || 'Contraseña actualizada correctamente',
    user,
  }
}

export async function clearSession() {
  try {
    return await apiRequest('/auth/logout', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
}
