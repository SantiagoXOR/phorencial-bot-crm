// Tipos para roles
type Rol = 'ADMIN' | 'ANALISTA' | 'VENDEDOR'

export type Permission = 
  | 'leads:read'
  | 'leads:write'
  | 'leads:delete'
  | 'leads:derive'
  | 'reports:read'
  | 'settings:read'
  | 'settings:write'
  | 'users:read'
  | 'users:write'

const rolePermissions: Record<Rol, Permission[]> = {
  ADMIN: [
    'leads:read',
    'leads:write',
    'leads:delete',
    'leads:derive',
    'reports:read',
    'settings:read',
    'settings:write',
    'users:read',
    'users:write',
  ],
  ANALISTA: [
    'leads:read',
    'leads:write',
    'leads:derive',
    'reports:read',
  ],
  VENDEDOR: [
    'leads:read',
  ],
}

export function hasPermission(userRole: Rol, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false
}

export function checkPermission(userRole: Rol, permission: Permission): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`)
  }
}

export function getPermissions(userRole: Rol): Permission[] {
  return rolePermissions[userRole] ?? []
}
