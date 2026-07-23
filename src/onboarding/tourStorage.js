const VERSION = 2
const keyFor = (user) => `wasita:tours:v${VERSION}:${user?.id || user?.phone || 'user'}:${user?.role}`
export function readTourProgress(user) { try { return JSON.parse(localStorage.getItem(keyFor(user))) || {} } catch { return {} } }
export function writeTourProgress(user, progress) { localStorage.setItem(keyFor(user), JSON.stringify(progress)); return progress }
export function clearTourProgress(user) { localStorage.removeItem(keyFor(user)) }
