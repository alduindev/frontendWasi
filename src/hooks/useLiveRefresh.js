import { useEffect, useEffectEvent } from 'react'

export function useLiveRefresh(refresh, prefixes = []) {
  const resourceKey = prefixes.join('|')
  const onRefresh = useEffectEvent(refresh)
  useEffect(() => {
    const resources = resourceKey ? resourceKey.split('|') : []
    const sync = event => {
      const path = event.detail?.path || ''
      if (!resources.length || resources.some(prefix => path.startsWith(prefix))) onRefresh(event.detail)
    }
    window.addEventListener('wasi:data-changed', sync)
    return () => window.removeEventListener('wasi:data-changed', sync)
  }, [resourceKey])
}
