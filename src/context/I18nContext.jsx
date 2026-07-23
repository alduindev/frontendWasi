import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentLanguage, loadLanguage, setCurrentLanguage, translateFrom } from '../services/i18nService'
import { I18nContext } from './i18nStore'

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => getCurrentLanguage())
  const [messages, setMessages] = useState({})
  const [ready, setReady] = useState(false)

  const syncLanguage = useCallback((nextLanguage, nextMessages) => {
    setMessages(nextMessages)
    setLanguageState(nextLanguage)
    document.documentElement.lang = nextLanguage
    setReady(true)
  }, [])

  useEffect(() => {
    let active = true

    loadLanguage(language).then((nextMessages) => {
      if (active) syncLanguage(language, nextMessages)
    })

    return () => {
      active = false
    }
  }, [language, syncLanguage])

  useEffect(() => {
    const handleLanguage = (event) => {
      const nextLanguage = event.detail || getCurrentLanguage()
      loadLanguage(nextLanguage).then((nextMessages) => syncLanguage(nextLanguage, nextMessages))
    }
    const handleSettings = (event) => {
      if (event.detail?.language) {
        loadLanguage(event.detail.language).then((nextMessages) => syncLanguage(event.detail.language, nextMessages))
      }
    }

    window.addEventListener('wasi:language-changed', handleLanguage)
    window.addEventListener('wasi:settings-changed', handleSettings)

    return () => {
      window.removeEventListener('wasi:language-changed', handleLanguage)
      window.removeEventListener('wasi:settings-changed', handleSettings)
    }
  }, [syncLanguage])

  const changeLanguage = useCallback((nextLanguage) => {
    setCurrentLanguage(nextLanguage)
  }, [])

  const t = useCallback((key, variables) => translateFrom(messages, key, variables), [messages])

  const value = useMemo(
    () => ({ changeLanguage, language, ready, t }),
    [changeLanguage, language, ready, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
