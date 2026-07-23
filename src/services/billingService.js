import { apiRequest } from '../api/httpClient'
export const getSubscription = () => apiRequest('/subscription')
export const getUsage = () => apiRequest('/subscription/usage')
export const getAddOns = () => apiRequest('/add-ons')
export const createSubscriptionCheckout = (data) => apiRequest('/subscription/checkout', { method:'POST', headers:{'Idempotency-Key':crypto.randomUUID()}, body:JSON.stringify(data) })
export const cancelSubscription = () => apiRequest('/subscription/cancel', { method:'POST' })
export const reactivateSubscription = () => apiRequest('/subscription/reactivate', { method:'POST' })
export const createAddOnCheckout = (id,quantity=1) => apiRequest(`/subscription/add-ons/${id}/checkout?quantity=${quantity}&provider=manual`,{method:'POST',headers:{'Idempotency-Key':globalThis.crypto.randomUUID()}})
