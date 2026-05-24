import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { seedDemoData } from '../../../seed/seedDemoData'

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const secret = process.env.PAYLOAD_SECRET || ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const payload = await getPayload({ config })
    const result = await seedDemoData(payload)
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 },
    )
  }
}
