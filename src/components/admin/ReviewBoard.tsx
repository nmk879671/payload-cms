import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { getVisibleEntities } from '@payloadcms/ui/shared'
import Link from 'next/link'
import { ExternalLink, Inbox } from 'lucide-react'
import React from 'react'

import { ApproveButton, RejectButton } from './ReviewBoardActions'
import './ReviewBoard.scss'

/* Collections that participate in the review workflow.
   Add new slugs here when more collections start using `withWorkflow`. */
const WORKFLOW_COLLECTIONS: { slug: string; label: string }[] = [
  { slug: 'pages', label: 'Pages' },
  { slug: 'posts', label: 'Posts' },
]

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ReviewBoard: React.FC<AdminViewServerProps> = async (props) => {
  const { initPageResult, params, searchParams } = props
  const req = initPageResult?.req
  const payload = req?.payload
  const user = req?.user
  const locale = initPageResult?.locale
  const permissions = initPageResult?.permissions

  if (!payload || !user) {
    return (
      <div className="review-board">
        <p className="review-board__empty">Please sign in.</p>
      </div>
    )
  }

  const visibleEntities = getVisibleEntities({ req })

  // Fetch in_review docs per collection — Payload's access pipeline
  // (combineWithScope) automatically filters to what this user can see.
  // We catch per-collection errors so one denied scope doesn't blank the
  // whole board for cross-scope reviewers.
  const sections = await Promise.all(
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

  // Batch-resolve all updatedBy user IDs in one query (overrideAccess so
  // users-collection read restrictions don't leave us with "Unknown").
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

  const content = (
    <div className="review-board">
      <header className="review-board__header">
        <h1 className="review-board__title">Review Board</h1>
        <p className="review-board__sub">
          {totalCount === 0
            ? 'No items waiting for review.'
            : `${totalCount} item${totalCount === 1 ? '' : 's'} pending review`}
        </p>
      </header>

      {visibleSections.length === 0 ? (
        <div className="review-board__empty">
          <Inbox size={32} strokeWidth={1.5} />
          <div className="review-board__empty-title">All caught up</div>
          <div className="review-board__empty-sub">
            Nothing in your scope is waiting for review right now.
          </div>
        </div>
      ) : (
        visibleSections.map((section) => (
          <section key={section.slug} className="review-board__section">
            <header className="review-board__section-header">
              <h2 className="review-board__section-title">{section.label}</h2>
              <span className="review-board__section-count">
                {section.docs.length}
              </span>
            </header>

            <div className="review-board__grid">
              {section.docs.map((doc: any) => {
                const editHref = `/admin/collections/${section.slug}/${doc.id}`
                const submitter = resolveSubmitter(doc.updatedBy)

                return (
                  <article key={doc.id} className="review-board__card">
                    <div className="review-board__card-header">
                      <h3 className="review-board__card-title">
                        {doc.title || doc.slug || 'Untitled'}
                      </h3>
                      <Link
                        href={editHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="review-board__card-open"
                        title="Open in new tab"
                      >
                        <ExternalLink size={13} strokeWidth={2} />
                        <span>Open</span>
                      </Link>
                    </div>

                    <dl className="review-board__card-meta">
                      <div>
                        <dt>Submitted by</dt>
                        <dd>{submitter}</dd>
                      </div>
                      <div>
                        <dt>Submitted</dt>
                        <dd>{formatDate(doc.updatedAt)}</dd>
                      </div>
                    </dl>

                    <div className="review-board__card-actions">
                      <RejectButton collection={section.slug} id={doc.id} />
                      <ApproveButton collection={section.slug} id={doc.id} />
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
      {content}
    </DefaultTemplate>
  )
}

export default ReviewBoard
