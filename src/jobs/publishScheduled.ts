import type { Payload } from 'payload'

type Result = {
  scanned: number
  published: number
  ids: Array<{ collection: string; id: string | number }>
}

/**
 * Finds all docs with status=scheduled whose scheduledAt has passed,
 * and flips them to status=published.
 *
 * Uses overrideAccess so it bypasses the field-level access on `status`
 * (which would normally only let admins write it directly).
 */
export const publishScheduled = async (
  payload: Payload,
  opts: { log?: boolean; collections?: string[] } = {},
): Promise<Result> => {
  const log = opts.log ?? true
  const collections = opts.collections ?? ['pages', 'posts']
  const now = new Date().toISOString()
  const result: Result = { scanned: 0, published: 0, ids: [] }

  for (const collection of collections) {
    let res
    try {
      res = await payload.find({
        collection: collection as any,
        where: {
          and: [
            { status: { equals: 'scheduled' } },
            { scheduledAt: { less_than_equal: now } },
          ],
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })
    } catch (err) {
      if (log) payload.logger.warn(`publishScheduled: cannot query ${collection}: ${err}`)
      continue
    }

    result.scanned += res.docs.length

    for (const doc of res.docs as any[]) {
      try {
        await payload.update({
          collection: collection as any,
          id: doc.id,
          data: {
            status: 'published',
            scheduledAt: null,
            publishedAt: doc.publishedAt || now,
          } as any,
          overrideAccess: true,
        })
        result.published++
        result.ids.push({ collection, id: doc.id })
        if (log) {
          payload.logger.info(
            `publishScheduled: published ${collection}/${doc.id}`,
          )
        }
      } catch (err) {
        if (log) {
          payload.logger.error(
            `publishScheduled: failed ${collection}/${doc.id}: ${err}`,
          )
        }
      }
    }
  }

  return result
}
