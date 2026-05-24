import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { publishScheduled } from '../../../../jobs/publishScheduled'

const authorized = (req: Request): boolean => {
  const secret = process.env.PAYLOAD_SECRET || ''
  if (!secret) return false
  const headerAuth = req.headers.get('authorization') || ''
  if (headerAuth === `Bearer ${secret}`) return true
  // Allow ?token= for schedulers that can't set headers (e.g. some cron services)
  const url = new URL(req.url)
  if (url.searchParams.get('token') === secret) return true
  return false
}

const run = async () => {
  const payload = await getPayload({ config })
  const result = await publishScheduled(payload, { log: true })
  return NextResponse.json({ ok: true, ...result })
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return run()
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return run()
}
