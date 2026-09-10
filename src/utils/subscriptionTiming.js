const DAY_MS = 24 * 60 * 60 * 1000

export const SUBSCRIPTION_ALERT_WINDOW_DAYS = 10.5

const ALERTABLE_STATUSES = new Set(['active', 'trialing'])

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getSubscriptionDeadline(subscription) {
  if (!subscription || !ALERTABLE_STATUSES.has(subscription.status)) return null

  const isTrial = subscription.status === 'trialing'
  const candidates = isTrial
    ? [['trial', subscription.trialEndsAt], ['trial', subscription.currentPeriodEnd]]
    : [['subscription', subscription.currentPeriodEnd], ['subscription', subscription.nextBillingAt], ['subscription', subscription.trialEndsAt]]
  const candidate = candidates.find(([, value]) => Boolean(value))
  const endAt = parseDate(candidate?.[1])
  if (!endAt) return null

  return { endAt, kind: candidate[0] }
}

export function getSubscriptionEndDate(subscription) {
  if (!subscription) return null

  const value = subscription.status === 'expired'
    ? subscription.expiresAt || subscription.currentPeriodEnd || subscription.trialEndsAt
    : subscription.status === 'trialing'
      ? subscription.trialEndsAt || subscription.currentPeriodEnd || subscription.expiresAt
      : subscription.currentPeriodEnd || subscription.trialEndsAt || subscription.expiresAt
  return parseDate(value)
}

export function getSubscriptionExpiryAlert(subscription, now = new Date()) {
  const deadline = getSubscriptionDeadline(subscription)
  if (!deadline) return null

  const daysRemaining = (deadline.endAt.getTime() - now.getTime()) / DAY_MS
  if (daysRemaining <= 0 || daysRemaining > SUBSCRIPTION_ALERT_WINDOW_DAYS) return null

  return { ...deadline, daysRemaining }
}

export function formatSubscriptionRemaining(daysRemaining) {
  const days = Math.max(1, Math.ceil(daysRemaining))
  if (days < 7) return `${days} día${days === 1 ? '' : 's'}`

  const weeks = Math.floor(days / 7)
  const extraDays = days % 7
  const parts = [`${weeks} semana${weeks === 1 ? '' : 's'}`]
  if (extraDays) parts.push(`${extraDays} día${extraDays === 1 ? '' : 's'}`)
  return parts.join(' y ')
}