import { createContext, useContext } from 'react'
export const AppConfigContext = createContext(null)
export function useAppConfig() { const value=useContext(AppConfigContext); if(!value) throw new Error('useAppConfig requiere AppConfigProvider'); return value }
