export const ROLE_LABELS = {
  admin_owner: 'Propietario',
  admin: 'Administrador',
  supervisor: 'Supervisor',
  operator: 'Operador',
  auditor: 'Auditor',
  accountant: 'Contador',
}

const permissionsByRole = {
  admin_owner: {
    canBulkManageProducts: true, canCreateProducts: true, canDeleteProducts: true, canEditProducts: true, canExportProducts: true, canImportProducts: true, canManageSettings: true,
    routes: ['overview', 'inventory', 'alerts', 'history', 'invoices', 'team', 'product', 'profile', 'settings', 'subscription'],
  },
  admin: {
    canBulkManageProducts: true,
    canCreateProducts: true,
    canDeleteProducts: true,
    canEditProducts: true,
    canExportProducts: true,
    canImportProducts: true,
    canManageSettings: true,
    routes: ['overview', 'inventory', 'alerts', 'history', 'invoices', 'team', 'product', 'profile', 'settings'],
  },
  supervisor: {
    canBulkManageProducts: false, canCreateProducts: false, canDeleteProducts: false, canEditProducts: false, canExportProducts: true, canImportProducts: false, canManageSettings: false,
    routes: ['overview', 'inventory', 'alerts', 'history', 'invoices', 'team', 'product', 'profile'],
  },
  auditor: {
    canBulkManageProducts: false, canCreateProducts: false, canDeleteProducts: false, canEditProducts: false, canExportProducts: true, canImportProducts: false, canManageSettings: false,
    routes: ['overview', 'inventory', 'alerts', 'history', 'invoices', 'product', 'profile'],
  },
  accountant: {
    canBulkManageProducts: false, canCreateProducts: false, canDeleteProducts: false, canEditProducts: false, canExportProducts: true, canImportProducts: false, canManageSettings: false,
    routes: ['overview', 'history', 'invoices', 'profile'],
  },
  operator: {
    canBulkManageProducts: false,
    canCreateProducts: false,
    canDeleteProducts: false,
    canEditProducts: true,
    canExportProducts: true,
    canImportProducts: false,
    canManageSettings: false,
    routes: ['overview', 'inventory', 'alerts', 'history', 'invoices', 'product', 'profile'],
  },
}

export function getUserRole(user) {
  return user?.role || 'operator'
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || 'Usuario'
}

export function getPermissions(user) {
  const fallback = permissionsByRole[getUserRole(user)] || permissionsByRole.operator
  const granted = user?.permissions || []
  if (!granted.length) return fallback
  const has = required => granted.some(permission => permission === required || (permission.endsWith('.*') && required.startsWith(permission.slice(0, -1))))
  const routes = ['overview', 'profile']
  if (has('inventory.read')) routes.push('inventory', 'alerts', 'product')
  if (has('history.read')) routes.push('history')
  if (has('sales.read')) routes.push('invoices')
  if (has('users.read') || has('operators.read')) routes.push('team')
  if (has('settings.edit')) routes.push('settings')
  if (has('subscription.edit')) routes.push('subscription')
  return {
    canBulkManageProducts: has('inventory.edit'),
    canCreateProducts: has('inventory.create'),
    canDeleteProducts: has('inventory.delete'),
    canEditProducts: has('inventory.edit'),
    canExportProducts: has('inventory.read'),
    canImportProducts: has('inventory.create'),
    canManageSettings: has('settings.edit'),
    routes,
  }
}

export function canAccessRoute(user, routeKey) {
  return getPermissions(user).routes.includes(routeKey)
}

export function filterNavigationByRole(items, user) {
  const permissions = getPermissions(user)
  return items.filter((item) => !item.routeKey || permissions.routes.includes(item.routeKey))
}
