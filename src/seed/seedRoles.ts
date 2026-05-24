import type { Payload } from 'payload'
import { DEFAULT_ROLES } from '../collections/Roles'

export const seedRoles = async (payload: Payload) => {
  const existing = await payload.find({
    collection: 'roles' as any,
    limit: 100,
    depth: 0,
  })
  const existingKeys = new Set(existing.docs.map((d: any) => d.key))

  for (const r of DEFAULT_ROLES) {
    if (existingKeys.has(r.key)) continue
    await payload.create({
      collection: 'roles' as any,
      data: r,
    })
    payload.logger.info(`Seeded role: ${r.key}`)
  }

  // Bootstrap: if any user has no role, give the first user 'admin', rest 'viewer'.
  const users = await payload.find({
    collection: 'users',
    limit: 1000,
    depth: 0,
  })
  const adminRole = await payload.find({
    collection: 'roles' as any,
    where: { key: { equals: 'admin' } },
    limit: 1,
  })
  const viewerRole = await payload.find({
    collection: 'roles' as any,
    where: { key: { equals: 'viewer' } },
    limit: 1,
  })
  const adminId = adminRole.docs[0]?.id
  const viewerId = viewerRole.docs[0]?.id
  if (!adminId || !viewerId) return

  let assignedAdmin = users.docs.some((u: any) => {
    const r = u.role
    if (!r) return false
    return (typeof r === 'object' ? r.id : r) === adminId
  })

  for (const u of users.docs as any[]) {
    if (u.role) continue
    const roleId = assignedAdmin ? viewerId : adminId
    await payload.update({
      collection: 'users',
      id: u.id,
      data: { role: roleId } as any,
    })
    if (!assignedAdmin) {
      payload.logger.info(`Bootstrap: assigned admin role to ${u.email}`)
      assignedAdmin = true
    }
  }
}
