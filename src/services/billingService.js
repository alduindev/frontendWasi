import { apiRequest } from '../api/httpClient'

const idempotencyKey = () => (
  globalThis.crypto?.randomUUID?.()
  || `${Date.now()}-${Math.random().toString(16).slice(2)}`
)

export const getSubscription = () => apiRequest('/subscription')
export const getUsage = () => apiRequest('/subscription/usage')
export const getAddOns = () => apiRequest('/add-ons')
export const createSubscriptionCheckout = (data) => apiRequest('/subscription/checkout', {
  method: 'POST',
  headers: { 'Idempotency-Key': idempotencyKey() },
  body: JSON.stringify({ provider: 'mercado_pago', ...data }),
})
export const getSubscriptionCheckoutStatus = (attemptId, paymentId = '') => {
  const query = paymentId ? `?paymentId=${encodeURIComponent(paymentId)}` : ''
  return apiRequest(`/subscription/checkout/${encodeURIComponent(attemptId)}/status${query}`)
}
export const cancelSubscription = () => apiRequest('/subscription/cancel', { method:'POST' })
export const reactivateSubscription = () => apiRequest('/subscription/reactivate', { method:'POST' })
export const createAddOnCheckout = (id, quantity = 1, provider = 'mercado_pago') => apiRequest(
  `/subscription/add-ons/${encodeURIComponent(id)}/checkout?quantity=${encodeURIComponent(quantity)}&provider=${encodeURIComponent(provider)}`,
  { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey() } },
)
