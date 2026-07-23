export const defaultSettings = {
  currency: 'PEN', language: 'es', dateFormat: 'dd/MM/yyyy', confirmations: true, animations: true,
}

let currentSettings = { ...defaultSettings }

export function getSettings() {
  return currentSettings
}

export function saveSettings(settings) {
  currentSettings = { ...defaultSettings, ...settings }
  window.dispatchEvent(new CustomEvent('wasi:settings-changed', { detail: currentSettings }))
  return currentSettings
}
