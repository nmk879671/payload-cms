import type { Access, FieldAccess } from 'payload'

export type RoleKey =
  | 'admin'
  | 'secure_editor'
  | 'editor'
  | 'author'
  | 'viewer'

const roleKeyOf = (user: any): RoleKey | null => {
  const role = user?.role
  if (!role) return null
  if (typeof role === 'object' && role.key) return role.key as RoleKey
  return null
}

export const hasRole =
  (...allowed: RoleKey[]) =>
  ({ req: { user } }: { req: { user: any } }) => {
    const key = roleKeyOf(user)
    return key !== null && allowed.includes(key)
  }

export const isAdmin: Access = hasRole('admin')

export const isAdminField: FieldAccess = ({ req: { user } }) =>
  roleKeyOf(user) === 'admin'

export const canRead: Access = ({ req: { user } }) => Boolean(user)

export const canManageContent: Access = hasRole(
  'admin',
  'secure_editor',
  'editor',
)

export const canPublish: Access = hasRole('admin', 'secure_editor')

export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (roleKeyOf(user) === 'admin') return true
  return { id: { equals: user.id } }
}

export const isAdminOrOwnAuthor: Access = ({ req: { user } }) => {
  if (!user) return false
  const key = roleKeyOf(user)
  if (key === 'admin' || key === 'secure_editor' || key === 'editor') return true
  if (key === 'author') return { author: { equals: user.id } }
  return false
}
