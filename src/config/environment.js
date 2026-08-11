function required(name, currentValue, fallback = '') {
  const value = currentValue || fallback
  if (!value && import.meta.env.PROD) throw new Error(`Variable pública requerida: ${name}`)
  return value
}

const rawApiUrl = required('VITE_API_URL', import.meta.env.VITE_API_URL, '/api/v1')

export const environment = Object.freeze({
  name: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'local',
  appName: import.meta.env.VITE_APP_NAME || 'Wasita',
  apiUrl: rawApiUrl.replace(/\/$/, ''),
  qrAppUrl: import.meta.env.VITE_QR_APP_URL || '',
  buildVersion: import.meta.env.VITE_BUILD_VERSION || '2.0.0',
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  tagManagerId: import.meta.env.VITE_GTM_ID || '',
  isDevelopment: import.meta.env.DEV,
  isProductionBuild: import.meta.env.PROD,
})

export const API_URL = environment.apiUrl
export const AUTH_API_URL = `${environment.apiUrl}/auth`
export const BUILD_VERSION = environment.buildVersion
