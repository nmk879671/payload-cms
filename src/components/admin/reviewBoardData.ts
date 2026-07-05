import type { Payload } from 'payload'

/* Collections that participate in the review workflow.
   Add new slugs here when more collections start using `withWorkflow`. */
export const WORKFLOW_COLLECTIONS: { slug: string; label: string }[] = [
  { slug: 'pages', label: 'Pages' },
  { slug: 'posts', label: 'Posts' },
]

export type ReviewSection = {
  slug: string
  label: string
  docs: any[]
}

export type ReviewData = {
  sections: ReviewSection[]
  visibleSections: ReviewSection[]
  totalCount: number
  resolveSubmitter: (updatedBy: any) => string
}

export const formatDate = (d?: string | null): string => {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* Relative time — for feed / table density. */
export const formatRelative = (d?: string | null): string => {
  if (!d) return '—'
  const diffMs = Date.now() - new Date(d).getTime()
  const s = Math.round(diffMs / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const day = Math.round(h / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.round(day / 30)
  return `${mo}mo ago`
}

type FetchArgs = { payload: Payload; user: any }

export async function fetchReviewData({ payload, user }: FetchArgs): Promise<ReviewData> {
  const sections: ReviewSection[] = await Promise.all(
    WORKFLOW_COLLECTIONS.map(async (c) => {
      try {
        const result = await payload.find({
          collection: c.slug as any,
          where: { status: { equals: 'in_review' } },
          sort: '-updatedAt',
          limit: 100,
          depth: 0,
          overrideAccess: false,
          user,
        })
        return { ...c, docs: result.docs as any[] }
      } catch {
        return { ...c, docs: [] as any[] }
      }
    }),
  )

  // Batch-resolve every referenced user in one query (overrideAccess so the
  // users-collection read guard doesn't leave us with "Unknown").
  const userIDs = Array.from(
    new Set(
      sections
        .flatMap((s) => s.docs.map((d: any) => d.updatedBy))
        .filter((u): u is string => typeof u === 'string' && u.length > 0)
        .concat(
          sections.flatMap((s) =>
            s.docs
              .map((d: any) => (typeof d.updatedBy === 'object' ? d.updatedBy?.id : null))
              .filter(Boolean),
          ),
        ),
    ),
  )

  const usersByID = new Map<string, { name?: string; email?: string }>()
  if (userIDs.length > 0) {
    const users = await payload.find({
      collection: 'users',
      where: { id: { in: userIDs } },
      limit: userIDs.length,
      depth: 0,
      overrideAccess: true,
    })
    users.docs.forEach((u: any) => usersByID.set(String(u.id), u))
  }

  const resolveSubmitter = (updatedBy: any): string => {
    if (!updatedBy) return '—'
    if (typeof updatedBy === 'object') {
      return updatedBy.name || updatedBy.email || 'Unknown'
    }
    const u = usersByID.get(String(updatedBy))
    return u ? u.name || u.email || 'Unknown' : 'Unknown'
  }

  const totalCount = sections.reduce((sum, s) => sum + s.docs.length, 0)
  const visibleSections = sections.filter((s) => s.docs.length > 0)

  return { sections, visibleSections, totalCount, resolveSubmitter }
}
