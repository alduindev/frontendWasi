import { getSettings, saveSettings } from './settingsService'

export const languages = [
  { labelKey: 'languages.es', shortLabel: 'ES', value: 'es' },
  { labelKey: 'languages.en', shortLabel: 'EN', value: 'en' },
  { labelKey: 'languages.pt', shortLabel: 'PT', value: 'pt' },
]

const localeModules = import.meta.glob('../locales/*/*.json')
const localeCache = new Map()

export function getBrowserLanguage() {
  const language = navigator.language?.slice(0, 2).toLowerCase()
  return languages.some((item) => item.value === language) ? language : 'es'
}

export function getCurrentLanguage() {
  return getSettings().language || getBrowserLanguage()
}

export function setCurrentLanguage(language) {
  const nextLanguage = languages.some((item) => item.value === language) ? language : 'es'
  saveSettings({ ...getSettings(), language: nextLanguage })
  window.dispatchEvent(new CustomEvent('wasi:language-changed', { detail: nextLanguage }))
  return nextLanguage
}

function deepMerge(target, source) {
  return Object.entries(source).reduce((acc, [key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      acc[key] = deepMerge(acc[key] || {}, value)
      return acc
    }

    acc[key] = value
    return acc
  }, target)
}

function getByPath(messages, key) {
  return key.split('.').reduce((value, segment) => value?.[segment], messages)
}

function interpolate(template, variables = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '')
}

export async function loadLanguage(language = getCurrentLanguage()) {
  const safeLanguage = languages.some((item) => item.value === language) ? language : 'es'
  if (localeCache.has(safeLanguage)) return localeCache.get(safeLanguage)

  const entries = Object.entries(localeModules).filter(([path]) => path.includes(`/locales/${safeLanguage}/`) || path.includes(`\\locales\\${safeLanguage}\\`))
  const modules = await Promise.all(entries.map(([, loader]) => loader()))
  const messages = modules.reduce((acc, module) => deepMerge(acc, module.default || module), {})

  localeCache.set(safeLanguage, messages)
  return messages
}

export function translateFrom(messages, key, variables = {}) {
  const value = getByPath(messages, key)

  if (value && typeof value === 'object') {
    const count = Number(variables.count)
    const pluralValue = count === 1 ? value.one : value.other
    return interpolate(pluralValue || value.other || value.one || key, variables)
  }

  return interpolate(value || key, variables)
}

export function formatDate(value, language = getCurrentLanguage(), options = {}) {
  return new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : language === 'en' ? 'en-US' : 'es-PE', options).format(new Date(value))
}

export function formatMoney(value, currency = getSettings().currency, language = getCurrentLanguage()) {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : language === 'en' ? 'en-US' : 'es-PE', {
    currency,
    style: 'currency',
  }).format(Number(value || 0))
}
