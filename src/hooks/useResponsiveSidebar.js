import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const DESKTOP_QUERY = '(min-width: 1024px)'

export function useResponsiveSidebar(storageKey) {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.localStorage.getItem(storageKey) === 'collapsed' } catch { return false }
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const openMobile = useCallback(() => setMobileOpen(true), [])
  const toggleCollapsed = useCallback(() => setCollapsed((value) => !value), [])

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, collapsed ? 'collapsed' : 'expanded') } catch { /* UI preference only. */ }
  }, [collapsed, storageKey])

  useEffect(() => {
    const frame = window.requestAnimationFrame(closeMobile)
    return () => window.cancelAnimationFrame(frame)
  }, [closeMobile, pathname])

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)
    const handleBreakpoint = () => closeMobile()
    media.addEventListener('change', handleBreakpoint)
    return () => media.removeEventListener('change', handleBreakpoint)
  }, [closeMobile])

  useEffect(() => {
    if (!mobileOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => { if (event.key === 'Escape') closeMobile() }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeMobile, mobileOpen])

  useEffect(() => {
    const handleOpenRequest = () => {
      if (window.matchMedia(DESKTOP_QUERY).matches) setCollapsed(false)
      else openMobile()
    }
    window.addEventListener('wasi:open-navigation', handleOpenRequest)
    return () => window.removeEventListener('wasi:open-navigation', handleOpenRequest)
  }, [openMobile])

  return { closeMobile, collapsed, mobileOpen, openMobile, toggleCollapsed }
}
