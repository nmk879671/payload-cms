/**
 * One-off script: flip the first few Pages and Posts into `in_review`
 * so the Review Board has something to display.
 *
 * Run with:
 *   npx tsx scripts/seedInReview.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  // Find an admin user — needed because withWorkflow's beforeChange
  // hook checks role.key, and we want it to actually run (not skip).
  const adminUsers = await payload.find({
    collection: 'users',
    where: { 'role.key': { equals: 'admin' } } as any,
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  let admin: any = adminUsers.docs[0]

  // Fallback: any user with role populated (in case role.key lookup fails)
  if (!admin) {
    const anyUser = await payload.find({
      collection: 'users',
      limit: 50,
      depth: 1,
      overrideAccess: true,
    })
    admin = anyUser.docs.find((u: any) => u?.role?.key === 'admin')
  }

  if (!admin) {
    console.error('No admin user found. Sign in once to bootstrap one.')
    process.exit(1)
  }
  console.log(`Using admin: ${admin.email}`)

  const flip = async (collection: 'pages' | 'posts', limit = 3) => {
    const docs = await payload.find({
      collection,
      limit,
      sort: '-updatedAt',
      overrideAccess: true,
    })

    let n = 0
    for (const doc of docs.docs as any[]) {
      if (doc.status === 'in_review') {
        console.log(`  ↷ ${collection}/${doc.id} already in_review, skipping`)
        continue
      }
      await payload.update({
        collection,
        id: doc.id,
        data: { status: 'in_review' as any },
        user: admin,
        overrideAccess: true,
      })
      n++
      console.log(`  ✓ ${collection}/${doc.id} (${doc.title}) → in_review`)
    }
    console.log(`  ${n} ${collection} document(s) flipped\n`)
  }

  console.log('\nSeeding in_review docs...\n')
  await flip('pages', 3)
  await flip('posts', 3)

  console.log('Done. Open /admin/review-board as a reviewer to see them.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
