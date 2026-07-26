const STORAGE_KEY = 'wasi.auth.access-token'

let memoryToken = ''

function storage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

export function getAccessToken() {
  if (memoryToken) return memoryToken
  try {
    memoryToken = storage()?.getItem(STORAGE_KEY) || ''
  } catch {
    memoryToken = ''
  }
  return memoryToken
}

export function setAccessToken(token) {
  memoryToken = typeof token === 'string' ? token.trim() : ''
  try {
    if (memoryToken) storage()?.setItem(STORAGE_KEY, memoryToken)
    else storage()?.removeItem(STORAGE_KEY)
  } catch {
    // El token sigue disponible en memoria si el navegador bloquea el almacenamiento.
  }
}

export function clearAccessToken() {
  setAccessToken('')
}
