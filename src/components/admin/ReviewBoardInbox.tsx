import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { getVisibleEntities } from '@payloadcms/ui/shared'
import Link from 'next/link'
import { ArrowRight, Inbox } from 'lucide-react'
import React from 'react'

import { fetchReviewData, formatDate, formatRelative } from './reviewBoardData'
import './ReviewBoardInbox.scss'

const ReviewBoardInbox: React.FC<AdminViewServerProps> = async (props) => {
  const { initPageResult, params, searchParams } = props
  const req = initPageResult?.req
  const payload = req?.payload
  const user = req?.user
  const locale = initPageResult?.locale
  const permissions = initPageResult?.permissions

  if (!payload || !user) {
    return (
      <div className="rb-inbox">
        <p className="rb-inbox__empty">Please sign in.</p>
      </div>
    )
  }

  const visibleEntities = getVisibleEntities({ req })
  const { visibleSections, totalCount, resolveSubmitter } = await fetchReviewData({
    payload,
    user,
  })

  const content = (
    <div className="rb-inbox">
      <header className="rb-inbox__header">
        <h1 className="rb-inbox__title">Review Board · Inbox</h1>
        <p className="rb-inbox__sub">
          {totalCount === 0
            ? 'No items waiting for review.'
            : `${totalCount} pending — click any row to open and change status.`}
        </p>
      </header>

      {visibleSections.length === 0 ? (
        <div className="rb-inbox__empty">
          <Inbox size={32} strokeWidth={1.5} />
          <div className="rb-inbox__empty-title">All caught up</div>
          <div className="rb-inbox__empty-sub">
            Nothing in your scope is waiting for review right now.
          </div>
        </div>
      ) : (
        visibleSections.map((section) => (
          <section key={section.slug} className="rb-inbox__section">
            <header className="rb-inbox__section-header">
              <h2 className="rb-inbox__section-title">{section.label}</h2>
              <span className="rb-inbox__section-count">{section.docs.length}</span>
            </header>

            <ul className="rb-inbox__list">
              {section.docs.map((doc: any) => {
                const editHref = `/admin/collections/${section.slug}/${doc.id}`
                const submitter = resolveSubmitter(doc.updatedBy)
                return (
                  <li key={doc.id} className="rb-inbox__row">
                    <Link href={editHref} className="rb-inbox__row-link">
                      <div className="rb-inbox__body">
                        <div className="rb-inbox__row-title">
                          {doc.title || doc.slug || 'Untitled'}
                        </div>
                        <div className="rb-inbox__row-meta">
                          <span className="rb-inbox__row-submitter">{submitter}</span>
                          <span className="rb-inbox__row-dot" aria-hidden>
                            •
                          </span>
                          <span>{formatRelative(doc.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="rb-inbox__row-date" title={doc.updatedAt}>
                        {formatDate(doc.updatedAt)}
                      </div>

                      <span className="rb-inbox__row-arrow" aria-hidden>
                        <ArrowRight size={16} strokeWidth={2} />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
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

export default ReviewBoardInbox
