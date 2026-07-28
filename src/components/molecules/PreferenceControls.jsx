import { useEffect } from 'react'
import { useI18n } from '../../hooks/useI18n'

export default function PreferenceControls() {
  const { changeLanguage, language } = useI18n()

  useEffect(() => {
    if (language !== 'es') changeLanguage('es')
  }, [changeLanguage, language])

  return null
}
