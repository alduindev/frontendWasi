import { useI18n } from '../../hooks/useI18n'
import { languages } from '../../services/i18nService'

export default function PreferenceControls({ compact = false }) {
  const { changeLanguage, language, t } = useI18n()

  return (
    <div className={compact ? '' : 'rounded-full border border-outline-variant bg-white/90 p-1 shadow-sm backdrop-blur'}>
      <label className="sr-only" htmlFor="language-select">{t('common.language')}</label>
      <select
        aria-label={t('common.language')}
        className="min-h-11 rounded-full border border-outline-variant bg-white px-3 text-xs font-bold text-primary outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
        id="language-select"
        onChange={(event) => changeLanguage(event.target.value)}
        title={t('common.language')}
        value={language}
      >
        {languages.map((item) => (
          <option key={item.value} title={t(item.labelKey)} value={item.value}>{item.shortLabel}</option>
        ))}
      </select>
    </div>
  )
}
