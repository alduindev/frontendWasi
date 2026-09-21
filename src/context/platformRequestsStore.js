import { createContext, useContext } from 'react'

export const PlatformRequestsContext = createContext(null)
export const usePlatformRequests = () => useContext(PlatformRequestsContext)
