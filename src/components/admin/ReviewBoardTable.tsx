import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { getVisibleEntities } from '@payloadcms/ui/shared'
import Link from 'next/link'
import { ChevronRight, Inbox } from 'lucide-react'
import React from 'react'

import { fetchReviewData, formatDate } from './reviewBoardData'
import './ReviewBoardTable.scss'

const ReviewBoardTable: React.FC<AdminViewServerProps> = async (props) => {
  const { initPageResult, params, searchParams } = props
  const req = initPageResult?.req
  const payload = req?.payload
  const user = req?.user
  const locale = initPageResult?.locale
  const permissions = initPageResult?.permissions

  if (!payload || !user) {
    return (
      <div className="rb-table">
        <p className="rb-table__empty">Please sign in.</p>
      </div>
    )
  }

  const visibleEntities = getVisibleEntities({ req })
  const { visibleSections, totalCount, resolveSubmitter } = await fetchReviewData({
    payload,
    user,
  })

  const content = (
    <div className="rb-table">
      <header className="rb-table__header">
        <h1 className="rb-table__title">Review Board · Table</h1>
        <p className="rb-table__sub">
          {totalCount === 0
            ? 'No items waiting for review.'
            : `${totalCount} pending — click a row to open and change its status.`}
        </p>
      </header>

      {visibleSections.length === 0 ? (
        <div className="rb-table__empty">
          <Inbox size={32} strokeWidth={1.5} />
          <div className="rb-table__empty-title">All caught up</div>
          <div className="rb-table__empty-sub">
            Nothing in your scope is waiting for review right now.
          </div>
        </div>
      ) : (
        visibleSections.map((section) => (
          <section key={section.slug} className="rb-table__section">
            <header className="rb-table__section-header">
              <h2 className="rb-table__section-title">{section.label}</h2>
              <span className="rb-table__section-count">{section.docs.length}</span>
            </header>

            <div className="rb-table__wrap">
              <table className="rb-table__table">
                <thead>
                  <tr>
                    <th className="rb-table__th rb-table__th--title">Title</th>
                    <th className="rb-table__th">Submitted by</th>
                    <th className="rb-table__th rb-table__th--date">Submitted</th>
                    <th className="rb-table__th rb-table__th--nav" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {section.docs.map((doc: any) => {
                    const editHref = `/admin/collections/${section.slug}/${doc.id}`
                    const submitter = resolveSubmitter(doc.updatedBy)
                    return (
                      <tr key={doc.id} className="rb-table__row">
                        <td className="rb-table__td rb-table__td--title">
                          <Link href={editHref} className="rb-table__row-link">
                            {doc.title || doc.slug || 'Untitled'}
                          </Link>
                        </td>
                        <td className="rb-table__td">{submitter}</td>
                        <td className="rb-table__td rb-table__td--date">
                          {formatDate(doc.updatedAt)}
                        </td>
                        <td className="rb-table__td rb-table__td--nav">
                          <Link
                            href={editHref}
                            className="rb-table__row-chevron"
                            aria-label={`Open ${doc.title || 'item'}`}
                          >
                            <ChevronRight size={16} strokeWidth={2} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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

export default ReviewBoardTable
