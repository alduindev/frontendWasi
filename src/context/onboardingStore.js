import { createContext, useContext } from 'react'

export const OnboardingContext = createContext(null)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) throw new Error('useOnboarding debe usarse dentro de OnboardingProvider')
  return context
}
