import { API_URL } from '../config/environment'
import { clearAccessToken, getAccessToken } from './authToken'

export class ApiError extends Error {
  constructor(message, status = 0, details = null, requestId = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.requestId = requestId
  }
}

function errorMessage(payload, fallback) {
  if (typeof payload?.detail === 'string') return payload.detail
  if (Array.isArray(payload?.detail)) return payload.detail.map((item) => item.msg).join('. ')
  return fallback
}

function requestHeaders(options = {}, accessToken = getAccessToken()) {
  const headers = new Headers(options.headers)
  if (accessToken && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${accessToken}`)
  if (!headers.has('X-Request-ID')) headers.set('X-Request-ID', globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`)
  if (options.body !== undefined && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  return headers
}

export async function apiRequest(path, options = {}) {
  const requestAccessToken = getAccessToken()
  const headers = requestHeaders(options, requestAccessToken)
  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include', headers })
  } catch (error) {
    throw new ApiError('No se pudo leer la respuesta del backend. Verifica que el API esté activo y que CORS permita este origen.', 0, error)
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const isCurrentAuthenticatedRequest = (
      Boolean(requestAccessToken)
      && getAccessToken() === requestAccessToken
    )
    if (
      response.status === 401
      && path !== '/auth/login'
      && path !== '/auth/logout'
      && isCurrentAuthenticatedRequest
    ) {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('wasi:session-expired'))
    }
    throw new ApiError(errorMessage(payload, `Error HTTP ${response.status}`), response.status, payload, response.headers.get('X-Request-ID') || '')
  }
  const method = String(options.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    window.dispatchEvent(new CustomEvent('wasi:data-changed', { detail: { method, path, payload } }))
  }
  return payload
}

export async function apiDownload(path) {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', headers: requestHeaders() })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(errorMessage(payload, `Error HTTP ${response.status}`), response.status, payload)
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  let filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'exportacion'
  if (encodedFilename) {
    try { filename = decodeURIComponent(encodedFilename) } catch { filename = encodedFilename }
  }
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.style.display = 'none'; document.body.append(anchor); anchor.click(); anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function apiBlob(path) {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include', headers: requestHeaders() })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(errorMessage(payload, `Error HTTP ${response.status}`), response.status, payload)
  }
  return response.blob()
}
