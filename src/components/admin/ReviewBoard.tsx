import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { getVisibleEntities } from '@payloadcms/ui/shared'
import Link from 'next/link'
import { ArrowUpRight, Inbox } from 'lucide-react'
import React from 'react'

import { fetchReviewData, formatDate } from './reviewBoardData'
import './ReviewBoard.scss'

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
  const { visibleSections, totalCount, resolveSubmitter } = await fetchReviewData({
    payload,
    user,
  })

  const content = (
    <div className="review-board">
      <header className="review-board__header">
        <h1 className="review-board__title">Review Board</h1>
        <p className="review-board__sub">
          {totalCount === 0
            ? 'No items waiting for review.'
            : `${totalCount} item${totalCount === 1 ? '' : 's'} pending review — open a card to change its status.`}
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
                  <Link
                    key={doc.id}
                    href={editHref}
                    className="review-board__card"
                  >
                    <div className="review-board__card-header">
                      <h3 className="review-board__card-title">
                        {doc.title || doc.slug || 'Untitled'}
                      </h3>
                      <span className="review-board__card-open" aria-hidden>
                        <ArrowUpRight size={14} strokeWidth={2} />
                      </span>
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
                  </Link>
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
