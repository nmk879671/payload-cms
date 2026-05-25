import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Find the admin role (seeded on Payload init) so the new user has one.
  const adminRole = await payload.find({
    collection: 'roles',
    where: { key: { equals: 'admin' } },
    limit: 1,
  })
  const adminRoleId = adminRole.docs[0]?.id
  if (!adminRoleId) {
    throw new Error('Admin role not seeded — start Payload at least once first.')
  }

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: {
      ...testUser,
      role: adminRoleId,
    },
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
