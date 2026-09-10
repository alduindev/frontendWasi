import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

function installMobileInputZoomGuard() {
  const viewport = document.querySelector('meta[name="viewport"]')
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!viewport || !isIOS) return undefined

  const originalContent = viewport.getAttribute('content') || 'width=device-width, initial-scale=1'
  const isEditableControl = (target) => {
    if (!target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return false
    return !['checkbox', 'radio', 'file', 'range', 'color'].includes(target.type)
  }
  const preventZoom = (event) => {
    if (window.matchMedia('(max-width: 767px)').matches && isEditableControl(event.target)) {
      viewport.setAttribute('content', `${originalContent}, maximum-scale=1`)
    }
  }
  const restoreZoom = () => viewport.setAttribute('content', originalContent)

  document.addEventListener('touchstart', preventZoom, true)
  document.addEventListener('focusin', preventZoom)
  document.addEventListener('focusout', restoreZoom)
  return () => {
    document.removeEventListener('touchstart', preventZoom, true)
    document.removeEventListener('focusin', preventZoom)
    document.removeEventListener('focusout', restoreZoom)
  }
}

const removeMobileInputZoomGuard = installMobileInputZoomGuard()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (removeMobileInputZoomGuard) {
  window.addEventListener('beforeunload', removeMobileInputZoomGuard, { once: true })
}
