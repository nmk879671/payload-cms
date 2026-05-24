import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

const authorized = (req: Request): boolean => {
  const secret = process.env.PAYLOAD_SECRET || ''
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = new URL(req.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 })
  }
  const payload = await getPayload({ config })
  const doc: any = await payload
    .findByID({
      collection: 'posts' as any,
      id,
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => null)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    id: doc.id,
    slug: doc.slug,
    status: doc.status,
    scheduledAt: doc.scheduledAt,
    publishedAt: doc.publishedAt,
    updatedAt: doc.updatedAt,
  })
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const users = await payload.find({ collection: 'users', limit: 1, depth: 0 })
  const authorId = users.docs[0]?.id
  if (!authorId) {
    return NextResponse.json({ error: 'No users' }, { status: 400 })
  }

  const slug = `scheduled-test-${Date.now()}`
  const scheduledAt = new Date(Date.now() + 30_000).toISOString()

  const doc = await payload.create({
    collection: 'posts' as any,
    data: {
      title: 'Scheduled test post',
      slug,
      status: 'scheduled',
      scheduledAt,
      author: authorId,
      excerpt: 'Auto-created to test the scheduled publisher.',
      content: {
        root: {
          type: 'root',
          version: 1,
          format: '',
          indent: 0,
          direction: 'ltr',
          children: [
            {
              type: 'paragraph',
              version: 1,
              format: '',
              indent: 0,
              direction: 'ltr',
              textFormat: 0,
              children: [
                {
                  type: 'text',
                  text: 'If you see this with status=published, the cron worked.',
                  format: 0,
                  detail: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                },
              ],
            },
          ],
        },
      },
    } as any,
    overrideAccess: true,
  })

  return NextResponse.json({
    ok: true,
    id: doc.id,
    slug,
    scheduledAt,
    willPublishIn: '~30s',
  })
}
