import { Link } from 'react-router-dom'
import { useI18n } from '../../hooks/useI18n'
import PreferenceControls from '../molecules/PreferenceControls'
import BrandLogo from './BrandLogo'

const defaultBenefits = [
  {
    icon: 'inventory_2',
    textKey: 'auth.benefits.inventory',
    titleKey: 'auth.benefits.inventoryTitle',
  },
  {
    icon: 'qr_code_scanner',
    textKey: 'auth.benefits.qr',
    titleKey: 'auth.benefits.qrTitle',
  },
]

export default function AuthLayout({
  benefits = defaultBenefits,
  children,
  description,
  eyebrow,
  title,
}) {
  const { t } = useI18n()
  const resolvedEyebrow = eyebrow || t('auth.layout.eyebrow')
  const resolvedTitle = title || t('auth.layout.title')
  const resolvedDescription = description || t('auth.layout.description')

  return (
    <main className="min-h-svh w-full overflow-x-hidden bg-background p-3 text-left text-on-surface transition-colors duration-300 sm:p-6">
      <PreferenceControls />
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-[#e9dfd4] bg-white shadow-xl shadow-primary/5 sm:rounded-3xl lg:h-[calc(100svh-3rem)] lg:min-h-0 lg:grid-cols-[0.9fr_1fr]">
        <section className="hidden min-h-0 overflow-y-auto bg-primary p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <Link aria-label="Volver al inicio de Wasita" className="w-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" to="/">
            <BrandLogo light />
          </Link>

          <div className="my-8 max-w-xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-tertiary-fixed-dim">{resolvedEyebrow}</p>
            <h1 className="font-heading text-4xl font-bold leading-tight xl:text-5xl">{resolvedTitle}</h1>
            <p className="mt-5 text-base leading-7 text-primary-fixed">{resolvedDescription}</p>

            <div className="mt-7 grid gap-3">
              {benefits.map((benefit) => (
                <article className="rounded-2xl border border-white/15 bg-white/10 p-4" key={benefit.titleKey || benefit.title}>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-primary-fixed">
                      {benefit.icon}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-white">{benefit.titleKey ? t(benefit.titleKey) : benefit.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-primary-fixed">{benefit.textKey ? t(benefit.textKey) : benefit.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4">
            <span aria-hidden="true" className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-primary-fixed">verified_user</span>
            <div><p className="text-sm font-bold text-white">Acceso protegido</p><p className="mt-1 text-xs leading-5 text-primary-fixed">Tu sesión y los datos de cada empresa permanecen aislados.</p></div>
          </div>
        </section>

        <section className="flex min-h-full items-center justify-center px-4 py-7 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:px-14">
          <div className="w-full max-w-[430px]">
            <div className="mb-7 flex items-center justify-between gap-3 lg:hidden">
              <Link aria-label="Volver al inicio de Wasita" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" to="/"><BrandLogo compact /></Link>
              <Link className="flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-bold text-primary transition hover:bg-primary-fixed focus-visible:outline-2 focus-visible:outline-primary" to="/"><span aria-hidden="true" className="material-symbols-outlined text-xl">arrow_back</span>Inicio</Link>
            </div>
            <Link className="mb-6 hidden w-fit items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-primary transition hover:bg-primary-fixed focus-visible:outline-2 focus-visible:outline-primary lg:flex" to="/"><span aria-hidden="true" className="material-symbols-outlined text-xl">arrow_back</span>Volver al inicio</Link>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
