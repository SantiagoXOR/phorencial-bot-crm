// Tipos para roles actualizados
type UserRole = 'ADMIN' | 'MANAGER' | 'ANALISTA' | 'VENDEDOR' | 'VIEWER'

export type Permission =
  | 'leads:read'
  | 'leads:write'
  | 'leads:update'
  | 'leads:delete'
  | 'leads:derive'
  | 'leads:assign'
  | 'leads:export'
  | 'reports:read'
  | 'reports:create'
  | 'reports:export'
  | 'reports:manage'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'users:manage'
  | 'users:roles'
  | 'settings:read'
  | 'settings:write'
  | 'settings:manage'
  | 'documents:read'
  | 'documents:write'
  | 'documents:delete'
  | 'documents:manage'
  | 'dashboard:read'
  | 'dashboard:metrics'
  | 'dashboard:manage'
  | 'pipeline:read'
  | 'pipeline:write'
  | 'pipeline:manage'
  | 'admin:pipeline'
  | 'pipeline:read'
  | 'pipeline:write'
  | 'pipeline:manage'
  | 'admin:cache'
  | 'admin:system'
  | 'admin:monitoring'

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    'leads:read', 'leads:write', 'leads:update', 'leads:delete', 'leads:derive', 'leads:assign', 'leads:export',
    'reports:read', 'reports:create', 'reports:export', 'reports:manage',
    'users:read', 'users:write', 'users:delete', 'users:manage', 'users:roles',
    'settings:read', 'settings:write', 'settings:manage',
    'documents:read', 'documents:write', 'documents:delete', 'documents:manage',
    'dashboard:read', 'dashboard:metrics', 'dashboard:manage',
    'pipeline:read', 'pipeline:write', 'pipeline:manage', 'admin:pipeline',
    'admin:cache', 'admin:system', 'admin:monitoring',
  ],
  MANAGER: [
    'leads:read', 'leads:write', 'leads:update', 'leads:delete', 'leads:derive', 'leads:assign', 'leads:export',
    'reports:read', 'reports:create', 'reports:export', 'reports:manage',
    'documents:read', 'documents:write', 'documents:delete', 'documents:manage',
    'dashboard:read', 'dashboard:metrics', 'dashboard:manage',
    'pipeline:read', 'pipeline:write', 'pipeline:manage',
    'settings:read', 'settings:write',
    'users:read',
  ],
  ANALISTA: [
    'leads:read', 'leads:write', 'leads:update', 'leads:derive', 'leads:export',
    'reports:read', 'reports:create', 'reports:export',
    'documents:read', 'documents:write',
    'dashboard:read', 'dashboard:metrics',
    'pipeline:read',
    'settings:read',
  ],
  VENDEDOR: [
    'leads:read', 'leads:write', 'leads:update',
    'documents:read', 'documents:write',
    'dashboard:read',
    'pipeline:read', 'pipeline:write',
    'reports:read',
  ],
  VIEWER: [
    'leads:read',
    'reports:read',
    'dashboard:read',
    'pipeline:read',
    'documents:read',
  ],
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false
}

export function checkPermission(userRole: UserRole, permission: Permission): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`)
  }
}

export function getPermissions(userRole: UserRole): Permission[] {
  return rolePermissions[userRole] ?? []
}

// Función para verificar múltiples permisos
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

// Función para verificar todos los permisos
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Función para obtener permisos por recurso
export function getPermissionsByResource(userRole: UserRole, resource: string): Permission[] {
  const allPermissions = getPermissions(userRole)
  return allPermissions.filter(permission => permission.startsWith(`${resource}:`))
}

// Función para verificar si un usuario puede acceder a una ruta
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/dashboard': ['dashboard:read'],
    '/leads': ['leads:read'],
    '/leads/new': ['leads:write'],
    '/reports': ['reports:read'],
    '/settings': ['settings:read'],
    '/admin': ['users:read'],
    '/documents': ['documents:read'],
  }

  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions) return true // Ruta pública

  return hasAnyPermission(userRole, requiredPermissions)
}
