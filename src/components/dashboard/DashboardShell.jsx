import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { navItems } from '../../constants/navigation'
import { useAuth } from '../../context/authStore'
import { useAppConfig } from '../../context/appConfigStore'
import { getInventoryAlerts } from '../../data/dashboard'
import { useInventory } from '../../hooks/useInventory'
import { useI18n } from '../../hooks/useI18n'
import { useResponsiveSidebar } from '../../hooks/useResponsiveSidebar'
import { filterNavigationByRole, getRoleLabel, getUserRole } from '../../services/permissionService'
import { getHospitalityNotifications, readHospitalityNotification } from '../../services/hospitalityService'
import {getDentalNotifications,readDentalNotification} from '../../services/healthService'
import { normalizeText, productMatchesQuery } from '../../utils/productUtils'
import Avatar from '../atoms/Avatar'
import Badge from '../atoms/Badge'
import BrandLogo from '../molecules/BrandLogo'
import ConfirmDialog from '../molecules/ConfirmDialog'
import PreferenceControls from '../molecules/PreferenceControls'

const NOTIFICATION_REFRESH_INTERVAL_MS = 30_000

function useClickOutside(ref, onOutsideClick, active) {
  useEffect(() => {
    if (!active) return undefined

    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) onOutsideClick(event)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [active, onOutsideClick, ref])
}

function useEscapeKey(onEscape, active) {
  useEffect(() => {
    if (!active) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onEscape(event)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, onEscape])
}

function HighlightMatch({ query, text }) {
  const value = String(text || '')
  const normalizedValue = normalizeText(value)
  const normalizedQuery = normalizeText(query)
  const index = normalizedQuery ? normalizedValue.indexOf(normalizedQuery) : -1

  if (index < 0) return value

  const before = value.slice(0, index)
  const match = value.slice(index, index + normalizedQuery.length)
  const after = value.slice(index + normalizedQuery.length)

  return (
    <>
      {before}
      <mark className="rounded bg-primary-fixed px-0.5 text-on-primary-fixed">{match}</mark>
      {after}
    </>
  )
}

function NavList({ collapsed, items, onNavigate, t, variant }) {
  const isDesktop = variant === 'desktop'

  return (
    <nav aria-label={t('nav.overview')} className={isDesktop ? 'flex-1 space-y-1' : 'grid gap-2'}>
      {items.map((item) => (
        <NavLink
          className={({ isActive }) =>
            [
              `${isDesktop && item.routeKey === 'chat' ? 'hidden' : 'flex'} items-center gap-3 text-sm font-bold transition-colors`,
              isDesktop ? 'relative px-5 py-3' : 'rounded-xl px-4 py-3',
              isActive
                ? isDesktop
                  ? 'bg-primary text-white before:absolute before:left-0 before:h-2/3 before:w-1 before:rounded-r before:bg-white'
                  : 'bg-primary text-white'
                : 'text-primary hover:bg-primary-container hover:text-on-primary-container',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            ].join(' ')
          }
          end={item.to === '/dashboard'}
          key={item.routeKey}
          data-onboarding={`nav-${item.routeKey}`}
          onClick={onNavigate}
          title={item.label || t(item.labelKey)}
          to={item.to}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            {item.icon}
          </span>
          <span className={`min-w-0 whitespace-nowrap transition-[max-width,opacity] duration-200 ${isDesktop && collapsed ? 'max-w-0 overflow-hidden opacity-0' : 'max-w-44 opacity-100'}`}>{item.label || t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function DesktopSidebar({ collapsed, items, onToggleCollapse, t }) {
  return (
    <aside
      className={`fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-outline-variant bg-surface py-5 transition-[width] duration-200 ease-out lg:flex ${
        collapsed ? 'w-[84px]' : 'w-[248px]'
      }`}
      data-onboarding="sidebar"
    >
      <div className="mb-8 flex h-12 items-center px-4">
        {collapsed ? (
          <BrandLogo markOnly />
        ) : (
          <div className="min-w-0 flex-1 overflow-hidden">
            <BrandLogo centered compact />
          </div>
        )}
        <button
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          className="material-symbols-outlined ml-auto shrink-0 rounded-full p-2 text-primary transition hover:bg-primary-fixed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={onToggleCollapse}
          type="button"
        >
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </button>
      </div>

      <NavList collapsed={collapsed} items={items} t={t} variant="desktop" />
    </aside>
  )
}

function MobileDrawer({ items, onClose, onNavigateAway, open, t }) {
  const panelRef = useRef(null)
  const location = useLocation()

  useClickOutside(panelRef, onClose, open)
  useEscapeKey(onClose, open)

  // Cierra el drawer automaticamente al cambiar de ruta.
  useEffect(() => {
    onNavigateAway()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[70] bg-black/40 lg:hidden"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            animate={{ x: 0 }}
            aria-label={t('sidebar.navigation')}
            aria-modal="true"
            className="flex h-full w-[min(320px,85vw)] flex-col gap-6 border-r border-outline-variant bg-white p-4 shadow-2xl"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.05, right: 0.2 }}
            exit={{ x: '-100%' }}
            initial={{ x: '-100%' }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) onClose()
            }}
            ref={panelRef}
            role="dialog"
            id="admin-mobile-navigation"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between">
              <BrandLogo compact />
              <button
                aria-label={t('sidebar.close')}
                className="material-symbols-outlined rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={onClose}
                type="button"
              >
                close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavList items={items} onNavigate={onClose} t={t} variant="mobile" />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function GlobalSearch({ displayedSearch, onChange, onSelectProduct, placeholder, products, t }) {
  const containerRef = useRef(null)
  const activeItemRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [debouncedValue, setDebouncedValue] = useState(displayedSearch)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(displayedSearch), 150)
    return () => window.clearTimeout(timeout)
  }, [displayedSearch])

  const results = useMemo(
    () =>
      debouncedValue.trim().length >= 2
        ? products.filter((product) => productMatchesQuery(product, debouncedValue)).slice(0, 6)
        : [],
    [debouncedValue, products],
  )

  const safeActiveIndex = activeIndex >= 0 && activeIndex < results.length ? activeIndex : -1

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' })
  }, [safeActiveIndex])

  useClickOutside(containerRef, () => setIsOpen(false), isOpen)

  const handleChange = (value) => {
    onChange(value)
    setIsOpen(value.trim().length >= 2)
  }

  const selectResult = (productId) => {
    setIsOpen(false)
    onSelectProduct(productId)
  }

  const handleKeyDown = (event) => {
    if (!isOpen || !results.length) {
      if (event.key === 'Escape') setIsOpen(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1))
    } else if (event.key === 'Enter') {
      const target = activeIndex >= 0 ? results[activeIndex] : results[0]
      if (target) selectResult(target.id)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full min-w-0 max-w-xl" data-tour="global-search" ref={containerRef}>
      <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
        search
      </span>
      <input
        aria-activedescendant={safeActiveIndex >= 0 ? `search-result-${safeActiveIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls="global-search-results"
        aria-expanded={isOpen}
        className="min-h-10 w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-9 pr-9 text-xs outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:min-h-11 sm:pl-10 sm:pr-11 sm:text-sm"
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => setIsOpen(displayedSearch.trim().length >= 2)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        type="search"
        value={displayedSearch}
      />
      {displayedSearch ? (
        <button
          aria-label={t('actions.clear')}
          className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant transition hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          onClick={() => handleChange('')}
          type="button"
        >
          close
        </button>
      ) : null}
      {isOpen ? (
        <div
          className="fixed left-2 right-2 top-[4.25rem] z-[80] max-h-[min(28rem,calc(100svh-5rem))] overflow-hidden rounded-3xl border border-outline-variant bg-white shadow-2xl shadow-primary/15 sm:absolute sm:left-0 sm:right-0 sm:top-12 sm:max-h-[min(28rem,calc(100svh-8rem))]"
          id="global-search-results"
          role="listbox"
        >
          <div className="border-b border-outline-variant bg-surface-container-low px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">{t('header.searchResults')}</p>
            <p className="mt-1 text-sm font-bold text-on-surface">
              {results.length ? t('plurals.matches', { count: results.length }) : t('search.noMatches')}
            </p>
          </div>
          <div className="grid max-h-80 gap-1 overflow-y-auto p-2">
            {results.length ? (
              results.map((product, index) => (
                <button
                  aria-selected={index === activeIndex}
                  className={`flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                    index === safeActiveIndex ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
                  }`}
                  id={`search-result-${index}`}
                  key={product.id}
                  onClick={() => selectResult(product.id)}
                  onMouseEnter={() => setActiveIndex(index)}
                  ref={index === safeActiveIndex ? activeItemRef : null}
                  role="option"
                  type="button"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low text-[9px] font-bold text-outline">
                    {product.image ? (
                      <img alt="" className="h-full w-full object-cover" src={product.image} />
                    ) : (
                      product.imageSize
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-on-surface">
                      <HighlightMatch query={displayedSearch} text={product.name} />
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {product.sku} / {product.category} / {product.brand || t('products.noBrand')}
                    </p>
                  </div>
                  <span aria-hidden="true" className="material-symbols-outlined text-primary">
                    arrow_forward
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-outline-variant p-4 text-sm text-on-surface-variant">
                {t('header.searchEmpty')}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NotificationsMenu({ alerts, isOpen, onClose, onRead, onToggle, t }) {
  const containerRef = useRef(null)
  const recentAlerts = alerts.slice(0, 5)

  useClickOutside(containerRef, onClose, isOpen)
  useEscapeKey(onClose, isOpen)

  return (
    <div className="relative" data-tour="notifications" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-label={t('header.alerts')}
        className="relative min-h-10 min-w-10 rounded-full p-2 text-on-surface-variant transition hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:min-h-11 sm:min-w-11"
        onClick={onToggle}
        title={t('header.alerts')}
        type="button"
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          notifications
        </span>
        {alerts.filter(alert => alert.unread !== false).length ? (
          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {alerts.filter(alert => alert.unread !== false).length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed left-2 right-2 top-[4.25rem] z-[75] overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl shadow-primary/15 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[min(360px,calc(100vw-1rem))]">
          <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-4 py-3">
            <div>
              <p className="text-sm font-bold text-on-surface">{t('header.alerts')}</p>
              <p className="text-xs text-on-surface-variant">{t('header.alertsSubtitle')}</p>
            </div>
            <Badge tone={alerts.length ? 'warning' : 'success'}>{alerts.length}</Badge>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {recentAlerts.length ? (
              recentAlerts.map((alert) => (
                <Link
                  className="block rounded-xl p-3 transition hover:bg-surface-container-low"
                  key={alert.id}
                  onClick={() => { onRead?.(alert); onClose() }}
                  to={alert.to || (alert.productId ? `/dashboard/product/${alert.productId}` : '/dashboard')}
                >
                  <Badge tone={alert.severity === 'error' ? 'danger' : alert.severity}>{alert.title}</Badge>
                  <p className="mt-2 text-sm font-semibold text-on-surface">{alert.message}</p>
                  {alert.createdAt ? <p className="mt-1 text-xs text-on-surface-variant">{new Date(alert.createdAt).toLocaleString('es-PE')}</p> : null}
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-outline-variant p-4 text-sm text-on-surface-variant">
                {t('header.noAlerts')}
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant p-2">
            <Link
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-primary hover:bg-primary-container"
              onClick={onClose}
              to="/dashboard/alerts"
            >
              {t('header.showMore')}
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AccountMenu({ isOpen, items, onClose, onLogout, onToggle, role, t, user }) {
  const containerRef = useRef(null)
  useClickOutside(containerRef, onClose, isOpen)
  useEscapeKey(onClose, isOpen)
  const icons = { profile: 'person', settings: 'settings', subscription: 'workspace_premium' }
  return <div className="relative" ref={containerRef}><button aria-expanded={isOpen} aria-haspopup="menu" className="flex min-h-10 items-center gap-1 rounded-full border border-outline-variant bg-white py-0.5 pl-1 pr-1.5 text-left transition hover:border-primary hover:shadow-md sm:gap-2 sm:pl-2 sm:pr-2 xl:pr-3" onClick={onToggle} type="button"><Avatar name={user?.name || t('profile.defaultUser')} /><span className="hidden max-w-44 xl:block"><span className="block truncate text-sm font-bold">{user?.name || t('profile.defaultUser')}</span><span className="block truncate text-xs text-on-surface-variant">{t(`roles.${role}`) || getRoleLabel(role)}</span></span><span className="material-symbols-outlined text-base text-on-surface-variant sm:text-lg">{isOpen ? 'expand_less' : 'expand_more'}</span></button>{isOpen ? <div className="fixed left-2 right-2 top-[4.25rem] z-[80] overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl shadow-primary/15 sm:absolute sm:left-auto sm:right-0 sm:top-13 sm:w-[min(18rem,calc(100vw-1rem))]" role="menu"><div className="border-b border-outline-variant bg-surface-container-low p-4"><p className="font-bold">{user?.name}</p><p className="mt-1 text-xs text-on-surface-variant">{user?.site || t('profile.defaultCompany')}</p></div><div className="grid gap-1 p-2">{items.map(item => <Link className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-primary-fixed hover:text-primary" key={item.routeKey} onClick={onClose} role="menuitem" to={item.to}><span className="material-symbols-outlined text-xl">{icons[item.routeKey] || item.icon}</span>{item.label || t(item.labelKey)}</Link>)}<button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-error hover:bg-error-container" onClick={onLogout} role="menuitem" type="button"><span className="material-symbols-outlined text-xl">logout</span>{t('actions.logout')}</button></div></div> : null}</div>
}

export default function DashboardShell({
  action,
  children,
  onSearch,
  searchPlaceholder,
  searchValue = '',
  subtitle,
  title,
}) {
  const { user, logout } = useAuth()
  const { config } = useAppConfig()
  const { t } = useI18n()
  const role = getUserRole(user)
  const configuredItems = useMemo(() => { const hospitality=config?.template?.dashboardKey === 'hospitality';const dental=config?.template?.dashboardKey === 'dental'; let items = config?.navigation?.map((item) => ({ icon:item.icon,label:hospitality&&item.frontendKey==='inventory'?'Productos y almacén':item.label,routeKey:item.frontendKey,to:item.route })) || navItems; if(dental){const financeIndex=items.findIndex(item=>['invoices','dental-billing','dental-reports'].includes(item.routeKey));items=items.filter(item=>!['invoices','dental-billing','dental-reports'].includes(item.routeKey));const finance={icon:'account_balance_wallet',label:'Finanzas dentales',routeKey:'dental-billing',to:'/dashboard/dental-billing'};items.splice(financeIndex<0?items.length:financeIndex,0,finance)} if(!items.some(item=>item.routeKey==='chat'))items=[...items.slice(0,1),{icon:'forum',label:'Chat del negocio',routeKey:'chat',to:'/dashboard/chat'},...items.slice(1)]; return hospitality && !items.some(item => item.routeKey === 'calendar') ? [...items.slice(0, 1), { icon: 'calendar_month', label: 'Calendario', routeKey: 'calendar', to: '/dashboard/calendar' }, { icon: 'assignment', label: 'Operaciones', routeKey: 'hotel-operations', to: '/dashboard/hotel-operations' }, ...items.slice(1)] : items }, [config])
  const hospitalityItems = useMemo(() => {
    if (config?.template?.dashboardKey !== 'hospitality') return configuredItems
    const primaryKeys = new Set(['dashboard', 'rooms', 'team', 'inventory', 'alerts', 'history', 'invoices', 'profile', 'settings', 'subscription'])
    const primary = configuredItems
      .filter(item => primaryKeys.has(item.routeKey))
      .map(item => item.routeKey === 'inventory' ? { ...item, label: 'Productos y almacén' } : item)
    const dashboardIndex = Math.max(0, primary.findIndex(item => item.routeKey === 'dashboard'))
    primary.splice(dashboardIndex + 1, 0, { icon: 'calendar_month', label: 'Agenda y estancias', routeKey: 'calendar', to: '/dashboard/calendar' })
    const roomsIndex = primary.findIndex(item => item.routeKey === 'rooms')
    primary.splice(roomsIndex >= 0 ? roomsIndex + 1 : primary.length, 0, { icon: 'assignment', label: 'Servicios', routeKey: 'hotel-operations', to: '/dashboard/hotel-operations' })
    return primary
  }, [config, configuredItems])
  const dentalItems = useMemo(() => {
    if (config?.template?.dashboardKey !== 'dental') return hospitalityItems
    const financeIndex = hospitalityItems.findIndex(item => item.routeKey === 'dental-billing')
    const receipts = { icon: 'receipt_long', label: 'Comprobantes', routeKey: 'dental-receipts', to: '/dashboard/invoices' }
    return financeIndex < 0 ? hospitalityItems : [...hospitalityItems.slice(0, financeIndex + 1), receipts, ...hospitalityItems.slice(financeIndex + 1)]
  }, [config, hospitalityItems])
  const allowedItems = useMemo(() => config ? dentalItems : filterNavigationByRole(dentalItems, user), [config, dentalItems, user])
  const accountItems = useMemo(() => allowedItems.filter(item => ['profile', 'settings', 'subscription'].includes(item.routeKey)), [allowedItems])
  const visibleNavItems = useMemo(() => allowedItems.filter(item => !['profile', 'settings', 'subscription'].includes(item.routeKey) && !(config?.template?.dashboardKey === 'hospitality' && item.routeKey === 'housekeeping') && !(config?.template?.dashboardKey === 'dental' && ['odontogram','treatments','dental-records','dental-catalog'].includes(item.routeKey))), [allowedItems, config])
  const { products } = useInventory()
  const navigate = useNavigate()
  const location = useLocation()

  const [alertsOpen, setAlertsOpen] = useState(false)
  const [hotelNotifications, setHotelNotifications] = useState([])
  const [accountOpen, setAccountOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const { closeMobile, collapsed, mobileOpen, openMobile, toggleCollapsed } = useResponsiveSidebar(`wasita:sidebar:admin:${user?.id || 'user'}`)

  const activeItem = visibleNavItems.find(
    (item) => location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to)),
  )
  const resolvedTitle = title || t('nav.inventory')
  const activeLabel = activeItem?.labelKey ? t(activeItem.labelKey) : resolvedTitle
  const hospitality = config?.template?.dashboardKey === 'hospitality'
  const dental = config?.template?.dashboardKey === 'dental'
  useEffect(() => {
    if (!hospitality&&!dental) return undefined
    let active = true
    let request = null
    const refresh = () => {
      if (document.visibilityState === 'hidden' || request) return request
      request = (dental?getDentalNotifications():getHospitalityNotifications())
        .then(data => { if (active) setHotelNotifications(data) })
        .catch(() => {})
        .finally(() => { request = null })
      return request
    }
    const refreshForChange = event => {
      const path = event.detail?.path || ''
      const relevant = dental
        ? path.startsWith('/health/appointments') || path.startsWith('/health/dental')
        : path.startsWith('/hospitality')
      if (relevant) refresh()
    }
    refresh(); const timer = window.setInterval(refresh, NOTIFICATION_REFRESH_INTERVAL_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('wasi:data-changed', refreshForChange)
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('wasi:data-changed', refreshForChange) }
  }, [dental,hospitality])
  const alerts = useMemo(() => [
    ...(hospitality||dental ? hotelNotifications : []).map(item => ({ ...item, severity: item.notificationType?.includes('damage') ? 'error' : item.notificationType?.includes('completed') ? 'success' : 'info', to: item.route, unread: !item.readAt })),
    ...getInventoryAlerts(products, t).map(item => ({ ...item, id: `inventory-${item.id}`, unread: true })),
  ], [dental,hospitality, hotelNotifications, products, t])
  const resolvedSearchPlaceholder = searchPlaceholder || t('header.searchPlaceholder')
  const displayedSearch = onSearch ? searchValue : globalSearch

  const handleSearchChange = (value) => {
    setGlobalSearch(value)
    onSearch?.(value)
  }

  const openProduct = (productId) => {
    navigate(`/dashboard/product/${productId}`)
  }


  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-svh w-full overflow-x-hidden bg-background text-on-surface">
      <DesktopSidebar collapsed={collapsed} items={visibleNavItems} onToggleCollapse={toggleCollapsed} t={t} />
      <MobileDrawer
        items={visibleNavItems}
        onClose={closeMobile}
        onNavigateAway={closeMobile}
        open={mobileOpen}
        t={t}
      />

      <header
        className={`sticky top-0 z-40 h-16 border-b border-outline-variant bg-surface/95 px-2 py-2 backdrop-blur transition-[left] duration-200 ease-out sm:px-4 lg:fixed lg:right-0 lg:px-6 lg:py-0 ${
          collapsed ? 'lg:left-[84px]' : 'lg:left-[248px]'
        }`}
      >
        <div className="grid h-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-3 lg:grid-cols-[minmax(12rem,36rem)_auto] lg:justify-between">
          <div className="shrink-0 px-1 lg:hidden">
            <BrandLogo markOnly />
          </div>

          <GlobalSearch
            displayedSearch={displayedSearch}
            onChange={handleSearchChange}
            onSelectProduct={openProduct}
            placeholder={resolvedSearchPlaceholder}
            products={products}
            t={t}
          />

          <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-2">
            <NotificationsMenu
              alerts={alerts}
              isOpen={alertsOpen}
              onClose={() => setAlertsOpen(false)}
              onRead={(alert) => { if (!alert.notificationType || !alert.unread) return; setHotelNotifications(current => current.map(item => item.id === alert.id ? { ...item, readAt: new Date().toISOString() } : item)); (dental?readDentalNotification(alert.id):readHospitalityNotification(alert.id)).catch(() => {}) }}
              onToggle={() => setAlertsOpen((current) => !current)}
              t={t}
            />

            <PreferenceControls />

            <AccountMenu accountItems={accountItems} isOpen={accountOpen} items={accountItems} onClose={() => setAccountOpen(false)} onLogout={() => { setAccountOpen(false); setConfirmLogout(true) }} onToggle={() => setAccountOpen(current => !current)} role={role} t={t} user={user} />

            <div className="lg:hidden">
              <button
                aria-controls="admin-mobile-navigation"
                aria-expanded={mobileOpen}
                aria-label={t('sidebar.open')}
                className="material-symbols-outlined grid min-h-10 min-w-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={openMobile}
                type="button"
              >
                menu
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`min-h-svh min-w-0 px-3 py-4 transition-[margin] duration-200 ease-out sm:px-4 lg:px-5 lg:pt-20 ${collapsed ? 'lg:ml-[84px]' : 'lg:ml-[248px]'}`}>
        <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
            <span>{t('dashboard.breadcrumbRoot')}</span>
            <span aria-hidden="true">/</span>
            <span>{activeLabel}</span>
          </div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-bold leading-tight text-on-surface lg:text-[28px]">{resolvedTitle}</h1>
              {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-5 text-on-surface-variant">{subtitle}</p> : null}
            </div>
            {action ? <div data-onboarding="page-action">{action}</div> : null}
          </div>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0"
            data-onboarding="page-content"
            initial={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      <ConfirmDialog
        description={t('auth.logoutDescription')}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        open={confirmLogout}
        title={t('auth.logoutTitle')}
      />
    </div>
  )
}
