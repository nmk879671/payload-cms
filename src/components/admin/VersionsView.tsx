import type { AdminViewServerProps } from 'payload'
import Link from 'next/link'
import React from 'react'

import './VersionsView.scss'

const formatDate = (d?: string | Date | null) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusPillClass = (status?: string) => {
  switch (status) {
    case 'published':
      return 'pill pill--success'
    case 'scheduled':
      return 'pill pill--info'
    case 'in_review':
      return 'pill pill--warning'
    case 'draft':
    default:
      return 'pill pill--neutral'
  }
}

/**
 * Custom Versions list view, generic across collections.
 * URL pattern: /admin/collections/<slug>/<id>/versions
 *   → params.segments = [<slug>, <id>, 'versions']
 * Extends Payload's stock list (Updated At + Version ID) with three more
 * columns: Updated By, Status, and a link to the diff view.
 */
const VersionsView: React.FC<AdminViewServerProps> = async (props) => {
  const { initPageResult, params } = props
  const payload = initPageResult?.req?.payload
  // Prefer Payload-provided values over URL parsing — segments include
  // the "collections" prefix and ordering can shift, so deriving them
  // ourselves is fragile.
  const collectionSlug =
    (initPageResult as any)?.collectionConfig?.slug ||
    params?.segments?.[1]
  const docID =
    (initPageResult as any)?.docID ||
    params?.segments?.[2]

  if (!payload || !docID || !collectionSlug) {
    return (
      <div className="pages-versions-view">
        <p className="pages-versions-view__empty">Unable to load versions.</p>
      </div>
    )
  }

  const versions = await payload.findVersions({
    collection: collectionSlug as any,
    where: { parent: { equals: docID } },
    sort: '-updatedAt',
    limit: 100,
    overrideAccess: false,
    user: initPageResult.req.user,
  })

  // Resolve updatedBy user IDs → user docs in a single batch
  const userIds = Array.from(
    new Set(
      versions.docs
        .map((v: any) => v.version?.updatedBy)
        .filter((id: any) => typeof id === 'string' && id.length > 0),
    ),
  )

  const usersByID = new Map<string, { name?: string; email?: string }>()
  if (userIds.length > 0) {
    const users = await payload.find({
      collection: 'users',
      where: { id: { in: userIds } },
      limit: userIds.length,
      depth: 0,
      // We're inside an authenticated admin view — show the saver's name
      // regardless of users-collection read access (which may be locked
      // down to admins only). overrideAccess is safe here because we
      // only return name/email, not the whole user record.
      overrideAccess: true,
    })
    users.docs.forEach((u: any) => usersByID.set(String(u.id), u))
  }

  const adminBase = `/admin/collections/${collectionSlug}/${docID}/versions`

  return (
    <div className="pages-versions-view">
      <header className="pages-versions-view__header">
        <h2 className="pages-versions-view__title">Version history</h2>
        <p className="pages-versions-view__sub">
          {versions.totalDocs} version{versions.totalDocs === 1 ? '' : 's'} · click a
          row to see the diff
        </p>
      </header>

      {versions.docs.length === 0 ? (
        <p className="pages-versions-view__empty">No versions yet.</p>
      ) : (
        <div className="pages-versions-view__table-wrap">
          <table className="pages-versions-view__table">
            <thead>
              <tr>
                <th>Saved at</th>
                <th>Updated by</th>
                <th>Status</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {versions.docs.map((v: any) => {
                const snap = v.version || {}
                const updatedByID =
                  typeof snap.updatedBy === 'string'
                    ? snap.updatedBy
                    : snap.updatedBy?.id
                const user = updatedByID
                  ? usersByID.get(String(updatedByID))
                  : null
                const userLabel = user
                  ? user.name || user.email || '—'
                  : updatedByID
                    ? 'Unknown user'
                    : '—'
                const status = (snap.status as string) || '—'
                const href = `${adminBase}/${v.id}`

                return (
                  <tr key={v.id}>
                    <td>
                      <Link href={href} className="pages-versions-view__time">
                        {formatDate(v.updatedAt)}
                      </Link>
                    </td>
                    <td>{userLabel}</td>
                    <td>
                      <span className={statusPillClass(status)}>
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="pages-versions-view__row-action">
                      <Link href={href}>View →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default VersionsView
